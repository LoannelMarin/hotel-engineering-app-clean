// frontend/src/components/TaskModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { X, UploadCloud, Image as ImageIcon } from "lucide-react";
import { uploadFile } from "../utils/api";

const empty = {
  title: "",
  description: "",
  status: "Not Started",
  priority: "Medium",
  assignee: "",
  room: "",
  floor: "",
  due_date: "",
  workstream: "",
  image_url: "",
};

export default function TaskModal({ open, initial, onClose, onSave }) {
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (initial) {
      setForm({
        ...empty,
        ...initial,
        due_date: initial.due_date ? initial.due_date.substring(0, 10) : "",
      });
    } else {
      setForm(empty);
    }
  }, [initial]);

  if (!open) return null;

  const submit = () => {
    const payload = { ...form };
    if (!payload.title.trim()) return;
    if (payload.due_date) payload.due_date = `${payload.due_date}T00:00:00`;
    else delete payload.due_date;
    onSave(payload);
  };

  const handleFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file); // { url }
      const url = res?.url || "";
      setForm((f) => ({ ...f, image_url: url }));
    } catch (e) {
      console.error(e);
      alert("Error uploading file");
    } finally {
      setUploading(false);
      setDragOver(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-lg shadow-xl border border-gray-200 dark:border-slate-700">
        <div className="p-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{initial?.id ? "Edit Task" : "New Task"}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Title</label>
            <input
              className="w-full border rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-gray-200 dark:border-slate-700"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Short task title"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Description</label>
            <textarea
              className="w-full border rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-gray-200 dark:border-slate-700"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Details, steps, notes..."
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Status</label>
            <select
              className="w-full border rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-gray-200 dark:border-slate-700"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option>Not Started</option>
              <option>In Progress</option>
              <option>Waiting for Approval</option>
              <option>Complete</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Priority</label>
            <select
              className="w-full border rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-gray-200 dark:border-slate-700"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Assignee (or "All")</label>
            <input
              className="w-full border rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-gray-200 dark:border-slate-700"
              value={form.assignee}
              onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
              placeholder='e.g., "All" or a name'
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Workstream / Required by</label>
            <input
              className="w-full border rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-gray-200 dark:border-slate-700"
              value={form.workstream}
              onChange={(e) => setForm((f) => ({ ...f, workstream: e.target.value }))}
              placeholder='e.g., "Fire Inspection"'
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Room</label>
            <input
              className="w-full border rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-gray-200 dark:border-slate-700"
              value={form.room}
              onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
              placeholder="e.g., 305"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Floor</label>
            <input
              className="w-full border rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-gray-200 dark:border-slate-700"
              value={form.floor}
              onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
              placeholder="e.g., 3"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Due Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-gray-200 dark:border-slate-700"
              value={form.due_date}
              onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
            />
          </div>

          {/* Dropzone + vista previa */}
          <div className="sm:col-span-2">
            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Photo</label>
            <div
              className={`border-2 rounded-lg p-4 transition ${
                dragOver
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-dashed border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  {form.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-400 dark:text-slate-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-slate-700 dark:text-slate-200">
                    {uploading ? "Uploading..." : "Click or drag & drop an image"}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    JPG, PNG o WEBP
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-2 border rounded text-slate-800 dark:text-slate-100 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 inline-flex items-center gap-2"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                >
                  <UploadCloud className="w-4 h-4" />
                  {uploading ? "Uploading" : "Choose file"}
                </button>
              </div>
            </div>

            <input
              className="mt-2 w-full border rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-gray-200 dark:border-slate-700"
              value={form.image_url}
              onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              placeholder="/uploads/your-photo.jpg or https://..."
            />
          </div>
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 border rounded hover:bg-gray-50 dark:hover:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-3 py-2 border rounded bg-gray-900 text-white hover:bg-black dark:bg-indigo-600 dark:hover:bg-indigo-700 border-gray-900"
            disabled={uploading}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
