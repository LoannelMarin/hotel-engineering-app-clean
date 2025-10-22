import React from "react";
import { Plus as PlusIcon, Printer as PrinterIcon } from "lucide-react";

/**
 * Toolbar compacta para la vista de Invoices
 * - Altura reducida (py-1.5)
 * - Bordes más planos (rounded-xl)
 * - Alineación visual más pareja con el header compacto
 */
export default function InvoiceToolbar({ value, onChange, onPrint, onAdd }) {
  return (
    <div className="flex items-center gap-2">
      {/* Search box */}
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Search invoices…"
        className="w-72 px-3 py-1.5 rounded-xl text-sm
                   bg-white border border-zinc-300 text-zinc-900 placeholder:text-zinc-500
                   dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500
                   focus:outline-none focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-600/50
                   transition-all"
      />

      {/* Add button */}
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm
                   border border-zinc-700 bg-zinc-900 hover:bg-zinc-800
                   text-zinc-100 transition-all"
        title="Add invoice"
      >
        <PlusIcon className="h-4 w-4" />
        <span>Add</span>
      </button>

      {/* Print button */}
      <button
        type="button"
        onClick={onPrint}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm
                   border border-zinc-300 text-zinc-700 hover:bg-zinc-100
                   dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-[#1a1a1a]
                   transition-all"
        title="Print report"
      >
        <PrinterIcon className="h-4 w-4" />
        <span>Print</span>
      </button>
    </div>
  );
}
