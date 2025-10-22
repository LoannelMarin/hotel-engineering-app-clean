// frontend/src/pages/CalendarPage.jsx
import React from "react";
import { Wrench, Clock } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="p-6 sm:p-8 space-y-6 flex flex-col items-center justify-center min-h-[80vh] text-center">
      <div className="space-y-3">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex items-center justify-center gap-3 text-[#0B5150] dark:text-[#5ad5d3]">
            <Wrench className="w-8 h-8 animate-pulse" />
            <Clock className="w-6 h-6 opacity-70" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            Calendar — Under Construction
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-lg">
            This section will display the monthly and weekly view combining
            tasks, PMs, deliveries, and engineering events.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#1d1f24] shadow-sm p-6 sm:p-8">
          <p className="text-zinc-700 dark:text-zinc-300 text-sm sm:text-base">
            🚧 We're working on integrating this feature very soon.
            It will include synchronization with tasks, PM schedules, and maintenance alerts.
          </p>
        </div>
      </div>
    </div>
  );
}
