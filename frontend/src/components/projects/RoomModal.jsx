// src/components/projects/RoomModal.jsx
import React, { useMemo, useState, useEffect } from "react";
import { X, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchWithAuth } from "../../utils/api";

/* ------------------ Normalizador de status ------------------ */
function normalizeKey(labelOrKey) {
  if (!labelOrKey) return "not_started";
  const s = String(labelOrKey).trim().toLowerCase();
  const aliases = {
    "not started": "not_started",
    not_started: "not_started",
    "in progress": "in_progress",
    in_progress: "in_progress",
    completed: "completed",
    done: "completed",
    "n/a": "na",
    na: "na",
  };
  return aliases[s] || s.replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

/* Combina defaults + legend del proyecto → array {key,label,color} */
function useLegendOptions(legend) {
  const DEFAULTS = {
    "Not Started": "#FFFFFF",
    "In Progress": "#4F46E5",
    "Completed": "#15803D",
    "N/A": "#94A3B8",
  };

  const entries = [];
  Object.entries(DEFAULTS).forEach(([label, color]) => {
    entries.push({
      key: normalizeKey(label),
      label,
      color,
    });
  });

  Object.entries(legend || {}).forEach(([k, v]) => {
    let label, color;
    if (v && typeof v === "object" && (v.label || v.color)) {
      label = v.label || k;
      color = v.color || "#94A3B8";
    } else {
      label = k;
      color = v || "#94A3B8";
    }
    const key = normalizeKey(label);
    if (!entries.some((e) => e.key === key)) {
      entries.push({ key, label, color });
    }
  });

  return entries;
}

/* ------------------ Modal principal ------------------ */
export default function RoomModal({
  open,
  projectId,
  roomNumber,
  legend = {},
  current = { statusKey: "completed", statusLabel: "Completed", notes: "" },
  busy = false,
  onClose,
  onSave,
}) {
  const { user } = useAuth();
  const options = useLegendOptions(legend);

  const [form, setForm] = useState(() => ({
    statusKey: normalizeKey(current.statusKey || "completed"),
    statusLabel: current.statusLabel || "Completed",
    notes: current.notes || "",
  }));

  const [audits, setAudits] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const baseInput =
    "rounded-xl border px-3 py-2 text-sm shadow-sm w-full transition " +
    "bg-[var(--surface-1)] border-[var(--border-1)] text-[var(--text-1)] " +
    "focus:outline-none focus:ring-2 focus:ring-[#0B5150]";

  /* 🔄 Cargar historial de auditoría */
  useEffect(() => {
    if (!open || !projectId || !roomNumber) return;
    (async () => {
      try {
        setLoadingAudit(true);
        const res = await fetchWithAuth(
          `/api/projects/${projectId}/room/${roomNumber}/audits`
        );
        setAudits(res.items || []);
      } catch (err) {
        console.error("Error loading audits:", err);
      } finally {
        setLoadingAudit(false);
      }
    })();
  }, [open, projectId, roomNumber]);

  const handleChangeStatus = (val) => {
    const k = normalizeKey(val);
    const found = options.find((o) => o.key === k);
    const label = found ? found.label : val;
    setForm((f) => ({ ...f, statusKey: k, statusLabel: label }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
      {/* 📱 Mobile → drawer style */}
      <div
        className="w-full sm:max-w-md sm:rounded-2xl sm:shadow-2xl sm:border sm:border-[var(--border-1)]
                   bg-[var(--surface-1)] sm:relative flex flex-col sm:p-5
                   animate-fadeIn sm:translate-y-0 translate-y-2 sm:max-h-[90vh] max-h-[90vh] 
                   overflow-y-auto rounded-t-3xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-0 pt-4 sm:pt-0 pb-3 border-b sm:border-0 border-[var(--border-1)]">
          <h3 className="text-lg font-semibold text-[var(--text-1)]">
            Room {roomNumber}
          </h3>
          <button
            type="button"
            className="rounded-md p-2 hover:bg-[var(--surface-2)] transition"
            onClick={onClose}
            disabled={busy}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Campos */}
        <div className="space-y-4 p-5 sm:p-0">
          {/* Status selector */}
          <div>
            <label className="text-sm mb-1 block text-[var(--text-2)]">
              Status
            </label>
            <select
              value={form.statusKey}
              onChange={(e) => handleChangeStatus(e.target.value)}
              className={baseInput}
              disabled={busy}
            >
              {options.map((op) => (
                <option key={op.key} value={op.key}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm mb-1 block text-[var(--text-2)]">
              Notes
            </label>
            <textarea
              className={baseInput + " min-h-[100px] resize-y"}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Optional notes"
              disabled={busy}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-0 pb-5 pt-3 flex flex-col sm:flex-row justify-end gap-3 border-t sm:border-0 border-[var(--border-1)] mt-4">
          <button
            type="button"
            className="rounded-lg border px-4 py-2 text-sm
                       border-[var(--border-1)] bg-[var(--surface-1)] 
                       hover:bg-[var(--surface-2)] text-[var(--text-1)] transition w-full sm:w-auto"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-[#0B5150] px-4 py-2 text-sm text-white 
                       font-medium hover:opacity-90 disabled:opacity-60 transition w-full sm:w-auto"
            disabled={busy}
            onClick={() => {
              const now = new Date().toISOString();
              const updatedBy = user?.name || user?.email || "Unknown";
              const selected = options.find(
                (o) => o.key === form.statusKey
              );
              const color = selected?.color || "#FFFFFF";
              onSave?.({
                status: form.statusKey,
                statusLabel: form.statusLabel,
                color,
                notes: form.notes,
                updated_at: now,
                updated_by: updatedBy,
              });
            }}
          >
            Save
          </button>
        </div>

        {/* 🕓 Audit History */}
        <div className="px-5 sm:px-0 pb-6">
          <div className="flex items-center gap-2 mb-2 mt-3">
            <Clock size={16} className="text-[#0B5150]" />
            <h4 className="font-medium text-sm text-[var(--text-1)]">
              Last Updates
            </h4>
          </div>

          {loadingAudit ? (
            <p className="text-sm text-[var(--text-2)] italic">
              Loading history…
            </p>
          ) : audits.length === 0 ? (
            <p className="text-sm text-[var(--text-2)] italic">
              No previous updates.
            </p>
          ) : (
            <ul className="max-h-40 overflow-y-auto pr-1 text-sm space-y-1">
              {audits.map((a) => (
                <li
                  key={a.id}
                  className="border-b border-[var(--border-1)] py-1 text-[var(--text-2)]"
                >
                  <span className="font-medium text-[var(--text-1)]">
                    {a.updated_by || "Unknown"}
                  </span>{" "}
                  changed to{" "}
                  <span className="font-semibold text-[#0B5150]">
                    {a.new_status}
                  </span>
                  <div className="text-xs opacity-80">
                    {new Date(a.created_at).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
