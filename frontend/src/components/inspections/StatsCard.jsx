import React from "react";

export default function StatsCard({ title, value, icon: Icon, bgFrom, bgTo, textColor }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
      <div className={`pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full opacity-10 translate-x-8 -translate-y-8 bg-gradient-to-br ${bgFrom} ${bgTo}`} />
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
          </div>
          <div className={`rounded-xl p-3 bg-gradient-to-br ${bgFrom} ${bgTo} bg-opacity-20`}>
            <Icon className={`h-6 w-6 ${textColor}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
