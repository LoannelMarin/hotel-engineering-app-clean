// src/pages/InspectionRun.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  getInspection,
  listItems,
  updateItemStatus,
  addItemComment,
  uploadItemPhoto,
  completeInspection,
  updateInspection,
} from "../api/inspections";
import AddNoteModal from "../components/inspections/AddNoteModal";
import { motion, AnimatePresence } from "framer-motion";

/* ====================== UI Tokens ====================== */
const CARD =
  "rounded-2xl bg-white/95 shadow-[0_1px_0_rgba(0,0,0,.02),0_8px_24px_rgba(0,0,0,.06)] ring-1 ring-black/5 transition duration-200 " +
  "dark:bg-[#1e1e1e] dark:ring-white/10 dark:shadow-[0_1px_0_rgba(255,255,255,.04)_inset,0_20px_40px_rgba(0,0,0,.45)]";
const CARD_HOVER =
  "hover:shadow-[0_2px_0_rgba(0,0,0,.03),0_16px_30px_rgba(0,0,0,.08)] " +
  "dark:hover:shadow-[0_1px_0_rgba(255,255,255,.05)_inset,0_26px_48px_rgba(0,0,0,.55)] hover:ring-[#0B5150]/20";
const CARD_PAD = "p-4 sm:p-5 md:p-6";
const SOFT_TXT = "text-gray-600 dark:text-slate-300";
const MUTED_TXT = "text-gray-500 dark:text-slate-400";
const STRONG_TXT = "text-gray-900 dark:text-slate-100";
const BTN_PRIMARY =
  "inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-[#083A39] text-white hover:bg-[#0A4644] active:scale-[.98] " +
  "focus:outline-none focus:ring-2 focus:ring-[#0B5150]/60 transition dark:bg-[#09403F] dark:hover:bg-[#0A4644]";
const BTN_SOFT =
  "inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-white/80 ring-1 ring-gray-200 hover:bg-white transition " +
  "dark:bg-[#24262c] dark:ring-white/10 dark:hover:bg-[#2a2d33]";

/* ====================== Helpers ====================== */
function useInspectionIdFromRoute() {
  const params = useParams();
  let raw = params?.id ?? params?.inspectionId ?? params?.inspection_id ?? null;
  if (!raw && typeof window !== "undefined") {
    const m = window.location.pathname.match(/\/inspections\/(\d+)/);
    if (m && m[1]) raw = m[1];
  }
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined"
    ? window.location.origin.replace(":5173", ":5000")
    : "");

function pickAssetPhoto(a) {
  return (
    a?.photo_url || a?.photo || a?.image || a?.image_url || a?.thumbnail || null
  );
}

function extractRoomKey(it) {
  const label = String(it?.label || "").trim();
  const rx = /(room|habitación|habitacion|rm)\s*([a-z0-9\-]+)/i;
  const m = label.match(rx);
  if (m && m[2]) return `Room ${m[2].toUpperCase()}`;
  const m3 = label.match(/\b(\d{3,4})\b/);
  if (m3 && m3[1]) return `Room ${m3[1]}`;
  if (it?.area) return String(it.area);
  return "Other";
}

function compareRoomKeys(a, b) {
  const getNum = (s) => {
    const m = String(s).match(/Room\s+(\d{1,4})/i);
    return m ? Number(m[1]) : null;
  };
  const na = getNum(a);
  const nb = getNum(b);
  if (na != null && nb != null) return na - nb;
  if (na != null) return -1;
  if (nb != null) return 1;
  return String(a).localeCompare(String(b));
}

