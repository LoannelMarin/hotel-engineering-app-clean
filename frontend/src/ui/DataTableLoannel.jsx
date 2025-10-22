import React from "react";

/**
 * DataTableLoannel
 * Estilo refinado "Loannel"
 * - Bordes ultra finos y suaves (no dobles)
 * - Header oscuro, filas claras
 * - Hover elegante
 * - Compatible con modo claro/oscuro
 */
export default function DataTableLoannel({
  columns = [],
  rows = [],
  keyField = "id",
  className = "",
}) {
  return (
    <div
      className={`dt-loannel-dark rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_rgba(255,255,255,0.04)] ${className}`}
      style={{
        border: "0.5px solid rgba(120,120,120,0.25)",
      }}
    >
      <table className="w-full text-sm border-separate border-spacing-0">
        {/* === Encabezado === */}
        <thead className="bg-zinc-900 text-zinc-100">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left font-medium px-4 py-2 whitespace-nowrap"
                style={{
                  borderBottom: "0.5px solid rgba(255,255,255,0.08)",
                }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>

        {/* === Cuerpo === */}
        <tbody
          className="bg-white dark:bg-[#1f1f22]"
          // Gris profesional, no negro puro
        >
          {rows.length > 0 ? (
            rows.map((row, idx) => (
              <tr
                key={row[keyField] ?? idx}
                className="group transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/70"
                style={{
                  borderBottom:
                    idx === rows.length - 1
                      ? "none"
                      : "0.5px solid rgba(255,255,255,0.06)",
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-2 text-zinc-800 dark:text-zinc-200"
                  >
                    {col.render ? col.render(row) : row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
              >
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
