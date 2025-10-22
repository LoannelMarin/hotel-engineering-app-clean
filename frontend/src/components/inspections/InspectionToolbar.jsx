// src/components/inspections/InspectionToolbar.jsx
import React from "react";


export default function InspectionToolbar({ progress, onPause, onComplete }) {
return (
<div className="flex items-center gap-3">
<div className="min-w-[200px]">
<div className="text-xs text-gray-500 mb-1">Progreso {progress}%</div>
<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
<div className="h-2 bg-gray-900" style={{ width: `${progress}%` }} />
</div>
</div>
<button onClick={onPause} className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">Pausar</button>
<button onClick={onComplete} className="px-3 py-2 rounded-xl bg-gray-900 text-white hover:bg-black">Completar</button>
</div>
);
}