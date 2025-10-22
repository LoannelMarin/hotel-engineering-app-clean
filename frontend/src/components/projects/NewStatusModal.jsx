// src/components/projects/NewStatusModal.jsx
import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Save } from "lucide-react";
import { fetchWithAuth } from "../../utils/api";

export default function NewStatusModal({ open, projectId, legend, onClose, onSave }) {
  const [localStatuses, setLocalStatuses] = useState([]);
  const [saving, setSaving] = useState(false);

  // ✅ Inicializa con copia de la leyenda actual
  useEffect(() => {
    if (legend) {
      const arr = Object.entries(legend).map(([label, color]) => ({
        label,
        color: typeof color === "string" ? color : color.color || "#FFFFFF",
      }));
      setLocalStatuses(arr);
    }
  }, [legend]);

  // ✅ Actualiza valor sin recrear todo el array
  function handleChange(index, field, value) {
    setLocalStatuses((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function handleAdd() {
    setLocalStatuses((prev) => [...prev, { label: "", color: "#FFFFFF" }]);
  }

  function handleRemove(index) {
    setLocalStatuses((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    try {
      setSaving(true);
      const legendToSend = {};
      for (const s of localStatuses) {
        if (s.label.trim()) legendToSend[s.label] = s.color;
      }

      await fetchWithAuth(`/api/projects/${projectId}/legend`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color_legend: legendToSend }),
      });

      onSave?.(legendToSend);
      onClose?.();
    } catch (err) {
      console.error("❌ Error saving legend:", err);
      alert("Error saving legend. Check console.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-3">
      <div
        className="bg-[var(--surface-1)] text-[var(--text-1)] rounded-2xl shadow-xl 
                   w-full max-w-lg p-6 border border-[var(--border-1)] relative overflow-hidden"
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-[var(--surface-2)] transition"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold mb-4 text-[#0B5150] dark:text-[#5ad5d3]">
          Manage Status Colors
        </h2>

        {/* Lista de status */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {localStatuses.map((s, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 bg-[var(--surface-2)] rounded-xl p-2"
            >
              <input
                type="text"
                value={s.label}
                onChange={(e) => handleChange(i, "label", e.target.value)}
                placeholder="Status name"
                className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-1)] 
                           bg-[var(--surface-1)] text-[var(--text-1)] focus:ring-2 
                           focus:ring-[#0B5150] outline-none"
              />
              <input
                type="color"
                value={s.color}
                onChange={(e) => handleChange(i, "color", e.target.value)}
                className="w-10 h-10 rounded-lg border cursor-pointer"
              />
              <button
                onClick={() => handleRemove(i)}
                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg self-center"
                title="Remove"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-5 gap-3">
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-[var(--border-1)] 
                       bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition"
          >
            <Plus size={16} /> Add
          </button>

          <button
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 text-sm px-4 py-1.5 rounded-lg text-white 
                       bg-[#0B5150] hover:bg-[#0e6664] disabled:opacity-70 transition"
          >
            <Save size={16} /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
