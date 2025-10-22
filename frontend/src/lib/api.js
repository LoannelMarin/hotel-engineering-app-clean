export const API_BASE = "/api"; 
// En dev: Vite proxy. En prod: detrás de nginx.

/** Lee el token del Local Storage (según los keys que vi en tu captura). */
function getToken() {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    ""
  );
}

/** Wrapper de fetch que añade Authorization y credentials. */
export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: options.credentials || "include",
  });
  return res;
}
