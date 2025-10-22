// frontend/src/pages/Paint.jsx
import React from "react";
import { Wrench, PaintBucket } from "lucide-react";

export default function Paint() {
  return (
    <div className="p-6 sm:p-8 space-y-6 flex flex-col items-center justify-center min-h-[80vh] text-center page-fade-in">
      <div className="space-y-3">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex items-center justify-center gap-3 text-[#0B5150] dark:text-[#5ad5d3]">
            <Wrench className="w-8 h-8 animate-pulse" />
            <PaintBucket className="w-6 h-6 opacity-70" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            Paint — Under Construction
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-lg">
            This section will include color libraries, paint jobs, finishes, and vendor tracking.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/60 shadow-sm p-6 sm:p-8 backdrop-blur-sm">
          <p className="text-zinc-700 dark:text-zinc-300 text-sm sm:text-base">
            🚧 We’re currently working on this feature. Soon you’ll be able to
            manage your paint projects and materials directly from here.
          </p>
        </div>
      </div>

      <style>{`
        .page-fade-in {
          animation: fadein .3s ease-out;
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
