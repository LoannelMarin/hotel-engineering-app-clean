// src/components/inspections/CommentModal.jsx
import React, { useEffect, useRef, useState } from "react";

export default function CommentModal({ open, item, onClose, onSubmit }) {
  const [text, setText] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (open) {
      setText("");
      setTimeout(() => ref.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border p-4 space-y-3">
          <div className="font-semibold">Add comment</div>
          <div className="text-sm text-gray-600">
            {item?.name ? `Item: ${item.name}` : "—"}
          </div>
          <textarea
            ref={ref}
            rows={4}
            className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-gray-300"
            placeholder="Write a comment…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => text.trim() && onSubmit(text.trim())}
              className="px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-black"
              disabled={!text.trim()}
            >
              Save comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
