// frontend/src/components/TaskGantt.jsx
import React, { useMemo } from "react";

const DAY = 24 * 60 * 60 * 1000;
const CELL = 28;   // ancho por día (px)
const ROW_H = 56;  // alto por fila (px) para alinear la cuadrícula

function atMidnightLocal(d) {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}
function dayDiff(a, b) {
  return Math.max(0, Math.round((atMidnightLocal(b) - atMidnightLocal(a)) / DAY));
}
function colorFromSeed(seed) {
  let h = 0;
  const s = String(seed || "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 70% 50%)`;
}

export default function TaskGantt({ items = [] }) {
  const today = atMidnightLocal(new Date());
  const rangeStart = new Date(today);
  rangeStart.setDate(rangeStart.getDate() - 3);
  const totalDays = 35;

  const dates = useMemo(() => {
    const list = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(rangeStart);
      d.setDate(rangeStart.getDate() + i);
      list.push(d);
    }
    return list;
  }, [totalDays]);

  const gridTemplate = `240px repeat(${totalDays}, ${CELL}px)`;

  // Grid overlay (día/semana/mes + filas)
  const gridOverlayStyle = useMemo(
    () => ({
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      backgroundImage: `
        repeating-linear-gradient(
          to right,
          var(--grid-day, rgba(100,116,139,18)) 0 1px,
          transparent 1px ${CELL}px
        ),
        repeating-linear-gradient(
          to right,
          var(--grid-week, rgba(100,116,139,30)) 0 1.2px,
          transparent 1.2px ${CELL * 7}px
        ),
        repeating-linear-gradient(
          to right,
          var(--grid-month, rgba(100,116,139,55)) 0 1.6px,
          transparent 1.6px ${CELL * 30}px
        ),
        repeating-linear-gradient(
          to bottom,
          var(--grid-row, rgba(148,163,184,18)) 0 1px,
          transparent 1px ${ROW_H}px
        )
      `,
      backgroundRepeat: "repeat",
      backgroundPosition: "left top",
      backgroundSize: "auto 100%",
      zIndex: 1,
    }),
    []
  );

  return (
    <div className="bg-white dark:bg-slate-900 border dark:border-slate-700 rounded p-3">
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Header */}
          <div
            className="grid text-xs text-gray-600 dark:text-slate-300"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div className="px-2 py-1 font-medium text-slate-700 dark:text-slate-200">Task</div>
            {dates.map((d, i) => (
              <div
                key={i}
                className={`px-0 py-1 text-center ${
                  d.getDay() === 0 || d.getDay() === 6 ? "bg-gray-50 dark:bg-slate-800/60" : "bg-white dark:bg-slate-900"
                }`}
              >
                {d.getMonth() + 1}/{d.getDate()}
              </div>
            ))}
          </div>

          {/* Body + GRID OVERLAY */}
          <div className="relative">
            <div style={gridOverlayStyle} />

            {items.map((t) => {
              const start = t.created_at ? atMidnightLocal(new Date(t.created_at)) : atMidnightLocal(new Date());
              const end = t.due_date ? atMidnightLocal(new Date(t.due_date)) : new Date(start.getTime() + DAY);
              const leftDays = dayDiff(rangeStart, start);
              const widthDays = Math.max(1, dayDiff(start, end) + 1);
              const color = colorFromSeed(t.id ?? t.title);

              return (
                <div
                  key={t.id}
                  className="grid items-center border-t dark:border-slate-700"
                  style={{ gridTemplateColumns: gridTemplate, height: ROW_H }}
                >
                  <div className="px-2">
                    <div className="font-medium truncate text-slate-900 dark:text-slate-100">{t.title}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 truncate">
                      {(t.assignee || "Unassigned")} • {(t.workstream || "—")}
                    </div>
                  </div>

                  {/* Timeline cell (empieza en la 2ª columna) */}
                  <div className="relative h-full" style={{ gridColumn: "2 / -1" }}>
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-6 rounded border shadow-sm"
                      style={{
                        left: `${leftDays * CELL}px`,
                        width: `${widthDays * CELL}px`,
                        background: color,
                        borderColor: "rgba(0,0,0,25)",
                        opacity: 0.95,
                      }}
                      title={`${t.title}`}
                    />
                  </div>
                </div>
              );
            })}

            {items.length === 0 && (
              <div className="text-center text-gray-500 dark:text-slate-400 py-6 border-t dark:border-slate-700">
                No tasks to display.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
