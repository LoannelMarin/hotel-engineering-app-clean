// src/pages/InspectionsHub.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// UI
import { Building2, MapPin, Boxes, Play, Plus } from "../ui/Icons";
import Tab from "../ui/Tab";

// API
import { createInspection, listScopes, listInspections } from "../api/inspections";

// Multi-floor modal
import SelectFloorsModal from "../components/inspections/SelectFloorsModal";

/* ====================== UI helpers (solo estilo) ====================== */
const CARD =
  "rounded-2xl bg-white/95 shadow-[0_1px_0_rgba(0,0,0,.02),0_8px_24px_rgba(0,0,0,.06)] ring-1 ring-black/5 " +
  "transition duration-200 " +
  "dark:bg-[#1d1f24]/90 dark:ring-white/10 dark:shadow-[0_1px_0_rgba(255,255,255,.04)_inset,0_20px_40px_rgba(0,0,0,.45)]";
const CARD_HOVER =
  "hover:shadow-[0_2px_0_rgba(0,0,0,.03),0_16px_30px_rgba(0,0,0,.08)] " +
  "dark:hover:shadow-[0_1px_0_rgba(255,255,255,.05)_inset,0_26px_48px_rgba(0,0,0,.55)] " +
  "hover:ring-[#0B5150]/20";
const CARD_PAD = "p-4 md:p-5";

// botones: acento teal
const BTN_PRIMARY =
  "inline-flex items-center gap-2 rounded-xl px-3 py-2 " +
  "bg-[#083A39] text-white hover:bg-[#0A4644] active:scale-[.98] " +
  "focus:outline-none focus:ring-2 focus:ring-[#0B5150]/60 " +
  "transition " +
  "dark:bg-[#09403F] dark:hover:bg-[#0A4644] dark:focus:ring-[#0B5150]/60";
const BTN_SOFT =
  "inline-flex items-center gap-2 rounded-xl px-3 py-2 " +
  "bg-white/80 ring-1 ring-gray-200 hover:bg-white transition " +
  "dark:bg-[#24262c] dark:ring-white/10 dark:hover:bg-[#2a2d33]";
const BADGE_RED =
  "inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-700 " +
  "dark:bg-rose-400/15 dark:text-rose-300 dark:ring-1 dark:ring-rose-300/20";

/* ========================= Constantes de datos ======================== */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  window.location.origin.replace(":5173", ":5000");

// Roof, Penthouse, 8..1, Basement
const FLOOR_ORDER = ["Roof", "Penthouse", "8", "7", "6", "5", "4", "3", "2", "1", "Basement"];
const FLOOR_INDEX = Object.fromEntries(FLOOR_ORDER.map((v, i) => [v.toLowerCase(), i]));

const DEFAULT_FLOORS = ["Roof", "Penthouse", "8", "7", "6", "5", "4", "3", "2", "1", "Basement"];
const DEFAULT_AREAS = ["Lobby", "Bar", "Kitchen", "Back of House", "MDF", "Gym"];
const DEFAULT_TYPES = ["FCU", "Pump", "Detector", "Extinguisher", "Panel", "Door"];

const LS_FLOORS = "he_custom_floors";
const LS_AREAS = "he_custom_areas";

/* ========================= Utils de navegación ======================== */
function extractInspectionId(payload) {
  if (!payload) return null;
  return (
    payload.id ??
    payload?.data?.id ??
    payload?.inspection?.id ??
    payload?.result?.id ??
    null
  );
}

async function goToInspection({ id, navigate }) {
  try {
    await fetch(`${API_BASE}/api/inspections/${id}`, { credentials: "include" });
  } catch {}
  const path = `/inspections/${id}/run`;
  try {
    navigate(path);
    await new Promise((r) => setTimeout(r, 0));
  } catch {
    window.location.assign(path);
  }
}

