// frontend/src/components/ManualUploadModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { X, Upload } from "lucide-react";
import api from "../api/client";

const MODAL_CARD =
  "rounded-2xl bg-white dark:bg-[#1d1f24] shadow-xl border border-zinc-200 dark:border-zinc-800 transition-all";
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 bg-[#0B5150] text-white font-medium " +
  "hover:bg-[#0C5F5E] active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-[#0B5150]/60 transition";
const INPUT =
  "w-full border rounded-xl px-3 py-2 border-zinc-300 dark:border-zinc-700 text-zinc-900 " +
  "placeholder-zinc-400 bg-white dark:bg-[#24262c] dark:text-zinc-200 dark:placeholder-zinc-500 " +
  "focus:ring-2 focus:ring-[#0B5150] outline-none transition";

export default function ManualUploadModal({ open, setOpen, onSuccess }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Manual");
  const [file, setFile] = useState(null);
  const [assetId, setAssetId] = useState("");
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef(null);

  /* -------------------- Load assets -------------------- */
  useEffect(() => {
    async function loadAssets() {
      if (!open) return;
      try {
        const res = await api.get("/api/assets/");
        let list = [];

        if (Array.isArray(res.data?.items)) list = res.data.items;
        else if (Array.isArray(res.data)) list = res.data;
        else if (Array.isArray(res.items)) list = res.items;
        else if (Array.isArray(res)) list = res;
        else list = [];

        setAssets(list);
      } catch (err) {
        console.error("Error loading assets:", err);
        setAssets([]);
      }
    }
    loadAssets();
  }, [open]);

  /* -------------------- Drag & Drop -------------------- */
  useEffect(() => {
    if (!open) return;
    const el = dropRef.current;
    if (!el) return;

    const onDragOver = (e) => {
      e.preventDefault();
      el.classList.add("ring-2", "ring-[#0B5150]/60");
    };
    const onDragLeave = () => {
      el.classList.remove("ring-2", "ring-[#0B5150]/60");
    };
    const onDrop = (e) => {
      e.preventDefault();
      el.classList.remove("ring-2", "ring-[#0B5150]/60");
      const f = e.dataTransfer?.files?.[0];
      if (f && f.type === "application/pdf") setFile(f);
      else if (f) alert("Only PDF files are allowed.");
    };

    el.addEventListener("dragover", onDragOver);
    el.addEventListener("dragleave", onDragLeave);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("dragleave", onDragLeave);
      el.removeEventListener("drop", onDrop);
    };
  }, [open]);

  const handleFilePick = (e) => {
    const f = e.target.files?.[0] || null;
    if (f && f.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      return;
    }
    setFile(f);
  };

  /* -------------------- Upload -------------------- */
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !file) {
      alert("Title and PDF are required.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("file", file);
    if (assetId) formData.append("asset_id", assetId);

    try {
      await api.post("/api/manuals/", formData);
      onSuccess?.();
      setOpen(false);
      setTitle("");
      setDescription("");
      setCategory("Manual");
      setFile(null);
      setAssetId("");
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed: " + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  /* -------------------- UI -------------------- */
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-6">
      <div
        className={`w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl ${MODAL_CARD} 
                    p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[95vh]`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Upload Manual (PDF)
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-[#2a2d33] text-zinc-500 dark:text-zinc-300 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form className="space-y-4 sm:space-y-5" onSubmit={handleUpload}>
          {/* Title */}
          <div>
            <label className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={INPUT}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={INPUT}
              rows={3}
            />
          </div>

          {/* Category & Asset */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={INPUT}
              >
                <option value="Manual">Manual</option>
                <option value="HowTo">How-To</option>
                <option value="Troubleshooting">Troubleshooting</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Asset (optional)
              </label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className={INPUT}
              >
                <option value="">-- None --</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} {a.floor ? `(${a.floor})` : ""}{" "}
                    {a.area ? `- ${a.area}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* File Drop Zone */}
          <div
            ref={dropRef}
            className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 
                       bg-zinc-50 dark:bg-[#24262c] p-5 text-center hover:bg-zinc-100/60 
                       dark:hover:bg-zinc-800/40 transition cursor-pointer"
          >
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Drag & drop a PDF here, or click to browse
            </p>
            <div className="mt-3">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFilePick}
                className="block w-full text-sm text-zinc-700 dark:text-zinc-300 file:mr-3 file:py-2 
                           file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium 
                           file:bg-[#0B5150] file:text-white hover:file:bg-[#0C5F5E] cursor-pointer"
              />
            </div>
            {file && (
              <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                Selected: <b>{file.name}</b>
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`${BTN_PRIMARY} w-full mt-4`}
          >
            <Upload className="w-4 h-4" />
            {loading ? "Uploading..." : "Upload Manual"}
          </button>
        </form>
      </div>
    </div>
  );
}
