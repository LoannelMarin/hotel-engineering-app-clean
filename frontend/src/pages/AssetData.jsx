// frontend/src/pages/AssetData.jsx
import React, { useEffect, useMemo, useState } from "react";
import AssetsTable from "../components/assets/AssetsTable.jsx";
import AssetFormModal from "../components/assets/AssetFormModal.jsx";
import { fetchWithAuth } from "../utils/api";
import PageWithToolbar from "../layout/PageWithToolbar";

/**
 * 📊 Asset Data Page
 * - Diseño responsivo con scroll limpio
 * - Tabla fluida (scroll-x en móvil, sticky header en desktop)
 * - Reutiliza estructura de QuotesEstimates
 */
export default function AssetData() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  /* ---------------- Fetch data ---------------- */
  async function load() {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/assets/");
      setItems(res.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /* ---------------- Search filter ---------------- */
  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    if (!text) return items;
    return items.filter((a) => {
      const bag = [
        a.name,
        a.type,
        a.location,
        a.manufacturer,
        a.model_no,
        a.serial_no,
        a.hostname,
        a.ip_address,
        a.mac_address,
        a.equipment,
        a.equipment_name,
      ]
        .map((x) => (x || "").toString().toLowerCase())
        .join(" ");
      return bag.includes(text);
    });
  }, [items, q]);

  /* ---------------- CRUD actions ---------------- */
  async function handleSave(payload) {
    if (editItem && editItem.id) {
      await fetchWithAuth(`/api/assets/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetchWithAuth("/api/assets/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setOpen(false);
    setEditItem(null);
    await load();
  }

  async function handleDelete(item) {
    if (!item?.id) return;
    const ok = window.confirm("Delete this asset?");
    if (!ok) return;
    await fetchWithAuth(`/api/assets/${item.id}`, { method: "DELETE" });
    await load();
  }

  function openCreate() {
    setEditItem(null);
    setOpen(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditItem(null);
  }

  const toolbarProps = {
    value: q,
    onChange: setQ,
    onAdd: openCreate,
  };

  /* ---------------- Render ---------------- */
  return (
    <PageWithToolbar toolbarProps={toolbarProps}>
      <div
        className="
          flex-1 relative flex flex-col 
          min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-6rem)] 
          bg-transparent overflow-hidden
        "
      >
        {/* Tabla contenedora con scroll limpio */}
        <div
          className="
            flex-1 w-full overflow-x-auto overflow-y-auto 
            rounded-2xl border border-zinc-200 dark:border-zinc-800 
            bg-white dark:bg-[#1d1f24] shadow-sm
          "
        >
          <div className="min-w-full">
            <AssetsTable
              items={filtered}
              loading={loading}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>

      {/* Modal de creación / edición */}
      <AssetFormModal
        open={open}
        initial={editItem}
        onClose={closeModal}
        onSave={handleSave}
      />
    </PageWithToolbar>
  );
}
