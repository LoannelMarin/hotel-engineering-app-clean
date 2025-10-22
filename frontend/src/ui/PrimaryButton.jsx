// src/ui/PrimaryButton.jsx
import React from "react";

/**
 * PrimaryButton — botón principal estilo Loannel
 * - Verde brand (#0B5150)
 * - Modo Day/Dark coherente
 * - Soporta disabled, hover y focus ring
 */
export default function PrimaryButton({
  children,
  className = "",
  ...props
}) {
  return (
    <button
      {...props}
      className={`bg-brand text-white px-4 py-2 rounded-lg font-medium shadow-sm 
        hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand/40 
        disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ${className}`}
    >
      {children}
    </button>
  );
}
