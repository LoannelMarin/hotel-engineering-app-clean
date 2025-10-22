// frontend/src/components/DocumentFormModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/client";
import { X, Search, Upload } from "lucide-react";

/**
 * Modal para crear/editar Document.
 * - NUNCA retornamos antes de ejecutar hooks (evita el error de hooks).
 * - Cuando open=false, ocultamos el contenido con clases (hidden) en lugar de return null.
 */

const INPUT =
  "w-full bg-transparent px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-100 transition-colors duration-150";

export default function DocumentFormModal({ open, initial, onClose, onSave }) {
  // ----- hooks SIEMPRE se ejecutan, sin condicionales -----
  const [form, setForm] = useState(empty());
  const [vendors, setVendors] = useState([]);
  const [qVendor, setQVendor] = useState("");

  const [pdfFile, setPdfFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return; // <- OK: dentro del efecto puedes condicionar
    setForm(initial ? normalize(initial) : empty());
    setPdfFile(null);
    loadVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  async function loadVendors() {
    try {
      const res = await api.get("/api/vendors/");
      const list = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      setVendors(list);
    } catch (e) {
      console.warn("Failed to load vendors:", e);
      setVendors([]);
    }
  }

  const vendorsFiltered = useMemo(() => {
    const t = qVendor.trim().toLowerCase();
    if (!t) return vendors;
    const norm = (s) => (s || "").toString().toLowerCase();
    return vendors.filter(
      (v) =>
        norm(v.name).includes(t) ||
        norm(v.contact_name).includes(t) ||
        norm(v.email).includes(t)
    );
  }, [vendors, qVendor]);

  // ----- helpers -----
  function empty() {
    return {
      id: "",
      name: "",
      description: "",
      vendor_id: "",
      file_url: "", // existente si edición
    };
  }
  function normalize(d) {
    return {
      id: d.id || "",
      name: d.name || "",
      description: d.description || "",
      vendor_id: d.vendor_id || "",
      file_url: d.file_url || "",
    };
  }
  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // file handlers
  function onPickPdf(e) {
    const f = e.target.files?.[0];
    attachFile(f);
  }
  function attachFile(f) {
    if (!f) return;
    if (f.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      if (fileRef.current) fileRef.current.value = "";
      setPdfFile(null);
      return;
    }
    setPdfFile(f);
  }
  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }
  function onDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }
  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    attachFile(f);
  }

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Document Name is required.");
      return;
    }
    // Si hay archivo -> FormData
    if (pdfFile) {
      const fd = new FormData();
      fd.append("name", form.name);
      if (form.description) fd.append("description", form.description);
      if (form.vendor_id) fd.append("vendor_id", String(form.vendor_id));
      fd.append("file", pdfFile, pdfFile.name);
      onSave?.(fd);
      return;
    }
    // Edición sin cambiar archivo: usar JSON (preserva file_url)
    onSave?.({
      name: form.name,
      description: form.description || "",
      vendor_id: form.vendor_id ? Number(form.vendor_id) : null,
      file_url: form.file_url || "",
    });
  }

  function requestClose() {
    onClose?.();
  }

  // ----- RENDER -----
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={(e) => open && e.target === e.currentTarget && requestClose()}
      />

      {/* Drawer */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-zinc-800 bg-zinc-900 shadow-2xl transform transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-3 backdrop-blur">
          <h3 className="text-base font-semibold text-zinc-100">
            {form.id ? "Edit Document" : "New Document"}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={requestClose}
              className="rounded-lg px-3 py-1.5 text-zinc-300 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
              type="button"
            >
              Cancel
            </button>
            <button
              form="document-form"
              type="submit"
              className="rounded-lg bg-[#0B5150] px-3 py-1.5 font-medium text-white hover:bg-[#0A4B4A]"
            >
              Save
            </button>
            <button
              onClick={requestClose}
              className="rounded-lg p-1.5 text-zinc-300 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
              aria-label="Close"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form id="document-form" onSubmit={submit} className="p-4 space-y-3">
          {/* Name */}
          <Field label="Document Name *">
            <div className="rounded-2xl border bg-white p-2 shadow-sm hover:border-zinc-300 focus-within:ring-2 focus-within:ring-black/5 dark:bg-zinc-900 dark:border-zinc-700 dark:hover:border-zinc-600">
              <input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className={INPUT}
                placeholder="e.g., Maintenance Manual"
                required
              />
            </div>
          </Field>

          {/* Vendor select con búsqueda */}
          <Field label="Vendor">
            <div className="rounded-2xl border bg-white p-2 shadow-sm dark:bg-zinc-900 dark:border-zinc-700">
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4 text-zinc-500" />
                <input
                  value={qVendor}
                  onChange={(e) => setQVendor(e.target.value)}
                  className={INPUT + " py-1"}
                  placeholder="Search vendor…"
                />
              </div>
              <select
                value={form.vendor_id}
                onChange={(e) => setField("vendor_id", e.target.value)}
                className="w-full rounded-2xl border border-zinc-300 px-3 py-2 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
              >
                <option value="">(none)</option>
                {vendorsFiltered.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.contact_name ? `— ${v.contact_name}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </Field>

          {/* Description */}
          <Field label="Description">
            <div className="rounded-2xl border bg-white p-2 shadow-sm hover:border-zinc-300 focus-within:ring-2 focus-within:ring-black/5 dark:bg-zinc-900 dark:border-zinc-700 dark:hover:border-zinc-600">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                className={INPUT + " min-h-20 resize-y"}
                placeholder="Optional notes…"
              />
            </div>
          </Field>

          {/* PDF dropzone */}
          <Field label={`Document PDF ${form.id && form.file_url ? "(keep existing if empty)" : "*"}`}>
            <div
              onDragOver={onDragOver}
              onDragEnter={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={
                "relative flex w-full items-center gap-3 rounded-2xl p-2 transition-all border " +
                (dragOver
                  ? "border-[#0B5150] ring-2 ring-[#0B5150]/40 bg-zinc-900"
                  : "border-zinc-300 dark:border-zinc-700")
              }
            >
              <div className="flex items-center gap-3 w-full">
                <span className="inline-flex items-center justify-center rounded-lg bg-zinc-100 p-2 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <Upload className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-zinc-700 dark:text-zinc-200">
                    Drag & drop a PDF, or click to select
                  </div>
                  <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {pdfFile
                      ? `${pdfFile.name} (${Math.ceil(pdfFile.size / 1024)} KB)`
                      : form.file_url
                      ? `Existing: ${form.file_url}`
                      : "No file selected"}
                  </div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  onChange={onPickPdf}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </Field>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</div>
      {children}
    </label>
  );
}
