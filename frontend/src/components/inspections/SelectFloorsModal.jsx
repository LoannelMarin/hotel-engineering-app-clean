import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ====== Estilos unificados (teal + card + dark) ====== */
const CARD =
  "rounded-2xl bg-white/95 shadow-[0_1px_0_rgba(0,0,0,.02),0_8px_24px_rgba(0,0,0,.06)] ring-1 ring-black/5 " +
  "transition duration-200 " +
  "dark:bg-[#1d1f24]/90 dark:ring-white/10 dark:shadow-[0_1px_0_rgba(255,255,255,.04)_inset,0_20px_40px_rgba(0,0,0,.45)]";
const CARD_HOVER =
  "hover:shadow-[0_2px_0_rgba(0,0,0,.03),0_16px_30px_rgba(0,0,0,.08)] " +
  "dark:hover:shadow-[0_1px_0_rgba(255,255,255,.05)_inset,0_26px_48px_rgba(0,0,0,.55)] " +
  "hover:ring-[#0B5150]/20";
const CARD_PAD = "p-4 md:p-5";
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 " +
  "bg-[#083A39] text-white hover:bg-[#0A4644] active:scale-[.98] " +
  "focus:outline-none focus:ring-2 focus:ring-[#0B5150]/60 " +
  "transition " +
  "dark:bg-[#09403F] dark:hover:bg-[#0A4644] dark:focus:ring-[#0B5150]/60";
const BTN_SOFT =
  "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 " +
  "bg-white/80 ring-1 ring-gray-200 hover:bg-white transition " +
  "dark:bg-[#24262c] dark:ring-white/10 dark:hover:bg-[#2a2d33]";
const SOFT_TXT = "text-gray-600 dark:text-slate-300";
const MUTED_TXT = "text-gray-500 dark:text-slate-400";
const STRONG_TXT = "text-gray-900 dark:text-slate-100";

/* Pills (chips) */
const CHIP_BASE =
  "h-10 px-4 rounded-xl text-sm font-medium ring-1 transition " +
  "flex items-center justify-center select-none";
const CHIP_DISABLED =
  "bg-gray-50 text-gray-400 ring-gray-200 cursor-not-allowed " +
  "dark:bg-[#20232a] dark:text-slate-500 dark:ring-white/10";
const CHIP_IDLE =
  "bg-white/80 text-gray-700 ring-gray-200 hover:bg-white cursor-pointer " +
  "dark:bg-[#24262c] dark:text-slate-200 dark:ring-white/10 dark:hover:bg-[#2a2d33]";
const CHIP_ACTIVE =
  "bg-[#083A39] text-white ring-[#0B5150] hover:bg-[#0A4644] cursor-pointer " +
  "dark:bg-[#09403F] dark:ring-[#0B5150] dark:hover:bg-[#0A4644]";

/**
 * SelectFloorsModal
 * Props:
 *  - open: boolean
 *  - floors: string[]
 *  - initial: string | null (pre-selección opcional)
 *  - onClose: () => void
 *  - onStart: (selectedFloors: string[]) => void
 */
export default function SelectFloorsModal({ open, floors = [], initial = null, onClose, onStart }) {
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (!open) return;
    if (initial && floors.includes(initial)) {
      setSelected([initial]);
    } else {
      setSelected([]);
    }
  }, [open, initial, floors]);

  const canStart = useMemo(() => selected.length > 0, [selected]);

  const toggle = (label) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="absolute inset-0 flex items-end md:items-center justify-center p-4">
        <AnimatePresence initial={true}>
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            className={`${CARD} ${CARD_PAD} ${CARD_HOVER} w-full max-w-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-lg font-semibold ${STRONG_TXT}`}>Select floors</h2>
              <button onClick={onClose} className={`${BTN_SOFT} h-9 px-3 text-sm`}>
                Close
              </button>
            </div>

            <p className={`text-sm mb-4 ${SOFT_TXT}`}>
              Choose one or more floors to include in this inspection.
            </p>

            {/* Grid de chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(floors.length ? floors : []).map((f) => {
                const isActive = selected.includes(String(f));
                const isDisabled = false; // deja aquí la lógica si algún piso debe estar bloqueado
                const cls = isDisabled
                  ? `${CHIP_BASE} ${CHIP_DISABLED}`
                  : isActive
                  ? `${CHIP_BASE} ${CHIP_ACTIVE}`
                  : `${CHIP_BASE} ${CHIP_IDLE}`;
                return (
                  <button
                    key={String(f)}
                    type="button"
                    className={cls}
                    disabled={isDisabled}
                    onClick={() => !isDisabled && toggle(String(f))}
                    title={String(f)}
                  >
                    {String(f)}
                  </button>
                );
              })}
            </div>

            {/* Footer acciones */}
            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={onClose} className={`${BTN_SOFT} h-10 px-4`}>
                Cancel
              </button>
              <button
                onClick={() => onStart(selected)}
                disabled={!canStart}
                className={`${BTN_PRIMARY} h-10 px-4 disabled:opacity-60`}
                title={canStart ? "Start inspection" : "Select at least one floor"}
              >
                Start inspection
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
