// src/components/inspections/PhotoAttachModal.jsx
import React, { useEffect, useState } from "react";

export default function PhotoAttachModal({ open, item, onClose, onSubmit }) {
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (open) setFile(null);
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (file) onSubmit(file);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border p-4 space-y-3">
          <div className="font-semibold">Attach photo</div>
          <div className="text-sm text-gray-600">
            {item?.name ? `Item: ${item.name}` : "—"}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border file:bg-white hover:file:bg-gray-50"
          />

          {file && (
            <div className="text-xs text-gray-600">
              Selected: <span className="font-medium">{file.name}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-black disabled:opacity-50"
              disabled={!file}
            >
              Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
