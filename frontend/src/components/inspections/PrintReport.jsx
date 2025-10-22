// frontend/src/components/inspections/PrintReport.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getInspection, listItems } from "../../api/inspections";

/**
 * Componente de impresión independiente del "run".
 * Uso:
 *   <PrintReport inspectionId={123} autoPrint />
 *
 * - Carga header e items por su cuenta.
 * - Muestra un layout limpio para impresión (blanco/negro).
 * - En pantalla incluye botones (ocultos en impresión con print:hidden)
 */
export default function PrintReport({ inspectionId, autoPrint = false, onBack }) {
  const [loading, setLoading] = useState(true);
  const [header, setHeader] = useState(null);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const [h, li] = await Promise.all([
          getInspection(inspectionId),
          listItems(inspectionId),
        ]);
        if (!alive) return;
        setHeader(h || null);
        setItems(Array.isArray(li?.items) ? li.items : []);
      } catch (e) {
        console.error(e);
        if (alive) setErr("Could not load inspection report.");
      } finally {
        alive && setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [inspectionId]);

  // Etiqueta de alcance (igual que en run)
  const scopeLabel = useMemo(() => {
    if (!header) return "";
    const t = header.scope_type;
    const v = header.scope_value;
    if (t === "floors" || t === "floor")
      return `floors • ${v || (header.floors || []).join(", ")}`;
    if (t === "area") return `area • ${v}`;
    if (t === "type") return `type • ${v}`;
    return `${t} • ${v || ""}`;
  }, [header]);

  // Tabla plana para imprimir
  const rows = useMemo(() => {
    const arr = Array.isArray(items) ? items.slice() : [];
    // Orden: Room asc (si aplica), luego label/type
    const getRoom = (it) => {
      const label = String(it?.label || "").trim();
      const rx = /(room|habitación|habitacion|rm)\s*([a-z0-9\-]+)/i;
      const m = label.match(rx) || label.match(/\b(\d{3,4})\b/);
      if (m) return (m[2] || m[1] || "").toString().toUpperCase();
      return it?.area || "";
    };
    arr.sort((a, b) => {
      const ra = getRoom(a);
      const rb = getRoom(b);
      if (ra && rb && ra !== rb) return ra.localeCompare(rb, undefined, { numeric: true });
      return String(a.label || a.type).localeCompare(String(b.label || b.type));
    });
    return arr;
  }, [items]);

  // Auto-print cuando termina de cargar
  useEffect(() => {
    if (!autoPrint) return;
    if (!loading && header) {
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [autoPrint, loading, header]);

  const fmtDateTime = (s) => {
    if (!s) return "—";
    try {
      const d = new Date(s);
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return String(s);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 print:p-0 print:max-w-full print:w-full print:bg-white print:text-black">
      {/* Barra de acciones (oculta en impresión) */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <button
          type="button"
          onClick={() => (onBack ? onBack() : window.history.back())}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-300 bg-white hover:shadow transition"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-white bg-[#0B5150] hover:bg-[#0A4B4A] transition"
        >
          Print
        </button>
      </div>

      {/* Header del reporte */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 print:border-0 print:rounded-none">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold leading-tight">
              Inspection Report
            </h1>
            <div className="text-sm text-zinc-600">
              {loading
                ? "Loading…"
                : header
                ? (
                  <>
                    <div>ID: <span className="font-medium">{header.id}</span></div>
                    <div>Scope: <span className="font-medium">{scopeLabel}</span></div>
                    <div>Created: {fmtDateTime(header.created_at || header.created)}</div>
                    <div>Status: {header.status || "—"}</div>
                  </>
                  )
                : err || "—"}
            </div>
          </div>
          {/* Logo (opcional): oculto si no lo usan */}
          {/* <img src="/logo.svg" alt="logo" className="h-10 print:h-8" /> */}
        </div>

        {/* Tabla de items */}
        <div className="mt-4">
          <table className="w-full text-[14px] leading-6 border-separate [border-spacing:0]">
            <thead>
              <tr>
                {["Label", "Type", "Floor/Area", "Status", "Notes"].map((h, i, arr) => (
                  <th
                    key={h}
                    className={[
                      "px-3 py-2 text-left font-semibold",
                      "bg-[#EDEFF2] text-zinc-700",
                      "border border-zinc-300",
                      i === 0 ? "rounded-tl-xl" : "",
                      i === arr.length - 1 ? "rounded-tr-xl" : "",
                      "print:bg-white print:text-black print:border-black/50 print:font-semibold",
                    ].join(" ")}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((it) => (
                <tr key={it.id} className="bg-white">
                  <td className="px-3 py-2 border-b border-l border-zinc-200 print:border-black/30">
                    <div className="font-medium">{it.label || "—"}</div>
                  </td>
                  <td className="px-3 py-2 border-b border-zinc-200 print:border-black/30">
                    {it.type || "—"}
                  </td>
                  <td className="px-3 py-2 border-b border-zinc-200 print:border-black/30">
                    {it.floor ? `Floor ${it.floor}` : it.area || "—"}
                  </td>
                  <td className="px-3 py-2 border-b border-zinc-200 print:border-black/30">
                    {(it.status || "open").toUpperCase()}
                  </td>
                  <td className="px-3 py-2 border-b border-r border-zinc-200 print:border-black/30">
                    {it.notes || "—"}
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-zinc-600 border-b border-l border-r border-zinc-200 print:border-black/30" colSpan={5}>
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pie de página (para firmas, etc.) */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 print:gap-8">
          {["Inspector", "Supervisor", "Customer"].map((role) => (
            <div key={role} className="text-sm">
              <div className="text-zinc-600 mb-8">&nbsp;</div>
              <div className="border-t border-zinc-300 pt-2 print:border-black/50">
                {role} Signature / Date
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nota de impresión (solo pantalla) */}
      {err ? (
        <div className="mt-3 text-rose-600 print:hidden">{err}</div>
      ) : null}
    </div>
  );
}
