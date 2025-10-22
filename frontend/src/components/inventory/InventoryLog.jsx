import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

const ACTIONS = [
  { value: "", label: "All" },
  { value: "in", label: "In" },
  { value: "out", label: "Out" },
  { value: "set", label: "Set" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
];

const fmtDT = (s) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleString(); } catch { return s; }
};

export default function InventoryLog() {
  const [sku, setSku] = useState("");
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [loading, setLoading] = useState(false);

  const qs = useMemo(() => {
    const q = new URLSearchParams();
    if (sku) q.set("item_code", sku.trim());
    if (userId) q.set("user_id", userId.trim());
    if (action) q.set("action", action);
    if (from) q.set("from", new Date(from).toISOString());
    if (to) q.set("to", new Date(to).toISOString());
    q.set("page", String(page));
    q.set("per_page", String(perPage));
    q.set("sort", "desc");
    return q.toString();
  }, [sku, userId, action, from, to, page, perPage]);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch(`/inventory/logs?${qs}`);
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];

      // Normalización ROBUSTA para que User/Item nunca queden vacíos
      const normalized = items.map((r) => {
        const user =
          r.user ??
          r.user_name ??
          r.user_email ??
          r.user_id ??
          "—";

        const item =
          r.item ??
          r.item_code ??
          r.name ??
          (typeof r.item_db_id === "number" ? String(r.item_db_id) : r.item_db_id) ??
          "—";

        return { ...r, user, item };
      });

      setRows(normalized);
    } catch (e) {
      console.error("[InventoryLog] load error:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [qs]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Inventory Log</h1>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
        <div className="md:col-span-2">
          <div className="text-sm mb-1 text-[var(--text-2)]">Item Code (SKU)</div>
          <input
            className="input w-full"
            placeholder="SKU-0001"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <div className="text-sm mb-1 text-[var(--text-2)]">User ID</div>
          <input
            className="input w-full"
            placeholder="user@example.com o ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>
        <div>
          <div className="text-sm mb-1 text-[var(--text-2)]">Action</div>
          <select
            className="input w-full"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <div className="text-sm mb-1 text-[var(--text-2)]">From</div>
          <input
            className="input w-full"
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <div className="text-sm mb-1 text-[var(--text-2)]">To</div>
          <input
            className="input w-full"
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button className="btn" onClick={load} disabled={loading}>
            {loading ? "..." : "Search"}
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-auto rounded-xl border border-[var(--border-1)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--surface-2)] sticky top-0">
            <tr>
              <th className="text-left px-4 py-2">When</th>
              <th className="text-left px-4 py-2">Item</th>
              <th className="text-left px-4 py-2">Action</th>
              <th className="text-right px-4 py-2">Δ</th>
              <th className="text-right px-4 py-2">Prev</th>
              <th className="text-right px-4 py-2">New</th>
              <th className="text-left px-4 py-2">User</th>
              <th className="text-left px-4 py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-[var(--muted)]" colSpan={8}>No data</td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={r.id ?? `${r.created_at}-${idx}`}>
                  <td className="px-4 py-2">{fmtDT(r.created_at)}</td>
                  <td className="px-4 py-2">{r.item}</td>
                  <td className="px-4 py-2 capitalize">{r.action}</td>
                  <td className="px-4 py-2 text-right">{r.delta ?? "—"}</td>
                  <td className="px-4 py-2 text-right">{r.prev_stock ?? "—"}</td>
                  <td className="px-4 py-2 text-right">{r.new_stock ?? "—"}</td>
                  <td className="px-4 py-2">{r.user}</td>
                  <td className="px-4 py-2">{r.note || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
