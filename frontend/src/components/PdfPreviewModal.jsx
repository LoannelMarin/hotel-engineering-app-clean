// frontend/src/components/PdfPreviewModal.jsx
import React, { useEffect } from "react";

/* ====== Style tokens ====== */
const HEADER =
  "flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 " +
  "backdrop-blur dark:border-white/10 dark:bg-[#1d1f24]/95";
const BTN_OK =
  "rounded-lg bg-[#083A39] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A4644] " +
  "focus:outline-none focus:ring-2 focus:ring-[#0B5150]/60 " +
  "dark:bg-[#09403F] dark:hover:bg-[#0A4644] dark:focus:ring-[#0B5150]/60";

export default function PdfPreviewModal({ open, url, title = "Attachment preview", onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const filename = typeof url === "string" ? url.split("/").pop() : "";

  function onBackdropClick(e) {
    if (e.target === e.currentTarget) onClose?.();
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]" onClick={onBackdropClick} />
      <div className="absolute inset-0 flex flex-col">
        <div className={HEADER}>
          <div className="min-w-0">
            <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</div>
            {filename ? (
              <div className="truncate text-xs text-slate-500 dark:text-slate-400">{filename}</div>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className={BTN_OK}>
            OK
          </button>
        </div>
        <div className="flex-1 overflow-hidden bg-slate-100 dark:bg-black">
          <iframe key={url} src={url} className="h-full w-full bg-white" title="PDF preview" />
        </div>
      </div>
    </div>
  );
}
