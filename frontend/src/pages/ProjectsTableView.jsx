import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../utils/api";
import { Plus, ClipboardList } from "lucide-react";
import PageWithToolbar from "../layout/PageWithToolbar";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";

/* ---------------- Modal para crear proyecto ---------------- */
function NewProjectModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    try {
      setSaving(true);
      const res = await fetchWithAuth("/api/projects/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      onCreated?.(res);
      setName("");
      onClose();
    } catch (err) {
      console.error("Error creating project:", err);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[var(--surface-1)] text-[var(--text-1)] rounded-2xl shadow-xl w-full max-w-sm p-6 border border-[var(--border-1)]"
      >
        <h2 className="text-lg font-semibold mb-4 text-center">New Project</h2>
        <input
          type="text"
          placeholder="Enter project name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 mb-4 rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[#0B5150]"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-sm bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border-1)]"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-white bg-[#0B5150] hover:bg-[#0e6664] transition disabled:opacity-70"
          >
            {saving ? "Saving..." : "Create"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------- Vista principal ---------------- */
export default function ProjectsTableView() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  /* --- Cargar proyectos --- */
  async function loadProjects() {
    try {
      setLoading(true);
      const res = await fetchWithAuth("/api/projects/");
      setProjects(res?.items || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  /* --- Filtro de búsqueda --- */
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return projects;
    return projects.filter(
      (p) =>
        String(p.name || "").toLowerCase().includes(t) ||
        String(p.status || "").toLowerCase().includes(t) ||
        String(p.completed_by || "").toLowerCase().includes(t)
    );
  }, [projects, q]);

  /* --- Exportar a Excel --- */
  function handleExportExcel() {
    if (!projects || projects.length === 0) {
      alert("No projects to export.");
      return;
    }

    const data = projects.map((p) => ({
      ID: p.id,
      Name: p.name,
      Status: p.status || "In Progress",
      "Completed By": p.completed_by || "",
      "Completed At": p.completed_at || "",
      "Created At": p.created_at || "",
      "Updated At": p.updated_at || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Projects");
    const filename = `Projects_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  /* --- Abrir resumen --- */
  function openSummary(projectId) {
    navigate(`/projects/summary?id=${projectId}`);
  }

  /* --- Toolbar --- */
  const toolbarProps = {
    value: q,
    onChange: setQ,
    onAdd: () => setShowModal(true),
    onExport: handleExportExcel,
    extraButtons: [
      {
        label: "Go to Summary",
        icon: ClipboardList,
        onClick: () => navigate("/projects/summary"),
      },
    ],
  };

  const TH =
    "px-4 sm:px-5 py-3 text-sm font-medium border-b border-zinc-800 text-left text-zinc-300 bg-zinc-900 sticky top-0 select-none";
  const TD =
    "px-4 sm:px-5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 text-sm text-zinc-800 dark:text-zinc-200";

  return (
    <>
      <PageWithToolbar toolbarProps={toolbarProps} hidePrint>
        {/* ✅ Responsive: scroll horizontal si no cabe la tabla */}
        <div className="relative flex-1 h-[calc(100vh-6rem)] overflow-y-auto overflow-x-auto">
          <table className="w-full min-w-[700px] text-[15px] leading-6 border-separate [border-spacing:0]">
            <thead>
              <tr>
                <th className={TH}>Name</th>
                <th className={TH}>Status</th>
                <th className={TH}>Completed By</th>
                <th className={TH}>Completed At</th>
                <th className={TH}>Created</th>
                <th className={TH}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8 text-zinc-500 dark:text-zinc-400"
                  >
                    Loading projects…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8 text-rose-600 dark:text-rose-400"
                  >
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8 text-zinc-500 dark:text-zinc-400"
                  >
                    No projects found.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="bg-transparent hover:bg-zinc-50 dark:hover:bg-[#1a1a1a] transition"
                  >
                    <td className={TD}>{p.name}</td>
                    <td className={TD}>
                      <StatusPill value={p.status} />
                    </td>
                    <td className={TD}>{p.completed_by || "—"}</td>
                    <td className={TD}>
                      {p.completed_at
                        ? new Date(p.completed_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className={TD}>
                      {p.created_at
                        ? new Date(p.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className={TD + " text-center"}>
                      <button
                        onClick={() => openSummary(p.id)}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border border-[#0B5150]/40 text-[#0B5150] hover:bg-[#0B5150]/10 dark:border-[#0B5150]/60 dark:text-[#5ad5d3] dark:hover:bg-[#0B5150]/20"
                      >
                        Open Summary
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </PageWithToolbar>

      <AnimatePresence>
        {showModal && (
          <NewProjectModal
            open
            onClose={() => setShowModal(false)}
            onCreated={() => {
              setShowModal(false);
              loadProjects();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------- Status Pill ---------- */
function StatusPill({ value }) {
  const v = String(value || "").toLowerCase();
  const styles = {
    completed:
      "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-800",
    "in progress":
      "bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-800",
    reopened:
      "bg-blue-100 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-800",
    default:
      "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700",
  };
  const cls = styles[v] || styles.default;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}
    >
      {value || "—"}
    </span>
  );
}
