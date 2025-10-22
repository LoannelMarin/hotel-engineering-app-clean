// frontend/src/components/ManualFormModal.jsx
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
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

export default function ManualFormModal({ open, onClose, onSaved, editing }) {
  const isEdit = Boolean(editing);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Manual",
    file_url: "",
    asset_id: "",
  });
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---------------------- Load assets ---------------------- */
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

  /* ---------------------- Load edit data ---------------------- */
  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title || "",
        description: editing.description || "",
        category: editing.category || "Manual",
        file_url: editing.file_url || "",
        asset_id: editing.asset_id || "",
      });
    } else {
      setForm({
        title: "",
        description: "",
        category: "Manual",
        file_url: "",
        asset_id: "",
      });
    }
  }, [editing, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  /* ---------------------- Submit ---------------------- */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title) return;

    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      file_url: form.file_url || null,
      asset_id: form.asset_id || null,
    };

    try {
      setLoading(true);

      if (isEdit) {
        const rawId = String(editing?.id || "");
        const isSop = rawId.startsWith("sop-");
        let realId = 0;

        if (isSop) realId = parseInt(rawId.replace("sop-", ""), 10);
        else realId = parseInt(rawId.replace(/\D/g, ""), 10);

        if (!realId || isNaN(realId)) {
          alert("Invalid manual ID");
          console.error("❌ Invalid ID for PUT:", rawId);
          return;
        }

        const endpoint = isSop ? `/api/sops/${realId}` : `/api/manuals/${realId}`;
        await api.put(endpoint, payload);
      } else {
        await api.post("/api/manuals/", payload);
      }

      onSaved?.();
      onClose?.();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Save failed: " + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-6">
      <div
        className={`w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl ${MODAL_CARD} 
                    p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[95vh]`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {isEdit ? "Edit Manual / SOP" : "New Manual / SOP"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-[#2a2d33] 
                       text-zinc-500 dark:text-zinc-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
          {/* Title */}
          <div>
            <label className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Title
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className={INPUT}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
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
                name="category"
                value={form.category}
                onChange={handleChange}
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
                name="asset_id"
                value={form.asset_id}
                onChange={handleChange}
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

          {/* File URL */}
          <div>
            <label className="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              File / Video URL (optional)
            </label>
            <input
              name="file_url"
              value={form.file_url}
              onChange={handleChange}
              placeholder="https://youtube.com/... or /uploads/manuals/file.pdf"
              className={INPUT}
            />
            <p className="text-xs text-zinc-500 mt-1 dark:text-zinc-400">
              For local PDF uploads use the Upload PDF button.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 
                         text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#2a2d33] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`w-full sm:w-auto ${BTN_PRIMARY}`}
            >
              {loading ? "Saving..." : isEdit ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
