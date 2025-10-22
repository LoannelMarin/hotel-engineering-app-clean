// frontend/src/components/invoices/InvoicesTable.jsx
import React, { useState, useMemo } from "react";
import { FileText, Pencil, Trash2, CheckCircle } from "lucide-react";

/* ---------- Estilos base (tabla loannel color negro) ---------- */
const TD =
  "px-4 sm:px-5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 text-left truncate";
const TH =
  "px-4 sm:px-5 py-3 font-semibold text-sm tracking-wide border-b border-zinc-800 bg-zinc-900 text-zinc-100 select-none cursor-pointer";
const ROW =
  "transition text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-[#1a1a1a]";

/* ---------- Helpers ---------- */
function getApiBase() {
  const env = typeof import.meta !== "undefined" && import.meta.env;
  if (env?.VITE_API_BASE_URL)
    return String(env.VITE_API_BASE_URL).replace(/\/$/, "");
  if (typeof window !== "undefined")
    return window.location.origin.replace(":5173", ":5000");
  return "http://localhost:5000";
}
function absolutize(u) {
  if (!u) return "";
  const s = String(u).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const base = getApiBase();
  return `${base}${s.startsWith("/") ? s : `/${s}`}`;
}
function formatMoney(amount, currencyCode = "USD") {
  const n =
    typeof amount === "number"
      ? amount
      : amount == null
      ? NaN
      : Number.parseFloat(String(amount).replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(n)) return "-";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "USD",
      currencySign: "accounting",
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}
function textify(x, fallback = "—") {
  if (x == null) return fallback;
  const t = typeof x;
  if (t === "string" || t === "number" || t === "boolean") return String(x);
  if (t === "object") {
    if ("name" in x) return String(x.name);
    if ("label" in x) return String(x.label);
    if ("title" in x) return String(x.title);
    return fallback;
  }
  return fallback;
}

