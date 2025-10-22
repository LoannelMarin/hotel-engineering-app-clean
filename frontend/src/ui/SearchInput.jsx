import React from "react";
import { Search, X } from "lucide-react";

/**
 * 🔍 SearchInput (Estilo Loannel Moderno)
 * - Fondo translúcido adaptativo (claro/oscuro)
 * - Bordes finos, suaves y sutiles
 * - Glow verde (#0B5150) en focus
 * - Icono dinámico y botón para limpiar
 * - Transiciones suaves y armonía con el dashboard
 */
export default function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <div
      className={`
        group flex items-center w-full px-3 py-2 rounded-xl
        border transition-all duration-200 ease-in-out
        bg-white/70 dark:bg-zinc-900/70
        border-zinc-300 dark:border-zinc-700
        text-sm text-zinc-800 dark:text-zinc-100
        backdrop-blur-sm
        focus-within:ring-2 focus-within:ring-[#0B5150]
        focus-within:border-[#0B5150]
        hover:border-[#0B5150]/40
        shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_2px_rgba(255,255,255,0.03)]
      `}
    >
      {/* Icono de búsqueda */}
      <Search
        size={16}
        className="text-zinc-400 dark:text-zinc-500 mr-2 transition-colors duration-200 group-focus-within:text-[#0B5150]"
      />

      {/* Input principal */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          flex-1 bg-transparent border-none outline-none
          placeholder-zinc-400 dark:placeholder-zinc-500
          text-sm text-zinc-900 dark:text-zinc-100
        `}
      />

      {/* Botón para limpiar texto */}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="ml-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          title="Clear"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
