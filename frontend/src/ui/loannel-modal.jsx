import React, { useEffect } from "react";
import { cn } from "../lib/utils";

/** Modal Loannel — Drawer lateral derecho reutilizable */
export default function LoannelModal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-[520px] bg-white dark:bg-slate-900 shadow-2xl",
          "border-l border-slate-200 dark:border-slate-800",
          "animate-in slide-in-from-right duration-200",
          className
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-auto h-[calc(100%-56px-64px)]">
          {children}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
          {footer}
        </div>
      </div>
    </div>
  );
}
