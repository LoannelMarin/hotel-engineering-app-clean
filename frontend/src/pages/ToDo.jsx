// frontend/src/pages/ToDo.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import KanbanBoard from "../components/KanbanBoard";
import TaskTable from "../components/TaskTable";
import TaskGantt from "../components/TaskGantt";
import TaskModal from "../components/TaskModal";
import TaskDetailModal from "../components/TaskDetailModal";
import * as apiModule from "../api/client";
import {
  ListTree,
  Columns,
  Table2,
  CalendarDays,
  Plus,
  Filter,
  ChevronDown,
} from "lucide-react";
import { fetchWithAuth } from "../utils/api";

const VIEWS = [
  { key: "kanban", label: "Board", icon: Columns },
  { key: "table", label: "Table", icon: Table2 },
  { key: "gantt", label: "Gantt", icon: CalendarDays },
];

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  window.location.origin.replace(":5173", ":5000");

function withQuery(url, params) {
  if (!params) return url;
  const qs = new URLSearchParams(
    Object.entries(params).filter(
      ([_, v]) => v !== undefined && v !== null && v !== ""
    )
  ).toString();
  return qs ? `${url}?${qs}` : url;
}

function pickClient(mod) {
  return mod?.api || mod?.default || mod?.client || mod?.request || mod?.fetcher || null;
}
function absolutize(u) {
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return `${API_BASE}${u}`;
  return `${API_BASE}/${u.replace(/^\/+/, "")}`;
}
function buildHttp() {
  const candidate = pickClient(apiModule);
  if (candidate && typeof candidate.get === "function") {
    return {
      get: (url, opts) => candidate.get(absolutize(url), opts),
      post: (url, data, opts) => candidate.post(absolutize(url), data, opts),
      put: (url, data, opts) => candidate.put(absolutize(url), data, opts),
      delete: (url, opts) => candidate.delete(absolutize(url), opts),
    };
  }

  async function fx(url, options) {
    const res = await fetch(absolutize(url), {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options && options.headers ? options.headers : {}),
      },
    });
    const ct = res.headers.get("content-type") || "";
    const isJSON = ct.includes("application/json");
    if (!res.ok) {
      const body = isJSON
        ? await res.json().catch(() => ({}))
        : await res.text().catch(() => "");
      throw new Error(
        `HTTP ${res.status} ${res.statusText} ${
          isJSON ? JSON.stringify(body) : body
        }`
      );
    }
    return isJSON ? res.json() : res.text();
  }

  return {
    get: (url, { params } = {}) => fx(withQuery(url, params), { method: "GET" }),
    post: (url, data) => fx(url, { method: "POST", body: JSON.stringify(data) }),
    put: (url, data) => fx(url, { method: "PUT", body: JSON.stringify(data) }),
    delete: (url) => fx(url, { method: "DELETE" }),
  };
}
const http = buildHttp();

