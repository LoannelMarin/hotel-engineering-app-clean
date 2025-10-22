// src/pages/InspectionPrint.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api from "../api/client";

/* ================== ID robusto ================== */
function useInspectionId() {
  const params = useParams();
  for (const c of [params?.inspectionId, params?.id, params?.inspection_id]) {
    const n = Number(c);
    if (Number.isFinite(n)) return n;
  }
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const m = path.match(/\/inspections\/(\d+)(?:\/|$)/i);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/* ================== Helpers ================== */
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
function firstItemPhoto(it) {
  if (Array.isArray(it?.photos) && it.photos.length) return it.photos[0];
  return null;
}
function StatusIcon({ status }) {
  const st = String(status || "open").toLowerCase();
  let cls = "ipr-status ipr-status--other";
  let symbol = "•";
  let title = "OPEN";
  if (st === "ok" || st === "pass") {
    cls = "ipr-status ipr-status--ok";
    symbol = "✓";
    title = "OK";
  } else if (st === "fail" || st === "x" || st === "ooo") {
    cls = "ipr-status ipr-status--fail";
    symbol = "✕";
    title = "FAIL";
  } else if (st === "na") {
    cls = "ipr-status ipr-status--na";
    symbol = "–";
    title = "N/A";
  }
  return <span className={cls} aria-label={title} title={title}>{symbol}</span>;
}

export default function InspectionPrint() {
  const inspectionId = useInspectionId();
  const qs = useQuery();
  const auto = qs.get("auto") === "1";
  const statusFilter = useMemo(() => {
    const s = (qs.get("status") || "").trim().toLowerCase();
    if (!s) return [];
    return s.split(",").map((x) => x.trim()).filter(Boolean);
  }, [qs]);

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

  const filteredItems = useMemo(() => {
    if (!statusFilter.length) return items;
    return items.filter((it) =>
      statusFilter.includes(String(it.status || "").toLowerCase())
    );
  }, [items, statusFilter]);

  const filterLabel = useMemo(() => {
    if (!statusFilter.length) return null;
    return statusFilter.map((s) => s.toUpperCase()).join(", ");
  }, [statusFilter]);

  return (
    <div className="ipr-root">
      {/* Toolbar */}
      <div className="ipr-toolbar ipr-no-print">
        <Link to="/inspections" className="ipr-btn">Back</Link>
        <button onClick={() => window.print()} className="ipr-btn ipr-btn-dark">
          Print
        </button>
      </div>

      {/* Header */}
      <header className="ipr-head">
        <div className="ipr-title">Inspection Report</div>
        <div className="ipr-meta">
          <div><strong>ID:</strong> {Number.isFinite(inspectionId) ? `#${inspectionId}` : "—"}</div>
          <div><strong>Scope:</strong> {scope || "—"}</div>
          <div><strong>Status:</strong> {inspection?.status || "—"}</div>
          {filterLabel && <div><strong>Filter:</strong> {filterLabel}</div>}
          <div><strong>Generated:</strong> {safeDate(new Date())}</div>
        </div>
      </header>

      {/* Body */}
      <section className="ipr-paper">
        {err && <div className="ipr-error">Could not load inspection report.</div>}

        <table className="ipr-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Photo</th>
              <th>Label</th>
              <th>Type</th>
              <th>Floor/Area</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="ipr-muted">Loading…</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="ipr-muted">
                  {statusFilter.length
                    ? "No items found for current filter."
                    : "No items found."}
                </td>
              </tr>
            ) : (
              filteredItems.map((it) => {
                const notes =
                  it.notes ||
                  it.note ||
                  (Array.isArray(it.comments) && it.comments.length
                    ? it.comments
                        .map((c) => c.text || c.note || "")
                        .filter(Boolean)
                        .join(" | ")
                    : "");
                const photo = firstItemPhoto(it);
                return (
                  <React.Fragment key={it.id}>
                    <tr>
                      <td className="ipr-status-cell">
                        <StatusIcon status={it.status} />
                      </td>
                      <td className="ipr-photo-cell">
                        {photo ? (
                          <img src={photo} alt="" className="ipr-photo" />
                        ) : (
                          <span className="ipr-muted">—</span>
                        )}
                      </td>
                      <td><div className="ipr-item-title">{it.label || it.name || "—"}</div></td>
                      <td className="ipr-muted">{it.type || "—"}</td>
                      <td className="ipr-muted">{locOf(it)}</td>
                    </tr>
                    {notes && (
                      <tr className="ipr-notes-row" key={`${it.id}-notes`}>
                        <td colSpan={5}>
                          <div className="ipr-notes">
                            <strong>Notes:</strong> {notes}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>

        {/* Signatures */}
        <div className="ipr-signs">
          <div className="ipr-sign">
            <div className="ipr-line" />
            <div className="ipr-sign-label">Inspector Signature / Date</div>
          </div>
          <div className="ipr-sign">
            <div className="ipr-line" />
            <div className="ipr-sign-label">Supervisor Signature / Date</div>
          </div>
          <div className="ipr-sign">
            <div className="ipr-line" />
            <div className="ipr-sign-label">Customer Signature / Date</div>
          </div>
        </div>
      </section>

      <style>{`
        :root {
          color-scheme: light dark;
        }
        .ipr-root {
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto;
          color: #0f172a;
          background: #0b0b0b;
          min-height: 100vh;
          padding: 16px;
          transition: background 0.3s ease;
        }
        @media (prefers-color-scheme: light) {
          .ipr-root { background: #f9fafb; color: #111827; }
        }

        .ipr-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: space-between;
          align-items: center;
          max-width: 1040px;
          margin: 0 auto 16px;
        }
        .ipr-btn {
          padding: 10px 16px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #fff;
          font-weight: 500;
          font-size: 15px;
        }
        .ipr-btn-dark {
          background: #083A39;
          color: #fff;
          border-color: #0B5150;
        }

        .ipr-head {
          max-width: 1040px;
          margin: 0 auto 12px;
          color: #e5e7eb;
        }
        .ipr-title {
          font-size: clamp(22px, 3vw, 28px);
          font-weight: 800;
          opacity: .9;
        }
        .ipr-meta {
          font-size: 13px;
          opacity: .85;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 6px;
        }

        .ipr-paper {
          max-width: 1040px;
          margin: 0 auto;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(0,0,0,.25);
          padding: 18px;
          overflow-x: auto;
        }

        .ipr-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 13.5px;
        }
        .ipr-table thead th {
          background: #edf2f7;
          text-align: left;
          padding: 10px 12px;
          font-weight: 600;
          color: #111827;
          border-bottom: 1px solid #e5e7eb;
        }
        .ipr-table tbody td {
          padding: 10px;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: middle;
        }
        .ipr-item-title { font-weight: 700; color: #111827; }
        .ipr-muted { color: #6b7280; }
        .ipr-error { color: #b91c1c; margin: 10px 0; }

        .ipr-photo { width: 96px; height: auto; max-height: 70px; border-radius: 8px; border: 1px solid #e5e7eb; object-fit: cover; }

        .ipr-status {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 9999px; font-weight: 800;
          border: 1px solid #d1d5db; background: #f3f4f6; color: #374151;
        }
        .ipr-status--ok { background: #10b981; color: #fff; border-color: #059669; }
        .ipr-status--fail { background: #ef4444; color: #fff; border-color: #dc2626; }
        .ipr-status--na { background: #e5e7eb; color: #374151; border-color: #cbd5e1; }

        .ipr-notes { font-size: 12.5px; color: #374151; white-space: pre-wrap; }

        .ipr-signs {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          margin-top: 28px;
        }
        .ipr-line { height: 1px; background: #e5e7eb; margin-bottom: 8px; }
        .ipr-sign-label { font-size: 12px; color: #9ca3af; }

        /* ✅ Responsive */
        @media (max-width: 640px) {
          .ipr-head { text-align: center; }
          .ipr-meta { justify-content: center; font-size: 12px; }
          .ipr-paper { padding: 12px; border-radius: 12px; }
          .ipr-table thead { display: none; }
          .ipr-table tbody tr { display: block; margin-bottom: 12px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 8px; }
          .ipr-table tbody td { display: block; border: none; padding: 6px 0; }
          .ipr-status, .ipr-photo { transform: scale(1.1); }
          .ipr-signs { grid-template-columns: 1fr; gap: 16px; }
        }

        /* ✅ Print */
        @media print {
          @page { size: Letter; margin: 12mm; }
          .ipr-no-print { display: none !important; }
          html, body { background: #fff !important; }
          .ipr-root { background: #fff; padding: 0; }
          .ipr-paper { box-shadow: none; border: 1px solid #d1d5db; }
          .ipr-table thead th,
          .ipr-status--ok, .ipr-status--fail, .ipr-status--na {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
