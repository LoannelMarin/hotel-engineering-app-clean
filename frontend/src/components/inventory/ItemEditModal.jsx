// src/components/inventory/ItemEditModal.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { X, Save, Image as ImageIcon, Upload, Trash2 } from "lucide-react";
import { uploadFile } from "../../utils/api"; // ✅ NUEVO: usa el helper centralizado

/* ---------------- helpers ---------------- */
const FALLBACK_PREVIEW_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180">
     <rect width="100%" height="100%" fill="#111827"/>
     <rect x="8" y="8" width="224" height="164" rx="12" ry="12" fill="#1f2937" stroke="#374151" stroke-width="2"/>
     <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
           fill="#9ca3af" font-size="14" font-family="ui-sans-serif, system-ui">No image</text>
   </svg>`;
const FALLBACK_PREVIEW = `data:image/svg+xml;utf8,${encodeURIComponent(FALLBACK_PREVIEW_SVG)}`;

function resolveSrc(raw) {
  const s = (raw || "").trim();
  if (!s) return "";
  if (/^data:|^blob:|^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) {
    const api =
      import.meta.env.VITE_API_BASE_URL ||
      window.location.origin.replace(":5173", ":5000");
    return `${api}${s}`;
  }
  return s;
}

function cleanNumber(v) {
  if (v === "" || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/* ---------------- component ---------------- */
export default function ItemEditModal({
  open,
  item,             // null => create
  onClose,
  onSubmit,         // (form) => void
  onSave,           // compat
}) {
  const isEdit = !!item?.id;

  const initial = useMemo(
    () => ({
      name: "",
      item_id: "",
      category: "",
      location: "",
      stock: "",
      minimum: "",
      supplier_id: "",
      part_no: "",
      unit_cost: "",
      product_link: "",
      image: "",
      description: "",
    }),
    []
  );

  const [form, setForm] = useState(initial);

  // imagen local y preview
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const dropRef = useRef(null);
  const fileInputRef = useRef(null);

  // ⚡️ Vendors (NUEVO: sin tocar estilos generales)
  const [vendors, setVendors] = useState([]);
  useEffect(() => {
    async function loadVendors() {
      try {
        const base =
          import.meta.env.VITE_API_BASE_URL ||
          window.location.origin.replace(":5173", ":5000");
        const res = await fetch(`${base}/api/vendors/`, { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        setVendors(
          list.map((v) => ({
            id: v.id,
            name: v.name || v.company || v.contact_name || `#${v.id}`,
          }))
        );
      } catch {
        setVendors([]);
      }
    }
    if (open) loadVendors();
  }, [open]);

  // Prefill cuando abrimos el modal
  useEffect(() => {
    if (open && item) {
      setForm({
        name: item.name ?? "",
        item_id: item.item_id ?? "",
        category: item.category ?? "",
        location: item.location ?? "",
        stock: item.stock ?? "",
        minimum: item.minimum ?? "",
        supplier_id: item.supplier_id ?? "",
        part_no: item.part_no ?? "",
        unit_cost: item.unit_cost ?? "",
        product_link: item.product_link ?? "",
        image: item.image ?? item.image_url ?? item.imageUrl ?? "",
        description: item.description ?? "",
      });
      setFile(null);
      setImgError(false);
    } else if (open && !item) {
      setForm(initial);
      setFile(null);
      setImgError(false);
    }
  }, [open, item, initial]);

  // Crea/limpia objectURL para previsualización
  useEffect(() => {
    let url = "";
    if (file) {
      url = URL.createObjectURL(file);
      setPreviewURL(url);
    } else {
      const fromForm = resolveSrc(form.image);
      setPreviewURL(fromForm || "");
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file, form.image]);

  const title = isEdit ? "Edit Item" : "Add Item";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const clearImage = () => {
    setFile(null);
    setPreviewURL("");
    setForm((f) => ({ ...f, image: "" }));
    setImgError(false);
  };

  // drag & drop
  useEffect(() => {
    const zone = dropRef.current;
    if (!zone) return;
    const prevent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onDrop = (e) => {
      prevent(e);
      const f = e.dataTransfer?.files?.[0];
      if (f && f.type.startsWith("image/")) {
        setFile(f);
        setImgError(false);
      }
    };
    zone.addEventListener("dragenter", prevent);
    zone.addEventListener("dragover", prevent);
    zone.addEventListener("drop", onDrop);
    return () => {
      zone.removeEventListener("dragenter", prevent);
      zone.removeEventListener("dragover", prevent);
      zone.removeEventListener("drop", onDrop);
    };
  }, []);

  const submit = async (e) => {
    e?.preventDefault?.();

    const payload = {
      name: form.name?.trim() || undefined,
      item_id: form.item_id?.trim() || undefined,
      category: form.category?.trim() || undefined,
      location: form.location?.trim() || undefined,
      stock: cleanNumber(form.stock),
      minimum: cleanNumber(form.minimum),
      supplier_id: cleanNumber(form.supplier_id),
      part_no: form.part_no?.trim() || undefined,
      unit_cost: cleanNumber(form.unit_cost),
      description: form.description?.trim() || undefined,
      product_link: form.product_link?.trim() || undefined,
    };

    try {
      if (file) {
        setUploading(true);
        const uploadedPath = await uploadFile(file); // ✅ usa helper centralizado
        payload.image = uploadedPath;
      } else if (form.image) {
        payload.image = form.image;
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      setUploading(false);
      alert("Image upload failed.");
      return;
    } finally {
      setUploading(false);
    }

    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    if (onSubmit) onSubmit(payload);
    else if (onSave) onSave(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      {/* panel */}
      <div className="absolute inset-0 flex items-start justify-center overflow-auto p-6">
        <form
          onSubmit={submit}
          className="relative w-full max-w-5xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl"
        >
          {/* header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-800">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-900"
              aria-label="Close"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* body */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-5">
            {/* Left: Upload + preview */}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                Image
              </label>

              <div className="mt-2 space-y-3">
                <div
                  ref={dropRef}
                  className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700 overflow-hidden bg-gray-50 dark:bg-zinc-900 flex items-center justify-center relative"
                >
                  {(previewURL || isEdit) && !imgError ? (
                    <img
                      src={previewURL || resolveSrc(form.image) || FALLBACK_PREVIEW}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="text-center text-gray-400 flex flex-col items-center gap-2">
                      <ImageIcon />
                      <span className="text-sm">Drop image here</span>
                    </div>
                  )}

                  {uploading && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="px-3 py-1.5 rounded-xl bg-white/90 dark:bg-zinc-900/90 text-sm">
                        Uploading…
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setFile(f);
                        setImgError(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-900"
                  >
                    <Upload size={16} />
                    <span>Choose file</span>
                  </button>

                  {file || form.image ? (
                    <button
                      type="button"
                      onClick={clearImage}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-300 hover:bg-red-50 dark:border-red-500/50 dark:hover:bg-red-500/10"
                      title="Remove image"
                    >
                      <Trash2 size={16} />
                      <span>Remove</span>
                    </button>
                  ) : null}
                </div>

                <p className="text-xs text-gray-500">
                  PNG/JPG up to ~10MB. You can drag & drop or choose a file.
                </p>
              </div>
            </div>

            {/* Right: fields */}
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="inp"
                  placeholder="Item name"
                />
              </Field>

              <Field label="Item ID / SKU">
                <input
                  name="item_id"
                  value={form.item_id}
                  onChange={handleChange}
                  className="inp font-mono"
                  placeholder="SKU-0001"
                />
              </Field>

              <Field label="Category">
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="inp"
                  placeholder="Lights, Tools, …"
                />
              </Field>

              <Field label="Location">
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="inp"
                  placeholder="Warehouse A"
                />
              </Field>

              <Field label="Stock">
                <input
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  className="inp"
                  inputMode="numeric"
                  placeholder="0"
                />
              </Field>

              <Field label="Minimum">
                <input
                  name="minimum"
                  value={form.minimum}
                  onChange={handleChange}
                  className="inp"
                  inputMode="numeric"
                  placeholder="0"
                />
              </Field>

              <Field label="Vendor">
                <select
                  name="supplier_id"
                  value={form.supplier_id ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      supplier_id: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  className="inp"
                >
                  <option value="">Select vendor…</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Part No">
                <input
                  name="part_no"
                  value={form.part_no}
                  onChange={handleChange}
                  className="inp"
                  placeholder="PN-1234"
                />
              </Field>

              <Field label="Unit Cost">
                <input
                  name="unit_cost"
                  value={form.unit_cost}
                  onChange={handleChange}
                  className="inp"
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </Field>

              <Field label="Product Link" full>
                <input
                  name="product_link"
                  value={form.product_link}
                  onChange={handleChange}
                  className="inp"
                  placeholder="https://…"
                />
              </Field>

              <Field label="Notes / Description" full>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  className="inp resize-none"
                  placeholder="Short description…"
                />
              </Field>
            </div>
          </div>

          {/* footer */}
          <div className="px-5 py-4 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {isEdit ? "Editing existing item" : "Creating a new item"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-300 bg-emerald-600/90 text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                <Save size={16} />
                <span>{uploading ? "Uploading…" : "Save"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* styles for inputs */}
      <style>{`
        .inp {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.75rem;
          border: 1px solid rgb(209 213 219 / 1);
          background: white;
        }
        :root.dark .inp {
          background: rgb(24 24 27 / 1);
          border-color: rgb(63 63 70 / 1);
          color: white;
        }
        .inp:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, .25);
          border-color: rgb(16 185 129 / 1);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children, full = false }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
