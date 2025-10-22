import React, { useState } from "react";
import { Minus, Plus as PlusIcon, X } from "lucide-react";

const clampInt = (v, min = -999999, max = 999999) => {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) return 0;
  return Math.max(min, Math.min(max, n));
};

export default function AdjustStockModal({ open, item, onClose, onConfirm }) {
  const [delta, setDelta] = useState(0);
  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-3 anim-fade">
      <div className="w-full max-w-lg rounded-xl overflow-hidden border border-[var(--border-1)] bg-[var(--surface-1)] anim-scale">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-1)]">
          <div className="font-semibold">Adjust Stock: {item?.name}</div>
          <button className="p-1 rounded hover:bg-[var(--surface-2)]" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="p-3 space-y-3">
          <div className="text-sm">
            Actual: <strong>{item?.stock ?? 0}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDelta((d) => d - 1)}
              className="px-3 py-2 rounded bg-[var(--surface-2)]"
            >
              <Minus size={16} />
            </button>
            <input
              className="input w-28 text-center"
              value={delta}
              onChange={(e) => setDelta(clampInt(e.target.value))}
            />
            <button
              onClick={() => setDelta((d) => d + 1)}
              className="px-3 py-2 rounded bg-[var(--surface-2)]"
            >
              <PlusIcon size={16} />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button
              onClick={() => onConfirm(delta)}
              className="btn btn-success"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
