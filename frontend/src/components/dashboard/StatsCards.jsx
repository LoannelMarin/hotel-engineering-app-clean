// frontend/src/components/dashboard/StatsCards.jsx
import React from "react";

export default function StatsCards({ stats = [] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
      {stats.length > 0 ? (
        stats.map((item, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border bg-white dark:bg-[#1d1f24] 
                       border-zinc-200 dark:border-zinc-700 shadow-sm flex flex-col 
                       justify-center transition hover:scale-[1.02]"
          >
            <p className="text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              {item.label}
            </p>
            <p className="text-2xl font-bold mt-1 text-[#0B5150] dark:text-[#5ad5d3]">
              {item.value}
            </p>
          </div>
        ))
      ) : (
        <div className="col-span-full flex items-center justify-center h-24">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No stats available
          </p>
        </div>
      )}
    </div>
  );
}
