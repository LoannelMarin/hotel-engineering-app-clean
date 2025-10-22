// src/pages/Projects.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Plus } from "lucide-react";
import ProjectsGrid from "../components/projects/ProjectsGrid";
import { fetchWithAuth } from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";

/* ---------------- Constantes ---------------- */
const BTN_TOGGLE =
  "px-4 py-1.5 border text-sm font-medium rounded-lg transition select-none";
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-white bg-[#0B5150] hover:bg-[#0e6664] active:scale-[.98] transition";

const LS_VIEW = "he.projects.view";
const LS_SELECTED_1 = "he.projects.selected1";
const LS_SELECTED_2 = "he.projects.selected2";
const API_BASE = "/api/projects";

/* ---------------- Modal para crear proyecto ---------------- */
function NewProjectModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    try {
      setSaving(true);
      const res = await fetchWithAuth(`${API_BASE}/`, {
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
            className={`${BTN_PRIMARY} disabled:opacity-70`}
          >
            {saving ? "Saving..." : "Create"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------- Página principal ---------------- */
export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [columns, setColumns] = useState(
    Number(localStorage.getItem(LS_VIEW)) || 1
  );
  const [selected1, setSelected1] = useState(
    Number(localStorage.getItem(LS_SELECTED_1)) || ""
  );
  const [selected2, setSelected2] = useState(
    Number(localStorage.getItem(LS_SELECTED_2)) || ""
  );
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const viewOptions = useMemo(
    () => [
      { label: "Single", value: 1 },
      { label: "Dual", value: 2 },
    ],
    []
  );

  /* ---------------- Cargar proyectos + 🔁 Polling ---------------- */
  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      try {
        const res = await fetchWithAuth(`${API_BASE}/`);
        if (!isMounted) return;

        setProjects((prev) => {
          const map = new Map(prev.map((p) => [p.id, p]));
          for (const newP of res.items || []) {
            const old = map.get(newP.id) || {};
            map.set(newP.id, {
              ...old,
              ...newP,
              color_legend:
                Object.keys(newP.color_legend || {}).length > 0
                  ? newP.color_legend
                  : old.color_legend,
            });
          }
          return Array.from(map.values());
        });
      } catch (err) {
        console.error("Error loading projects:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
    const interval = setInterval(loadProjects, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  /* ---------------- Handlers ---------------- */
  function handleNewProjectCreated(p) {
    setProjects((prev) => [...prev, p]);
  }

  function handleDeleteProject(id) {
    if (!window.confirm("Delete this project?")) return;
    fetchWithAuth(`${API_BASE}/${id}`, { method: "DELETE" })
      .then(() => setProjects((prev) => prev.filter((p) => p.id !== id)))
      .catch((err) => console.error("Error deleting:", err));
  }

  function handleColumnsChange(v) {
    setColumns(v);
    localStorage.setItem(LS_VIEW, String(v));
  }

  function handleSelect1(id) {
    setSelected1(id);
    localStorage.setItem(LS_SELECTED_1, String(id));
  }

  function handleSelect2(id) {
    setSelected2(id);
    localStorage.setItem(LS_SELECTED_2, String(id));
  }

  /* ---------------- Filtro de proyectos ---------------- */
  let filteredProjects = [];
  if (columns === 1) {
    filteredProjects = selected1
      ? projects.filter((p) => p.id === Number(selected1))
      : [];
  } else if (columns === 2) {
    const sel1 = projects.find((p) => p.id === Number(selected1));
    const sel2 = projects.find((p) => p.id === Number(selected2));
    filteredProjects = [sel1, sel2].filter(Boolean);
  }

  /* ---------------- Render ---------------- */
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <h1 className="text-2xl font-semibold text-[var(--text-1)]">Projects</h1>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          {/* View buttons */}
          <div className="flex gap-2 justify-center sm:justify-start">
            {viewOptions.map((opt) => {
              const isActive = columns === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleColumnsChange(opt.value)}
                  className={`${BTN_TOGGLE} ${
                    isActive
                      ? "bg-[#0B5150] text-white border-[#0B5150]"
                      : "text-[var(--text-1)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Selectors */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <select
              value={selected1 || ""}
              onChange={(e) => handleSelect1(e.target.value || "")}
              className="px-3 py-1.5 border border-[var(--border-1)] rounded-lg text-sm bg-[var(--surface-1)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[#0B5150]"
            >
              <option value="">Select Project 1</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {columns === 2 && (
              <select
                value={selected2 || ""}
                onChange={(e) => handleSelect2(e.target.value || "")}
                className="px-3 py-1.5 border border-[var(--border-1)] rounded-lg text-sm bg-[var(--surface-1)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[#0B5150]"
              >
                <option value="">Select Project 2</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Button */}
          <button
            onClick={() => setShowModal(true)}
            className={`${BTN_PRIMARY} sm:ml-2 w-full sm:w-auto justify-center`}
          >
            <Plus size={18} className="sm:mr-1" />
            <span className="hidden sm:inline">New Project</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-[var(--text-2)] italic text-center">
          Loading projects...
        </div>
      ) : (
        <ProjectsGrid
          boards={filteredProjects}
          columns={columns}
          statuses={{}}
          onDeleteProject={handleDeleteProject}
        />
      )}

      <AnimatePresence>
        {showModal && (
          <NewProjectModal
            open
            onClose={() => setShowModal(false)}
            onCreated={handleNewProjectCreated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
