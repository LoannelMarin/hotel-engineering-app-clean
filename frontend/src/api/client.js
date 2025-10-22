// frontend/src/api/client.js
// Cliente HTTP único + utilidades de auth.
// Meta: conservar compat, añadir X-User-Id en headers y reintentar con/ sin “/” final para evitar 405.

/* ========================== BASE URL ========================== */
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  (typeof window !== "undefined"
    ? window.location.origin.replace(":5173", ":5000")
    : "http://localhost:5000");

/* ========================== AUTH STATE ========================== */
const LS_TOKEN_KEY = "access_token";
const LS_USER_ID_KEY = "user_id";

function getToken() {
  return (
    (typeof localStorage !== "undefined" && localStorage.getItem(LS_TOKEN_KEY)) ||
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem(LS_TOKEN_KEY)) ||
    ""
  );
}
function setToken(token) {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(LS_TOKEN_KEY, token || "");
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem(LS_TOKEN_KEY, token || "");
  } catch {}
}
function getUserId() {
  return (
    (typeof localStorage !== "undefined" && localStorage.getItem(LS_USER_ID_KEY)) ||
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem(LS_USER_ID_KEY)) ||
    ""
  );
}
function setUserId(id) {
  const val = id == null ? "" : String(id);
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(LS_USER_ID_KEY, val);
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem(LS_USER_ID_KEY, val);
  } catch {}
}

/** Compat: algunos sitios llaman setAuth({ access_token, user_id }) */
export function setAuth({ access_token, token, user_id } = {}) {
  const t = access_token || token || "";
  if (t) setToken(t);
  if (user_id !== undefined) setUserId(user_id);
}

/** Compat: guardar tokens tras login */
export function saveTokensFromLogin(loginResponse = {}) {
  const t = loginResponse.access_token || loginResponse.token || loginResponse.accessToken || "";
  if (t) setToken(t);
  if (loginResponse.user?.id != null) setUserId(loginResponse.user.id);
  if (loginResponse.user_id != null) setUserId(loginResponse.user_id);
}

/** Limpia credenciales */
export function clearAuth() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(LS_TOKEN_KEY);
      localStorage.removeItem(LS_USER_ID_KEY);
    }
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(LS_TOKEN_KEY);
      sessionStorage.removeItem(LS_USER_ID_KEY);
    }
  } catch {}
}

/* ========================== HELPERS ========================== */
function absolutize(u) {
  if (/^https?:\/\//i.test(u)) return u;

  // 🟢 Forzar automáticamente el prefijo /api si no está presente
  if (!u.startsWith("/api/")) {
    u = "/api" + (u.startsWith("/") ? "" : "/") + u;
  }

  return `${API_BASE}${u}`;
}

function isJsonLike(body) {
  if (body == null) return false;
  if (typeof body === "string") {
    try {
      JSON.parse(body);
      return true;
    } catch {
      return false;
    }
  }
  if (typeof body === "object" && !(typeof FormData !== "undefined" && body instanceof FormData))
    return true;
  return false;
}

/**
 * Fetch JSON con auth (Bearer + cookies) y fallback de “/” final para 405.
 * - Sólo añade Content-Type si el body es JSON (no para FormData).
 * - Añade X-User-Id si está disponible (para backends que lo usan).
 * - Reintenta UNA VEZ alternando el slash final si recibe 405.
 */
async function fetchJson(url, options = {}) {
  const absUrl = absolutize(url);
  const token = getToken();
  const userId = getUserId();

  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  // Content-Type sólo si el body es JSON
  if (options.body !== undefined && isJsonLike(options.body)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
    if (typeof options.body !== "string") {
      options.body = JSON.stringify(options.body);
    }
  }

  // Bearer si hay token
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  // X-User-Id si está presente (evita 401 y ayuda a resolver "me")
  if (userId && !headers["X-User-Id"]) {
    headers["X-User-Id"] = userId;
  }

  const init = {
    credentials: "include",
    ...options,
    headers,
  };

  const res = await fetch(absUrl, init);
  if (!res.ok) {
    // Retry una vez alternando la barra final si el backend es estricto
    if (res.status === 405 && !options.__retriedSlash && !absUrl.includes("?")) {
      const toggled =
        absUrl.endsWith("/") ? absUrl.replace(/\/+$/, "") : `${absUrl}/`;
      if (toggled && toggled !== absUrl) {
        return fetchJson(toggled, { ...options, __retriedSlash: true });
      }
    }

    const ct = res.headers.get("content-type") || "";
    const isJSON = ct.includes("application/json");
    const errPayload = isJSON ? await res.json().catch(() => ({})) : await res.text().catch(() => "");
    const message =
      (isJSON && (errPayload.detail || errPayload.message || errPayload.msg)) ||
      (typeof errPayload === "string" ? errPayload : "") ||
      `HTTP ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.payload = errPayload;
    throw error;
  }

  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  return isJSON ? res.json() : res.text();
}

/* ========================== API SHAPE (default export) ========================== */
const api = {
  baseURL: API_BASE,
  get: (url, { params } = {}) => {
    if (params && typeof params === "object") {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
      ).toString();
      const full = qs ? `${url}${url.includes("?") ? "&" : "?"}${qs}` : url;
      return fetchJson(full, { method: "GET" });
    }
    return fetchJson(url, { method: "GET" });
  },
  post: (url, data, opts = {}) => fetchJson(url, { method: "POST", body: data, ...opts }),
  put: (url, data, opts = {}) => fetchJson(url, { method: "PUT", body: data, ...opts }),
  delete: (url, opts = {}) => fetchJson(url, { method: "DELETE", ...opts }),
};

export default api;

/* ========================== Compat layer ========================== */
/** Algunos componentes usan fetchWithAuth(path, options) directamente */
export async function fetchWithAuth(path, options = {}) {
  return fetchJson(path, options);
}
