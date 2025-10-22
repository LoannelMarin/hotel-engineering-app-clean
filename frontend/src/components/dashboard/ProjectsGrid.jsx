import React from "react";

export default function ProjectsGrid({ projects }) {
  return (
    <div className="rounded-2xl border p-4 bg-white dark:bg-[#1d1f24] dark:border-gray-700 shadow-sm">
      <h3 className="font-semibold mb-3 text-[#0B5150]">Active Projects</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {projects.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-[#2a2d35] transition"
          >
            <div className="font-semibold text-gray-800 dark:text-gray-100">{p.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{p.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
