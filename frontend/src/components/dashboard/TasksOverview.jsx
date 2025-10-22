import React from "react";

export default function TasksOverview({ tasks = [] }) {
  return (
    <div
      className="rounded-2xl border border-zinc-200 dark:border-zinc-700 
                 bg-white dark:bg-[#1d1f24] shadow-sm p-6 flex flex-col h-full"
    >
      <h3 className="text-lg font-semibold mb-4 text-[#0B5150] dark:text-[#5ad5d3]">
        Tasks Overview
      </h3>

      {tasks.length > 0 ? (
        <ul className="space-y-2">
          {tasks.map((task, i) => (
            <li
              key={i}
              className="flex justify-between items-center text-sm 
                         text-zinc-700 dark:text-zinc-300 border-b 
                         border-zinc-100 dark:border-zinc-800 pb-1"
            >
              <span className="truncate max-w-[70%]">{task.name || task}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  task.status === "Completed"
                    ? "bg-green-600 text-white"
                    : task.status === "In Progress"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-600 text-white"
                }`}
              >
                {task.status || "Pending"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-zinc-400 text-sm text-center mt-6">
          No tasks available
        </p>
      )}
    </div>
  );
}
