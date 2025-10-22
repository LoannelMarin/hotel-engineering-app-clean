// frontend/src/components/dashboard/InvoiceSummaryPanel.jsx
import React, { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

/* === Utilidades === */
const ONE_DAY = 24 * 60 * 60 * 1000;

function parseISODate(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s));
  if (!m) return null;
  const y = +m[1],
    mo = +m[2],
    d = +m[3];
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
    if (typeof terms.name === "string") return /receipt/i.test(terms.name)
      ? 0
      : 30;
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

/* === Panel principal === */
export default function InvoiceSummaryPanel({ invoices = [] }) {
  const navigate = useNavigate();

  const { postedCount, overdueCount, totalActive } = useMemo(() => {
    const active = invoices.filter(
      (r) => String(r.status || "").toLowerCase() !== "paid"
    );
    const overdue = active.filter((r) => computeOverdueDays(r) > 0).length;
    const posted = active.filter((r) => computeOverdueDays(r) === 0).length;
    return {
      postedCount: posted,
      overdueCount: overdue,
      totalActive: active.length,
    };
  }, [invoices]);

  const data = [
    { name: "Posted", value: postedCount, color: "#F59E0B" },
    { name: "Overdue", value: overdueCount, color: "#B91C1C" },
  ];

  return (
    <div
      className="
        col-span-1 sm:col-span-2
        rounded-2xl
        bg-white dark:bg-[#1d1f24]
        ring-1 ring-zinc-100 dark:ring-zinc-800
        shadow-[0_10px_30px_rgba(2,6,23,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]
        hover:shadow-[0_14px_36px_rgba(2,6,23,0.10)] dark:hover:shadow-[0_14px_36px_rgba(0,0,0,0.45)]
        transition-all duration-300
        p-6 flex flex-col justify-between
        h-full min-h-[360px]
      "
    >
      {/* ---------- Header ---------- */}
      <h3
        className="text-lg sm:text-xl font-semibold text-center mb-4 
                   text-black dark:text-white"
      >
        Invoices Overview
      </h3>

      {/* ---------- Content ---------- */}
      <div className="flex flex-col lg:flex-row flex-1 items-center justify-center gap-6 sm:gap-8">
        {/* Donut centrado y adaptativo */}
        <div className="flex justify-center items-center w-[140px] sm:w-[180px] h-[140px] sm:h-[180px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Texto lateral */}
        <div className="flex flex-col justify-center items-center lg:items-start text-center lg:text-left w-full">
          <p className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            {totalActive} active invoices
          </p>
          <div className="text-sm text-zinc-500 dark:text-zinc-300 space-y-2">
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-amber-500"></span>
              <span>Posted: {postedCount}</span>
            </div>
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-rose-700"></span>
              <span>Overdue: {overdueCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Footer ---------- */}
      <div className="flex justify-end mt-6">
        <button
          onClick={() => navigate("/invoices")}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl 
                     bg-[#0B5150] text-white font-medium text-sm sm:text-base
                     hover:bg-[#094543] active:scale-[.98] transition-all duration-150 shadow-sm"
        >
          Go to Invoices <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
