import React, { useEffect, useMemo, useState } from "react";
import { FileText, Download, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { fetchWithAuth } from "../utils/api";
import PdfPreviewModal from "./PdfPreviewModal";

/* ---------- Formato monetario ---------- */
function money(v) {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function QuotesTable({ onRowClick, onEdit, reloadToken, filterQ = "" }) {
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("Attachment preview");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const qRes = await fetchWithAuth("/api/quotes/");
        const list = Array.isArray(qRes?.items)
          ? qRes.items
          : Array.isArray(qRes)
          ? qRes
          : [];
        if (isMounted) setItems(list);

        const vRes = await fetchWithAuth("/api/vendors/?per_page=1000");
        const map = {};
        (vRes?.items || []).forEach((v) => {
          map[String(v.id)] = v.name || v.company || v.contact_name || `#${v.id}`;
        });
        if (isMounted) setVendors(map);
      } catch (err) {
        console.error(err);
        if (isMounted) setError("Failed to load quotes.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [reloadToken]);

  const joinedRows = useMemo(
    () =>
      items.map((q) => {
        const vid = q.vendor_id != null ? String(q.vendor_id) : null;
        const vendor_name =
          (vid && vendors[vid]) ||
          (q.vendor && (q.vendor.name || q.vendor.company)) ||
          "—";
        return { ...q, vendor_name };
      }),
    [items, vendors]
  );

  const rows = useMemo(() => {
    const t = filterQ.trim().toLowerCase();
    if (!t) return joinedRows;
    const norm = (x) => (x == null ? "" : String(x)).toLowerCase();
    return joinedRows.filter(
      (r) =>
        norm(r.quote_number || r.id).includes(t) ||
        norm(r.vendor_name).includes(t) ||
        norm(r.status).includes(t) ||
        norm(r.amount).includes(t)
    );
  }, [joinedRows, filterQ]);

  /* ---------- Ordenamiento ---------- */
  const sortedRows = useMemo(() => {
    if (!sortConfig.key) return rows;
    const sorted = [...rows].sort((a, b) => {
      const aVal = a[sortConfig.key] ?? "";
      const bVal = b[sortConfig.key] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return sorted;
  }, [rows, sortConfig]);

  function handleSort(key) {
    setSortConfig((prev) => {
      if (prev.key === key) {
        const nextDir = prev.direction === "asc" ? "desc" : "asc";
        return { key, direction: nextDir };
      }
      return { key, direction: "asc" };
    });
  }

  function absolutize(u) {
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith("/")) return u;
    return `/${u.replace(/^\/+/, "")}`;
  }

  function openPreview(row) {
    const att = Array.isArray(row.attachments) ? row.attachments[0] : row.attachments;
    if (!att) return;
    const url = absolutize(att);
    setPreviewUrl(url);
    setPreviewTitle(row.quote_number ? `Quote ${row.quote_number}` : "Attachment preview");
    setPreviewOpen(true);
  }

  async function handleApprove(row) {
    if (!row?.id) return;
    try {
      const body = { status: "Approved" };
      await fetchWithAuth(`/api/quotes/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setItems((prev) =>
        prev.map((it) => (it.id === row.id ? { ...it, status: "Approved" } : it))
      );
    } catch (e) {
      console.error("Approve failed:", e);
      alert("Failed to approve quote.");
    }
  }

  // ✅ Reparado: función de Delete real
  async function handleDelete(row) {
    if (!row?.id) return;
    const ok = confirm("Delete this quote?");
    if (!ok) return;
    try {
      await fetchWithAuth(`/api/quotes/${row.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((it) => it.id !== row.id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete quote.");
    }
  }

  const TD = "px-4 sm:px-5 py-2.5 border-b border-zinc-200 dark:border-zinc-800";

  return (
    <>
      {/* 🔹 Full page table view (no borders, full width, header sticky) */}
      <div className="absolute inset-0 overflow-y-auto">
        <table className="w-full text-[15px] leading-6 border-separate [border-spacing:0] cursor-default select-none">
          {/* Header sticky + sort */}
          <thead className="bg-zinc-900 sticky top-0 z-10">
            <tr>
              {[
                { label: "Attachment", key: null, align: "center" },
                { label: "Quote #", key: "quote_number" },
                { label: "Vendor", key: "vendor_name" },
                { label: "Amount", key: "amount", align: "left" },
                { label: "Status", key: "status", align: "center" },
                { label: "Actions", key: null, align: "center" },
              ].map((col, i, arr) => {
                const isSorted = sortConfig.key === col.key;
                const dirIcon =
                  isSorted && sortConfig.direction === "asc"
                    ? "▲"
                    : isSorted
                    ? "▼"
                    : "";
                return (
                  <th
                    key={col.label}
                    onClick={() => col.key && handleSort(col.key)}
                    className={[
                      "px-4 sm:px-5 py-3 font-medium text-zinc-300 border-b border-zinc-800 select-none bg-zinc-900",
                      col.key ? "cursor-pointer" : "",
                      col.align === "center"
                        ? "text-center"
                        : col.align === "right"
                        ? "text-right"
                        : "text-left",
                    ].join(" ")}
                  >
                    <div
                      className={`flex ${
                        col.align === "center"
                          ? "justify-center"
                          : col.align === "right"
                          ? "justify-end"
                          : "justify-between"
                      } items-center gap-1`}
                    >
                      <span>{col.label}</span>
                      {dirIcon && <span className="text-xs opacity-60">{dirIcon}</span>}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 sm:px-5 py-6 text-center text-zinc-500 dark:text-zinc-400"
                >
                  Loading…
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 sm:px-5 py-6 text-center text-rose-600 dark:text-rose-400"
                >
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && sortedRows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 sm:px-5 py-6 text-center text-zinc-500 dark:text-zinc-400"
                >
                  No quotes found.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              sortedRows.map((row, idx, arr) => {
                const isLast = idx === arr.length - 1;
                const pdfUrl = Array.isArray(row.attachments)
                  ? absolutize(row.attachments[0])
                  : absolutize(row.attachments || "");
                const statusLC = String(row.status || "").toLowerCase();

                return (
                  <tr
                    key={row.id}
                    className={`bg-transparent text-zinc-800 hover:bg-zinc-50 dark:bg-transparent dark:hover:bg-[#1a1a1a] dark:text-zinc-200 transition ${
                      isLast ? "last:[&>td]:border-b-0" : ""
                    }`}
                  >
                    {/* Attachment */}
                    <td className={TD + " text-center"}>
                      {pdfUrl ? (
                        <button
                          type="button"
                          onClick={() => openPreview(row)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-transparent text-[#0B5150] hover:bg-zinc-100 dark:text-[#5ad5d3] dark:hover:bg-zinc-800"
                          title="Open PDF"
                        >
                          <FileText size={16} />
                        </button>
                      ) : (
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
                          <FileText size={16} />
                        </span>
                      )}
                    </td>

                    {/* Quote # */}
                    <td className={TD}>
                      <div className="inline-flex items-center gap-2">
                        <FileText className="h-4 w-4 text-zinc-500" />
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {row.quote_number || `#${row.id}`}
                        </span>
                      </div>
                    </td>

                    <td className={TD + " text-zinc-700 dark:text-zinc-300"}>
                      {row.vendor_name}
                    </td>

                    <td className={TD + " text-zinc-700 dark:text-zinc-300"}>
                      {money(row.amount)}
                    </td>

                    <td className={TD + " text-center"}>
                      <StatusPill value={row.status} />
                    </td>

                    <td className={TD + " text-center"}>
                      <div className="inline-flex justify-center gap-2 flex-wrap">
                        {statusLC !== "approved" && (
                          <button
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border border-emerald-300 bg-transparent text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                            onClick={() => handleApprove(row)}
                            title="Approve"
                            type="button"
                          >
                            <CheckCircle2 size={13} />
                            Approve
                          </button>
                        )}

                        <button
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border border-zinc-300 bg-transparent text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          onClick={() => onEdit?.(row)}
                          title="Edit"
                          type="button"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>

                        {pdfUrl && (
                          <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border border-[#0B5150]/40 text-[#0B5150] hover:bg-[#0B5150]/10 dark:border-[#0B5150]/60 dark:text-[#5ad5d3] dark:hover:bg-[#0B5150]/20"
                            title="Download"
                          >
                            <Download size={13} />
                            Download
                          </a>
                        )}

                        <button
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border border-rose-300 bg-transparent text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/30"
                          onClick={() => handleDelete(row)}
                          title="Delete"
                          type="button"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <PdfPreviewModal
        open={previewOpen}
        url={previewUrl}
        title={previewTitle}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}

/* ---------- Status Pill ---------- */
function StatusPill({ value }) {
  const v = String(value || "").toLowerCase();
  const styles = {
    approved:
      "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-800",
    pending:
      "bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-800",
    denied:
      "bg-rose-100 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:ring-rose-800",
    default:
      "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700",
  };
  const cls = styles[v] || styles.default;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {value || "—"}
    </span>
  );
}
