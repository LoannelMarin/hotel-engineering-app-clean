// frontend/src/components/dashboard/MainOverview.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchWithAuth } from "../../utils/api";

/* 🎨 Colores base (fallback) */
const FALLBACK_COLORS = {
  Completed: "#15803D",
  "In Progress": "#4F46E5",
  "Not Started": "#FFFFFF",
  "N/A": "#94A3B8",
};

/* Normaliza claves */
function normKey(s) {
  return String(s || "").trim().toLowerCase().replace(/\s+/g, "_");
}

export default function MainOverview() {
  const [projects, setProjects] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  /* Detectar tamaño de pantalla */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ------------------- LOAD PROJECTS ------------------- */
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await fetchWithAuth("/api/projects/");
        const items = data?.items || [];

        const withProgress = await Promise.all(
          items.map(async (p) => {
            const [roomsRes, projectRes] = await Promise.all([
              fetchWithAuth(`/api/projects/${p.id}/rooms`),
              fetchWithAuth(`/api/projects/${p.id}`),
            ]);

            const rooms = roomsRes?.items || [];
            const legend = projectRes?.color_legend || {};

            const mappedLegend = {};
            Object.entries(legend).forEach(([key, value]) => {
              if (typeof value === "string") {
                mappedLegend[key.toLowerCase()] = value;
              } else if (value?.color) {
                mappedLegend[key.toLowerCase()] = value.color;
              }
            });

            const totals = {};
            rooms.forEach((r) => {
              const label = (r.status || "Not Started").trim();
              totals[label] = (totals[label] || 0) + 1;
            });

            const completedKey = Object.keys(totals).find(
              (k) => k.toLowerCase() === "completed"
            );
            const completed = completedKey ? totals[completedKey] : 0;

            const totalRooms = rooms.length > 0 ? rooms.length : 1;
            const progress = Math.round((completed / totalRooms) * 100);

            let status = "In Progress";
            if (completed === 0 && !totals["In Progress"]) status = "Not Started";
            if (completed === totalRooms) status = "Completed";

            return {
              ...p,
              totals,
              totalRooms,
              progress,
              status,
              legend: mappedLegend,
            };
          })
        );

        setProjects(withProgress);
      } catch (err) {
        console.error("Error loading projects:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  const project = projects[index] || {};
  const nextProject = () =>
    setIndex((i) => (projects.length ? (i + 1) % projects.length : 0));
  const prevProject = () =>
    setIndex((i) =>
      projects.length ? (i - 1 + projects.length) % projects.length : 0
    );

  /* ------------------- BUILD CHART DATA ------------------- */
  const chartData = useMemo(() => {
    const t = project.totals || {};
    const legend = project.legend || {};

    return Object.entries(t).map(([status, count]) => {
      const key = normKey(status);
      const color =
        legend[key]?.color ||
        legend[key] ||
        FALLBACK_COLORS[status] ||
        "#999999";

      return {
        name: status,
        value: count,
        color,
        stroke: status === "Not Started" ? "#D1D5DB" : "none",
      };
    });
  }, [project.totals, project.legend]);

  /* ------------------- STATUS BADGE ------------------- */
  const renderStatusBadge = (status) => {
    const base = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "Completed":
        return (
          <span
            className={`${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300`}
          >
            Completed
          </span>
        );
      case "In Progress":
        return (
          <span
            className={`${base} bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300`}
          >
            In Progress
          </span>
        );
      default:
        return (
          <span
            className={`${base} bg-white text-zinc-700 dark:bg-zinc-200 dark:text-zinc-900`}
          >
            {status}
          </span>
        );
    }
  };

  /* ------------------- RENDER ------------------- */
  return (
    <div className="flex flex-col gap-10">
      {/* ---------- Active Project ---------- */}
      <div
        className="rounded-2xl border border-zinc-100 dark:border-zinc-800 
                   bg-white dark:bg-[#1d1f24]
                   shadow-md hover:shadow-lg hover:bg-zinc-50 dark:hover:bg-[#22232a]
                   p-6 relative overflow-hidden 
                   min-h-[380px] flex flex-col justify-between transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black dark:text-white text-center w-full">
            Active Project
          </h2>
          <div className="absolute right-6 top-6 flex items-center gap-2">
            <button
              onClick={prevProject}
              className="p-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextProject}
              className="p-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-zinc-400 py-16">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center text-zinc-400 py-16">No projects found.</div>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* --- Pie Chart --- */}
            <div
              className={`flex flex-col items-center justify-center w-full md:w-1/2 ${
                isMobile ? "h-48" : "h-64"
              }`}
            >
              <div className="flex justify-center items-center w-full h-full">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 45 : 70}
                      outerRadius={isMobile ? 70 : 100}
                      dataKey="value"
                    >
                      {chartData.map((entry, i) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={entry.color}
                          stroke={entry.stroke}
                          strokeWidth={entry.stroke === "none" ? 0 : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1d1f24",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                      formatter={(val, name) => [val, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* ✅ Leyenda debajo del gráfico */}
              <div className="mt-4 w-full flex flex-wrap justify-center gap-4">
                {chartData.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                  >
                    <span
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: d.color }}
                    ></span>
                    {d.name}
                  </div>
                ))}
              </div>
            </div>

            {/* --- Project Info --- */}
            <div className="w-full md:w-1/2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-[#0B5150] dark:text-zinc-100">
                  {project.name}
                </h3>
                {renderStatusBadge(project.status)}
              </div>

              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">
                Created: {project.created_at?.slice(0, 10)}
              </p>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
                Updated: {project.updated_at?.slice(0, 10)}
              </p>

              <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-zinc-800 transition-colors">
                <div
                  className="bg-[#52bdbb] h-3 rounded-full transition-all"
                  style={{ width: `${project.progress || 0}%` }}
                />
              </div>

              <p className="text-right text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                {(() => {
                  const totals = project.totals || {};
                  const completedKey = Object.keys(totals).find((k) =>
                    /(completed|complete|done|finished)/i.test(k)
                  );
                  const completedCount = completedKey
                    ? totals[completedKey]
                    : 0;
                  const totalRooms = project.totalRooms || 0;
                  const progress = project.progress || 0;
                  return `${completedCount} / ${totalRooms} rooms completed (${progress}%)`;
                })()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