/* ====================== Modal Detalle Asset ====================== */
function AssetDetailModal({ open, onClose, item, asset, inspectionPhotos = [] }) {
  if (!open || !item) return null;
  const thumb = pickAssetPhoto(asset);
  const status = String(item.status || "open").toLowerCase();

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        className={`relative w-full md:max-w-3xl ${CARD} overflow-hidden max-h-[95vh] overflow-y-auto`}
      >
        <div className="w-full h-44 md:h-60 bg-gray-100 dark:bg-slate-800">
          {thumb && (
            <img src={thumb} alt="asset" className="w-full h-full object-cover" />
          )}
        </div>
        <div className={`${CARD_PAD}`}>
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <h3 className={`text-lg font-semibold leading-tight ${STRONG_TXT}`}>
                {item.label}
              </h3>
              <div className={`text-sm ${MUTED_TXT}`}>
                {item.type || "Item"} •{" "}
                {item.floor ? `Floor ${item.floor}` : item.area || "—"}
              </div>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                status === "ok"
                  ? "bg-emerald-100 text-emerald-700"
                  : status === "fail"
                  ? "bg-rose-100 text-rose-700"
                  : status === "na"
                  ? "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-200"
                  : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
              }`}
            >
              {status.toUpperCase()}
            </span>
          </div>

          {item.notes && (
            <div className={`mt-4 text-sm ${SOFT_TXT}`}>
              <span className="font-medium">Note: </span>
              {item.notes}
            </div>
          )}

          {Array.isArray(inspectionPhotos) && inspectionPhotos.length > 0 && (
            <div className="mt-5">
              <div className={`text-sm ${MUTED_TXT} mb-2`}>
                Inspection photos
              </div>
              <div className="flex gap-2 flex-wrap">
                {inspectionPhotos.map((p, idx) => (
                  <a
                    key={idx}
                    href={p}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-24 h-24 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden ring-1 ring-gray-200 dark:ring-white/10"
                  >
                    <img
                      src={p}
                      alt="evidence"
                      className="w-full h-full object-cover"
                      onError={(ev) => (ev.currentTarget.style.display = "none")}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className={BTN_SOFT}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============================== Página ================================== */
export default function InspectionRun() {
  const inspectionId = useInspectionIdFromRoute();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState(null);
  const [items, setItems] = useState([]);
  const [assetMap, setAssetMap] = useState({});
  const [actingItem, setActingItem] = useState(null);
  const [openGroups, setOpenGroups] = useState({});
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteItemId, setNoteItemId] = useState(null);
  const [noteInitial, setNoteInitial] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputs = useRef({});

  useEffect(() => {
    if (!inspectionId) return;
    (async () => {
      try {
        const [ins, its] = await Promise.all([
          getInspection(inspectionId),
          listItems(inspectionId),
        ]);
        setInspection(ins || null);
        setItems(Array.isArray(its?.items) ? its.items : []);
      } catch {
        alert("Could not load inspection.");
      } finally {
        setLoading(false);
      }
    })();
  }, [inspectionId]);

  useEffect(() => {
    const ids = Array.from(new Set(items.map((it) => it.asset_id).filter(Boolean)));
    if (!ids.length) return;
    (async () => {
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const r = await fetch(`${API_BASE}/api/assets/${id}`, {
              credentials: "include",
            });
            if (!r.ok) return [id, null];
            return [id, await r.json()];
          } catch {
            return [id, null];
          }
        })
      );
      setAssetMap(Object.fromEntries(results));
    })();
  }, [items]);

  const progress = useMemo(() => {
    if (!items.length) return 0;
    const done = items.filter((it) =>
      ["ok", "fail", "na"].includes((it.status || "").toLowerCase())
    ).length;
    return Math.round((done / items.length) * 100);
  }, [items]);

  useEffect(() => {
    if (inspection && inspectionId && !loading)
      updateInspection(inspectionId, { progress }).catch(() => {});
  }, [progress, inspection, inspectionId, loading]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      const key = extractRoomKey(it);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    const entries = Array.from(map.entries());
    entries.sort((a, b) => compareRoomKeys(a[0], b[0]));
    for (const [, arr] of entries)
      arr.sort((x, y) =>
        String(x.type || x.label).localeCompare(String(y.type || y.label))
      );
    return entries;
  }, [items]);

  const toggleGroup = (roomKey) =>
    setOpenGroups((s) => ({ ...s, [roomKey]: !s[roomKey] }));

  const setStatus = async (itemId, status) => {
    try {
      setActingItem(itemId);
      const resp = await updateItemStatus(inspectionId, itemId, { status });
      const newStatus = resp?.item?.status || status;
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, status: newStatus } : it))
      );
    } catch {
      alert("Could not update item.");
    } finally {
      setActingItem(null);
    }
  };

  const openNoteModal = (item) => {
    setNoteItemId(item.id);
    setNoteInitial(item.notes || "");
    setNoteOpen(true);
  };

  const saveNote = async (note) => {
    const id = noteItemId;
    setNoteOpen(false);
    if (!id) return;
    try {
      setActingItem(id);
      const resp = await addItemComment(inspectionId, { item_id: id, note });
      const saved = resp?.item?.notes ?? note;
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, notes: saved } : it))
      );
    } catch {
      alert("Could not save note.");
    } finally {
      setActingItem(null);
      setNoteItemId(null);
    }
  };

  const onPickPhoto = (id) =>
    fileInputs.current[id] && fileInputs.current[id].click();

  const onSelectedPhoto = async (id, ev) => {
    const f = ev.target.files?.[0];
    ev.target.value = "";
    if (!f) return;
    try {
      setActingItem(id);
      const res = await uploadItemPhoto(inspectionId, id, f);
      const photos = res?.item?.photos ?? [];
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, photos } : it))
      );
    } catch {
      alert("Could not upload photo.");
    } finally {
      setActingItem(null);
    }
  };

  const onPause = async () => {
    try {
      await updateInspection(inspectionId, { status: "paused" });
      navigate("/inspections");
    } catch {
      alert("Could not pause inspection.");
    }
  };

  const onComplete = async () => {
    if (!confirm("Mark inspection as completed?")) return;
    try {
      await completeInspection(inspectionId);
      navigate("/inspections");
    } catch {
      alert("Could not complete inspection.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-5 md:p-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-white/70 dark:bg-[#0e0e0e]/70 border-b border-zinc-200 dark:border-zinc-700 mb-5 rounded-b-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-3 p-3">
        <div>
          <h1 className={`text-xl sm:text-2xl font-semibold ${STRONG_TXT}`}>
            Inspection
          </h1>
          <p className={`text-xs sm:text-sm ${MUTED_TXT}`}>
            {inspection
              ? `Scope • ${inspection.scope_type || ""} ${inspection.scope_value || ""}`
              : "Loading..."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onPause} className={BTN_SOFT}>
            Pause
          </button>
          <button onClick={onComplete} className={BTN_PRIMARY}>
            Complete
          </button>
          <Link to="/inspections" className={BTN_SOFT}>
            Back
          </Link>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`${CARD} ${CARD_PAD} mb-4 ${CARD_HOVER}`}>
        <div className="flex items-center gap-3">
          <div className={`text-sm min-w-[88px] ${SOFT_TXT}`}>
            Progress {progress}%
          </div>
          <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
            <motion.div
              animate={{
                width: `${progress}%`,
                scale: progress === 100 ? [1, 1.05, 1] : 1,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-2 bg-[#083A39] dark:bg-[#0A4B4A]"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className={`${CARD} ${CARD_PAD} ${MUTED_TXT}`}>Loading…</div>
      ) : !items.length ? (
        <div className={`${CARD} ${CARD_PAD} ${MUTED_TXT}`}>
          No items found.
        </div>
      ) : (
        grouped.map(([roomKey, list]) => {
          const isOpen = !!openGroups[roomKey];
          return (
            <section key={roomKey} className="space-y-2">
              {/* Header de grupo */}
              <div className={`${CARD} py-2 px-3 md:px-4 ${CARD_HOVER}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-1 rounded bg-[#083A39] dark:bg-[#0A4B4A]" />
                    <div className="text-xs uppercase tracking-wide font-semibold">
                      <span className={STRONG_TXT}>{roomKey}</span>
                      <span className={`ml-2 ${MUTED_TXT}`}>
                        • {list.length} assets
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleGroup(roomKey)}
                    className={`${BTN_SOFT} py-1 text-xs`}
                  >
                    {isOpen ? "Close" : "Open"}
                  </button>
                </div>
              </div>

              {/* Grid responsive de tarjetas */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
                  >
                    {list.map((it) => {
                      const status = String(it.status || "open").toLowerCase();
                      const asset = it.asset_id ? assetMap[it.asset_id] : null;
                      const thumb = pickAssetPhoto(asset);
                      const isActing = actingItem === it.id;
                      return (
                        <motion.li
                          key={it.id}
                          layout
                          whileHover={{ scale: 1.01 }}
                          className={`${CARD} ${CARD_HOVER} ${CARD_PAD} cursor-pointer`}
                          onClick={() => {
                            setDetailItem(it);
                            setDetailOpen(true);
                          }}
                        >
                          <div className="flex items-stretch gap-4">
                            {/* Miniatura */}
                            <div className="w-24 md:w-28 self-stretch rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 ring-1 ring-gray-200 dark:ring-white/10 shrink-0">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt="asset"
                                  className="w-full h-full object-cover"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <div className="w-full h-full grid place-items-center text-gray-400 dark:text-slate-500 text-[10px]">
                                  No image
                                </div>
                              )}
                            </div>

                            {/* Contenido */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className={`text-[11px] ${MUTED_TXT}`}>
                                    {it.type || "Item"} •{" "}
                                    {it.floor ? `Floor ${it.floor}` : it.area || "—"}
                                  </div>
                                  <div className={`font-medium truncate ${STRONG_TXT}`}>
                                    {it.label}
                                  </div>
                                </div>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    status === "ok"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : status === "fail"
                                      ? "bg-rose-100 text-rose-700"
                                      : status === "na"
                                      ? "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-200"
                                      : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                  }`}
                                >
                                  {status.toUpperCase()}
                                </span>
                              </div>

                              {/* Acciones (no abren modal) */}
                              <div
                                className="mt-3 flex flex-wrap gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  disabled={isActing}
                                  onClick={() => setStatus(it.id, "ok")}
                                  className="px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                                >
                                  OK
                                </button>
                                <button
                                  disabled={isActing}
                                  onClick={() => setStatus(it.id, "fail")}
                                  className="px-2 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                                >
                                  Fail
                                </button>
                                <button
                                  disabled={isActing}
                                  onClick={() => setStatus(it.id, "na")}
                                  className="px-2 py-1 rounded-lg bg-gray-800 text-white hover:bg-black disabled:opacity-60"
                                >
                                  N/A
                                </button>
                                <button
                                  disabled={isActing}
                                  onClick={() => setStatus(it.id, "open")}
                                  className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-60 dark:bg-slate-700 dark:hover:bg-slate-600"
                                >
                                  Open
                                </button>

                                <button
                                  disabled={isActing}
                                  onClick={() => openNoteModal(it)}
                                  className="ml-2 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 disabled:opacity-60 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/40 dark:text-indigo-200"
                                >
                                  + Add note
                                </button>

                                <button
                                  disabled={isActing}
                                  onClick={() => onPickPhoto(it.id)}
                                  className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 disabled:opacity-60 dark:bg-sky-900/30 dark:hover:bg-sky-900/40 dark:text-sky-200"
                                >
                                  + Photo
                                </button>
                                <input
                                  ref={(el) => (fileInputs.current[it.id] = el)}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => onSelectedPhoto(it.id, e)}
                                />
                              </div>

                              {/* Nota breve inline */}
                              {it.notes ? (
                                <div className="mt-3 text-xs text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 rounded-lg p-2 ring-1 ring-gray-100 dark:ring-white/10">
                                  <span className="font-medium">Note:</span> {it.notes}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </section>
          );
        })
      )}

      {/* Modales */}
      <AddNoteModal
        open={noteOpen}
        initial={noteInitial}
        onClose={() => setNoteOpen(false)}
        onSave={saveNote}
      />

      <AssetDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        item={detailItem}
        asset={detailItem?.asset_id ? assetMap[detailItem.asset_id] : null}
        inspectionPhotos={Array.isArray(detailItem?.photos) ? detailItem.photos : []}
      />

      {/* Print: fondo claro para legibilidad */}
      <style>{`
        @media print {
          html, body { background: #fff !important; }
          .dark html, .dark body { background: #fff !important; color: #000 !important; }
        }
      `}</style>
    </div>
  );
}
