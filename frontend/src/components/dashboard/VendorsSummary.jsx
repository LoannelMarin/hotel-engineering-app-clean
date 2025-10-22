import React from "react";

export default function SummaryView({ stats = [] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-zinc-800 bg-white dark:bg-[#1d1f24] dark:border-zinc-700 shadow-sm p-4 flex flex-col items-center justify-center"
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {s.label}
          </p>
          <p className="text-3xl font-semibold text-[#0B5150] mt-1">
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}
