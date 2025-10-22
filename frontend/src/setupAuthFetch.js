// Parche global de window.fetch para adjuntar siempre el JWT y credentials.
(function patchFetch() {
  if (typeof window === "undefined") return;
  if (window.__fetchPatchedForAuth) return;
  window.__fetchPatchedForAuth = true;

  const origFetch = window.fetch;

  function readToken() {
    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      ""
    );
  }

  window.fetch = async function (input, init = {}) {
    try {
      const token = readToken();
      const opts = { ...init };

      // Incluye cookies (por si cambias a cookies HTTPOnly)
      opts.credentials = opts.credentials || "include";

      const headers = new Headers(opts.headers || {});
      if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      if (
        !headers.has("Content-Type") &&
        opts.body &&
        typeof opts.body === "string" &&
        (opts.body.trim().startsWith("{") || opts.body.trim().startsWith("["))
      ) {
        headers.set("Content-Type", "application/json");
      }
      opts.headers = headers;

      return await origFetch(input, opts);
    } catch (err) {
      console.error("[setupAuthFetch] error:", err);
      return await origFetch(input, init);
    }
  };
})();
