// frontend/src/components/QuoteFormDrawer.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, DollarSign, ChevronDown, Check, Paperclip } from "lucide-react";
import { fetchWithAuth } from "../utils/api";

/** Drawer lateral para crear/editar Quotes */
const STATUS_SEGMENTS = ["Pending", "Approved", "Capex Submitted", "Denied"];
const INPUT_GHOST =
  "w-full bg-transparent px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-100 transition-colors duration-150";
const FILE_INPUT_OVERLAY = "absolute inset-0 opacity-0 cursor-pointer";

export default function QuoteFormDrawer({ open, initial, vendors = [], onClose, onSaved }) {
  const [form, setForm] = useState(empty());
  const [pdfFile, setPdfFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const initialRef = useRef(empty());

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const API_BASE =
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
    (typeof window !== "undefined" ? window.location.origin.replace(":5173", ":5000") : "http://localhost:5000");

  useEffect(() => {
    if (!open) return;
    const base = initial ? normalize(initial) : empty();
    setForm(base);
    initialRef.current = base;
    setPdfFile(null);
    setDragOver(false);
    loadTasks();
  }, [open, initial]);

  function empty() {
    return {
      quote_number: "",
      vendor_id: "",
      scope_title: "",
      amount: "",
      currency: "USD",
      status: "Pending",
      task_id: "",
      attachments: "",
    };
  }
  function normalize(x) {
    return {
      quote_number: x?.quote_number || "",
      vendor_id: String(x?.vendor_id ?? ""),
      scope_title: x?.scope_title || "",
      amount: x?.amount ?? "",
      currency: x?.currency || "USD",
      status: x?.status || "Pending",
      task_id:
        x?.task_id != null
          ? String(x.task_id)
          : x?.linked_task_id != null
          ? String(x.linked_task_id)
          : x?.linked_project_id != null
          ? String(x.linked_project_id)
          : "",
      attachments: x?.attachments || "",
    };
  }
  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function loadTasks() {
    try {
      setTasksLoading(true);
      const res = await fetchWithAuth("/api/tasks/");
      const list = res?.items || (Array.isArray(res) ? res : []);
      const filtered = list.filter((t) => (t.status || "").toLowerCase() !== "complete");
      setTasks(filtered);
    } catch (e) {
      console.error("GET /api/tasks/ failed:", e);
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }

  function isDirty() {
    return JSON.stringify(form) !== JSON.stringify(initialRef.current) || !!pdfFile;
  }
  function requestClose() {
    if (isDirty()) {
      const ok = window.confirm("Discard changes? Your edits will be lost.");
      if (!ok) return;
    }
    onClose?.();
  }

  // --- PDF Upload ---
  function onPickPdf(e) {
    const f = e.target.files?.[0];
    attachPdf(f);
  }
  function attachPdf(f) {
    if (!f) return;
    if (f.type !== "application/pdf") {
      alert("Only PDF is allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPdfFile(null);
      return;
    }
    setPdfFile(f);
  }
  function onDragOverPdf(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }
  function onDragLeavePdf(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }
  function onDropPdf(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    attachPdf(f);
  }
  async function uploadPdfReturnUrl(file) {
    const fd = new FormData();
    fd.append("file", file, file.name);
    const res = await fetch(`${API_BASE}/api/uploads`, {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json().catch(() => ({}));
    const url = data.url || data.path || data.file || data.filename || "";
    if (!url) return "";
    if (typeof url === "string" && !url.startsWith("http") && !url.startsWith("/uploads/")) {
      return `/uploads/${url.replace(/^\/+/, "")}`;
    }
    return url;
  }

  async function submit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      vendor_id: form.vendor_id ? Number(form.vendor_id) : null,
      amount: form.amount === "" ? null : Number(form.amount),
      task_id: form.task_id ? Number(form.task_id) : null,
    };

    try {
      if (pdfFile) {
        const uploadedUrl = await uploadPdfReturnUrl(pdfFile);
        if (uploadedUrl) payload.attachments = uploadedUrl;
      }

      const created = initial?.id
        ? await fetchWithAuth(`/api/quotes/${initial.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await fetchWithAuth(`/api/quotes/`, {
            method: "POST",
            body: JSON.stringify(payload),
          });

      onSaved?.(created);
      onClose?.();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Save failed.");
    }
  }

  const vendorOptions = useMemo(
    () =>
      vendors.map((v) => ({
        value: String(v.id),
        label: v.name || v.company || `#${v.id}`,
      })),
    [vendors]
  );

  const taskOptions = useMemo(() => {
    const toLabel = (t) => {
      const loc = t.room || t.area || "";
      const title = t.title || `Task #${t.id}`;
      const status = t.status || "";
      return `${loc ? `${loc} — ` : ""}${title}  (${status})  •  #${t.id}`;
    };
    const opts = tasks.map((t) => ({
      value: String(t.id),
      label: toLabel(t),
    }));
    return [{ value: "", label: "— None" }, ...opts];
  }, [tasks]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={(e) => open && e.target === e.currentTarget && requestClose()}
      />

      {/* Drawer principal */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l 
        bg-white shadow-2xl border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 transform transition-transform
        ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/90 px-4 py-3 
                     backdrop-blur border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/90"
        >
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {initial?.id ? "Edit Quote" : "New Quote / Estimate"}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={requestClose}
              className="rounded-xl px-4 py-2 text-zinc-700 border border-zinc-300 bg-white hover:bg-zinc-50
                         dark:text-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              type="button"
            >
              Cancel
            </button>
            <button
              form="quote-form"
              type="submit"
              className="rounded-xl bg-[#0B5150] px-4 py-2 font-medium text-white hover:bg-[#094543] active:scale-[.98] transition"
            >
              Save
            </button>
            <button
              onClick={requestClose}
              className="rounded-xl p-2 text-zinc-700 border border-zinc-300 bg-white hover:bg-zinc-50
                         dark:text-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              aria-label="Close"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form id="quote-form" onSubmit={submit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Quote # */}
            <Field label="Quote #">
              <CardInput>
                <input
                  value={form.quote_number}
                  onChange={(e) => setField("quote_number", e.target.value)}
                  className={INPUT_GHOST}
                  placeholder="e.g., Q-2024-001"
                  required
                />
              </CardInput>
            </Field>

            {/* Vendor */}
            <Field label="Vendor">
              <CardInput>
                <SelectLike
                  value={form.vendor_id}
                  onChange={(v) => setField("vendor_id", v)}
                  options={vendorOptions}
                  placeholder="Select vendor…"
                  emptyLabel="No vendors"
                />
              </CardInput>
            </Field>

            {/* Amount */}
            <Field label="Amount" className="md:col-span-2">
              <CardInput>
                <div className="flex items-stretch overflow-hidden rounded-xl border border-zinc-300 dark:border-zinc-700">
                  <span className="inline-flex items-center px-3 text-zinc-500 dark:text-zinc-400">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setField("amount", e.target.value)}
                    className={INPUT_GHOST}
                    placeholder="0"
                    aria-label="Amount"
                  />
                </div>
              </CardInput>
            </Field>

            {/* Description */}
            <Field label="Description / Scope" className="md:col-span-2">
              <CardInput>
                <textarea
                  rows={5}
                  value={form.scope_title}
                  onChange={(e) => setField("scope_title", e.target.value)}
                  className={`${INPUT_GHOST} min-h-28 resize-y`}
                  placeholder="Scope summary"
                />
              </CardInput>
            </Field>

            {/* Task */}
            <Field label="Assign to Task" className="md:col-span-2">
              <CardInput>
                <SelectLike
                  value={form.task_id}
                  onChange={(v) => setField("task_id", v)}
                  options={taskOptions}
                  placeholder={tasksLoading ? "Loading tasks…" : "Select a task…"}
                  emptyLabel="No tasks"
                />
              </CardInput>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Solo se listan tasks con estado diferente a{" "}
                <span className="font-medium">Complete</span>.
              </div>
            </Field>

            {/* Attachment */}
            <Field label="Quote PDF" className="md:col-span-2">
              <CardInput noPadding>
                <div
                  onDragOver={onDragOverPdf}
                  onDragEnter={onDragOverPdf}
                  onDragLeave={onDragLeavePdf}
                  onDrop={onDropPdf}
                  className={
                    "relative flex w-full items-center gap-3 rounded-2xl p-2 transition-all " +
                    (dragOver
                      ? "ring-2 ring-[#0B9C99]/50 border border-[#0B9C99] bg-[#0B9C99]/5 dark:bg-zinc-900/30"
                      : "border border-transparent")
                  }
                  role="button"
                  aria-label="Drag & drop a PDF, or click to select"
                >
                  <div className="relative flex w-full items-center gap-3 rounded-xl border border-zinc-300 p-2 dark:border-zinc-700">
                    <span className="inline-flex items-center justify-center rounded-lg bg-zinc-100 p-2 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                      <Paperclip className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-zinc-700 dark:text-zinc-200">
                        Drag & drop a PDF, or click to select
                      </div>
                      <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {pdfFile
                          ? `${pdfFile.name} (${Math.ceil(pdfFile.size / 1024)} KB)`
                          : "No file selected"}
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={onPickPdf}
                      className={FILE_INPUT_OVERLAY}
                    />
                  </div>
                </div>
              </CardInput>
            </Field>

            {/* Status */}
            <Field label="Status" className="md:col-span-2">
              <CardInput>
                <div className="flex flex-wrap gap-2">
                  {STATUS_SEGMENTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setField("status", s)}
                      className={
                        "rounded-xl px-4 py-2 text-sm transition " +
                        (form.status === s
                          ? "bg-[#0B5150] text-white"
                          : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800")
                      }
                      aria-pressed={form.status === s}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </CardInput>
            </Field>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- UI helpers ---------- */
function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</div>
      {children}
    </label>
  );
}

function CardInput({ children, noPadding = false }) {
  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm transition-colors duration-150 hover:border-zinc-300 focus-within:ring-2 focus-within:ring-[#0B5150]/10
                  dark:bg-zinc-900 dark:border-zinc-700 dark:hover:border-zinc-600 ${
                    noPadding ? "p-0" : "p-2"
                  }`}
    >
      {children}
    </div>
  );
}

function SelectLike({ value, onChange, options = [], placeholder = "Select…", emptyLabel = "No options" }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label?.toLowerCase().includes(q));
  }, [options, query]);

  const selected = useMemo(() => options.find((i) => i.value === String(value)), [options, value]);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function toggle() {
    setOpen((o) => {
      const n = !o;
      if (n) {
        setQuery("");
        setHighlight(0);
      }
      return n;
    });
  }
  function choose(v) {
    onChange?.(v);
    setOpen(false);
  }
  function onKeyDown(e) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      setQuery("");
      setHighlight(0);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = filtered[highlight];
      if (it) choose(it.value);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-zinc-900 dark:text-zinc-100"
      >
        <span className={selected ? "" : "text-zinc-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`ml-2 h-4 w-4 text-zinc-400 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-zinc-300 bg-white shadow-xl ring-1 ring-black/5 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {/* Filtro */}
          <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-2 py-2 dark:border-zinc-700 dark:bg-zinc-900">
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              placeholder="Type to filter..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0B5150]/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400"
            />
          </div>

          <ul className="py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">{emptyLabel}</li>
            )}
            {filtered.map((it, idx) => {
              const active = highlight === idx;
              const isSelected = String(value) === it.value;
              return (
                <li key={it.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlight(idx)}
                    onClick={() => choose(it.value)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                        : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <span className="truncate">{it.label}</span>
                    {isSelected && <Check className="ml-2 h-4 w-4" style={{ color: "#0B9C99" }} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
