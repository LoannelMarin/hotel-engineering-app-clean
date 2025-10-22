// frontend/src/pages/InspectionPrintPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getInspection, listItems } from "../api/inspections";

/**
 * Página de impresión final con branding Aloft Engineering.
 * - Agrupa por Floor / Area / Type
 * - Incluye logo, botones y estilos refinados para PDF/print
 */

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function safeDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (isNaN(+dt)) return String(d);
    return dt.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(d);
  }
}

function locationOf(it) {
  if (it?.floor !== undefined && it?.floor !== null && String(it.floor) !== "")
    return `Floor ${it.floor}${it?.area ? ` • ${it.area}` : ""}`;
  if (it?.area) return String(it.area);
  return it?.type || "—";
}

function groupKeyOf(it) {
  if (it?.floor !== undefined && it?.floor !== null && String(it.floor) !== "")
    return `Floor ${it.floor}`;
  if (it?.area) return String(it.area);
  return String(it?.type || "General");
}

export default function InspectionPrintPage() {
  const { id, inspectionId } = useParams();
  const qs = useQuery();
  const auto = qs.get("auto") === "1";

  const effectiveId = Number(inspectionId ?? id);
  const [inspection, setInspection] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [ins, list] = await Promise.all([
          getInspection(effectiveId),
          listItems(effectiveId),
        ]);
        if (!alive) return;
        setInspection(ins || null);
        setItems(Array.isArray(list?.items) ? list.items : []);
      } catch {
        if (alive) setErr("Unable to load inspection data.");
      } finally {
        alive && setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [effectiveId]);

  useEffect(() => {
    if (auto && !loading) {
      const t = setTimeout(() => window.print(), 350);
      return () => clearTimeout(t);
    }
  }, [auto, loading]);

  const scope = useMemo(() => {
    if (!inspection) return "";
    const t = inspection.scope_type;
    const v = inspection.scope_value;
    if (t === "floors" || t === "floor") {
      const list = v || (inspection.floors || []).join(", ");
      return `Floors • ${list}`;
    }
    if (t === "area") return `Area • ${v || "—"}`;
    if (t === "type") return `Type • ${v || "—"}`;
    return `${t} • ${v || "—"}`;
  }, [inspection]);

  const grouped = useMemo(() => {
    const by = {};
    for (const it of items) {
      const k = groupKeyOf(it);
      (by[k] ||= []).push(it);
    }
    return Object.entries(by).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  return (
    <div className="ipr-root">
      {/* Toolbar no imprimible */}
      <div className="ipr-toolbar ipr-no-print">
        <div className="ipr-toolbar-left">
          <div className="ipr-logo">
            <img
              src="/logo192.png"
              alt="Aloft Logo"
              className="ipr-logo-img"
            />
            <div>
              <div className="ipr-toolbar-title">Aloft Engineering Department</div>
              <div className="ipr-toolbar-sub">Orlando Downtown</div>
            </div>
          </div>
        </div>

        <div className="ipr-actions">
          <button className="ipr-btn ipr-btn-dark" onClick={() => window.print()}>
            Download PDF
          </button>
          <Link to="/inspections" className="ipr-btn">
            Back
          </Link>
        </div>
      </div>

      {/* Header imprimible */}
      <header className="ipr-head">
        <div className="ipr-title">Inspection Report</div>
        <div className="ipr-meta">
          <div><strong>Scope:</strong> {scope || "—"}</div>
          <div><strong>Status:</strong> {inspection?.status || "—"}</div>
          <div><strong>Generated:</strong> {safeDate(new Date())}</div>
          {inspection?.inspection_date && (
            <div><strong>Inspection date:</strong> {safeDate(inspection.inspection_date)}</div>
          )}
        </div>
      </header>

      {err && <div className="ipr-error ipr-no-print">{err}</div>}

      {loading ? (
        <div className="ipr-paper"><div className="ipr-muted">Loading…</div></div>
      ) : !items.length ? (
        <div className="ipr-paper"><div className="ipr-muted">No items to display.</div></div>
      ) : (
        grouped.map(([section, list]) => (
          <section key={section} className="ipr-paper">
            <h2 className="ipr-section">{section}</h2>
            <table className="ipr-table">
              <thead>
                <tr>
                  <th style={{ width: "42%" }}>Item</th>
                  <th style={{ width: "20%" }}>Location</th>
                  <th style={{ width: "20%" }}>Date</th>
                  <th style={{ width: "18%" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((it) => {
                  const st = String(it.status || "open").toUpperCase();
                  return (
                    <tr key={it.id}>
                      <td>
                        <div className="ipr-item-title">{it.label || it.type || "—"}</div>
                        {it.notes && <div className="ipr-notes">{it.notes}</div>}
                      </td>
                      <td className="ipr-muted">{locationOf(it)}</td>
                      <td className="ipr-muted">{safeDate(it.updated_at || it.created_at)}</td>
                      <td>
                        <span
                          className={`ipr-badge ${
                            st === "OK" || st === "PASS"
                              ? "ipr-badge-ok"
                              : st === "FAIL" || st === "X"
                              ? "ipr-badge-fail"
                              : st === "NA"
                              ? "ipr-badge-na"
                              : ""
                          }`}
                        >
                          {st}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ))
      )}

      <style>{`
        .ipr-root {
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto;
          color: #0f172a;
          background: #f9fafb;
        }
        .ipr-muted { color: #6b7280; }
        .ipr-toolbar {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
        }
        .ipr-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ipr-logo-img {
          width: 40px;
          height: 40px;
          border-radius: 8px;
        }
        .ipr-toolbar-title {
          font-weight: 700;
          font-size: 15px;
          color: #0B5150;
        }
        .ipr-toolbar-sub {
          font-size: 12px;
          color: #6b7280;
        }
        .ipr-actions { display: flex; gap: 10px; }
        .ipr-btn {
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: #fff;
        }
        .ipr-btn:hover { background: #f3f4f6; }
        .ipr-btn-dark {
          background: #0B5150;
          color: #fff;
          border-color: #0B5150;
        }
        .ipr-btn-dark:hover { background: #0d6664; }

        .ipr-head {
          max-width: 1024px;
          margin: 18px auto 10px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: end;
        }
        .ipr-title {
          font-size: 26px;
          font-weight: 800;
          color: #083A39;
        }
        .ipr-meta {
          font-size: 12.5px;
          color: #374151;
          display: grid;
          gap: 4px;
        }

        .ipr-paper {
          max-width: 1024px;
          margin: 12px auto;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 4px 18px rgba(0,0,0,.05);
          page-break-inside: avoid;
        }
        .ipr-section {
          font-size: 15px;
          font-weight: 800;
          margin: 0 0 10px;
          border-bottom: 2px solid #0B5150;
          color: #0B5150;
          padding-bottom: 4px;
        }

        .ipr-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        .ipr-table thead th {
          text-align: left;
          font-weight: 700;
          font-size: 12px;
          background: #0B5150;
          color: #fff;
          padding: 10px 12px;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
        }
        .ipr-table tbody td {
          border-bottom: 1px solid #e5e7eb;
          padding: 10px 12px;
          vertical-align: top;
          font-size: 12.5px;
        }
        .ipr-item-title { font-weight: 700; color: #111827; margin-bottom: 2px; }
        .ipr-notes { font-size: 12px; color: #374151; }

        .ipr-badge {
          display: inline-flex;
          align-items: center;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          border: 1px solid #e5e7eb;
        }
        .ipr-badge-ok { background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }
        .ipr-badge-fail { background: #fff1f2; color: #9f1239; border-color: #fecdd3; }
        .ipr-badge-na { background: #f3f4f6; color: #374151; border-color: #e5e7eb; }

        .ipr-error {
          max-width: 1024px;
          margin: 10px auto 0;
          color: #9f1239;
        }

        /* Print-friendly */
        @media print {
          @page { size: Letter landscape; margin: 10mm; }
          .ipr-no-print { display: none !important; }
          html, body { background: #fff !important; }
          .ipr-root { background: #fff; padding: 0; }
          .ipr-paper { box-shadow: none; border: 1px solid #d1d5db; border-radius: 8px; padding: 8mm; page-break-after: avoid; }
          .ipr-table thead th,
          .ipr-badge-ok,
          .ipr-badge-fail,
          .ipr-badge-na {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