/* ========================= PÁGINA ========================= */
export default function ToDo() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [view, setView] = useState("kanban");
  const [filters, setFilters] = useState({
    q: "",
    assignee: "",
    workstream: "",
    status: "",
    priority: "",
  });
  const [editing, setEditing] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTask, setDetailTask] = useState(null);
  const [activity, setActivity] = useState([]);

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = () =>
    http
      .get("/api/tasks/")
      .then((res) => {
        const list = res?.items || (Array.isArray(res) ? res : []);
        setItems(list);
      })
      .catch((e) => {
        console.error("GET /api/tasks/ failed:", e);
        setItems([]);
      });

  const add = async () => {
    if (!title.trim()) return;
    await http
      .post("/api/tasks/", {
        title,
        status: "Not Started",
        priority: "Medium",
      })
      .catch((e) => console.error("POST /api/tasks/ failed:", e));
    setTitle("");
    load();
  };

  const onMove = async (card, status) => {
    await http.put(`/api/tasks/${card.id}`, { status }).catch((e) => console.error(e));
    load();
  };

  const onSave = async (payload) => {
    if (editing?.id) {
      await http.put(`/api/tasks/${editing.id}`, payload).catch((e) => console.error(e));
    } else {
      await http.post("/api/tasks/", payload).catch((e) => console.error(e));
    }
    setOpenModal(false);
    setEditing(null);
    load();
  };

  const onDelete = async (id) => {
    await http.delete(`/api/tasks/${id}`).catch((e) => console.error(e));
    load();
  };

  const onQuickUpdate = async (id, partial) => {
    await http.put(`/api/tasks/${id}`, partial).catch((e) => console.error(e));
    load();
  };

  const openDetails = async (t) => {
    setDetailTask(t);
    setDetailOpen(true);
    try {
      const res = await http.get(`/api/tasks/${t.id}/activity`);
      setActivity(res.items || (Array.isArray(res) ? res : []));
    } catch {
      setActivity([]);
    }
  };

  const filtered = useMemo(() => {
    const { q, assignee, workstream, status, priority } = filters;
    return (items || []).filter((t) => {
      const text = `${t.title} ${t.description || ""} ${t.assignee || ""} ${t.workstream || ""}`.toLowerCase();
      if (q && !text.includes(q.toLowerCase())) return false;
      if (assignee && (t.assignee || "") !== assignee) return false;
      if (workstream && (t.workstream || "") !== workstream) return false;
      if (status && (t.status || "") !== status) return false;
      if (priority && (t.priority || "") !== priority) return false;
      return true;
    });
  }, [items, filters]);

  const assignees = useMemo(() => {
    const set = new Set();
    items.forEach((t) => t.assignee && set.add(t.assignee));
    return Array.from(set);
  }, [items]);

  const workstreams = useMemo(() => {
    const set = new Set();
    items.forEach((t) => t.workstream && set.add(t.workstream));
    return Array.from(set);
  }, [items]);

  return (
    <div className="space-y-3 px-2 sm:px-4">
      {/* --------- Barra superior --------- */}
      <div className="bg-white/5 dark:bg-slate-900/60 border border-slate-700 rounded-2xl px-3 sm:px-4 py-2 flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <ListTree className="w-5 h-5 text-gray-400" />
          <h1 className="text-base sm:text-lg font-semibold">To Do</h1>
        </div>

        {/* Selector de vista */}
        <div className="ml-0 sm:ml-2">
          <CompactSelect
            value={view}
            onChange={setView}
            options={VIEWS.map((v) => ({ value: v.key, label: v.label }))}
          />
        </div>

        {/* Botón Work Order */}
        <button
          onClick={() => {
            setEditing(null);
            setOpenModal(true);
          }}
          className="inline-flex items-center gap-2 h-9 rounded-2xl border border-slate-600 px-3 hover:bg-white/5 text-sm sm:text-base"
        >
          <Plus className="w-5 h-5" />
          <span>Work Order</span>
        </button>

        {/* Records */}
        <a
          href="/todo/records"
          className="inline-flex items-center gap-2 h-9 rounded-2xl border border-slate-600 px-3 hover:bg-white/5 text-sm sm:text-base"
        >
          Records
        </a>

        {/* Filtro */}
        <button
          className="ml-auto inline-flex items-center justify-center h-9 w-10 rounded-2xl border border-slate-600 hover:bg-white/5"
          onClick={() => setShowFilters((v) => !v)}
          title="Filters"
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* --------- Filtros --------- */}
      {showFilters && (
        <div className="bg-white/5 dark:bg-slate-900/60 border border-slate-700 rounded-2xl px-3 sm:px-4 py-3 grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <input
            placeholder="Search..."
            className="border border-slate-600 bg-transparent rounded-2xl px-3 py-2 min-w-0"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
          <select
            className="border border-slate-600 bg-transparent rounded-2xl px-3 py-2"
            value={filters.assignee}
            onChange={(e) => setFilters((f) => ({ ...f, assignee: e.target.value }))}
          >
            <option value="">All assignees</option>
            {assignees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            className="border border-slate-600 bg-transparent rounded-2xl px-3 py-2"
            value={filters.workstream}
            onChange={(e) => setFilters((f) => ({ ...f, workstream: e.target.value }))}
          >
            <option value="">All workstreams</option>
            {workstreams.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
          <select
            className="border border-slate-600 bg-transparent rounded-2xl px-3 py-2"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">All status</option>
            <option>Not Started</option>
            <option>Paused</option>
            <option>In Progress</option>
            <option>Waiting for Approval</option>
            <option>Denied</option>
            <option>Complete</option>
          </select>
          <select
            className="border border-slate-600 bg-transparent rounded-2xl px-3 py-2"
            value={filters.priority}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
          >
            <option value="">All priority</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>
      )}

      {/* --------- Contenido --------- */}
      <div className="px-1 sm:px-2 lg:px-4">
        {view === "kanban" && (
          <KanbanBoard
            items={filtered}
            onMove={onMove}
            onEdit={(t) => {
              setEditing(t);
              setOpenModal(true);
            }}
            onDelete={onDelete}
            onQuickUpdate={onQuickUpdate}
            onOpen={openDetails}
          />
        )}

        {view === "table" && (
          <TaskTable
            items={filtered}
            onEdit={(t) => {
              setEditing(t);
              setOpenModal(true);
            }}
            onDelete={onDelete}
            onQuickUpdate={onQuickUpdate}
            onOpen={openDetails}
          />
        )}

        {view === "gantt" && <TaskGantt items={filtered} />}
      </div>

      {/* --------- Modales --------- */}
      {openModal && (
        <TaskModal
          open={openModal}
          initial={editing}
          onClose={() => {
            setOpenModal(false);
            setEditing(null);
          }}
          onSave={onSave}
        />
      )}

      {detailOpen && (
        <TaskDetailModal
          open={detailOpen}
          task={detailTask}
          activity={activity}
          onClose={() => {
            setDetailOpen(false);
            setDetailTask(null);
            setActivity([]);
          }}
          onChangeStatus={(next) => {
            if (!detailTask) return;
            http.put(`/api/tasks/${detailTask.id}`, { status: next }).catch(console.error);
            setDetailTask((t) => ({ ...t, status: next }));
            setItems((prev) =>
              prev.map((it) => (it.id === detailTask.id ? { ...it, status: next } : it))
            );
          }}
          onEdit={(t) => {
            setDetailOpen(false);
            setEditing(t);
            setOpenModal(true);
          }}
          onDelete={async (id) => {
            await onDelete(id);
            setDetailOpen(false);
            setDetailTask(null);
          }}
          onPostComment={async (text) => {
            if (!detailTask?.id) return;
            await fetchWithAuth(`/api/tasks/${detailTask.id}/comments`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ body: (text || "").trim() }),
            });
            try {
              const res = await http.get(`/api/tasks/${detailTask.id}/activity`);
              setActivity(res.items || (Array.isArray(res) ? res : []));
            } catch {
              /* no-op */
            }
          }}
        />
      )}
    </div>
  );
}

/* ======= Selector compacto ======= */
function CompactSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function onKey(e) {
    if (e.key === "Escape") setOpen(false);
    if ((e.key === "Enter" || e.key === " ") && !open) {
      e.preventDefault();
      setOpen(true);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKey}
        className="inline-flex items-center gap-2 h-9 rounded-2xl border border-slate-600 px-3 hover:bg-white/5 text-sm sm:text-base"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {current?.label || "Select"}
        <ChevronDown
          className={"w-4 h-4 transition-transform " + (open ? "rotate-180" : "")}
        />
      </button>

      {open && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur shadow-xl"
        >
          <ul className="py-1 text-sm text-slate-200">
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={
                      "w-full text-left px-3 py-2 transition " +
                      (active
                        ? "bg-indigo-600 text-white"
                        : "hover:bg-slate-800")
                    }
                    role="option"
                    aria-selected={active}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
