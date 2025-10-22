// src/components/inspections/InspectionCard.jsx
import React from "react";
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Camera,
  AlertTriangle,
} from "../ui/Icons";

export default function InspectionCard({
  item,
  onPass,
  onFail,
  onComment,
  onPhoto,
}) {
  const statusChip =
    item.status === "pass"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : item.status === "fail"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <div className="border rounded-2xl p-4 bg-white h-full flex flex-col">
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
          {item.photo_url ? (
            <img
              src={item.photo_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              No photo
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <div className="font-medium truncate">{item.name}</div>
              {item.code && (
                <div className="text-xs text-gray-500 truncate">{item.code}</div>
              )}
            </div>
            <span
              className={[
                "px-2 py-0.5 rounded-full text-xs border whitespace-nowrap",
                statusChip,
              ].join(" ")}
            >
              {item.status === "pending"
                ? "Pending"
                : item.status === "pass"
                ? "Pass"
                : "Fail"}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onPass}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
              title="Mark as Pass"
            >
              <CheckCircle2 size={16} />
              <span className="text-sm">Pass</span>
            </button>
            <button
              onClick={onFail}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
              title="Mark as Fail"
            >
              <XCircle size={16} />
              <span className="text-sm">Fail</span>
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={onComment}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
                title="Add comment"
              >
                <MessageSquare size={16} />
                <span className="text-xs">{item.comment_count || 0}</span>
              </button>
              <button
                onClick={onPhoto}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
                title="Attach photo"
              >
                <Camera size={16} />
                <span className="text-xs">{item.photo_count || 0}</span>
              </button>
            </div>
          </div>

          {item.status === "fail" && (
            <div className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-2 inline-flex items-center gap-2">
              <AlertTriangle size={14} />
              Marked as failed — add a comment or photo as evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
