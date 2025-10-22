// src/ui/Page.jsx
import React from "react";

/**
 * Componente Page — Contenedor base para cada vista
 * - Elimina padding global excesivo (usa padding adaptativo por breakpoint)
 * - Mantiene modo oscuro/claro coherente con App.jsx
 * - Título y acciones se mantienen visibles y alineados
 * - 100% responsive en tablets y móviles
 */
export default function Page({ title, actions, children }) {
  return (
    <div className="w-full h-full min-h-screen bg-transparent text-zinc-900 dark:text-zinc-100">
      {/* Header superior */}
      <header
        className="
          flex flex-col sm:flex-row sm:items-center sm:justify-between
          gap-3 sm:gap-4
          px-3 sm:px-5 lg:px-8
          pt-4 sm:pt-6
        "
      >
        {title && (
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h1>
        )}
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </header>

      {/* Contenido principal */}
      <main
        className="
          w-full
          px-2 sm:px-4 md:px-6 lg:px-8
          pb-6 sm:pb-8
        "
      >
        {children}
      </main>
    </div>
  );
}
