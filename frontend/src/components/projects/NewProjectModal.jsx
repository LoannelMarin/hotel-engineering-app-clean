import React, { useState } from "react";
import { X } from "lucide-react";

export default function NewProjectModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", color: "#0B5150" });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return alert("Name required");

    const id = `p${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 7)}`;

    const proj = { id, name, color: form.color || "#0B5150" };
    onCreated?.(proj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-[var(--surface-1)] p-6 shadow-xl border border-[var(--border-1)] relative text-[var(--text-1)]"
      >
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
        >
          <X size={18} />
        </button>

        <h3 className="mb-4 text-lg font-semibold text-[#0B5150] dark:text-[#5ad5d3]">
          Create Project
        </h3>

        {/* Campo Nombre */}
        <label className="mb-1 block text-sm text-[var(--text-2)]">Name</label>
        <input
          className="mb-4 w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] 
                     px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5150]"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g., Paint Renovation"
          required
        />

        {/* Campo Color */}
        <label className="mb-1 block text-sm text-[var(--text-2)]">Color</label>
        <input
          type="color"
          className="mb-6 h-10 w-16 cursor-pointer rounded border border-[var(--border-1)] bg-[var(--surface-2)]"
          value={form.color}
          onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
        />

        {/* Botones */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] 
                       px-4 py-1.5 text-sm text-[var(--text-1)] hover:bg-[var(--surface-3)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#0B5150] hover:bg-[#0e6664] text-white 
                       px-4 py-1.5 text-sm transition-colors"
          >
            Save
          </button>
        </div>
      </form>

      {/* Animación */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn .25s ease-out; }
      `}</style>
    </div>
  );
}
