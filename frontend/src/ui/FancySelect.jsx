// src/components/ui/FancySelect.jsx
import React from "react";

export default function FancySelect({
  value,
  onChange,
  children,
  className = "",
  disabled = false,
  title,
}) {
  return (
    <div className={`relative ${className}`} title={title}>
      <select
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        className={[
          "appearance-none w-full pe-9 ps-3 py-2",
          "rounded-lg border bg-white shadow-sm",
          "hover:bg-slate-50",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          "transition"
        ].join(" ")}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
        ▾
      </span>
    </div>
  );
}
