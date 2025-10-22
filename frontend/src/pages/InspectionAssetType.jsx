// frontend/src/pages/InspectionAssetType.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Layers, Building2, Loader2 } from "lucide-react";

/* ---------------- Safe JSON fetch ---------------- */
async function safeJson(url, init) {
  try {
    const res = await fetch(url, { credentials: "include", ...(init || {}) });
    if (!res.ok) return [];
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/* ---------------- Floor sorting weight ---------------- */
function floorWeight(id) {
  const norm = String(id).toLowerCase();
  if (norm === "roof") return 0;
  if (norm === "penthouse") return 1;
  if (/^\d+$/.test(norm)) return 100 - parseInt(norm, 10);
  if (norm === "ground") return 150;
  if (norm === "basement") return 160;
  return 200;
}

/* ---------------- Component ---------------- */
export default function InspectionAssetType() {
  const [params] = useSearchParams();
  const inspectionName = params.get("name") || "Inspection";
  const selectedType = params.get("type") || "";

  const [floors, setFloors] = useState([]);
  const [assets, setAssets] = useState([]);
  const [floorFilter, setFloorFilter] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  /* ---------------- Load schema + assets ---------------- */
  useEffect(() => {
    (async () => {
      setLoading(true);
      const schema = await safeJson("/api/inspections/schema");
      const fs = (schema && schema.floors) || [
        { id: "roof", name: "Roof" },
        { id: "penthouse", name: "Penthouse" },
        { id: "8", name: "Floor 8" },
        { id: "7", name: "Floor 7" },
        { id: "6", name: "Floor 6" },
        { id: "5", name: "Floor 5" },
        { id: "4", name: "Floor 4" },
        { id: "3", name: "Floor 3" },
        { id: "2", name: "Floor 2" },
        { id: "1", name: "Floor 1" },
        { id: "basement", name: "Basement" },
      ];
      setFloors(fs.sort((a, b) => floorWeight(a.id) - floorWeight(b.id)));

      const a = await safeJson(
        `/api/assets?limit=10000&type=${encodeURIComponent(selectedType)}`
      );
      setAssets(Array.isArray(a) ? a : []);
      setLoading(false);
    })();
  }, [selectedType]);

  /* ---------------- Filters ---------------- */
  const filtered = useMemo(() => {
    return assets
      .filter((a) =>
        floorFilter ? String(a.floor) === String(floorFilter) : true
      )
      .filter((a) =>
        q
          ? `${a.name} ${a.area || ""}`
              .toLowerCase()
              .includes(q.toLowerCase())
          : true
      )
      .sort((a, b) => floorWeight(a.floor) - floorWeight(b.floor));
  }, [assets, floorFilter, q]);

  /* ---------------- UI ---------------- */
  return (
    <div className="p-4 sm:p-6 space-y-6 text-gray-900 dark:text-slate-100">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-semibold">
          {inspectionName} — {selectedType || "Asset Type"}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
          Showing {selectedType || "selected type"} from top to bottom. Use
          filters to narrow by floor or search by name.
        </p>
      </div>

      {/* Filters Card */}
      <Card className="rounded-2xl bg-white shadow-lg ring-1 ring-black/5 dark:bg-[#1d1f24] dark:ring-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
            <Layers className="w-5 h-5 text-[#0B5150]" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-300">
              Floor
            </label>
            <Select value={floorFilter} onValueChange={setFloorFilter}>
              <SelectTrigger className="mt-1 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
                <SelectValue placeholder="All floors" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
                <SelectItem value="">All</SelectItem>
                {floors.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="text-sm text-slate-600 dark:text-slate-300">
              Search
            </label>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or area…"
              className="mt-1 bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 placeholder:text-slate-400 w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Asset list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#0B5150]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-10">
            No assets found for this selection.
          </div>
        ) : (
          filtered.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 bg-white dark:bg-[#1d1f24] shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-medium text-gray-900 dark:text-slate-100 text-base sm:text-lg">
                    {a.name}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Floor: {a.floor} • Area: {a.area || "—"}
                  </div>
                </div>
                <Building2 className="w-5 h-5 text-slate-400 sm:ml-2" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
