// frontend/src/components/inventory/ItemDrawer.jsx
import React from "react";
import {
  X,
  Image as ImageIcon,
  Link2,
  Building2,
  MapPin,
  Tag,
  Trash2,
  Clock,
  Hash,
  Package2,
} from "lucide-react";

const fmt = (v) => (v ?? v === 0 ? String(v) : "—");

function LowDot({ low }) {
  return (
    <span
      title={low ? "Low / Out of stock" : "OK"}
      className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${
        low ? "bg-[var(--accent-red)]" : "bg-[var(--muted-3)]"
      }`}
    />
  );
}

/**
 * ItemDrawer
 * - Normalizado para vendor_id/vendor_name
 * - Muestra correctamente vendor_name si existe, o "supplier" como fallback
 * - Misma estética y layout original
 */
export default function ItemDrawer({
  item,
  open,
  onClose,
  onEdit,
  onDelete,
  onAdjust,
  onLogs,
}) {
  if (!open || !item) return null;

  const low =
    (item.stock ?? 0) <= 0 || (item.minimum ?? 0) > (item.stock ?? 0);

  // Normalización de vendor para mostrar el nombre correcto
  const vendorName =
    item.vendor_name ||
    item.vendor?.name ||
    item.vendor ||
    item.supplier ||
    "—";

  return (
    <aside
      className="fixed inset-y-0 right-0 w-[420px] max-w-[90vw] bg-[var(--surface-1)] border-l border-[var(--border-1)]
                 shadow-2xl z-40 flex flex-col anim-right"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-1)]">
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="btn btn-ghost text-xs">
            Editar
          </button>
          <button onClick={onAdjust} className="btn btn-ghost text-xs">
            Ajustar
          </button>
          <button
            onClick={onLogs}
            className="btn btn-ghost text-xs inline-flex items-center gap-1"
          >
            <Clock size={14} /> Logs
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--surface-2)]"
          title="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="p-3 space-y-3 overflow-y-auto">
        {/* Imagen */}
        <div className="w-full aspect-video bg-[var(--surface-2)] rounded grid place-items-center overflow-hidden anim-scale">
          {item.image_url || item.image ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <img
              src={item.image_url || item.image}
              className="object-contain w-full h-full"
            />
          ) : (
            <ImageIcon className="opacity-40" size={64} />
          )}
        </div>

        {/* Info principal */}
        <div className="card p-3 space-y-2 anim-up">
          <div className="text-lg font-semibold flex items-center gap-2">
            <LowDot low={low} />
            <span>{item.name}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Stock" value={fmt(item.stock)} icon={<Package2 size={14} />} />
            <Info label="Mínimo" value={fmt(item.minimum)} />
            <Info label="Ubicación" value={fmt(item.location)} icon={<MapPin size={14} />} />
            <Info label="Proveedor" value={vendorName} icon={<Building2 size={14} />} />
            <Info label="Part No" value={fmt(item.part_no)} />
            <Info label="Categoría" value={fmt(item.category)} icon={<Tag size={14} />} />
          </div>

          {item.product_link ? (
            <a
              href={item.product_link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-[var(--link)] hover:underline mt-1"
            >
              <Link2 size={14} /> Ver producto
            </a>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-[var(--muted)] flex items-center gap-1">
            <Hash size={12} /> ID: {fmt(item.item_id)}
          </div>
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-2 text-[var(--accent-red)] text-sm hover:opacity-80"
            title="Eliminar"
          >
            <Trash2 size={16} /> Eliminar
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ---------- Helper para mostrar cada campo ---------- */
function Info({ label, value, icon }) {
  return (
    <div className="space-y-1">
      <div className="text-[var(--muted)] flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="font-medium truncate">{value}</div>
    </div>
  );
}
