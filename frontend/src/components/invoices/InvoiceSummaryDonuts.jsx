import React, { useMemo } from "react";

/* === Utilidades para cálculo dinámico de Overdue === */
const ONE_DAY = 24 * 60 * 60 * 1000;

function parseISODate(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s));
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const dt = new Date(y, mo - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}
function addDaysStr(dateStr, days) {
  const d = parseISODate(dateStr);
  if (!d) return null;
  const x = new Date(d);
  x.setDate(x.getDate() + (Number.isFinite(days) ? days : 0));
  return x;
}
function termsToDays(terms) {
  if (!terms) return 30;
  if (typeof terms === "number") return terms;
  if (typeof terms === "object") {
    if (Number.isFinite(terms.termsDays)) return terms.termsDays;
    if (typeof terms.name === "string") return /receipt/i.test(terms.name) ? 0 : 30;
    return 30;
  }
  const s = String(terms);
  if (/receipt/i.test(s)) return 0;
  const m = /(\d+)\s*days/i.exec(s);
  return m ? +m[1] : 30;
}
function computeOverdueDays(row) {
  const delivery = row.due_date || row.delivery_date || row.deliveryDate;
  const base = parseISODate(delivery);
  if (!base) return null;
  const days = termsToDays(row.payment_terms || row.terms);
  const dueOn = addDaysStr(delivery, days);
  if (!dueOn) return null;
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(dueOn.getFullYear(), dueOn.getMonth(), dueOn.getDate());
  const diff = Math.floor((a - b) / ONE_DAY);
  return Math.max(diff, 0);
}

/* === Barras horizontales compactas con padding === */
export default function InvoiceSummaryBars({ items = [] }) {
  const { postedCount, overdueCount } = useMemo(() => {
    const overdue = items.filter((r) => {
      const status = String(r.status || "").toLowerCase();
      const overdueDays = computeOverdueDays(r);
      return status !== "paid" && overdueDays > 0;
    }).length;

    const posted = items.filter((r) => {
      const status = String(r.status || "").toLowerCase();
      const overdueDays = computeOverdueDays(r);
      return status !== "paid" && overdueDays === 0;
    }).length;

    return { postedCount: posted, overdueCount: overdue };
  }, [items]);

  const total = postedCount + overdueCount || 1;
  const postedPct = Math.round((postedCount / total) * 100);
  const overduePct = Math.round((overdueCount / total) * 100);

  return (
    <div className="flex flex-col items-end w-[230px] px-4 pt-1 pb-2">
      {/* Encabezado mini */}
      <div className="flex items-center justify-between w-full mb-1">
        <span className="text-sm font-medium text-zinc-200">Invoices</span>
        <span className="text-sm text-zinc-400">{total} total</span>
      </div>

      {/* Barra combinada */}
      <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden flex">
        <div
          className="h-full bg-amber-500 transition-all duration-700"
          style={{ width: `${postedPct}%` }}
        />
        <div
          className="h-full bg-rose-800 transition-all duration-700"
          style={{ width: `${overduePct}%` }}
        />
      </div>

      {/* Leyenda compacta */}
      <div className="flex justify-between w-full mt-1.5 text-xs text-zinc-400">
        <div className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Posted ({postedCount})</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-800"></span>
          <span>Overdue ({overdueCount})</span>
        </div>
      </div>
    </div>
  );
}
