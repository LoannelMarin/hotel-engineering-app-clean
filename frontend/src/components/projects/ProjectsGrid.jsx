// src/components/projects/ProjectsGrid.jsx
import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  FileDown,
  Settings2,
  Trash2,
  CheckCircle2,
  RefreshCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RoomTile from "./RoomTile";
import RoomModal from "./RoomModal";
import NewStatusModal from "./NewStatusModal";
import { fetchWithAuth } from "../../utils/api";

const FLOORS = [8, 7, 6, 5, 4, 3, 2];
const roomsForFloor = (f) =>
  f === 2
    ? Array.from({ length: 16 }, (_, i) => 201 + i)
    : Array.from({ length: 17 }, (_, i) => f * 100 + 1 + i);

const DEFAULT_COLOR = "#0B5150";
const LEGEND_BASE = {
  "Not Started": "#FFFFFF",
  "In Progress": "#4F46E5",
  Completed: "#15803D",
  "N/A": "#94A3B8",
};

/* 🔧 Normaliza leyenda */
function normalizeLegend(legend) {
  const base = {};
  Object.entries(LEGEND_BASE).forEach(([lbl, clr]) => {
    base[lbl.toLowerCase().replace(/\s+/g, "_")] = { label: lbl, color: clr };
  });

  if (!legend) return base;
  const map = { ...base };
  Object.entries(legend).forEach(([k, v]) => {
    if (typeof v === "string") {
      map[k.toLowerCase().replace(/\s+/g, "_")] = { label: k, color: v };
    } else if (v && v.label && v.color) {
      map[v.label.toLowerCase().replace(/\s+/g, "_")] = {
        label: v.label,
        color: v.color,
      };
    } else if (v && v.color) {
      map[k.toLowerCase().replace(/\s+/g, "_")] = {
        label: v.label || k,
        color: v.color,
      };
    }
  });
  return map;
}

