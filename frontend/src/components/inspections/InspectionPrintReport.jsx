// src/components/inspections/InspectionPrintReport.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../api/client";

/* =============== ID 100% robusto: solo desde URL pathname =============== */
function getInspectionIdFromPath() {
  try {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    // Soporta: /inspections/42/print, /inspections/42/print?auto=1, /inspections/42/
    const m = path.match(/\/inspections\/(\d+)(?:\/|$)/i);
    const n = m ? Number(m[1]) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/* ================== helpers ================== */
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
function locOf(it) {
  if (it?.floor !== undefined && it?.floor !== null && String(it.floor) !== "")
    return `Floor ${it.floor}${it?.area ? ` / ${it.area}` : ""}`;
  if (it?.area) return String(it.area);
  return "—";
}

export default function InspectionPrintReport() {
  const qs = useQuery();
  const auto = qs.get("auto") === "1";

  // 🔒 ID solo desde la URL (evita NaN aunque useParams no pase nada)
  const inspectionId = useMemo(() => getInspectionIdFromPath(), []);

  const [inspection, setInspection] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!Number.isFinite(inspectionId)) {
      setErr("Could not load inspection report.");
      setLoading(false);
      return;
    }

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const [iRes, itsRes] = await Promise.all([
          api.get(`/api/inspections/${inspectionId}`),
          api.get(`/api/inspections/${inspectionId}/items`),
        ]);
        if (!alive) return;

        const i = iRes?.inspection ? iRes.inspection : iRes;
        const list = Array.isArray(itsRes?.items)
          ? itsRes.items
          : Array.isArray(itsRes)
          ? itsRes
          : [];

        setInspection(i || null);
        setItems(list);
      } catch {
        if (alive) setErr("Could not load inspection report.");
      } finally {
        alive && setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [inspectionId]);

  // Auto print cuando terminó de cargar
  useEffect(() => {
    if (auto && !loading && Number.isFinite(inspectionId)) {
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [auto, loading, inspectionId]);

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

  return (
    <div className="ipr-root">
      {/* Toolbar (no se imprime) */}
      <div className="ipr-toolbar ipr-no-print">
        <Link to="/inspections" className="ipr-btn">Back</Link>
        <button onClick={() => window.print()} className="ipr-btn ipr-btn-dark">Print</button>
      </div>

      {/* Encabezado */}
      <header className="ipr-head">
        <div className="ipr-title">Inspection Report</div>
        <div className="ipr-meta">
          <div><strong>ID:</strong> {Number.isFinite(inspectionId) ? `#${inspectionId}` : "—"}</div>
          <div><strong>Scope:</strong> {scope || "—"}</div>
          <div><strong>Status:</strong> {inspection?.status || "—"}</div>
          <div><strong>Generated:</strong> {safeDate(new Date())}</div>
        </div>
      </header>

      {/* Reporte */}
      <section className="ipr-paper">
        {err && <div className="ipr-error">Could not load inspection report.</div>}

        <table className="ipr-table">
          <thead>
            <tr>
              <th style={{ width: "30%" }}>Label</th>
              <th style={{ width: "18%" }}>Type</th>
              <th style={{ width: "20%" }}>Floor/Area</th>
              <th style={{ width: "12%" }}>Status</th>
              <th style={{ width: "20%" }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="ipr-muted">Loading…</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="ipr-muted">No items found.</td>
              </tr>
            ) : (
              items.map((it) => {
                const st = String(it.status || "open").toUpperCase();
                const notes =
                  it.notes ||
                  it.note ||
                  (Array.isArray(it.comments) && it.comments.length
                    ? it.comments.map((c) => c.text || c.note || "").filter(Boolean).join(" | ")
                    : "");
                return (
                  <tr key={it.id}>
                    <td><div className="ipr-item-title">{it.label || it.name || "—"}</div></td>
                    <td className="ipr-muted">{it.type || "—"}</td>
                    <td className="ipr-muted">{locOf(it)}</td>
                    <td>
                      <span
                        className={
                          "ipr-badge " +
                          (st === "OK" || st === "PASS"
                            ? "ipr-badge-ok"
                            : st === "FAIL" || st === "X"
                            ? "ipr-badge-fail"
                            : st === "NA"
                            ? "ipr-badge-na"
                            : "")
                        }
                      >
                        {st}
                      </span>
                    </td>
                    <td className="ipr-notes">{notes || "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Firmas */}
        <div className="ipr-signs">
          <div className="ipr-sign"><div className="ipr-line" /><div className="ipr-sign-label">Inspector Signature / Date</div></div>
          <div className="ipr-sign"><div className="ipr-line" /><div className="ipr-sign-label">Supervisor Signature / Date</div></div>
          <div className="ipr-sign"><div className="ipr-line" /><div className="ipr-sign-label">Customer Signature / Date</div></div>
        </div>
      </section>

      {/* Estilos locales (no tocan el resto de la app) */}
      <style>{`
        .ipr-root{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Helvetica,Arial;color:#0f172a;background:#0b0b0b;min-height:100vh;padding:24px 16px;}
        .ipr-no-print{}
        .ipr-toolbar{display:flex;justify-content:space-between;align-items:center;max-width:1040px;margin:0 auto 12px;}
        .ipr-btn{padding:10px 14px;border-radius:12px;border:1px solid #e5e7eb;background:#fff;}
        .ipr-btn-dark{background:#083A39;color:#fff;border-color:#0B5150}
        .ipr-head{max-width:1040px;margin:0 auto 10px;color:#e5e7eb;}
        .ipr-title{font-size:28px;font-weight:800;opacity:.9}
        .ipr-meta{font-size:13px;opacity:.8;display:flex;gap:14px;flex-wrap:wrap;margin-top:6px}
        .ipr-paper{max-width:1040px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.25);padding:18px;}
        .ipr-table{width:100%;border-collapse:separate;border-spacing:0;}
        .ipr-table thead th{text-align:left;font-weight:600;font-size:13px;color:#111827;background:#edf2f7;padding:10px 12px;border-top-left-radius:10px;border-top-right-radius:10px;border-bottom:1px solid #e5e7eb;}
        .ipr-table thead th + th{border-top-left-radius:0}
        .ipr-table tbody td{padding:12px;border-bottom:1px solid #e5e7eb;vertical-align:top;font-size:13px;}
        .ipr-item-title{font-weight:700;color:#111827}
        .ipr-notes{color:#374151}
        .ipr-muted{color:#6b7280}
        .ipr-error{color:#b91c1c;margin:10px 0 0}
        .ipr-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;border:1px solid #e5e7eb}
        .ipr-badge-ok{background:#ecfdf5;color:#065f46;border-color:#a7f3d0}
        .ipr-badge-fail{background:#fff1f2;color:#9f1239;border-color:#fecdd3}
        .ipr-badge-na{background:#f3f4f6;color:#374151;border-color:#e5e7eb}
        .ipr-signs{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:26px}
        .ipr-line{height:1px;background:#e5e7eb;margin-bottom:8px}
        .ipr-sign-label{color:#9ca3af;font-size:12px}
        @media print{
          @page{size:Letter;margin:12mm}
          .ipr-no-print{display:none!important}
          html,body{background:#fff!important}
          .ipr-root{background:#fff;padding:0}
          .ipr-head{color:#111827}
          .ipr-paper{box-shadow:none;border:1px solid #d1d5db;border-radius:10px;padding:10mm;}
          .ipr-table thead th,.ipr-badge-ok,.ipr-badge-fail,.ipr-badge-na{-webkit-print-color-adjust:exact;print-color-adjust:exact}
        }
      `}</style>
    </div>
  );
}
