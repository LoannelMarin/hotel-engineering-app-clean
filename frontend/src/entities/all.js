async function getJSON(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });
  if (res.status === 204) return [];
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return [];
  return res.json();
}

function qs(params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") search.set(k, String(v));
  });
  const s = search.toString();
  return s ? `?${s}` : "";
}

async function tryMany(requests) {
  for (const req of requests) {
    try {
      if (req.method === "POST") {
        return await getJSON(req.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body || {}),
        });
      }
      return await getJSON(req.url);
    } catch { /* sigue probando */ }
  }
  return [];
}

export const Asset = {
  async list(order = "-created_date") {
    const q = qs({ order });
    return tryMany([
      { url: `/api/assets${q}` },
      { url: `/api/assets/${q.slice(1)}` },
      { url: `/api/asset${q}` },
      { url: `/api/assets/list${q}` },
      { url: `/api/asset/list${q}` },
      { url: `/api/assets/list`, method: "POST", body: { order } },
      { url: `/api/asset/list`, method: "POST", body: { order } },
    ]);
  },
  async get(id) {
    return tryMany([
      { url: `/api/assets/${encodeURIComponent(id)}` },
      { url: `/api/asset/${encodeURIComponent(id)}` },
    ]);
  },
};

export const Inspection = {
  async list(order = "-inspection_date", limit = 50) {
    const q = qs({ order, limit });
    return tryMany([
      { url: `/api/inspections${q}` },
      { url: `/api/inspections/${q.slice(1)}` },
      { url: `/api/inspection${q}` },
      { url: `/api/inspections/list${q}` },
      { url: `/api/inspection/list${q}` },
      { url: `/api/inspections/list`, method: "POST", body: { order, limit } },
      { url: `/api/inspection/list`, method: "POST", body: { order, limit } },
    ]);
  },
  async get(id) {
    return tryMany([
      { url: `/api/inspections/${encodeURIComponent(id)}` },
      { url: `/api/inspection/${encodeURIComponent(id)}` },
    ]);
  },
};
