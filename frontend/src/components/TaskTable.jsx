import React from "react";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";

/* ===== util ===== */
function rowTintByStatus(status = "") {
  switch (status) {
    case "In Progress":
      return "bg-sky-100 dark:bg-sky-900/50 hover:bg-sky-200 dark:hover:bg-sky-900/60";
    case "Waiting for Approval":
      return "bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-900/60";
    case "Complete":
      return "bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-900/60";
    case "Not Started":
    default:
      return "bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800/70";
  }
}

function StatusPill({ value }) {
  const map = {
    "Not Started": "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
    "In Progress": "bg-sky-200 text-sky-900 dark:bg-sky-800 dark:text-sky-100",
    "Waiting for Approval": "bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100",
    "Paused": "bg-purple-200 text-purple-900 dark:bg-purple-900/60 dark:text-purple-100",
    "Denied": "bg-rose-200 text-rose-900 dark:bg-rose-900/60 dark:text-rose-100",
    "Complete": "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[value] || map["Not Started"]}`}>
      {value || "—"}
    </span>
  );
}

/* ===== component ===== */
export default function TaskTable({ items = [], onEdit, onDelete, onQuickUpdate, onOpen }) {
  return (
    <div className="bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            <tr>
              <th className="text-left px-4 py-2 w-[90px]">Room</th>
              <th className="text-left px-4 py-2">Title</th>
              <th className="text-left px-4 py-2">Assignee</th>
              <th className="text-left px-4 py-2">Workstream</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Priority</th>
              <th className="text-left px-4 py-2">Due</th>
              <th className="text-left px-4 py-2 w-[120px]">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200/80 dark:divide-slate-700/80">
            {items.map((t) => (
              <tr
                key={t.id}
                className={`text-slate-900 dark:text-slate-100 transition-colors cursor-pointer ${rowTintByStatus(t.status)}`}
                onClick={() => onOpen && onOpen(t)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onOpen && onOpen(t)}
              >
                <td className="px-4 py-2">{t.room || "—"}</td>

                <td className="px-4 py-2">
                  <div className="font-semibold">{t.title || "—"}</div>
                  <div className="text-xs text-slate-700/80 dark:text-slate-200/80 line-clamp-1">
                    {t.description || "—"}
                  </div>
                </td>

                <td className="px-4 py-2">{t.assignee || "—"}</td>
                <td className="px-4 py-2">{t.workstream || "—"}</td>

                {/* === Status: sin dropdown, solo “pill” === */}
                <td className="px-4 py-2">
                  <StatusPill value={t.status} />
                </td>

                {/* Priority (dejamos tal cual, dropdown rápido útil) */}
                <td className="px-4 py-2">
                  <select
                    className="bg-white/80 dark:bg-black/20 border border-gray-300/70 dark:border-slate-600 rounded-2xl px-2 py-1"
                    value={t.priority}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onQuickUpdate && onQuickUpdate(t.id, { priority: e.target.value })}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </td>

                <td className="px-4 py-2">
                  {t.due_date ? new Date(t.due_date).toLocaleDateString() : "—"}
                </td>

                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onQuickUpdate && onQuickUpdate(t.id, { status: "Complete" }); }}
                      className="px-2 py-1 rounded-2xl border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200/70 dark:hover:bg-emerald-800/60"
                      title="Mark complete"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit && onEdit(t); }}
                      className="px-2 py-1 rounded-2xl border border-gray-300 dark:border-slate-600 hover:bg-white/60 dark:hover:bg-white/10"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete && onDelete(t.id); }}
                      className="px-2 py-1 rounded-2xl border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 hover:bg-rose-200/70 dark:hover:bg-rose-900/60"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-600 dark:text-slate-300/90">
                  No tasks to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
