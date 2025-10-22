// src/utils/api.js

// Detecta si la URL ya es absoluta (http/https)
function isAbsoluteUrl(u) {
  return /^https?:\/\//i.test(u);
}

// Base de la API: en dev usa localhost:5000 por defecto
const API_BASE = (
  import.meta.env.DEV
    ? (import.meta.env.VITE_API_BASE || window.location.origin.replace(":5173", ":5000"))
    : (import.meta.env.VITE_API_BASE || "")
).replace(/\/$/, "");

// buildUrl ahora respeta URLs absolutas
function buildUrl(path) {
  if (isAbsoluteUrl(path)) return path; // no tocar si ya es absoluta
  const p = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
}

/* ---------------- Token helpers ---------------- */
function getToken() {
  try {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      ""
    );
  } catch {
    return "";
  }
}
function setToken(t) {
  try {
    if (localStorage.getItem("token") != null) {
      localStorage.setItem("token", t);
    } else {
      localStorage.setItem("access_token", t);
    }
  } catch {}
}
function clearAuth() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user_id");
  } catch {}
}

/* ---------------- JWT helpers ---------------- */
function safeBase64UrlDecode(s) {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "===".slice((b64.length + 3) % 4);
    return atob(padded);
  } catch {
    return "";
  }
}
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const json = safeBase64UrlDecode(parts[1]);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/* ---------------- Actor helpers ---------------- */
function getActorName() {
  const token = getToken();
  if (token) {
    const p = decodeJwtPayload(token) || {};
    const fromJwt =
      p.name ||
      p.full_name ||
      p.display_name ||
      (p.user && (p.user.name || p.user.full_name || p.user.display_name)) ||
      p.preferred_username ||
      p.username ||
      p.email;
    if (fromJwt && String(fromJwt).trim()) return String(fromJwt).trim();
  }

  try {
    const direct =
      localStorage.getItem("user_name") ||
      localStorage.getItem("username") ||
      localStorage.getItem("display_name") ||
      localStorage.getItem("email");
    if (direct && String(direct).trim()) return String(direct).trim();

    const keys = ["user", "auth_user", "profile", "auth"];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      try {
        const o = JSON.parse(raw);
        const v = o?.name || o?.full_name || o?.display_name || o?.username || o?.email;
        if (v && String(v).trim()) return String(v).trim();
      } catch {}
    }
  } catch {}

  return "anonymous";
}

function maybeInjectActorIntoBody(options, actor) {
  try {
    if (!options || !options.method || options.method.toUpperCase() === "GET") return options;
    const headers = new Headers(options.headers || {});
    const ct = headers.get("Content-Type") || "";
    if (ct.includes("application/json")) {
      if (typeof options.body === "string" && options.body.trim().startsWith("{")) {
        const obj = JSON.parse(options.body);
        if (!("actor_name" in obj)) obj.actor_name = actor;
        options.body = JSON.stringify(obj);
      } else if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
        if (!("actor_name" in options.body)) options.body.actor_name = actor;
      } else if (!options.body) {
        options.body = JSON.stringify({ actor_name: actor });
      }
    }
  } catch {}
  return options;
}

/* ---------------- Parse helper ---------------- */
async function parseResponse(resp) {
  if (resp.status === 204 || resp.status === 205) return null;
  const text = await resp.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/* ---------------- Refresh logic (on-demand) ---------------- */
const REFRESH_PATH =
  (import.meta.env.VITE_AUTH_REFRESH_PATH || "/api/auth/refresh").trim() || null;

let _refreshing = null;
let _refreshUnavailable = false;

async function tryRefreshTokenOnce(method = "POST") {
  if (!REFRESH_PATH || _refreshUnavailable) return null;
  try {
    const current = getToken();
    const resp = await fetch(buildUrl(REFRESH_PATH), {
      method,
      credentials: "include",
      headers: current ? { Authorization: `Bearer ${current}` } : undefined,
    });
    if (resp.status === 405 && method === "POST") {
      return await tryRefreshTokenOnce("GET");
    }
    if (resp.status === 404 || resp.status === 405) {
      _refreshUnavailable = true;
      return null;
    }
    if (!resp.ok) return null;
    const data = await resp.json().catch(() => ({}));
    const newTok = data?.access_token || data?.token;
    if (newTok) {
      setToken(newTok);
      return newTok;
    }
    return null;
  } catch {
    return null;
  }
}
async function tryRefreshToken() {
  if (!REFRESH_PATH || _refreshUnavailable) return null;
  if (_refreshing) return _refreshing;
  _refreshing = (async () => {
    const t = await tryRefreshTokenOnce("POST");
    _refreshing = null;
    return t;
  })();
  return _refreshing;
}

/* ---------------- Main fetch ---------------- */
export async function fetchWithAuth(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const actor = getActorName();
  if (!headers.has("X-Actor-Name")) headers.set("X-Actor-Name", actor);
  options.headers = headers;
  options = maybeInjectActorIntoBody(options, actor);

  const doFetch = () =>
    fetch(buildUrl(path), {
      ...options,
      credentials: "include",
      mode: "cors",
      cache: "no-store",
    });

  let resp = await doFetch();

  if (resp.status === 401 && !_refreshUnavailable && !options.__retried) {
    const newTok = await tryRefreshToken();
    if (newTok) {
      const h2 = new Headers(options.headers || {});
      h2.set("Authorization", `Bearer ${newTok}`);
      resp = await fetch(buildUrl(path), {
        ...options,
        __retried: true,
        headers: h2,
        credentials: "include",
        mode: "cors",
        cache: "no-store",
      });
    }
  }

  if (!resp.ok) {
    if (resp.status === 401) {
      clearAuth();
      if (typeof window !== "undefined") window.location.replace("/login");
    }
    const payload = await parseResponse(resp);
    const detail =
      typeof payload === "object" ? JSON.stringify(payload) : String(payload || "");
    const err = new Error(
      `API ${resp.status} ${resp.statusText} @ ${buildUrl(path)}${detail ? ` — ${detail}` : ""}`,
    );
    err.status = resp.status;
    err.response = payload;
    throw err;
  }
  return parseResponse(resp);
}

/* ---------------- Upload helper ---------------- */
export async function uploadFile(file) {
  const fd = new FormData();
  fd.append("file", file);
  const headers = new Headers();
  headers.set("X-Actor-Name", getActorName());
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let resp = await fetch(buildUrl("/api/uploads"), {
    method: "POST",
    body: fd,
    credentials: "include",
    headers,
  });

  if (resp.status === 401 && !_refreshUnavailable) {
    const newTok = await tryRefreshToken();
    if (newTok) {
      headers.set("Authorization", `Bearer ${newTok}`);
      resp = await fetch(buildUrl("/api/uploads"), {
        method: "POST",
        body: fd,
        credentials: "include",
        headers,
      });
    }
  }

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    if (resp.status === 401) {
      clearAuth();
      if (typeof window !== "undefined") window.location.replace("/login");
    }
    throw new Error(`Upload failed (${resp.status}) ${txt}`);
  }
  return resp.json();
}

export const API_URL = API_BASE;
