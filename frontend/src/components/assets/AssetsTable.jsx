// frontend/src/components/assets/AssetsTable.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ---------- helpers para imágenes ---------- */
function getApiBase() {
  const env = typeof import.meta !== "undefined" && import.meta.env;
  if (env?.VITE_API_BASE_URL)
    return String(env.VITE_API_BASE_URL).replace(/\/$/, "");
  if (typeof window !== "undefined") {
    return window.location.origin.replace(":5173", ":5000");
  }
  return "http://localhost:5000";
}
function absolutize(u) {
  if (!u) return "";
  const s = String(u).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const base = getApiBase();
  return `${base}${s.startsWith("/") ? s : `/${s}`}`;
}
function parsePhotosField(photos) {
  if (!photos) return [];
  try {
    if (typeof photos === "string" && photos.trim().startsWith("[")) {
      const arr = JSON.parse(photos);
      if (Array.isArray(arr)) {
        return arr
          .map((x) =>
            typeof x === "string"
              ? x
              : x && typeof x === "object" && (x.url || x.href || x.src)
              ? x.url || x.href || x.src
              : ""
          )
          .filter(Boolean);
      }
    }
  } catch {}
  if (typeof photos === "string") {
    return photos
      .split(/[\n,;|]+/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(photos)) return photos.filter(Boolean);
  return [];
}
function resolveAssetImage(a = {}) {
  const direct = [
    a.photo_url,
    a.image_url,
    a.thumbnail_url,
    a.picture_url,
    a.asset_photo_url,
    a.asset_image_url,
    a.photo,
    a.image,
    a.thumb,
    a.thumbnail,
  ].find((u) => typeof u === "string" && u.trim());
  if (direct) return absolutize(direct);
  const list = parsePhotosField(a.photos);
  if (list.length) return absolutize(list[0]);
  const alt =
    (Array.isArray(a.photos) && a.photos[0]) ||
    (Array.isArray(a.images) && a.images[0]) ||
    "";
  if (alt) return absolutize(alt);
  return "";
}

/* ---------- UI helpers ---------- */
const TD_BASE =
  "px-4 sm:px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 text-left align-middle";

/* ✅ Compacto, títulos en negrita, info normal, separadores finos */
function Kvp({ label, children }) {
  return (
    <div className="pb-1.5 mb-1 border-b border-zinc-200/60 dark:border-zinc-800/70">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className="text-[14px] text-zinc-900 dark:text-zinc-100 leading-tight">
        {children ?? "—"}
      </div>
    </div>
  );
}

function RowActions({ item, onEdit, onDelete, compact = false, stop }) {
  const baseBtn =
    "rounded-lg border text-xs font-medium transition px-2 py-0.5 select-none";
  const editCls =
    "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-[#1a1a1a]";
  const delCls =
    "border-red-500/60 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30";

  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "justify-end"}`}>
      <button
        type="button"
        className={`${baseBtn} ${editCls}`}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          stop?.();
          onEdit?.(item);
        }}
      >
        Edit
      </button>
      <button
        type="button"
        className={`${baseBtn} ${delCls}`}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          stop?.();
          if (!onDelete) return;
          const ok = window.confirm("Delete this asset?");
          if (ok) onDelete(item);
        }}
      >
        Delete
      </button>
    </div>
  );
}

/* ---------- MAIN TABLE ---------- */
export default function AssetsTable({ items = [], loading = false, onEdit, onDelete }) {
  const [openId, setOpenId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, dir: "asc" });
  const rowRefs = useRef({});

  const headers = useMemo(
    () => [
      { key: "photo", label: "Photo" },
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
      { key: "location", label: "Location" },
      { key: "manufacturer", label: "Manufacturer" },
      { key: "model_no", label: "Model" },
      { key: "serial_no", label: "Serial" },
      { key: "actions", label: "Actions" },
    ],
    []
  );

  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return items;
    const sorted = [...items].sort((a, b) => {
      const av = (a[sortConfig.key] || "").toString().toLowerCase();
      const bv = (b[sortConfig.key] || "").toString().toLowerCase();
      if (av < bv) return sortConfig.dir === "asc" ? -1 : 1;
      if (av > bv) return sortConfig.dir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [items, sortConfig]);

  function handleSort(key) {
    if (key === "photo" || key === "actions") return;
    setSortConfig((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  // 📍 Al expandir, centra la fila en el viewport del contenedor con scroll
  useEffect(() => {
    if (openId && rowRefs.current[openId]) {
      rowRefs.current[openId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [openId]);

  return (
    // ⬇️ Igual que Quotes: contenedor con scroll interno y fondo day/dark
    <div className="absolute inset-0 overflow-y-auto bg-white dark:bg-zinc-900">
      <table className="w-full text-[15px] leading-6 border-separate [border-spacing:0] cursor-default select-none">
        {/* Header sticky y ordenable (fondo negro en dark, blanco en day) */}
        <thead className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            {headers.map((h) => (
              <th
                key={h.key}
                onClick={() => handleSort(h.key)}
                className={`px-4 sm:px-5 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300 select-none ${
                  h.key === "photo" || h.key === "actions" ? "" : "cursor-pointer"
                } ${sortConfig.key === h.key ? "text-[#0B5150]" : "hover:text-[#0B5150]/80 transition"}`}
              >
                <div className="flex items-center gap-1">
                  {h.label}
                  {sortConfig.key === h.key && (
                    <span className="text-xs opacity-70">
                      {sortConfig.dir === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading && (
            <tr>
              <td
                colSpan={headers.length}
                className="py-6 text-center text-zinc-500 dark:text-zinc-400"
              >
                Loading…
              </td>
            </tr>
          )}

          {!loading &&
            sortedItems.map((a, idx) => {
              const isLast = idx === sortedItems.length - 1;
              const img = resolveAssetImage(a);
              const isOpen = openId === a.id;
              const isIT = (a.type || "").toLowerCase() === "it";

              return (
                <React.Fragment key={a.id ?? `${a.name}-${idx}`}>
                  <tr
                    ref={(el) => (rowRefs.current[a.id] = el)}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      setOpenId((cur) => (cur === a.id ? null : a.id));
                    }}
                    className={[
                      "bg-transparent transition",
                      "text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-[#1a1a1a]",
                      "cursor-pointer",
                      isLast ? "last:[&>td]:border-b-0" : "",
                    ].join(" ")}
                  >
                    <td className={TD_BASE}>
                      {img ? (
                        <img
                          src={img}
                          alt={a.name || "Asset photo"}
                          className="w-24 h-16 rounded-lg object-cover border border-zinc-300 dark:border-zinc-700"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-24 h-16 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 flex items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
                          —
                        </div>
                      )}
                    </td>

                    <td className={`${TD_BASE} font-semibold text-zinc-900 dark:text-zinc-100`}>
                      {a.name || "—"}
                    </td>
                    <td className={TD_BASE}>{a.type || "—"}</td>
                    <td className={TD_BASE}>{a.location || a.area || a.floor || "—"}</td>
                    <td className={TD_BASE}>{a.manufacturer || a.vendor || "—"}</td>
                    <td className={TD_BASE}>{a.model_no || a.model || "—"}</td>
                    <td className={TD_BASE}>{a.serial_no || a.serial || "—"}</td>
                    <td className={TD_BASE}>
                      <RowActions item={a} onEdit={onEdit} onDelete={onDelete} compact />
                    </td>
                  </tr>

                  {/* Expansión con AnimatePresence */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <tr>
                        <td
                          colSpan={headers.length}
                          className="p-0 border-b border-zinc-200 dark:border-zinc-800"
                        >
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 sm:px-5 pb-4 pt-2">
                              <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-3">
                                {/* Imagen grande */}
                                <div className="lg:sticky lg:top-16">
                                  {img ? (
                                    <img
                                      src={img}
                                      alt={a.name}
                                      className="w-full max-w-[300px] aspect-[4/3] object-cover rounded-lg border border-zinc-300 dark:border-zinc-700"
                                    />
                                  ) : (
                                    <div className="w-full max-w-[300px] aspect-[4/3] rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/10 flex items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
                                      —
                                    </div>
                                  )}
                                </div>

                                {/* Detalles */}
                                <div className="space-y-3">
                                  <div
                                    className={`grid grid-cols-2 ${
                                      isIT ? "xl:grid-cols-2" : "xl:grid-cols-1"
                                    } gap-3`}
                                  >
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                      <Kvp label="Floor">{a.floor}</Kvp>
                                      <Kvp label="Area">{a.area}</Kvp>
                                      <Kvp label="Location">{a.location}</Kvp>
                                      <Kvp label="PM Frequency">{a.pm_frequency}</Kvp>
                                      <Kvp label="Install Date">
                                        {a.install_date?.slice?.(0, 10)}
                                      </Kvp>
                                      <Kvp label="Warranty Exp.">
                                        {a.warranty_expiration?.slice?.(0, 10)}
                                      </Kvp>
                                      <Kvp label="Next Service">
                                        {a.next_service_at?.slice?.(0, 10)}
                                      </Kvp>
                                      <Kvp label="Manufacturer">{a.manufacturer}</Kvp>
                                    </div>

                                    {/* 🔁 IT Details (restaurado) */}
                                    {isIT && (
                                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 shadow-sm">
                                        <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 text-[12px] font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-200">
                                          IT Details
                                        </div>
                                        <div className="p-3 grid grid-cols-2 gap-x-6 gap-y-3">
                                          <Kvp label="Hostname">{a.hostname}</Kvp>
                                          <Kvp label="VLAN">{a.vlan_id}</Kvp>
                                          <Kvp label="IP">{a.ip_address}</Kvp>
                                          <Kvp label="MAC">{a.mac_address}</Kvp>
                                          <Kvp label="Ports">
                                            {a.ports_used != null || a.ports_total != null
                                              ? `${a.ports_used ?? 0}/${a.ports_total ?? 0}`
                                              : "—"}
                                          </Kvp>
                                          <Kvp label="OS">{a.os_version}</Kvp>
                                          <Kvp label="Firmware">{a.firmware_version}</Kvp>
                                          <Kvp label="Port Notes">
                                            <div className="whitespace-pre-wrap">
                                              {a.port_notes || "—"}
                                            </div>
                                          </Kvp>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Notes */}
                                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 shadow-sm">
                                    <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 text-[12px] font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
                                      Notes
                                    </div>
                                    <div className="p-3 text-[14px] text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">
                                      {a.notes || a.note || "—"}
                                    </div>
                                  </div>

                                  {/* Linked Docs */}
                                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shadow-sm">
                                    <LinkedDocs assetId={a.id} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- LinkedDocs ---------- */
function LinkedDocs({ assetId }) {
  const [docs, setDocs] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!assetId) return;
    setLoading(true);
    fetch(`/api/assets/${assetId}/linked`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setDocs(data))
      .catch(() => setDocs(null))
      .finally(() => setLoading(false));
  }, [assetId]);

  if (loading)
    return <div className="text-sm text-zinc-400 mt-2">Loading linked documents…</div>;

  if (!docs || (!docs.sops?.length && !docs.manuals?.length))
    return (
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        No linked documents.
      </div>
    );

  return (
    <div className="p-2">
      <div className="text-[12px] font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300 mb-1.5 border-b border-zinc-300/40 dark:border-zinc-700/60 pb-1">
        Linked Documents
      </div>
      <ul className="space-y-1 text-[14px] text-zinc-900 dark:text-zinc-100">
        {docs.sops?.map((s) => (
          <li key={`sop-${s.id}`} className="flex items-center gap-2">
            <span className="text-[#0B5150] font-semibold">(SOP)</span>
            <a href={`/sop/view/${s.id}`} className="hover:underline hover:text-[#0B5150]">
              {s.title || "Untitled SOP"}
            </a>
          </li>
        ))}
        {docs.manuals?.map((m) => (
          <li key={`manual-${m.id}`} className="flex items-center gap-2">
            <span className="text-sky-600 font-semibold">(Manual)</span>
            {m.file_url ? (
              <a
                href={m.file_url}
                target="_blank"
                rel="noreferrer"
                className="hover:underline hover:text-sky-600"
              >
                {m.title || "Untitled Manual"}
              </a>
            ) : (
              <span>{m.title || "Untitled Manual"}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
