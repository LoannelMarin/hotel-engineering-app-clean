import React, { useState } from "react";
import ImageUpload from "./ImageUpload";

const clampInt = (v, min = -999999, max = 999999) => {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) return 0;
  return Math.max(min, Math.min(max, n));
};

export default function ItemForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(() => ({
    name: initial?.name || "",
    item_id: initial?.item_id || "",
    category: initial?.category || "",
    stock: initial?.stock ?? 0,
    minimum: initial?.minimum ?? 0,
    location: initial?.location || "",
    supplier: initial?.supplier || "",
    part_no: initial?.part_no || "",
    product_link: initial?.product_link || "",
    image_url: initial?.image_url || "",
    notes: initial?.notes || "",
  }));
  const [busy, setBusy] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "stock" || name === "minimum" ? clampInt(value, 0) : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave(form);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-3 space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1 card p-3 anim-scale">
          <div className="text-sm font-semibold mb-2">Imagen</div>
          <ImageUpload
            value={form.image_url}
            onChange={(v) => setForm((f) => ({ ...f, image_url: v }))}
          />
        </div>

        <div className="md:col-span-2 card p-3 anim-scale">
          <div className="text-sm font-semibold mb-3">Detalles</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--muted)]">Nombre</label>
              <input className="w-full mt-1 input" name="name" value={form.name} onChange={onChange} required />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">Item ID / SKU</label>
              <input className="w-full mt-1 input" name="item_id" value={form.item_id} onChange={onChange} />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">Categoría</label>
              <input className="w-full mt-1 input" name="category" value={form.category} onChange={onChange} />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">Ubicación</label>
              <input className="w-full mt-1 input" name="location" value={form.location} onChange={onChange} />
            </div>

            <div>
              <label className="text-xs text-[var(--muted)]">Stock</label>
              <input className="w-full mt-1 input" name="stock" value={form.stock} onChange={onChange} />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">Mínimo</label>
              <input className="w-full mt-1 input" name="minimum" value={form.minimum} onChange={onChange} />
            </div>

            <div>
              <label className="text-xs text-[var(--muted)]">Proveedor</label>
              <input className="w-full mt-1 input" name="supplier" value={form.supplier} onChange={onChange} />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">Part No</label>
              <input className="w-full mt-1 input" name="part_no" value={form.part_no} onChange={onChange} />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-[var(--muted)]">Enlace del producto</label>
              <input className="w-full mt-1 input" name="product_link" value={form.product_link} onChange={onChange} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[var(--muted)]">Notas</label>
              <textarea className="w-full mt-1 input" rows={3} name="notes" value={form.notes} onChange={onChange} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn btn-ghost">Cancelar</button>
        <button disabled={busy} className="btn btn-success">
          {busy ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
