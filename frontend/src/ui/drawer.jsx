import React, { useEffect } from "react";
import { cn } from "../../lib/utils";

export default function Drawer({ open, onClose, title, children, className }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-slate-900 shadow-xl border-l border-slate-200 dark:border-slate-800",
          "transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        {title ? (
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close drawer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        ) : null}
        <div className="h-[calc(100%-3.25rem)] overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}
