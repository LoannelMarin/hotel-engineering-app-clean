import React from "react";
import {
  Plus as PlusIcon,
  Printer as PrinterIcon,
  Download as DownloadIcon,
  Filter as FilterIcon,
} from "lucide-react";

/**
 * 🔧 ToolbarLoannel
 * Reutilizable para cualquier módulo (Invoices, Vendors, Quotes, etc.)
 *
 * Props:
 * - value: texto actual del input
 * - onChange: callback para búsqueda
 * - onAdd: callback botón agregar
 * - onPrint: callback botón imprimir (opcional)
 * - onExport: callback botón exportar (opcional)
 * - onFilter: callback botón filtrar (opcional)
 * - placeholder: texto placeholder personalizado
 * - compact: boolean → si true, aplica py-1.5; si false, py-2
 */
export default function ToolbarLoannel({
  value = "",
  onChange,
  onAdd,
  onPrint,
  onExport,
  onFilter,
  placeholder = "Search…",
  compact = true,
}) {
  const spacing = compact ? "py-1.5" : "py-2";

  return (
    <div className="flex items-center gap-2">
      {/* 🔍 Search box */}
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`w-72 px-3 ${spacing} rounded-xl text-sm
          bg-white border border-zinc-300 text-zinc-900 placeholder:text-zinc-500
          dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500
          focus:outline-none focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-600/50
          transition-all`}
      />

      {/* ➕ Add button */}
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className={`inline-flex items-center gap-1.5 px-3 ${spacing} rounded-xl text-sm
            border border-zinc-700 bg-zinc-900 hover:bg-zinc-800
            text-zinc-100 transition-all`}
          title="Add item"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add</span>
        </button>
      )}

      {/* 🖨️ Print button */}
      {onPrint && (
        <button
          type="button"
          onClick={onPrint}
          className={`inline-flex items-center gap-1.5 px-3 ${spacing} rounded-xl text-sm
            border border-zinc-300 text-zinc-700 hover:bg-zinc-100
            dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-[#1a1a1a]
            transition-all`}
          title="Print report"
        >
          <PrinterIcon className="h-4 w-4" />
          <span>Print</span>
        </button>
      )}

      {/* 📤 Export button */}
      {onExport && (
        <button
          type="button"
          onClick={onExport}
          className={`inline-flex items-center gap-1.5 px-3 ${spacing} rounded-xl text-sm
            border border-zinc-300 text-zinc-700 hover:bg-zinc-100
            dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-[#1a1a1a]
            transition-all`}
          title="Export data"
        >
          <DownloadIcon className="h-4 w-4" />
          <span>Export</span>
        </button>
      )}

      {/* ⚙️ Filter button */}
      {onFilter && (
        <button
          type="button"
          onClick={onFilter}
          className={`inline-flex items-center gap-1.5 px-3 ${spacing} rounded-xl text-sm
            border border-zinc-300 text-zinc-700 hover:bg-zinc-100
            dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-[#1a1a1a]
            transition-all`}
          title="Filter"
        >
          <FilterIcon className="h-4 w-4" />
          <span>Filter</span>
        </button>
      )}
    </div>
  );
}
