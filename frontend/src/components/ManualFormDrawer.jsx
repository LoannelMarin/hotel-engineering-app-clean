// frontend/src/components/ManualFormDrawer.jsx
import React, { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Upload } from "lucide-react";
import { toast } from "sonner";
import { fetchWithAuth } from "../utils/api";
import AssetSelector from "./AssetSelector";

export default function ManualFormDrawer({ open, onClose, onSaved, editing, assets }) {
  const [form, setForm] = useState({
    title: "",
    category: "",
    file: null,
    asset_id: "",
  });

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title || "",
        category: editing.category || "",
        asset_id: editing.asset_id || "",
        file: null,
      });
    } else {
      setForm({
        title: "",
        category: "",
        file: null,
        asset_id: "",
      });
    }
  }, [editing]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setForm((prev) => ({ ...prev, file: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.category) {
      toast.error("Title and category are required");
      return;
    }

    const data = new FormData();
    data.append("title", form.title);
    data.append("category", form.category);
    data.append("asset_id", form.asset_id);
    if (form.file) data.append("file", form.file);

    const url = editing ? `/api/manuals/${editing.id}` : "/api/manuals/";
    const method = editing ? "PUT" : "POST";

    try {
      const response = await fetchWithAuth(url, { method, body: data });
      if (response.ok) {
        const json = await response.json();
        onSaved(json);
        onClose();
        toast.success(`Manual ${editing ? "updated" : "uploaded"} successfully`);
      } else {
        toast.error("Failed to save manual");
      }
    } catch (error) {
      toast.error("Error saving manual");
    }
  };

  const items = assets?.items || [];

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          className="fixed inset-0 z-50 overflow-hidden"
        >
          {/* Drawer animado */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[90%] md:w-[80%] lg:w-[60%] max-w-2xl 
                       bg-white dark:bg-zinc-900/95 backdrop-blur-sm shadow-2xl 
                       border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
              <Dialog.Title className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {editing ? "Edit Manual" : "Upload Manual"}
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-5 space-y-5 text-sm sm:text-base">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Enter manual title"
                  className="w-full mt-1 rounded-xl border border-zinc-300 dark:border-zinc-700 
                             bg-transparent px-3 py-2 focus:ring-2 focus:ring-[#0B5150] outline-none"
                  required
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Category
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full mt-1 rounded-xl border border-zinc-300 dark:border-zinc-700 
                             bg-transparent px-3 py-2 focus:ring-2 focus:ring-[#0B5150] outline-none"
                  required
                >
                  <option value="">Select category</option>
                  <option value="manual">Manual</option>
                  <option value="procedure">Procedure</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {/* Asset opcional */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Asset (optional)
                </label>
                <AssetSelector
                  items={items}
                  value={form.asset_id}
                  onChange={(value) => setForm((f) => ({ ...f, asset_id: value }))}
                />
              </div>

              {/* Archivo */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  File
                </label>
                <input
                  type="file"
                  name="file"
                  onChange={handleChange}
                  accept=".pdf,.doc,.docx,.mp4,.jpg,.jpeg,.png"
                  className="w-full mt-1 file-input file-input-bordered border-zinc-300 dark:border-zinc-700 rounded-xl bg-transparent text-sm"
                />
              </div>

              {/* Botón */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0B5150] text-white 
                             py-2.5 hover:bg-[#0C5F5E] transition font-medium shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  {editing ? "Update Manual" : "Upload Manual"}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Fondo oscuro */}
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-[2px]" />
        </Dialog>
      )}
    </AnimatePresence>
  );
}
