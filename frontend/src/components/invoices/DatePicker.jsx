import React, { useEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * DatePicker (versión compacta)
 * - Permite escribir, pegar o seleccionar fechas.
 * - Estilo coherente con Loannel dark/light.
 * - Sin dependencias externas.
 */

const INPUT_GHOST =
  "w-full bg-transparent px-3 py-2 text-slate-900 placeholder-slate-400 " +
  "focus:outline-none focus:ring-2 focus:ring-[#0B5150]/30 " +
  "dark:text-slate-200 dark:placeholder-slate-500 dark:focus:ring-[#0B5150]/40 " +
  "transition-colors duration-150";

export default function DatePicker({ value, onChange, placeholder = "YYYY-MM-DD" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const date = parseDate(value);
  const [viewYear, setViewYear] = useState(date ? date.getFullYear() : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(date ? date.getMonth() : new Date().getMonth());
  const [inputValue, setInputValue] = useState(value || "");

  useEffect(() => setInputValue(value || ""), [value]);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const monthStart = new Date(viewYear, viewMonth, 1);
  const startWeekday = monthStart.getDay();
  const daysCount = daysInMonth(viewYear, viewMonth);
  const monthLabel = monthStart.toLocaleString("en-US", { month: "long", year: "numeric" });
  const selectedStr = value;
  const todayStr = formatDate(new Date());

  function selectDay(day) {
    const d = new Date(viewYear, viewMonth, day);
    const iso = formatDate(d);
    setInputValue(iso);
    onChange?.(iso);
    setOpen(false);
  }

  function commitInput(raw) {
    const iso = normalizeToISO(raw);
    if (iso) {
      setInputValue(iso);
      onChange?.(iso);
    }
  }

  return (
    <div ref={ref} className="relative w-full">
      {/* Icono calendario */}
      <button
        type="button"
        className="absolute left-2 top-1.5 rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open calendar"
      >
        <CalendarIcon className="h-4 w-4" />
      </button>

      {/* Input editable */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={(e) => commitInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && commitInput(e.target.value)}
        className={`${INPUT_GHOST} pl-9 text-left rounded-xl`}
        placeholder={placeholder}
      />

      {open && (
        <div className="absolute z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 dark:border-white/10 dark:bg-[#0F141B]">
          {/* Header calendario */}
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-white/10">
            <button
              type="button"
              className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-white/5"
              onClick={() => {
                const m = new Date(viewYear, viewMonth - 1, 1);
                setViewYear(m.getFullYear());
                setViewMonth(m.getMonth());
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {monthLabel}
            </div>
            <button
              type="button"
              className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-white/5"
              onClick={() => {
                const m = new Date(viewYear, viewMonth + 1, 1);
                setViewYear(m.getFullYear());
                setViewMonth(m.getMonth());
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 px-3 pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((wd) => (
              <div key={wd}>{wd}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1 p-3 pt-1">
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysCount }).map((_, idx) => {
              const d = idx + 1;
              const dStr = formatDate(new Date(viewYear, viewMonth, d));
              const isSelected = selectedStr === dStr;
              const isToday = todayStr === dStr;
              return (
                <button
                  key={dStr}
                  type="button"
                  onClick={() => selectDay(d)}
                  className={`h-9 rounded-lg text-sm transition ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-slate-100 dark:hover:bg-white/5"
                  } ${isToday && !isSelected ? "ring-1 ring-indigo-400" : ""}`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* === Utilidades locales === */
function pad(n) {
  return n < 10 ? `0${n}` : String(n);
}
function formatDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseDate(s) {
  if (!s) return null;
  const mIso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (mIso) {
    const y = +mIso[1],
      mo = +mIso[2],
      d = +mIso[3];
    const dt = new Date(y, mo - 1, d);
    return isNaN(dt) ? null : dt;
  }
  return null;
}
function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}
function normalizeToISO(raw) {
  if (!raw) return "";
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    let [_, dd, mm, yyyy] = m;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return "";
}
