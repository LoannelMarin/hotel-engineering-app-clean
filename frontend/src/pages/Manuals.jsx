// frontend/src/pages/Manuals.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  FileText,
  Link as LinkIcon,
  ClipboardList,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import ManualFormModal from "../components/ManualFormModal";
import ManualUploadModal from "../components/ManualUploadModal";
import PdfPreviewModal from "../components/PdfPreviewModal";

/* ==== Styles ==== */
const CARD_ITEM =
  "rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:border-[#0B5150]/30";
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-medium bg-[#0B5150] hover:bg-[#0d6664] text-white active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-[#0B5150]/60 transition";
const BTN_SOFT =
  "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-1.5 bg-[#0B5150] text-white hover:bg-[#0d6664] active:scale-[.98] transition text-sm w-[90px] text-center";
const BTN_ICON =
  "p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition text-rose-600 dark:text-rose-400";
const INPUT_SEARCH =
  "w-full rounded-2xl px-4 py-2 border border-slate-300 placeholder-slate-400 bg-white text-slate-900 dark:bg-[#0a0a0a] dark:border-white/10 dark:placeholder-slate-500 dark:text-white";

/* ==== Helpers ==== */
function absolutize(u) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const API_BASE =
    import.meta.env?.VITE_API_BASE_URL ||
    window.location.origin.replace(":5173", ":5000");
  const base = API_BASE.replace(/\/$/, "");
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}

function isExternal(u = "") {
  return /^https?:\/\//i.test(u || "");
}

function isVideoUrl(u = "") {
  const url = String(u || "").toLowerCase();
  return (
    url.includes("youtube.com/") ||
    url.includes("youtu.be/") ||
    url.includes("vimeo.com/") ||
    url.includes("tiktok.com/") ||
    /\.(mp4|webm|mov|m4v|avi|mkv)(\?|#|$)/.test(url)
  );
}

export default function Manuals() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [openUpload, setOpenUpload] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfTitle, setPdfTitle] = useState("Attachment preview");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [manualsRes, sopsRes] = await Promise.all([
        api.get("/api/manuals/"),
        api.get("/api/sops/"),
      ]);

      const manuals = Array.isArray(manualsRes?.items)
        ? manualsRes.items
        : manualsRes;
      const sops = Array.isArray(sopsRes?.items) ? sopsRes.items : sopsRes;

      const combined = [
        ...manuals.map((m) => ({ ...m, type: "manual" })),
        ...sops.map((s) => ({
          id: `sop-${s.id}`,
          title: s.title,
          description: s.description,
          category: s.category || "HowTo",
          file_url: null,
          asset_name: s.asset_name || null,
          created_at: s.created_at,
          type: "sop",
        })),
      ];

      setItems(combined);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((it) =>
      [it.title, it.description, it.category, it.asset_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [q, items]);

  const categories = [
    { key: "Manual", label: "Manuals" },
    { key: "HowTo", label: "How-To" },
    { key: "Troubleshooting", label: "Troubleshooting" },
  ];

  function openPdf(item) {
    setPdfUrl(absolutize(item.file_url));
    setPdfTitle(item.title || "Attachment preview");
    setPdfOpen(true);
  }

  async function handleDelete(item) {
    if (!window.confirm("Delete this item?")) return;
    try {
      if (item.type === "sop") {
        await api.delete(`/api/sops/${item.id.replace("sop-", "")}`);
      } else {
        await api.delete(`/api/manuals/${item.id}`);
      }
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete item.");
    }
  }

  function renderCard(item) {
    const isSOP = item.type === "sop";
    const isVideo = isVideoUrl(item.file_url);
    const external = isExternal(item.file_url);
    const hasFile = !!item.file_url;

    return (
      <motion.div
        key={item.id ?? `${item.title}-${item.created_at}`}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className={`${CARD_ITEM} flex justify-between items-start gap-4`}
      >
        {/* --- Left content --- */}
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isSOP ? (
              <ClipboardList className="w-4 h-4 text-[#0B5150]" />
            ) : (
              <FileText className="w-4 h-4 text-[#0B5150]" />
            )}
            <div className="font-semibold text-sm truncate text-zinc-900 dark:text-zinc-200">
              {item.title || "(untitled)"}
            </div>
          </div>

          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            {item.category || "—"}{" "}
            {isSOP && (
              <span className="ml-1 text-[10px] uppercase text-[#0B5150] font-semibold">
                (SOP)
              </span>
            )}
          </div>

          <div className="text-xs text-zinc-500 dark:text-zinc-500">
            {item.created_at ? String(item.created_at).slice(0, 10) : ""}
          </div>

          {item.description && (
            <div className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2">
              {item.description}
            </div>
          )}

          {item.asset_name && (
            <div className="text-xs font-medium text-[#0B5150] dark:text-emerald-400 mt-1">
              Asset: <span className="font-semibold">{item.asset_name}</span>
            </div>
          )}
        </div>

        {/* --- Right buttons column --- */}
        <div className="flex flex-col items-end gap-2 shrink-0 w-[90px]">
          {isSOP ? (
            <button
              onClick={() =>
                navigate(`/sop/view/${item.id.replace("sop-", "")}`)
              }
              className={BTN_SOFT}
            >
              <ExternalLink className="w-3 h-3" /> Open
            </button>
          ) : hasFile ? (
            isVideo ? (
              <a
                href={item.file_url}
                target="_blank"
                rel="noreferrer"
                className={BTN_SOFT}
              >
                Watch
              </a>
            ) : external ? (
              <a
                href={item.file_url}
                target="_blank"
                rel="noreferrer"
                className={BTN_SOFT}
              >
                Open
              </a>
            ) : (
              <button onClick={() => openPdf(item)} className={BTN_SOFT}>
                Open
              </button>
            )
          ) : null}

          <button
            onClick={() => {
              setEditing(item);
              setOpenForm(true);
            }}
            className={BTN_SOFT}
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>

          <button onClick={() => handleDelete(item)} className={BTN_ICON}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
          Manuals & SOPs
        </h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setOpenForm(true)} className={BTN_SOFT}>
            <LinkIcon className="w-4 h-4" /> New Link/Video
          </button>
          <button onClick={() => setOpenUpload(true)} className={BTN_PRIMARY}>
            <Plus className="w-4 h-4" /> Upload PDF
          </button>
          <button
            onClick={() => navigate("/sop/create")}
            className={BTN_PRIMARY}
          >
            <ClipboardList className="w-4 h-4" /> Add SOP
          </button>
        </div>
      </div>

      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={INPUT_SEARCH}
          placeholder="Search by title, description, category..."
        />
        <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin w-6 h-6 text-slate-500 dark:text-slate-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const group = filtered.filter((it) => it.category === cat.key);
            return (
              <div key={cat.key} className="space-y-3">
                <div className="pb-2 border-b border-zinc-300/60 dark:border-white/10">
                  <h3 className="text-lg font-semibold">{cat.label}</h3>
                </div>
                {group.length === 0 ? (
                  <div className="text-gray-500 dark:text-slate-400 text-sm">
                    No results.
                  </div>
                ) : (
                  group.map((item) => <div key={item.id}>{renderCard(item)}</div>)
                )}
              </div>
            );
          })}
        </div>
      )}

      <ManualUploadModal
        open={openUpload}
        setOpen={setOpenUpload}
        onSuccess={loadAll}
      />
      <ManualFormModal
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSaved={loadAll}
        editing={editing}
      />
      <PdfPreviewModal
        open={pdfOpen}
        url={pdfUrl}
        title={pdfTitle}
        onClose={() => setPdfOpen(false)}
      />
    </div>
  );
}
