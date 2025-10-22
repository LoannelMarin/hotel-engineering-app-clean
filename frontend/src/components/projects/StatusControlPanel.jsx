import React from "react";
import { LayoutGrid, Columns2, Square, Palette } from "lucide-react";

/**
 * Toolbar superior:
 * - Toggle de layout (single / two / four)
 * - Selects de proyectos visibles según el layout
 * - Botón para abrir el editor de leyenda (por proyecto)
 */
export default function StatusControlPanel({
  projects = [],
  mode = "two",
  selected = [], // ids visibles en orden
  onChangeMode,
  onChangeSelected, // (index, projectId)
  onOpenLegend, // (projectId)
}) {
  const baseBtn =
    "px-3 py-1.5 text-sm rounded-lg transition border border-gray-300 " +
    "bg-white text-zinc-700 hover:bg-zinc-100 " +
    "dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";

  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-zinc-800 sticky top-0 z-20 bg-[var(--bg)] px-2 sm:px-4">
      {/* 🔹 Título */}
      <h2 className="text-lg sm:text-xl font-semibold text-[#0B5150] dark:text-zinc-100">
        Projects
      </h2>

      {/* 🔹 Controles principales */}
      <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-start w-full sm:w-auto">
        {/* Layout toggle */}
        <div className="inline-flex rounded-xl bg-[var(--surface-1)] shadow-sm ring-1 ring-[var(--border-1)] p-1">
          {[
            { key: "single", icon: <Square size={16} />, label: "Single" },
            { key: "two", icon: <Columns2 size={16} />, label: "Dual" },
            { key: "four", icon: <LayoutGrid size={16} />, label: "Grid" },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => onChangeMode?.(key)}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-sm rounded-lg transition ${
                mode === key
                  ? "bg-[#0B5150] text-white"
                  : "text-[var(--text-1)] hover:bg-[var(--surface-2)]"
              }`}
              title={label}
            >
              <span className="block sm:hidden">{icon}</span>
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>

        {/* Selects por cantidad visible */}
        <div className="flex flex-wrap gap-2">
          {selected.map((val, idx) => (
            <select
              key={idx}
              className="rounded-xl border px-3 py-2 text-sm shadow-sm min-w-[120px]
                         bg-[var(--surface-1)] border-[var(--border-1)] text-[var(--text-1)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--accent-emerald)]"
              value={val ?? ""}
              onChange={(e) => onChangeSelected?.(idx, Number(e.target.value))}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {/* 🔹 Botón de leyenda */}
      {selected[0] != null && (
        <button
          className={`${baseBtn} flex items-center gap-1 justify-center`}
          type="button"
          onClick={() => onOpenLegend?.(selected[0])}
        >
          <Palette size={16} className="text-[#0B5150]" />
          <span className="hidden sm:inline">Status & Colors</span>
        </button>
      )}
    </header>
  );
}
