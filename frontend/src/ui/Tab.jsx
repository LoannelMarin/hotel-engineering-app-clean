// src/components/ui/Tab.jsx
import React from "react";

/**
 * Botón de pestaña para grupos tipo "By floor / By area / By asset type".
 * Usa los tokens de color (var(--surface-*), --border-1, --text-1/2).
 *
 * Props:
 * - active   : bool   -> estado seleccionado
 * - onClick  : fn
 * - children : node   -> icono + texto
 */
export default function Tab({ active = false, onClick, children }) {
  const base =
    "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm transition " +
    "border hover:bg-[var(--surface-2)]";

  const cls = active
    ? `${base} border-[var(--border-1)] bg-[var(--text-1)] text-[var(--surface-1)]`
    : `${base} border-[var(--border-1)] bg-[var(--surface-1)] text-[var(--text-2)]`;

  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
