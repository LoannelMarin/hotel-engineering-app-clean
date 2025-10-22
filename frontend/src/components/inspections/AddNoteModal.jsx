// src/components/inspections/AddNoteModal.jsx
import React, { useEffect, useRef, useState } from "react";

export default function AddNoteModal({ open, initial = "", onClose, onSave }) {
  const [note, setNote] = useState(initial || "");
  const dialogRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setNote(initial || "");
    // focus al abrir
    const t = setTimeout(() => textareaRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [open, initial]);

  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "enter") {
        handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, note]);

  if (!open) return null;

  const handleSave = () => {
    onSave?.(note);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end md:items-center justify-center"
      aria-modal="true"
      role="dialog"
      ref={dialogRef}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="
        relative w-full md:max-w-xl
        rounded-t-2xl md:rounded-2xl
        border
        bg-white text-gray-900
        shadow-2xl
        p-4 md:p-6
        dark:bg-neutral-900 dark:text-gray-100 dark:border-neutral-800
      ">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Add note</h2>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50
                       dark:bg-neutral-900 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            Notes (Ctrl/⌘+Enter to save)
          </label>
          <textarea
            ref={textareaRef}
            rows={6}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write a quick note…"
            className="
              w-full rounded-xl border px-3 py-2
              bg-white text-gray-900 placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300
              dark:bg-neutral-800 dark:text-gray-100 dark:placeholder:text-gray-500
              dark:border-neutral-700 dark:focus:ring-neutral-500/30 dark:focus:border-neutral-600
            "
          />
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50
                       dark:bg-neutral-900 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-black
                       dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