/* ---------- Fechas ---------- */
const ONE_DAY = 24 * 60 * 60 * 1000;
function parseISODate(s) {
  if (!s) return null;
  const str = String(s);
  const d10 = str.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(d10)) {
    const [y, mo, d] = d10.split("-").map(Number);
    const dt = new Date(y, mo - 1, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(str);
  return Number.isNaN(dt.getTime()) ? null : new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

/* ---------- Days y Overdue ---------- */
function computeAgeDays(row) {
  const statusLC = String(row.status || "").toLowerCase();
  if (statusLC === "paid") return 0;
  const baseStr = row.delivery_date || row.order_date;
  const base = parseISODate(baseStr);
  if (!base) return null;
  const today = new Date();
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const b = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const diff = Math.floor((a - b) / ONE_DAY);
  return Math.max(diff, 0);
}

function termsToDays(terms) {
  if (!terms) return 30;
  if (typeof terms === "number") return terms;
  if (typeof terms === "object") {
    if (Number.isFinite(terms.termsDays)) return terms.termsDays;
    if (typeof terms.name === "string")
      return /receipt/i.test(terms.name) ? 0 : 30;
    return 30;
  }
  const s = String(terms);
  if (/receipt/i.test(s)) return 0;
  const m = /(\d+)\s*days/i.exec(s);
  return m ? +m[1] : 30;
}
function addDaysStr(dateStr, days) {
  const d = parseISODate(dateStr);
  if (!d) return null;
  const x = new Date(d);
  x.setDate(x.getDate() + (Number.isFinite(days) ? days : 0));
  return x;
}
function computeOverdueDays(row) {
  const baseStr = row.due_date || row.delivery_date;
  const base = parseISODate(baseStr);
  if (!base) return 0;
  const terms = termsToDays(row.payment_terms || row.terms);
  const dueOn = addDaysStr(baseStr, terms);
  if (!dueOn) return 0;
  const today = new Date();
  const diff = Math.floor((today - dueOn) / ONE_DAY);
  return diff > 0 ? diff : 0;
}

/* ---------- Status Badge ---------- */
function StatusBadge({ row }) {
  const isPaid = String(row.status || "").toLowerCase() === "paid";
  const overdueDays = computeOverdueDays(row);
  const label = isPaid
    ? "Paid"
    : overdueDays > 0
    ? "Overdue"
    : row.status || "Posted";

  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border transition-colors duration-200";

  const map = {
    Paid:
      base +
      " border-emerald-500/50 text-emerald-700 bg-emerald-200 dark:border-emerald-400/40 dark:text-emerald-300 dark:bg-emerald-900/30",
    Overdue:
      base +
      " border-rose-500/50 text-rose-700 bg-rose-100 dark:border-rose-400/40 dark:text-rose-300 dark:bg-rose-900/30",
    Posted:
      base +
      " border-amber-500/50 text-amber-700 bg-amber-100 dark:border-amber-400/40 dark:text-amber-300 dark:bg-amber-900/30",
    Submitted:
      base +
      " border-indigo-500/50 text-indigo-700 bg-indigo-100 dark:border-indigo-400/40 dark:text-indigo-300 dark:bg-indigo-900/30",
    Processing:
      base +
      " border-blue-500/50 text-blue-700 bg-blue-100 dark:border-blue-400/40 dark:text-blue-300 dark:bg-blue-900/30",
    Draft:
      base +
      " border-zinc-400 text-zinc-700 bg-zinc-100 dark:border-zinc-400/40 dark:text-zinc-300 dark:bg-zinc-800/30",
    Default:
      base +
      " border-zinc-400 text-zinc-700 bg-zinc-100 dark:border-zinc-400/40 dark:text-zinc-300 dark:bg-zinc-800/30",
  };

  return <span className={map[label] || map.Default}>{label}</span>;
}

/* ---------- Tabla principal ---------- */
export default function InvoicesTable({
  items = [],
  vendorMap = {},
  loading = false,
  onEdit,
  onDelete,
  onMarkPaid,
  onOpenPdf,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  const headers = [
    { label: "Invoice #", key: "invoice_number", align: "left" },
    { label: "Vendor", key: "vendor_name", align: "left" },
    { label: "Description", key: "description", align: "left" },
    { label: "Total", key: "amount", align: "right" },
    { label: "Status", key: "status", align: "center" },
    { label: "Days", key: "days_due", align: "center" },
    { label: "Actions", key: null, align: "center" },
    { label: "Order Date", key: "order_date", align: "left" },
    { label: "Delivery Date", key: "delivery_date", align: "left" },
    { label: "Post Date", key: "post_date", align: "left" },
  ];

  function handleSort(key) {
    if (!key) return;
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function sortValue(row, key) {
    if (key === "days_due") {
      const v = computeAgeDays(row);
      return v == null ? -Infinity : v;
    }
    const val = row[key];
    if (val == null) return "";
    return typeof val === "number" ? val : String(val).toLowerCase();
  }

  const sorted = useMemo(() => {
    if (!sortKey) return items;
    return [...items].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [items, sortKey, sortAsc]);

  return (
    <div className="relative w-full h-full overflow-auto rounded-2xl bg-transparent">
      <table className="w-full min-w-[1300px] text-[15px] leading-6 border-separate [border-spacing:0]">
        <thead className="sticky top-0 z-20">
          <tr>
            {headers.map((h) => {
              const sortedNow = sortKey === h.key;
              const arrow = sortedNow ? (sortAsc ? "▲" : "▼") : "";
              return (
                <th
                  key={h.label}
                  onClick={() => h.key && handleSort(h.key)}
                  className={`${TH} ${
                    h.align === "center"
                      ? "text-center"
                      : h.align === "right"
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  <div
                    className={`flex items-center ${
                      h.align === "center"
                        ? "justify-center"
                        : h.align === "right"
                        ? "justify-end"
                        : "justify-between"
                    } gap-1`}
                  >
                    <span>{h.label}</span>
                    {arrow && <span className="text-xs opacity-60">{arrow}</span>}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="bg-transparent">
          {loading && (
            <tr>
              <td
                colSpan={headers.length}
                className="px-4 sm:px-5 py-6 text-center text-zinc-500 dark:text-zinc-400"
              >
                Loading…
              </td>
            </tr>
          )}

          {!loading &&
            sorted.map((r, idx) => {
              const vendor = textify(
                vendorMap[String(r.vendor_id)] ??
                  r.vendor?.name ??
                  r.vendor_name
              );
              const desc = textify(
                r.order_description ?? r.description ?? r.notes
              );
              const pdfUrl = r.attachments || r.attachment_url || r.pdf_url;
              const days = computeAgeDays(r);
              const daysCell = days == null ? "—" : days;

              return (
                <tr key={r.id ?? `row-${idx}`} className={ROW}>
                  <td className={TD}>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title="Open PDF"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 text-[#0B5150] hover:bg-zinc-100 dark:text-[#5ad5d3] dark:hover:bg-zinc-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (pdfUrl) onOpenPdf?.(absolutize(pdfUrl));
                          else alert("This invoice does not have a PDF attached.");
                        }}
                      >
                        <FileText size={16} />
                      </button>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {textify(r.invoice_number)}
                      </span>
                    </div>
                  </td>

                  <td className={TD}>{vendor}</td>
                  <td className={`${TD} max-w-[240px] truncate`}>{desc}</td>
                  <td className={`${TD} text-right`}>
                    {formatMoney(r.amount, r.currency)}
                  </td>
                  <td className={`${TD} text-center`}>
                    <StatusBadge row={r} />
                  </td>
                  <td className={`${TD} text-center`}>{daysCell}</td>

                  <td className={`${TD} text-center`}>
                    <div className="inline-flex justify-center gap-2 flex-wrap">
                      {String(r.status || "").toLowerCase() !== "paid" && (
                        <button
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border border-emerald-300 bg-transparent text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                          onClick={() => onMarkPaid?.(r)}
                          type="button"
                        >
                          <CheckCircle size={13} />
                          Paid
                        </button>
                      )}
                      <button
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border border-zinc-300 bg-transparent text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        onClick={() => onEdit?.(r)}
                        type="button"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border border-rose-300 bg-transparent text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/30"
                        onClick={() => onDelete?.(r)}
                        type="button"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  </td>

                  <td className={TD}>{textify(r.order_date?.slice?.(0, 10))}</td>
                  <td className={TD}>{textify(r.delivery_date?.slice?.(0, 10))}</td>
                  <td className={TD}>{textify(r.post_date?.slice?.(0, 10))}</td>
                </tr>
              );
            })}

          {!loading && sorted.length === 0 && (
            <tr>
              <td
                colSpan={headers.length}
                className="px-4 sm:px-5 py-6 text-center text-zinc-500 dark:text-zinc-400"
              >
                No results.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