export default function ProjectsGrid({
  boards = [],
  columns = 1,
  statuses = {},
  onDeleteProject,
}) {
  const [roomModal, setRoomModal] = useState(null);
  const [legendModal, setLegendModal] = useState(null);
  const [projectStates, setProjectStates] = useState({});
  const [roomStates, setRoomStates] = useState({});
  const [projectsData, setProjectsData] = useState([]);

  const visibleBoards = boards.slice(0, columns);
  const columnsClass =
    columns === 1 ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2";

  /* 🔁 Polling + Sync rooms */
  useEffect(() => {
    let mounted = true;

    async function refreshProjects() {
      try {
        const res = await fetchWithAuth("/api/projects/");
        if (!mounted) return;
        const items = res.items || [];
        setProjectsData(items);

        // 🔁 Sincroniza estados de habitaciones
        for (const p of items) {
          try {
            const roomsRes = await fetchWithAuth(`/api/projects/${p.id}/rooms`);
            if (!mounted) return;
            const map = {};
            (roomsRes.items || []).forEach((r) => {
              map[r.room_number] = r.status;
            });
            setRoomStates((prev) => ({ ...prev, [p.id]: map }));
          } catch (err) {
            console.error(`Error loading rooms for project ${p.id}:`, err);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }

    refreshProjects();
    const timer = setInterval(refreshProjects, 10000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  /* ✅ Toggle complete */
  async function toggleComplete(project) {
    try {
      const res = await fetchWithAuth(`/api/projects/${project.id}/complete`, {
        method: "PUT",
      });
      const updated = res.project || {};
      setProjectStates((prev) => ({
        ...prev,
        [project.id]: {
          status: updated.status,
          completed_at: updated.completed_at,
          completed_by: updated.completed_by,
        },
      }));
    } catch (err) {
      console.error("Error toggling project:", err);
    }
  }

  function handlePrint(projectId) {
    window.open(`/projects/print/${projectId}`, "_blank");
  }

  /* ✅ Guardar desde RoomModal */
  async function handleSaveRoom(data) {
    if (!roomModal?.projectId || !roomModal?.roomNumber) return;
    try {
      await fetchWithAuth(
        `/api/projects/${roomModal.projectId}/room/${roomModal.roomNumber}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: data.status,
            notes: data.notes,
          }),
        }
      );

      setRoomStates((prev) => ({
        ...prev,
        [roomModal.projectId]: {
          ...(prev[roomModal.projectId] || {}),
          [roomModal.roomNumber]: data.status,
        },
      }));

      setRoomModal(null);
    } catch (err) {
      console.error("❌ Error saving room:", err);
      alert("Error saving room status. Check console.");
    }
  }

  return (
    <div className={`grid gap-6 mt-8 ${columnsClass}`}>
      <AnimatePresence>
        {visibleBoards.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="col-span-full flex flex-col items-center justify-center py-20 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] shadow-sm"
          >
            <p className="text-lg font-semibold text-[var(--text-1)] mb-2">
              No project selected
            </p>
            <p className="text-sm text-[var(--text-2)] text-center max-w-sm">
              Choose a project from the top bar to display its rooms.
            </p>
          </motion.div>
        )}

        {visibleBoards.map((project) => {
          const backendProject =
            projectsData.find((p) => p.id === project.id) || project;

          const legend =
            backendProject.color_legend &&
            Object.keys(backendProject.color_legend).length
              ? backendProject.color_legend
              : LEGEND_BASE;

          const normalizedLegend = normalizeLegend(legend);
          const current = projectStates[project.id] || backendProject;
          const isCompleted = current.status === "Completed";

          const completedText = current.completed_at
            ? `${current.completed_by || "Unknown"} completed this project on ${new Date(
                current.completed_at
              ).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}`
            : "—";

          return (
            <motion.section
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] shadow-sm overflow-hidden"
            >
              {/* Header */}
              <div
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 text-white rounded-t-2xl gap-2"
                style={{ background: project.color || DEFAULT_COLOR }}
              >
                <h3 className="font-semibold truncate">{project.name}</h3>
                <div className="flex items-center justify-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    title="Undo"
                    className="p-2 rounded-md hover:bg-white/15 transition"
                  >
                    <RotateCcw size={18} />
                  </button>
                  <button
                    title="Print"
                    onClick={() => handlePrint(project.id)}
                    className="p-2 rounded-md hover:bg-white/15 transition"
                  >
                    <FileDown size={18} />
                  </button>
                  <button
                    title="Statuses & Colors"
                    onClick={() =>
                      setLegendModal({
                        projectId: project.id,
                        legend: normalizedLegend,
                      })
                    }
                    className="p-2 rounded-md hover:bg-white/15 transition"
                  >
                    <Settings2 size={18} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-3 sm:p-4">
                {FLOORS.map((floor) => (
                  <div key={`${project.id}-f${floor}`} className="mb-3 sm:mb-4">
                    {/* Floor header */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold bg-[var(--surface-2)] text-[var(--text-1)]">
                        FLOOR {floor}
                      </span>
                      <div className="h-px flex-1 bg-[var(--border-1)]/60" />
                    </div>

                    {/* Rooms */}
                    {/* 📱 Mobile: lista vertical */}
                    <div className="block sm:hidden space-y-2">
                      {roomsForFloor(floor).map((room) => {
                        const currentStatus = roomStates[project.id]?.[room];
                        const effectiveStatus =
                          !currentStatus ||
                          currentStatus === "N/A" ||
                          currentStatus === "Not Started"
                            ? "Not Started"
                            : currentStatus;
                        const key = effectiveStatus
                          .toLowerCase()
                          .replace(/\s+/g, "_");
                        const color =
                          normalizedLegend[key]?.color ||
                          LEGEND_BASE["Not Started"];

                        return (
                          <button
                            key={room}
                            onClick={() =>
                              setRoomModal({
                                projectId: project.id,
                                roomNumber: room,
                                legend: normalizedLegend,
                              })
                            }
                            className="w-full flex items-center justify-between px-4 py-2 rounded-xl border text-sm font-medium transition-colors"
                            style={{
                              background: color,
                              color: color === "#FFFFFF" ? "#111" : "white",
                              borderColor: "rgba(0,0,0,0.1)",
                            }}
                          >
                            <span>Room {room}</span>
                            <span className="opacity-70 text-xs">
                              {effectiveStatus}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* 🖥️ Desktop grid */}
                    <div
                      className="hidden sm:grid gap-[6px] md:gap-2"
                      style={{
                        gridTemplateColumns:
                          floor === 2
                            ? "repeat(16, minmax(0, 1fr))"
                            : "repeat(17, minmax(0, 1fr))",
                      }}
                    >
                      {roomsForFloor(floor).map((room) => {
                        let currentStatus = roomStates[project.id]?.[room];
                        const effectiveStatus =
                          !currentStatus ||
                          currentStatus === "N/A" ||
                          currentStatus === "Not Started"
                            ? "Not Started"
                            : currentStatus;
                        const key = effectiveStatus
                          .toLowerCase()
                          .replace(/\s+/g, "_");
                        const color =
                          normalizedLegend[key]?.color ||
                          LEGEND_BASE["Not Started"];

                        return (
                          <RoomTile
                            key={room}
                            number={room}
                            color={color}
                            onClick={() =>
                              setRoomModal({
                                projectId: project.id,
                                roomNumber: room,
                                legend: normalizedLegend,
                              })
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Footer */}
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-[var(--border-1)] pt-3 gap-2">
                  <div className="text-xs text-[var(--text-2)] italic text-center sm:text-left">
                    {completedText}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
                    <button
                      type="button"
                      onClick={() => onDeleteProject?.(project.id)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-sm
                                 border-[var(--border-1)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--text-1)]"
                    >
                      <Trash2 size={16} />
                      <span className="hidden sm:inline">Delete</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleComplete(project)}
                      className={`inline-flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm transition ${
                        isCompleted
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : "bg-[#0B5150] hover:bg-[#0e6664] text-white"
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <RefreshCcw size={16} />
                          <span className="hidden sm:inline">Re-open</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span className="hidden sm:inline">Complete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          );
        })}
      </AnimatePresence>

      {/* Modals */}
      {roomModal && (
        <RoomModal
          open
          projectId={roomModal.projectId}
          roomNumber={roomModal.roomNumber}
          legend={roomModal.legend}
          onClose={() => setRoomModal(null)}
          onSave={handleSaveRoom}
        />
      )}

      {legendModal && (
        <NewStatusModal
          open
          projectId={legendModal.projectId}
          legend={legendModal.legend}
          onClose={() => setLegendModal(null)}
          onSave={() => setLegendModal(null)}
        />
      )}
    </div>
  );
}
