// frontend/src/pages/Inventory.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Plus as PlusIcon, QrCode, History, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import * as apiModule from "../api/client";
import { setAuth as setApiAuth } from "../api/client";
import { fetchWithAuth } from "../utils/api";

import InventoryTable from "../components/inventory/InventoryTable";
import BulkScanModal from "../components/inventory/BulkScanModal";
import ItemEditModal from "../components/inventory/ItemEditModal";

/* ----------------------------- API BASE ----------------------------- */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  window.location.origin.replace(":5173", ":5000");

const INVENTORY_BASE = `${API_BASE}/api/inventory/`;

const withQuery = (url, params) => {
  if (!params) return url;
  const qs = new URLSearchParams(params).toString();
  return qs ? `${url}?${qs}` : url;
};

/* --------------------------- HTTP ADAPTER --------------------------- */
function pickClient(mod) {
  return mod?.api || mod?.default || mod?.client || mod?.request || mod?.fetcher || null;
}

function absolutize(u) {
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return `${API_BASE}${u}`;
  return `${API_BASE}/${u.replace(/^\/+/, "")}`;
}

function buildHttp() {
  const candidate = pickClient(apiModule);
  if (candidate && typeof candidate.get === "function") {
    return {
      get: (url, opts) => candidate.get(absolutize(url), opts),
      post: (url, data, opts) => candidate.post(absolutize(url), data, opts),
      put: (url, data, opts) => candidate.put(absolutize(url), data, opts),
      delete: (url, opts) => candidate.delete(absolutize(url), opts),
    };
  }

  async function fx(url, options) {
    const res = await fetch(absolutize(url), {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });
    const ct = res.headers.get("content-type") || "";
    const isJSON = ct.includes("application/json");
    if (!res.ok) {
      const body = isJSON ? await res.json().catch(() => ({})) : await res.text();
      throw new Error(`HTTP ${res.status} ${res.statusText} ${JSON.stringify(body)}`);
    }
    return isJSON ? res.json() : res.text();
  }

  return {
    get: (url, { params } = {}) => fx(withQuery(url, params), { method: "GET" }),
    post: (url, data) => fx(url, { method: "POST", body: JSON.stringify(data) }),
    put: (url, data) => fx(url, { method: "PUT", body: JSON.stringify(data) }),
    delete: (url) => fx(url, { method: "DELETE" }),
  };
}
const http = buildHttp();

