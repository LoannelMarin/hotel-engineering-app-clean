import React, { useMemo } from "react";
import TaskCard from "./TaskCard";

const VISIBLE_STATUSES = [
  { key: "Not Started", color: "bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700", accent: "bg-gray-300 dark:bg-slate-500" },
  { key: "Paused", color: "bg-purple-50/40 dark:bg-purple-950/20 border-purple-200/60 dark:border-purple-900/40", accent: "bg-purple-400 dark:bg-purple-500" },
  { key: "In Progress", color: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900", accent: "bg-indigo-400 dark:bg-indigo-500" },
  { key: "Waiting for Approval", color: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900", accent: "bg-amber-400 dark:bg-amber-500" },
];

function groupByStatus(items = []) {
  const g = {};
  for (const it of items) {
    const k = it.status || "Not Started";
    if (!g[k]) g[k] = [];
    g[k].push(it);
  }
  return g;
}

export default function KanbanBoard({ items = [], onMove, onEdit, onDelete, onQuickUpdate, onOpen }) {
  const grouped = useMemo(() => groupByStatus(items), [items]);

  const handleDrop = (e, status) => {
    const id = e.dataTransfer.getData("text/id");
    if (!id) return;
    const card = items.find((t) => String(t.id) === String(id));
    if (card && card.status !== status) onMove?.(card, status);
  };

  const changeStatus = (id, next) => onQuickUpdate?.(id, { status: next });

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
      {VISIBLE_STATUSES.map((col) => (
        <div
          key={col.key}
          className={`rounded border ${col.color} p-2 min-h-[300px]`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, col.key)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded ${col.accent}`} />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{col.key}</h3>
            </div>
            <span className="text-xs text-gray-500 dark:text-slate-400">{grouped[col.key]?.length || 0}</span>
          </div>

          <div className="space-y-2">
            {(grouped[col.key] || []).map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/id", String(t.id))}
                onEdit={() => onEdit?.(t)}
                onDelete={() => onDelete?.(t.id)}
                onOpen={onOpen}
                onChangeStatus={(next) => changeStatus(t.id, next)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
