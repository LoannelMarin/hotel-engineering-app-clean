// frontend/src/components/TaskDetailModal.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User2,
  Tag,
  Hash,
  Landmark,
  Paperclip,
} from "lucide-react";

/**
 * API (igual que tu versión): <TaskDetailModal open task activity onClose />
 * - task: { title, description, image_url, status, priority, assignee, workstream, room, floor, due_date, created_at, updated_at, last_actor, last_activity_at }
 * - activity: [{ id, actor, action, created_at, changes }]
 *
 * Cambios clave:
 *  - En el fallback de POST comenta, enviar { body } (no { text }).
 */

export default function TaskDetailModal({
  open,
  task,
  activity = [],
  onClose,
  onEdit,
  onDelete,
  onChangeStatus,
  onPostComment, // opcional
}) {
  const [showActivity, setShowActivity] = useState(false);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !task) return null;

  const fmt = (v, withTime = true) => {
    if (!v) return "—";
    try {
      const d = new Date(v);
      return withTime
        ? d.toLocaleString(undefined, { hour12: false })
        : d.toLocaleDateString();
    } catch {
      return String(v);
    }
  };

  const meta = useMemo(
    () =>
      [
        { icon: User2, label: "Assignee", value: task.assignee },
        { icon: Tag, label: "Workstream", value: task.workstream },
        { icon: Hash, label: "Room", value: task.room },
        { icon: Landmark, label: "Floor", value: task.floor },
        { icon: CalendarIcon, label: "Due", value: fmt(task.due_date, false) },
        { icon: Clock, label: "Created", value: fmt(task.created_at) },
        { icon: Clock, label: "Updated", value: fmt(task.updated_at) },
      ].filter((m) => m.value && String(m.value).trim() !== ""),
    [task]
  );

  async function postCommentDefault(text) {
    // Fallback por si el padre no provee onPostComment
    const res = await fetch(`/api/tasks/${task.id}/comments`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: (text || "").trim() }), // <-- FIX
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`POST /api/tasks/${task.id}/comments -> ${res.status} ${t}`);
    }
    return true;
  }

  async function submitComment(e) {
    e?.preventDefault?.();
    const text = comment.trim();
    if (!text) return;
    try {
      setPosting(true);
      if (onPostComment) {
        await onPostComment(text);
      } else {
        await postCommentDefault(text);
      }
      setComment("");
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to post comment.");
    } finally {
      setPosting(false);
    }
  }

  // Botonera de acciones por status (idéntica lógica del board)
  const status = String(task?.status || "Not Started");
  function ActionBar() {
    const Btn = ({ tone = "slate", onClick, children }) => {
      const cls = {
        slate:
          "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800/50",
        indigo:
          "border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/30",
        purple:
          "border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-900 dark:text-purple-300 dark:hover:bg-purple-950/30",
        amber:
          "border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-300 dark:hover:bg-amber-950/30",
        emerald:
          "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30",
        rose:
          "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30",
      }[tone];
      return (
        <button
          onClick={onClick}
          className={
            "h-9 px-3 rounded-xl border inline-flex items-center gap-1.5 text-sm transition " +
            cls
          }
        >
          {children}
        </button>
      );
    };

    if (!onChangeStatus) return null;

    if (status === "Complete") {
      return null;
    }
    if (status === "Waiting for Approval") {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Btn tone="emerald" onClick={() => onChangeStatus("In Progress")}>
            Approved
          </Btn>
          <Btn tone="rose" onClick={() => onChangeStatus("Denied")}>
            Denied
          </Btn>
        </div>
      );
    }
    if (status === "Not Started" || status === "Paused") {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Btn tone="indigo" onClick={() => onChangeStatus("In Progress")}>
            Start
          </Btn>
        </div>
      );
    }
    // In Progress
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Btn tone="purple" onClick={() => onChangeStatus("Paused")}>
          Pause
        </Btn>
        <Btn tone="amber" onClick={() => onChangeStatus("Waiting for Approval")}>
          Waiting
        </Btn>
        <Btn tone="emerald" onClick={() => onChangeStatus("Complete")}>
          Complete
        </Btn>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          {/* Header */}
          <div className="relative border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-white p-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  {task.title || "Untitled task"}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px]">
                  <Badge tone="blue">{task.status || "—"}</Badge>
                  <Badge tone="rose">{task.priority || "—"}</Badge>
                  {task.last_actor && (
                    <span className="text-slate-500 dark:text-slate-400">
                      Last update by{" "}
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {task.last_actor}
                      </span>
                      {task.last_activity_at && <> • {fmt(task.last_activity_at)}</>}
                    </span>
                  )}
                </div>
              </div>

              {/* Switch Activity + Close */}
              <div className="flex items-center gap-3">
                <Switch
                  checked={showActivity}
                  onChange={setShowActivity}
                  label="Show activity"
                />
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-3 sm:p-6">
            {/* Left column */}
            <div className="space-y-4 sm:col-span-1">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                {task.image_url ? (
                  <img
                    src={task.image_url}
                    alt=""
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                    No cover
                  </div>
                )}
              </div>

              <Card title="At a glance">
                <div className="grid grid-cols-1 gap-2">
                  {meta.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <span className="text-[12px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {label}
                      </span>
                      <span className="truncate text-sm text-slate-900 dark:text-slate-100">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-4 sm:col-span-2">
              <Card title="Description">
                <p className="break-words whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
                  {task.description || "—"}
                </p>
              </Card>

              {/* Comments */}
              <Card title="Comments">
                <form onSubmit={submitComment} className="flex items-start gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 grid place-items-center font-semibold">
                    {(task.assignee || "A").toString().slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-2">
                    <textarea
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Write a note or comment…"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setComment("")}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Clear
                      </button>
                      <button
                        type="submit"
                        disabled={posting || !comment.trim()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        <Paperclip className="h-4 w-4" />
                        Post Note
                      </button>
                    </div>
                  </div>
                </form>
              </Card>

              {showActivity && (
                <Card title="Activity">
                  <ActivityList activity={activity} fmt={fmt} />
                </Card>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-3 dark:border-slate-800">
            <ActionBar />
            <div className="ml-auto flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit?.(task)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    const ok = window.confirm("Delete this task?");
                    if (ok) onDelete?.(task.id);
                  }}
                  className="rounded-lg border border-rose-300 px-3 py-2 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/40"
                >
                  Delete
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== Subcomponentes UI ===================== */

function Card({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Badge({ children, tone = "slate" }) {
  const map = {
    slate:
      "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700",
    blue:
      "bg-blue-100 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-700",
    rose:
      "bg-rose-100 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:ring-rose-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${map[tone]}`}
    >
      {children}
    </span>
  );
}

function Switch({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2">
      <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <span
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && onChange(!checked)
        }
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </span>
    </label>
  );
}

function ActivityList({ activity = [], fmt }) {
  if (!activity?.length)
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        No activity yet
      </div>
    );

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {activity.map((a) => (
        <li key={a.id} className="py-3">
          <div className="flex flex-wrap items-center gap-x-2 text-sm">
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {a.actor || "anonymous"}
            </span>
            <span className="text-slate-600 dark:text-slate-300">
              • {a.action}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              — {fmt(a.created_at)}
            </span>
          </div>

          {a?.changes && Object.keys(a.changes || {}).length > 0 && (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Object.entries(a.changes).map(([k, v]) => (
                <Change key={k} k={k} v={v} fmt={fmt} />
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function Change({ k, v, fmt }) {
  const fromVal =
    v && typeof v === "object" && ("old" in v || "new" in v) ? v.old : undefined;
  const toVal =
    v && typeof v === "object" && ("old" in v || "new" in v) ? v.new : v;

  const isDate = /date/i.test(k);
  const oldTxt = isDate ? fmt(fromVal) : fromVal ?? "—";
  const newTxt = isDate ? fmt(toVal) : toVal ?? "—";

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {k}
      </div>
      <div className="mt-1 flex flex-wrap gap-2 text-xs">
        <span className="line-through text-slate-500 dark:text-slate-400">
          {String(oldTxt)}
        </span>
        <span className="text-slate-800 dark:text-slate-100">
          {String(newTxt)}
        </span>
      </div>
    </div>
  );
}
