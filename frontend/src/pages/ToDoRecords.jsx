import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Pencil, Trash2, ChevronDown, Check } from "lucide-react";

/* ---------- helpers de estilo ---------- */

const statusTone = {
  "Not Started":
    "bg-slate-200 text-slate-700 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700",
  "In Progress":
    "bg-sky-200 text-sky-900 ring-1 ring-sky-300 dark:bg-sky-900/50 dark:text-sky-200 dark:ring-sky-800",
  "Waiting for Approval":
    "bg-amber-200 text-amber-900 ring-1 ring-amber-300 dark:bg-amber-900/50 dark:text-amber-200 dark:ring-amber-800",
  Complete:
    "bg-emerald-200 text-emerald-900 ring-1 ring-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200 dark:ring-emerald-800",
  Paused:
    "bg-purple-200 text-purple-900 ring-1 ring-purple-300 dark:bg-purple-900/50 dark:text-purple-200 dark:ring-purple-800",
  Denied:
    "bg-rose-200 text-rose-900 ring-1 ring-rose-300 dark:bg-rose-900/50 dark:text-rose-200 dark:ring-rose-800",
};

const STATUS_OPTIONS = [
  "Not Started",
  "Paused",
  "In Progress",
  "Waiting for Approval",
  "Denied",
  "Complete",
];

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return String(d);
  }
}

/* ---------- Dropdown con portal (no se recorta) ---------- */

function StatusDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, minWidth: 180 });

  const selected = STATUS_OPTIONS.includes(value) ? value : "Not Started";
  const badgeCls =
    statusTone[selected] ||
    "bg-slate-200 text-slate-700 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700";

  const placeMenu = () => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const w = Math.max(180, r.width + 16);
    let left = r.left;
    let top = r.bottom + 6;
    const maxLeft = window.innerWidth - w - 8;
    if (left > maxLeft) left = maxLeft;
    const menuH = 260;
    if (top + menuH > window.innerHeight) top = Math.max(8, r.top - menuH - 6);
    setPos({ top, left, minWidth: w });
  };

  useLayoutEffect(() => {
    if (open) placeMenu();
  }, [open]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      const m = menuRef.current;
      const b = btnRef.current;
      if (!m || !b) return;
      if (!m.contains(e.target) && !b.contains(e.target)) setOpen(false);
    };
    const onScroll = () => open && placeMenu();
    const onResize = () => open && placeMenu();
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  function toggle(e) {
    e.stopPropagation();
    setOpen((o) => !o);
  }
  function choose(e, v) {
    e.stopPropagation();
    onChange?.(v);
    setOpen(false);
  }
  function onKeyDown(e) {
    if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
      e.preventDefault();
      setOpen(true);
      setHighlight(0);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, STATUS_OPTIONS.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const v = STATUS_OPTIONS[highlight];
      if (v) onChange?.(v);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        onKeyDown={onKeyDown}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs ${badgeCls} hover:brightness-[.97]`}
      >
        <span className="truncate">{selected}</span>
        <ChevronDown
          className={
            "h-4 w-4 opacity-70 transition-transform " +
            (open ? "rotate-180" : "")
          }
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: `${pos.top}px`,
              left: `${pos.left}px`,
              minWidth: `${pos.minWidth}px`,
              zIndex: 9999,
            }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[260px] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900"
          >
            <ul className="py-1">
              {STATUS_OPTIONS.map((opt, idx) => {
                const active = highlight === idx;
                const isSel = opt === selected;
                return (
                  <li key={opt}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSel}
                      onMouseEnter={() => setHighlight(idx)}
                      onClick={(e) => choose(e, opt)}
                      className={
                        "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors " +
                        (active
                          ? "bg-indigo-50 text-slate-900 dark:bg-slate-800"
                          : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60")
                      }
                    >
                      <span className="truncate">{opt}</span>
                      {isSel && <Check className="h-4 w-4 text-indigo-600" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body
        )}
    </>
  );
}

/* ---------- Tabla ---------- */

export default function TaskTable({
  items = [],
  onEdit,
  onDelete,
  onQuickUpdate,
  onOpen,
}) {
  const [hoverId, setHoverId] = useState(null);

  return (
    <div className="rounded-2xl border border-slate-400/60 dark:border-slate-700/80 bg-white dark:bg-slate-900">
      {/* ✅ Responsive scroll horizontal */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <tbody className="divide-y divide-slate-300/60 dark:divide-slate-700/70">
            {items.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-slate-600 dark:text-slate-300">
                  No tasks to display.
                </td>
              </tr>
            )}

            {items.map((t, idx) => {
              const striped =
                (idx % 2 === 0
                  ? "bg-slate-50/70 dark:bg-slate-900/40"
                  : "bg-white dark:bg-slate-900") +
                " hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors";
              const openRow = () => onOpen && onOpen(t);

              return (
                <tr
                  key={t.id}
                  className={striped + " cursor-pointer"}
                  onMouseEnter={() => setHoverId(t.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={openRow}
                  onKeyDown={(e) => e.key === "Enter" && openRow()}
                  tabIndex={0}
                >
                  {/* Room */}
                  <td className="w-16 px-4 py-3 align-middle text-[12px] font-medium text-slate-500 dark:text-slate-400">
                    {t.room || "—"}
                  </td>

                  {/* Workstream + título + desc */}
                  <td className="px-2 py-3 align-middle">
                    <div className="flex flex-col">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {t.workstream ? (
                          <>
                            <span className="font-semibold">
                              {t.workstream}
                            </span>
                            {t.title ? (
                              <>
                                {" "}
                                <span className="font-normal text-slate-600 dark:text-slate-300">
                                  {t.title}
                                </span>
                              </>
                            ) : null}
                          </>
                        ) : (
                          t.title || "—"
                        )}
                      </div>
                      {t.description && (
                        <div className="mt-0.5 line-clamp-1 text-[13px] text-slate-600 dark:text-slate-300/90">
                          {t.description}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Assigned to */}
                  <td className="px-3 py-3 align-middle text-slate-600 dark:text-slate-300 hidden md:table-cell">
                    <span className="text-[13px]">
                      Assigned to{" "}
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {t.assignee || "—"}
                      </span>
                    </span>
                  </td>

                  {/* Status */}
                  <td
                    className="px-3 py-3 align-middle whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <StatusDropdown
                      value={t.status || "Not Started"}
                      onChange={(v) =>
                        onQuickUpdate && onQuickUpdate(t.id, { status: v })
                      }
                    />
                  </td>

                  {/* Due date */}
                  <td className="px-3 py-3 align-middle text-right text-[13px] text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                    {fmtDate(t.due_date)}
                  </td>

                  {/* Acciones */}
                  <td className="px-3 py-3 align-middle text-right">
                    <div
                      className={
                        "inline-flex items-center gap-1 transition-opacity " +
                        (hoverId === t.id ? "opacity-100" : "opacity-0")
                      }
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          onQuickUpdate &&
                          onQuickUpdate(t.id, { status: "Complete" })
                        }
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                        title="Mark complete"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEdit && onEdit(t)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800/70"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete && onDelete(t.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
