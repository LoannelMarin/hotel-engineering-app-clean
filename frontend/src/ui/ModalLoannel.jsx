// src/ui/ModalLoannel.jsx
import React from "react";

/**
 * ModalLoannel
 * Modal base estilo “Loannel” con soporte Dark/Day
 * - Fondo translúcido negro
 * - Bordes redondeados y sombras suaves
 * - Encabezado con título y botón de cerrar
 * - Contenido scrollable y pie opcional de acciones
 */
export default function ModalLoannel({ open, onClose, title, children, actions }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl rounded-2xl border border-border-day dark:border-border-dark
                   bg-card-day dark:bg-card-dark shadow-soft dark:shadow-soft-dark
                   text-zinc-900 dark:text-zinc-100 overflow-hidden"
      >
        {/* === Header === */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-day dark:border-border-dark">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* === Cuerpo === */}
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">{children}</div>

        {/* === Footer de acciones === */}
        {actions && (
          <div className="px-5 py-4 border-t border-border-day dark:border-border-dark flex justify-end gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
