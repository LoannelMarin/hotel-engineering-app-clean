import React, { useState, useEffect, useRef } from "react";

export default function BulkScanModal({ open, onClose, onSubmit }) {
  const [raw, setRaw] = useState("");
  const [mode, setMode] = useState("out"); // default OUT
  const [parsed, setParsed] = useState([]);
  const [summary, setSummary] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setRaw("");
      setMode("out"); // always start as OUT
      setParsed([]);
      setSummary([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const doParse = (text, modeVal = mode) => {
    const tokens = text
      .split(/[\s,;|]+/g)
      .map((t) => t.trim())
      .filter(Boolean);

    setParsed(tokens);

    const map = new Map();
    for (const t of tokens) {
      map.set(t, (map.get(t) || 0) + 1);
    }
    const list = Array.from(map.entries()).map(([code, count]) => ({
      code,
      count,
      delta: modeVal === "in" ? count : -count,
    }));
    setSummary(list);
  };

  const handleChange = (val) => {
    setRaw(val);
    doParse(val);
  };

  useEffect(() => {
    if (raw) doParse(raw, mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const total = summary.reduce((acc, s) => acc + s.count, 0);
  const uniques = summary.length;

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900 dark:text-zinc-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Bulk Scan</h2>
          <div className="inline-flex rounded-xl border border-gray-300 dark:border-zinc-700 overflow-hidden">
            <button
              className={`px-3 py-1.5 text-sm ${
                mode === "in"
                  ? "bg-blue-600 text-white"
                  : "bg-transparent text-gray-700 dark:text-zinc-200"
              }`}
              onClick={() => setMode("in")}
              type="button"
            >
              IN (Add)
            </button>
            <button
              className={`px-3 py-1.5 text-sm ${
                mode === "out"
                  ? "bg-red-600 text-white"
                  : "bg-transparent text-gray-700 dark:text-zinc-200"
              }`}
              onClick={() => setMode("out")}
              type="button"
            >
              OUT (Subtract)
            </button>
          </div>
        </div>

        <label className="block text-sm mb-3">
          <span className="block mb-1">
            Paste all barcodes (scanner memory dump):
          </span>
          <textarea
            ref={inputRef}
            value={raw}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full h-40 rounded-xl border border-gray-300 px-3 py-2 dark:bg-zinc-800 dark:border-zinc-700"
            placeholder="Paste codes here..."
          />
        </label>

        <div className="text-sm text-gray-600 dark:text-zinc-400 mb-3">
          <span className="mr-4">Codes parsed: <b>{total}</b></span>
          <span>Unique codes: <b>{uniques}</b></span>
        </div>

        {summary.length > 0 && (
          <div className="overflow-auto rounded-xl border border-gray-200 dark:border-zinc-800">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700 dark:bg-zinc-900/50 dark:text-zinc-300">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Barcode</th>
                  <th className="px-3 py-2 text-right font-semibold">Occurrences</th>
                  <th className="px-3 py-2 text-right font-semibold">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                {summary.map((row) => (
                  <tr key={row.code} className="hover:bg-gray-100 dark:hover:bg-zinc-800">
                    <td className="px-3 py-2 font-mono">{row.code}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.count}</td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums ${
                        row.delta >= 0 ? "text-blue-600" : "text-red-600"
                      }`}
                    >
                      {row.delta >= 0 ? `+${row.delta}` : row.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            disabled={summary.length === 0}
            className="px-3 py-2 rounded-xl border border-blue-300 bg-blue-600 text-white disabled:opacity-50"
            onClick={() => {
              const payload = summary.map((s) => ({
                barcode: s.code,
                delta: s.delta,
              }));
              onSubmit?.(payload, { mode });
              onClose?.();
            }}
            type="button"
          >
            Process
          </button>
        </div>
      </div>
    </div>
  );
}
