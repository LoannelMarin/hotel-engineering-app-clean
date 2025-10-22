// frontend/src/pages/InventoryLogs.jsx
import React, { useEffect, useMemo, useState } from "react";

/** Igual que en Inventory.jsx */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  window.location.origin.replace(":5173", ":5000");

/** Añade query string solo si hay params */
function withQuery(url, params) {
  if (!params) return url;
  const qs = new URLSearchParams(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  return qs ? `${url}?${qs}` : url;
}

const ACTIONS = [
  { value: "", label: "All" },
  { value: "in", label: "In" },
  { value: "out", label: "Out" },
  { value: "set", label: "Set" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
];

export default function InventoryLogs() {
  const [sku, setSku] = useState("");
  const [user, setUser] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  const params = useMemo(
    () => ({
      item_code: sku || undefined,
      user: user || undefined,
      action: action || undefined,
      from: from || undefined,
      to: to || undefined,
      sort: "desc",
      page: 1,
      per_page: 50,
    }),
    [sku, user, action, from, to]
  );

  async function fetchLogs() {
    setLoading(true);
    setErr("");
    try {
      const url = withQuery(`${API_BASE}/api/inventory/logs`, params);
      const res = await fetch(url, { credentials: "include" });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        const text = await res.text();
        console.error("GET /api/inventory/logs failed:", res.status, text);
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const data = ct.includes("application/json") ? await res.json() : { items: [] };
      setRows(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      console.error(e);
      setErr("Failed to load logs.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 space-y-4 page-fade-in text-zinc-900 dark:text-zinc-100">
      {/* Header con blur y sombra */}
      <div
        className="
          sticky top-0 z-30 py-3 px-4 -mx-4 mb-2 rounded-2xl
          bg-white/75 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800
          shadow-sm supports-[backdrop-filter]:backdrop-blur-md
        "
      >
        <h1 className="text-2xl font-semibold">Inventory Log</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          View all stock changes, user actions, and updates.
        </p>
      </div>

      {/* Filtros */}
      <div
        className="
          flex flex-wrap items-end gap-3 p-4 rounded-2xl
          bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800
          shadow-sm transition
        "
      >
        <div className="flex flex-col">
          <label className="text-sm opacity-80">Item Code (SKU)</label>
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="SKU-0001"
            className="rounded-xl border border-zinc-300 px-3 py-2 w-[220px] dark:bg-zinc-900 dark:border-zinc-700"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm opacity-80">User (id, email o nombre)</label>
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="12  |  john@hotel.com  |  John"
            className="rounded-xl border border-zinc-300 px-3 py-2 w-[280px] dark:bg-zinc-900 dark:border-zinc-700"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm opacity-80">Action</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="rounded-xl border border-zinc-300 px-3 py-2 w-[160px] dark:bg-zinc-900 dark:border-zinc-700"
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm opacity-80">From</label>
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-zinc-300 px-3 py-2 w-[210px] dark:bg-zinc-900 dark:border-zinc-700"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm opacity-80">To</label>
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-zinc-300 px-3 py-2 w-[210px] dark:bg-zinc-900 dark:border-zinc-700"
          />
        </div>

        <button
          onClick={fetchLogs}
          className="
            h-[42px] inline-flex items-center gap-2 px-4 rounded-xl border border-zinc-300
            bg-white hover:shadow-sm transition
            dark:bg-zinc-900 dark:border-zinc-700
          "
        >
          Search
        </button>
      </div>

      {/* Tabla */}
      <div
        className="
          overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800
          shadow-sm bg-white dark:bg-zinc-900 content-fade-in
        "
      >
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-950">
            <tr className="text-left text-zinc-700 dark:text-zinc-300">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Δ</th>
              <th className="px-4 py-3">Prev</th>
              <th className="px-4 py-3">New</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                  colSpan={8}
                >
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                  colSpan={8}
                >
                  {err || "No logs"}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition"
                >
                  <td className="px-4 py-2 whitespace-nowrap">
                    {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
                  </td>
                  <td className="px-4 py-2">{r.item_code}</td>
                  <td className="px-4 py-2 capitalize">{r.action}</td>
                  <td className="px-4 py-2">{r.delta ?? ""}</td>
                  <td className="px-4 py-2">{r.prev_stock ?? ""}</td>
                  <td className="px-4 py-2">{r.new_stock ?? ""}</td>
                  <td className="px-4 py-2">{r.user_name || r.user_email || r.user_id || ""}</td>
                  <td className="px-4 py-2">{r.note ?? ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Estilos locales */}
      <style>{`
        .page-fade-in {
          animation: inv-page-fade .25s ease-out;
        }
        .content-fade-in {
          animation: inv-content-rise .28s ease-out;
        }
        @keyframes inv-page-fade {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes inv-content-rise {
          from { opacity: 0; transform: translateY(4px) }
          to { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </div>
  );
}
