// frontend/src/components/TaskCard.jsx
import React from "react";
import {
  CheckCircle2, User2, CalendarClock, Tag, MapPin,
  Play, Pause, Hourglass, ThumbsUp, ThumbsDown
} from "lucide-react";

/* ---------- Botón compacto "ghost/outline" con tonos ---------- */
function Btn({ tone = "slate", icon: Icon, children, className = "", ...props }) {
  const tones = {
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
  };
  const toneCls = tones[tone] || tones.slate;

  return (
    <button
      {...props}
      className={
        "h-8 px-2.5 rounded-xl border inline-flex items-center gap-1.5 text-xs sm:text-sm transition " +
        toneCls +
        " " +
        className
      }
    >
      {Icon ? <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : null}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}

export default function TaskCard({
  task,
  draggable,
  onDragStart,
  onEdit,
  onDelete,
  onOpen,
  onChangeStatus,
}) {
  const due = task?.due_date ? new Date(task.due_date) : null;
  const lastAt = task?.last_activity_at ? new Date(task.last_activity_at) : null;
  const status = String(task?.status || "Not Started");

  const handleDragStart = (e) => {
    e.currentTarget.classList.add("opacity-60", "ring-2", "ring-indigo-500/60", "scale-[.98]");
    onDragStart?.(e);
  };
  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove("opacity-60", "ring-2", "ring-indigo-500/60", "scale-[.98]");
  };

  const stop = (e, fn) => {
    e.stopPropagation();
    e.preventDefault();
    fn && fn(e);
  };

  const locationLabel = task?.room || task?.area || task?.floor || "";
  const title = task?.title || "Untitled";

  /* ---------- Barras de acciones ---------- */
  const ActionBar = () => {
    if (status === "Complete") return null;

    if (status === "Waiting for Approval") {
      return (
        <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-1.5">
          <Btn
            tone="emerald"
            icon={ThumbsUp}
            onClick={(e) => stop(e, () => onChangeStatus?.("In Progress"))}
          >
            Approved
          </Btn>
          <Btn
            tone="rose"
            icon={ThumbsDown}
            onClick={(e) => stop(e, () => onChangeStatus?.("Denied"))}
          >
            Denied
          </Btn>
        </div>
      );
    }

    if (status === "Not Started" || status === "Paused") {
      return (
        <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-1.5">
          <Btn
            tone="indigo"
            icon={Play}
            onClick={(e) => stop(e, () => onChangeStatus?.("In Progress"))}
          >
            Start
          </Btn>
        </div>
      );
    }

    return (
      <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-1.5">
        <Btn
          tone="purple"
          icon={Pause}
          onClick={(e) => stop(e, () => onChangeStatus?.("Paused"))}
        >
          Pause
        </Btn>
        <Btn
          tone="amber"
          icon={Hourglass}
          onClick={(e) => stop(e, () => onChangeStatus?.("Waiting for Approval"))}
        >
          Waiting
        </Btn>
        <Btn
          tone="emerald"
          icon={CheckCircle2}
          onClick={(e) => stop(e, () => onChangeStatus?.("Complete"))}
        >
          Complete
        </Btn>
      </div>
    );
  };

  return (
    <div
      className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 
                 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition cursor-pointer 
                 w-full max-w-full sm:max-w-none"
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onOpen && onOpen(task)}
      role="button"
      tabIndex={0}
    >
      {/* Imagen / status chip */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-gray-100 dark:bg-slate-800">
        {task.image_url && (
          <img
            src={task.image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        )}
        <div className="absolute top-2 left-2 text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
          {status}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-2 sm:p-3 md:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
              {locationLabel ? (
                <>
                  <span className="mr-1">{locationLabel}</span>
                  {title}
                </>
              ) : (
                title
              )}
            </div>
            <div className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
              {task.description || "—"}
            </div>
          </div>
          <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 shrink-0">
            {task.priority || "Medium"}
          </span>
        </div>

        {/* Meta info */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
          {task.workstream && (
            <span className="inline-flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> {task.workstream}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <User2 className="w-3.5 h-3.5" /> {task.assignee || "Unassigned"}
          </span>
          {due && (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="w-3.5 h-3.5" />
              {due.toLocaleDateString()}
            </span>
          )}
          {(task.room || task.floor || task.area) && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {task.room || task.area || "—"}
              {task.floor ? ` · ${task.floor}` : ""}
            </span>
          )}
        </div>

        {/* Fecha / usuario */}
        <div className="mt-2 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
          {task.last_actor ? (
            <>
              Last update by <span className="font-medium">{task.last_actor}</span>
              {lastAt ? ` — ${lastAt.toLocaleString(undefined, { hour12: false })}` : ""}
            </>
          ) : (
            <>
              Created{" "}
              {task.created_at
                ? new Date(task.created_at).toLocaleString(undefined, { hour12: false })
                : ""}
            </>
          )}
        </div>

        <ActionBar />
      </div>
    </div>
  );
}
