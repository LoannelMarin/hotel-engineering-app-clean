import React from "react";

export function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
        {label}
      </div>
      {children}
    </label>
  );
}

export function CardInput({ children, status = "neutral", noPadding = false }) {
  const statusClass =
    status === "valid"
      ? "border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/40"
      : status === "invalid"
      ? "border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/30"
      : "border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/30";

  return (
    <div
      className={
        `rounded-2xl border bg-white shadow-sm transition-colors duration-150 ` +
        `hover:border-slate-300 dark:bg-[#0e0e0e] dark:border-white/10 dark:hover:border-white/20 ` +
        statusClass +
        (noPadding ? " p-0" : " p-2")
      }
    >
      {children}
    </div>
  );
}