/* ========================= Modal Records ========================= */
function RecordsModal({ open, onClose, inProgress = [], completed = [] }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("inProgress"); // inProgress | completed
  if (!open) return null;

  const MODAL_CARD =
    "rounded-2xl bg-white shadow-[0_1px_0_rgba(0,0,0,.02),0_12px_36px_rgba(0,0,0,.22)] ring-1 ring-black/10 " +
    "dark:bg-[#1d1f24] dark:ring-white/10 dark:shadow-[0_1px_0_rgba(255,255,255,.04)_inset,0_24px_56px_rgba(0,0,0,.6)]";
  const MODAL_PAD = "p-4 md:p-5";

  const LIST_SCROLL =
    "overflow-y-auto max-h-[560px] pr-1 " +
    "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent " +
    "[&::-webkit-scrollbar-thumb]:bg-black/10 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 " +
    "[&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-black/20 " +
    "dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/20";

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className={`relative w-full md:max-w-3xl ${MODAL_CARD} ${MODAL_PAD}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Records</h2>
          <button onClick={onClose} className={BTN_SOFT}>Close</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("inProgress")}
            className={`px-3 py-1.5 rounded-xl transition ${
              tab === "inProgress"
                ? "bg-[#083A39] text-white dark:bg-[#09403F]"
                : "bg-gray-100 hover:bg-gray-200 dark:bg-[#24262c] dark:hover:bg-[#2a2d33]"
            }`}
          >
            In progress
          </button>
          <button
            onClick={() => setTab("completed")}
            className={`px-3 py-1.5 rounded-xl transition ${
              tab === "completed"
                ? "bg-[#083A39] text-white dark:bg-[#09403F]"
                : "bg-gray-100 hover:bg-gray-200 dark:bg-[#24262c] dark:hover:bg-[#2a2d33]"
            }`}
          >
            Completed
          </button>
        </div>

        {/* Listas */}
        <div className={`${LIST_SCROLL}`}>
          {tab === "inProgress" ? (
            <ul className="divide-y divide-gray-100 dark:divide-white/10">
              {inProgress.length ? (
                inProgress.map((i) => (
                  <li key={i.id} className="py-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-sm text-gray-500 dark:text-slate-300 truncate">
                        {i.scope_type} • {i.scope_value}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-slate-200 truncate">
                        Progress {i.progress}% — started by {i.started_by_name || "—"}
                      </div>
                    </div>
                    <button
                      onClick={() => goToInspection({ id: i.id, navigate })}
                      className={BTN_PRIMARY}
                    >
                      Resume
                    </button>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 text-sm py-2 dark:text-slate-300">
                  No inspections in progress
                </li>
              )}
            </ul>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-white/10">
              {completed.length ? (
                completed.map((i) => (
                  <li key={i.id} className="py-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-sm text-gray-500 dark:text-slate-300 truncate">
                        {i.scope_type} • {i.scope_value}
                      </div>
                      <div className="text-sm text-gray-900 dark:text-slate-200 truncate">
                        Completed — started by {i.started_by_name || "—"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(`/inspections/${i.id}/view`, "_blank")}
                        className={BTN_SOFT}
                        title="Open summary"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => window.open(`/inspections/${i.id}/print?auto=1`, "_blank")}
                        className={BTN_SOFT}
                        title="Open printable report"
                      >
                        Print
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-gray-500 text-sm py-2 dark:text-slate-300">
                  No completed inspections
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* =============================== Página ================================== */
export default function InspectionsHub() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("floor"); // floor | area | type
  const [data, setData] = useState({
    floors: [],
    areas: [],
    types: [],
    inProgress: [],
    completed: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [recordsOpen, setRecordsOpen] = useState(false);
  const [floorModalOpen, setFloorModalOpen] = useState(false);
  const [presetFloor, setPresetFloor] = useState(null);

  const [badSummary, setBadSummary] = useState({ byFloor: {}, byArea: {}, byType: {} });

  const addScope = (kind) => {
    const v = prompt(kind === "floor" ? "Add new floor label:" : "Add new area name:");
    const t = (v || "").trim();
    if (!t) return;
    if (kind === "floor") {
      const next = Array.from(new Set([...(data.floors || []), t]));
      setData((d) => ({ ...d, floors: next }));
      try { localStorage.setItem("he_custom_floors", JSON.stringify(next.filter(Boolean))); } catch {}
    } else {
      const next = Array.from(new Set([...(data.areas || []), t]));
      setData((d) => ({ ...d, areas: next }));
      try { localStorage.setItem("he_custom_areas", JSON.stringify(next.filter(Boolean))); } catch {}
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await listScopes();
        const floors = Array.isArray(res?.floors) && res.floors.length ? res.floors : DEFAULT_FLOORS;
        const areas  = Array.isArray(res?.areas)  && res.areas.length  ? res.areas  : DEFAULT_AREAS;
        const types  = Array.isArray(res?.types)  && res.types.length  ? res.types  : DEFAULT_TYPES;

        let extraFloors = [], extraAreas = [];
        try {
          extraFloors = JSON.parse(localStorage.getItem(LS_FLOORS) || "[]");
          extraAreas  = JSON.parse(localStorage.getItem(LS_AREAS)  || "[]");
        } catch {}
        const mergedFloors = Array.from(new Set([...(floors || []), ...(extraFloors || [])]));
        const mergedAreas  = Array.from(new Set([...(areas  || []), ...(extraAreas  || [])]));

        setData({
          floors: mergedFloors,
          areas: mergedAreas,
          types,
          inProgress: res?.inProgress || [],
          completed: res?.completed || [],
        });

        try {
          const sRes = await fetch(`${API_BASE}/api/assets/status/summary`, { credentials: "include" });
          if (sRes.ok) {
            const s = await sRes.json();
            if (mounted) setBadSummary({
              byFloor: s.byFloor || {},
              byArea: s.byArea || {},
              byType: s.byType || {},
            });
          }
        } catch {}

        try {
          const completedList = await listInspections({ status: "completed" });
          if (mounted && Array.isArray(completedList)) {
            setData((d) => ({ ...d, completed: completedList }));
          }
        } catch {}
      } catch (e) {
        console.error(e);
        if (mounted) {
          setData({
            floors: DEFAULT_FLOORS,
            areas: DEFAULT_AREAS,
            types: DEFAULT_TYPES,
            inProgress: [],
            completed: [],
          });
          setError("Could not load inspections data (showing defaults).");
        }
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // === Progreso global (contador y barra) ===
  const totalCount = (data.inProgress?.length || 0) + (data.completed?.length || 0);
  const completedCount = data.completed?.length || 0;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Ordena pisos por el orden especificado
  const sortedFloors = useMemo(() => {
    const uniq = Array.from(new Set((data.floors || []).map((x) => String(x))));
    uniq.sort((a, b) => {
      const ia = FLOOR_INDEX[a.toLowerCase()];
      const ib = FLOOR_INDEX[b.toLowerCase()];
      if (ia !== undefined && ib !== undefined) return ia - ib;
      if (ia !== undefined) return -1;
      if (ib !== undefined) return 1;
      const na = Number(a), nb = Number(b);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return nb - na;
      return a.localeCompare(b);
    });
    return uniq;
  }, [data.floors]);

  const currentList = tab === "floor" ? sortedFloors : tab === "area" ? data.areas : data.types;

  const getBadCount = (label) => {
    if (tab === "floor") return Number(badSummary.byFloor?.[String(label)] || 0);
    if (tab === "area") return Number(badSummary.byArea?.[String(label)] || 0);
    return Number(badSummary.byType?.[String(label)] || 0);
  };

  const startMultiFloorFlow = (initialFloor = null) => {
    setPresetFloor(initialFloor);
    setFloorModalOpen(true);
  };

  const onConfirmFloors = async (selectedFloors) => {
    try {
      const resp = await createInspection({ scope_type: "floors", floors: selectedFloors });
      const id = extractInspectionId(resp);
      if (id) {
        await goToInspection({ id, navigate });
      } else {
        alert("Could not start the inspection (invalid response). Check console.");
      }
    } catch {
      alert("Could not start the inspection.");
    } finally {
      setFloorModalOpen(false);
      setPresetFloor(null);
    }
  };

  const startAreaOrType = async ({ scopeType, scopeValue }) => {
    try {
      const resp = await createInspection({ scope_type: scopeType, scope_value: scopeValue });
      const id = extractInspectionId(resp);
      if (id) {
        await goToInspection({ id, navigate });
      } else {
        alert("Could not start the inspection (invalid response). Check console.");
      }
    } catch {
      alert("Could not start the inspection.");
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] p-6 pb-16">
      {/* Header con progreso + acciones */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Inspections</h1>

          {/* Progreso global: contador + barra (responsive) */}
          <div className="mt-2 flex flex-col gap-2 sm:max-w-md">
            <div className="text-sm text-gray-600 dark:text-slate-300">
              Completed <span className="font-semibold">{completedCount}</span> of{" "}
              <span className="font-semibold">{totalCount}</span> ({percent}%)
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-2 bg-[#083A39] dark:bg-[#0A4B4A] transition-all"
                style={{ width: `${percent}%` }}
                aria-label={`Progress ${percent}%`}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setRecordsOpen(true)}
            className={BTN_SOFT}
            title="View records"
          >
            Records
          </button>

          {tab === "floor" && (
            <>
              <button
                onClick={() => addScope("floor")}
                className={BTN_SOFT}
                title="Add floor"
              >
                <Plus size={16} /> Add floor
              </button>
              <button
                onClick={() => startMultiFloorFlow(null)}
                className={BTN_PRIMARY}
                title="Start multi-floor inspection"
              >
                <Play size={16} /> Start (multi-floor)
              </button>
            </>
          )}

          {tab === "area" && (
            <button onClick={() => addScope("area")} className={BTN_SOFT} title="Add area">
              <Plus size={16} /> Add area
            </button>
          )}

          {tab === "type" && (
            <button onClick={() => navigate("/assets")} className={BTN_SOFT} title="Add asset">
              <Plus size={16} /> Add asset
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={`${CARD} ${CARD_PAD} mb-2 ${CARD_HOVER}`}>
        <div className="flex gap-2">
          <Tab active={tab === "floor"} onClick={() => setTab("floor")}>
            <Building2 className="inline mr-2" size={16} />
            By floor
          </Tab>
          <Tab active={tab === "area"} onClick={() => setTab("area")}>
            <MapPin className="inline mr-2" size={16} />
            By area
          </Tab>
          <Tab active={tab === "type"} onClick={() => setTab("type")}>
            <Boxes className="inline mr-2" size={16} />
            By asset type
          </Tab>
        </div>
      </div>

      {loading && <div className={`${CARD} ${CARD_PAD}`}>Loading…</div>}
      {!loading && error && <div className={`${CARD} ${CARD_PAD} text-amber-700 dark:text-amber-300`}>{error}</div>}

      {/* Grid principal */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {(currentList || []).map((v) => {
            const count = getBadCount(v);
            return (
              <motion.div
                key={String(v)}
                layout
                whileHover={{ scale: 1.01 }}
                className={`${CARD} ${CARD_HOVER} ${CARD_PAD}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      {tab === "floor" ? "Floor" : tab === "area" ? "Area" : "Type"}
                    </div>
                    <div className="mt-1 text-lg font-medium flex items-center gap-2">
                      {String(v)}
                      {count > 0 && (
                        <span className={BADGE_RED}>
                          {count} {count === 1 ? "issue" : "issues"}
                        </span>
                      )}
                    </div>
                  </div>

                  {tab === "floor" ? (
                    <button
                      onClick={() => startMultiFloorFlow(String(v))}
                      className={BTN_PRIMARY}
                    >
                      <Play size={16} /> Start
                    </button>
                  ) : (
                    <button
                      onClick={() => startAreaOrType({ scopeType: tab, scopeValue: String(v) })}
                      className={BTN_PRIMARY}
                    >
                      <Play size={16} /> Start
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal multi-floor */}
      <SelectFloorsModal
        open={floorModalOpen}
        floors={sortedFloors}
        initial={presetFloor}
        onClose={() => { setFloorModalOpen(false); setPresetFloor(null); }}
        onStart={onConfirmFloors}
      />

      {/* Modal de Records */}
      <RecordsModal
        open={recordsOpen}
        onClose={() => setRecordsOpen(false)}
        inProgress={data.inProgress}
        completed={data.completed}
      />
    </div>
  );
}