/* -------------------------------- PAGE --------------------------------- */
export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [lowMode, setLowMode] = useState(false);
  const [lowCount, setLowCount] = useState(0);

  const headerRef = useRef(null);
  const [tableHeight, setTableHeight] = useState("auto");

  useEffect(() => {
    function recalcHeight() {
      const headerH = headerRef.current?.offsetHeight || 0;
      const viewportH =
        window.visualViewport?.height || window.innerHeight || 800;
      const marginBottom = 8;
      const available = viewportH - headerH - marginBottom;
      setTableHeight(`${available}px`);
    }

    recalcHeight();
    const resizeObs = new ResizeObserver(recalcHeight);
    if (headerRef.current) resizeObs.observe(headerRef.current);

    window.addEventListener("resize", recalcHeight);
    window.visualViewport?.addEventListener("resize", recalcHeight);

    return () => {
      resizeObs.disconnect();
      window.removeEventListener("resize", recalcHeight);
      window.visualViewport?.removeEventListener("resize", recalcHeight);
    };
  }, []);

  // === asegurar user_id en localStorage
  useEffect(() => {
    (async () => {
      try {
        const me = await fetchWithAuth("/api/auth/me");
        if (me?.id) {
          setApiAuth({ user_id: me.id });
          localStorage.setItem("user_id", me.id);
          localStorage.setItem("user_name", me.name || me.email || "Unknown");
        }
      } catch (err) {
        console.error("❌ /api/auth/me failed:", err);
      }
    })();
  }, []);

  /* ------------------------- LOAD ALL ITEMS ------------------------- */
  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await http.get(`${INVENTORY_BASE}`);
      const data = res?.data ?? res;
      const list = Array.isArray(data) ? data : data?.items || [];
      setItems(list);
      setLowCount(list.filter((i) => (i.stock ?? 0) <= (i.minimum ?? 0)).length);
    } catch (err) {
      console.error("GET /api/inventory/ failed:", err);
      alert("Failed to load items.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStock = async () => {
    setLoading(true);
    try {
      const res = await http.get(`${INVENTORY_BASE}lowstock`);
      const data = res?.data ?? res;
      const list = Array.isArray(data) ? data : data?.items || [];
      setItems(list);
      setLowCount(list.length);
    } catch (err) {
      console.error("GET /api/inventory/lowstock failed:", err);
      alert("Failed to load low stock items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const term = q.toLowerCase();
    return items.filter((i) =>
      [
        i.item_id,
        i.name,
        i.category,
        i.part_no,
        i.location,
        i.description,
        i.supplier,
        i.supplier_id?.toString?.(),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [items, q]);

  /* ---------------------------- CRUD OPS ---------------------------- */
  const openCreate = () => {
    setSelected(null);
    setShowEdit(true);
  };
  const handleEditItem = (item) => {
    setSelected(item || null);
    setShowEdit(true);
  };
  const handleDeleteItem = async (item) => {
    const ok = window.confirm(
      `Delete item "${item.name}" (${item.item_id})? This cannot be undone.`
    );
    if (!ok) return;
    try {
      await http.delete(`${INVENTORY_BASE}${item.id}`);
      if (lowMode) await fetchLowStock();
      else await fetchItems();
    } catch (err) {
      console.error("DELETE failed:", err);
      alert("Delete failed.");
    }
  };

  const handleAdjustInline = async (item, delta) => {
    try {
      const newStock = (item.stock || 0) + delta;
      await http.put(`${INVENTORY_BASE}${item.id}`, { stock: newStock });

      if (lowMode && newStock > (item.minimum ?? 0)) {
        const updated = items.filter((i) => i.id !== item.id);
        setItems(updated);
        setLowCount(updated.filter((i) => (i.stock ?? 0) <= (i.minimum ?? 0)).length);
      } else {
        await (lowMode ? fetchLowStock() : fetchItems());
      }
    } catch (err) {
      console.error("Inline adjust failed:", err);
      alert("Adjustment failed.");
    }
  };

  const handleSubmitEdit = async (form) => {
    try {
      if (selected?.id) {
        await http.put(`${INVENTORY_BASE}${selected.id}`, form);
      } else {
        await http.post(`${INVENTORY_BASE}`, form);
      }
      setShowEdit(false);
      setSelected(null);
      await (lowMode ? fetchLowStock() : fetchItems());
    } catch (err) {
      console.error("Save failed:", err);
      alert("Save item failed.");
    }
  };

  const handleSubmitBulk = async (payload) => {
    try {
      const byItemId = new Map(items.map((i) => [i.item_id, i]));
      const byId = new Map();
      for (const { barcode, delta } of payload) {
        const item = byItemId.get(barcode);
        if (!item) continue;
        const prev = byId.get(item.id) || 0;
        byId.set(item.id, prev + delta);
      }
      for (const [id, delta] of byId.entries()) {
        const current = items.find((i) => i.id === id)?.stock || 0;
        const newStock = current + delta;
        await http.put(`${INVENTORY_BASE}${id}`, { stock: newStock });
      }
      setShowBulk(false);
      await (lowMode ? fetchLowStock() : fetchItems());
    } catch (err) {
      console.error("Bulk adjust failed:", err);
      alert("Bulk adjust failed.");
    }
  };

  /* --------------------------- RENDER PAGE --------------------------- */
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-transparent">
      {/* Header */}
      <header
        ref={headerRef}
        className="
          sticky top-0 z-30
          bg-white/80 dark:bg-zinc-950/60 supports-[backdrop-filter]:backdrop-blur-sm
          border-b border-zinc-200 dark:border-zinc-800
          px-6 min-h-[64px] py-2
          flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6
        "
      >
        <div className="h-[42px] flex items-center">
          <h1 className="text-2xl font-semibold leading-none text-zinc-900 dark:text-zinc-100">
            Inventory
          </h1>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, part no, item ID..."
            className="h-[42px] rounded-2xl border px-3 w-full sm:w-[260px] md:w-[320px] flex-shrink-0
              border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500
              dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700
              focus:ring-2 focus:ring-[#0B5150]/40 focus:outline-none transition"
          />

          <Link
            to="/inventory/logs"
            className="h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-2xl border
              border-zinc-300 bg-white text-zinc-800 hover:shadow-sm transition
              dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700"
          >
            <History size={18} />
            <span className="hidden sm:inline">Logs</span>
          </Link>

          <button
            className={`relative h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-2xl border transition
              ${
                lowMode
                  ? "border-red-700 bg-red-700 text-white"
                  : "border-zinc-300 bg-white text-zinc-800 hover:shadow-sm dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700"
              }`}
            onClick={() => {
              if (lowMode) {
                setLowMode(false);
                fetchItems();
              } else {
                setLowMode(true);
                fetchLowStock();
              }
            }}
            type="button"
          >
            <AlertTriangle size={18} />
            <span className="hidden sm:inline">{lowMode ? "Show All" : "Low Stock"}</span>
            {lowCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                {lowCount}
              </span>
            )}
          </button>

          <button
            className="h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-2xl border
              border-zinc-300 bg-white text-zinc-800 hover:shadow-sm transition
              dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700"
            onClick={() => setShowBulk(true)}
          >
            <QrCode size={18} />
            <span className="hidden sm:inline">Bulk Scan</span>
          </button>

          <button
            className="h-[42px] inline-flex items-center justify-center gap-2 px-4 rounded-2xl border
              border-zinc-300 bg-white text-zinc-800 hover:shadow-sm transition
              dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700"
            onClick={openCreate}
          >
            <PlusIcon size={18} />
            <span className="hidden sm:inline">Add Item</span>
          </button>
        </div>
      </header>

      <div
        className="flex-1 min-h-0 overflow-y-auto overflow-x-auto border-t border-zinc-200 dark:border-zinc-800 bg-transparent"
        style={{ height: tableHeight }}
      >
        <InventoryTable
          loading={loading}
          items={filtered}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
          onAdjustInline={handleAdjustInline}
        />
      </div>

      <BulkScanModal
        open={showBulk}
        onClose={() => setShowBulk(false)}
        onSubmit={handleSubmitBulk}
      />

      <ItemEditModal
        open={showEdit}
        item={selected}
        onClose={() => {
          setShowEdit(false);
          setSelected(null);
        }}
        onSubmit={handleSubmitEdit}
        onSave={handleSubmitEdit}
      />
    </div>
  );
}
