import React from "react";
import { AlertTriangle } from "lucide-react";

export default function CriticalAssets({ assets = [], inspections = [] }) {
  const critical = inspections.filter((i) => i.status === "critical");
  const getAssetName = (id) => assets.find((a) => a.id === id)?.name || "Asset not found";

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b px-6 py-4">
        <h3 className="flex items-center gap-2 text-slate-900">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Critical Assets
        </h3>
      </div>

      <div className="px-6 py-4">
        {critical.length === 0 ? (
          <div className="py-10 text-center text-slate-500">
            <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-slate-400" />
            <p>No critical assets</p>
            <p className="text-sm text-slate-400">Great job keeping everything healthy!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {critical.slice(0, 5).map((i) => (
              <div key={i.id} className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="font-medium text-red-900">{getAssetName(i.asset_id)}</h4>
                  <span className="inline-flex rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">Critical</span>
                </div>
                <p className="mb-2 text-sm text-red-700">{i.notes ? (i.notes.length > 100 ? i.notes.slice(0, 100) + "…" : i.notes) : "No notes"}</p>
                <div className="flex items-center justify-between text-xs text-red-700">
                  <span>{i.floor} • {i.room_area}</span>
                  <span>{new Date(i.inspection_date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
