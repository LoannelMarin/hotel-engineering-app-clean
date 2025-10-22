// frontend/src/components/assets/AssetFormModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

/* ===== Base styles (light/dark) ===== */
const INPUT_GHOST =
  "w-full bg-transparent px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none dark:text-slate-100 transition-colors duration-150";

/* ===== Options ===== */
const TYPE_OPTIONS = [
  "IT",
  "HVAC",
  "Pump",
  "Boiler",
  "Electrical",
  "Plumbing",
  "Panel",
  "Furniture",
  "Appliance",
  "Other",
];

const PM_FREQ_OPTIONS = [
  "Annual",
  "Semi-Annual",
  "Quarterly",
  "Monthly",
  "Weekly",
  "Daily",
];

/* ===== Date helpers ===== */
function pad(n) {
  return n < 10 ? `0${n}` : String(n);
}
function formatDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseDate(s) {
  if (!s) return null;
  const mIso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (mIso) {
    const y = +mIso[1],
      mo = +mIso[2],
      d = +mIso[3];
    const dt = new Date(y, mo - 1, d);
    return isNaN(dt) ? null : dt;
  }
  return null;
}
function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}

/* ===== Normalizers ===== */
function normalizeMac(mac) {
  if (!mac) return mac;
  let s = mac.trim().replace(/-/g, ":").replace(/\./g, "").toUpperCase();
  const hex = s.replace(/:/g, "");
  if (hex.length === 12 && /^[0-9A-F]+$/.test(hex)) {
    s = hex.match(/.{1,2}/g).join(":");
  }
  return s;
}
function clampInt(n, minv, maxv) {
  const x = Number.parseInt(n, 10);
  if (Number.isNaN(x)) return undefined;
  if (minv != null && x < minv) return minv;
  if (maxv != null && x > maxv) return maxv;
  return x;
}

/* ===== Upload helpers ===== */
const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  (typeof window !== "undefined"
    ? window.location.origin.replace(":5173", ":5000")
    : "http://localhost:5000");

function absolutize(u) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return `${API_BASE}${u}`;
  return `${API_BASE}/${u.replace(/^\/+/, "")}`;
}

async function uploadImageReturnUrl(file) {
  const fd = new FormData();
  fd.append("file", file, file.name);
  const res = await fetch(`${API_BASE}/api/uploads`, {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await res.json();
        msg = j?.message || j?.detail || j?.msg || msg;
      } else {
        msg = await res.text();
      }
    } catch {}
    throw new Error(`Upload failed: ${msg}`);
  }
  const data = await res.json().catch(() => ({}));
  const url = data.url || data.path || data.file || data.filename || "";
  if (!url) return "";
  if (
    typeof url === "string" &&
    !/^https?:\/\//i.test(url) &&
    !url.startsWith("/uploads/")
  ) {
    return `/uploads/${url.replace(/^\/+/, "")}`;
  }
  return String(url);
}

/* ===== Reusable UI ===== */
function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
        {label}
      </div>
      {children}
    </label>
  );
}
function CardInput({ children, status = "neutral", noPadding = false }) {
  const statusClass =
    status === "valid"
      ? "border-[#0B5150] focus-within:ring-2 focus-within:ring-[#0B5150]/45"
      : status === "invalid"
      ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500/40"
      : "border-slate-200 focus-within:ring-2 focus-within:ring-[#0B5150]/35";
  return (
    <div
      className={
        `rounded-2xl border bg-white shadow-sm transition-colors duration-150 ` +
        `hover:border-slate-300 ` +
        `dark:bg-[#0b0b0b] dark:border-white/10 dark:hover:border-white/15 ` +
        statusClass +
        (noPadding ? " p-0" : " p-2")
      }
    >
      {children}
    </div>
  );
}
function DatePicker({ value, onChange, placeholder = "YYYY-MM-DD" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const date = parseDate(value);
  const [viewYear, setViewYear] = useState(
    date ? date.getFullYear() : new Date().getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    date ? date.getMonth() : new Date().getMonth()
  );

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  useEffect(() => {
    if (!open) return;
    const d = parseDate(value) || new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [open, value]);

  function selectDay(day) {
    const d = new Date(viewYear, viewMonth, day);
    onChange?.(formatDate(d));
    setOpen(false);
  }

  const monthStart = new Date(viewYear, viewMonth, 1);
  const startWeekday = monthStart.getDay();
  const daysCount = daysInMonth(viewYear, viewMonth);

  const monthLabel = monthStart.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const grid = [];
  for (let i = 0; i < startWeekday; i++) grid.push(null);
  for (let d = 1; d <= daysCount; d++) grid.push(d);

  const selectedStr = value;
  const todayStr = formatDate(new Date());

  return (
    <div ref={ref} className="relative w-full">
      <div className="pointer-events-none absolute left-3 top-2.5 text-slate-400">
        <CalendarIcon className="h-4 w-4" />
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${INPUT_GHOST} pl-9 text-left rounded-xl`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {selectedStr ? (
          selectedStr
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 dark:border-white/10 dark:bg-[#0b0b0b]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-white/10">
            <button
              type="button"
              className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-[#111]"
              onClick={() => {
                const m = new Date(viewYear, viewMonth - 1, 1);
                setViewYear(m.getFullYear());
                setViewMonth(m.getMonth());
              }}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {monthLabel}
            </div>
            <button
              type="button"
              className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-[#111]"
              onClick={() => {
                const m = new Date(viewYear, viewMonth + 1, 1);
                setViewYear(m.getFullYear());
                setViewMonth(m.getMonth());
              }}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 px-3 pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((wd) => (
              <div key={wd}>{wd}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1 p-3 pt-1">
            {grid.map((d, i) => {
              if (d === null) return <div key={`pad-${i}`} />;
              const dStr = formatDate(new Date(viewYear, viewMonth, d));
              const isSelected = selectedStr === dStr;
              const isToday = todayStr === dStr;
              return (
                <button
                  key={dStr}
                  type="button"
                  onClick={() => selectDay(d)}
                  className={
                    "h-9 rounded-lg text-sm transition " +
                    (isSelected
                      ? "bg-[#083A39] text-white"
                      : "hover:bg-slate-100 dark:hover:bg-[#111]") +
                    (isToday && !isSelected ? " ring-1 ring-[#0B5150]/40" : "")
                  }
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Main Modal with slide-in/out ===== */
export default function AssetFormModal({ open, initial = null, onClose, onSave }) {
  const [form, setForm] = useState(empty());

  // keep mounted for exit animation
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // Photos
  const [existingPhotos, setExistingPhotos] = useState([]); // string[]
  const [photoFiles, setPhotoFiles] = useState([]); // File[]
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial && initial.id) {
      const base = normalizeFromBackend(initial);
      setForm(base);
      setExistingPhotos(parsePhotos(initial.photos));
      setPhotoFiles([]);
    } else {
      setForm(empty());
      setExistingPhotos([]);
      setPhotoFiles([]);
    }
    setDragOver(false);
  }, [open, initial]);

  const isIT = useMemo(() => (form.type || "").toLowerCase() === "it", [form.type]);

  function empty() {
    return {
      name: "",
      type: "IT",
      location: "",
      floor: "",
      area: "",
      manufacturer: "",
      model_no: "",
      serial_no: "",
      pm_frequency: "",
      install_date: "",
      warranty_expiration: "",
      next_service_at: "",
      notes: "",        // 👈 general notes (all types)
      equipment: "",
      equipment_name: "",
      ip_address: "",
      mac_address: "",
      hostname: "",
      vlan_id: "",
      os_version: "",
      firmware_version: "",
      ports_total: "",
      ports_used: "",
      port_notes: "",
    };
  }

  function normalizeFromBackend(x) {
    return {
      name: x.name || "",
      type: x.type || "IT",
      location: x.location || "",
      floor: x.floor || "",
      area: x.area || "",
      manufacturer: x.manufacturer || "",
      model_no: x.model_no || "",
      serial_no: x.serial_no || "",
      pm_frequency: x.pm_frequency || "",
      install_date: x.install_date ? x.install_date.slice(0, 10) : "",
      warranty_expiration: x.warranty_expiration
        ? x.warranty_expiration.slice(0, 10)
        : "",
      next_service_at: x.next_service_at ? x.next_service_at.slice(0, 10) : "",
      notes: x.notes || "",     // 👈 pull from backend
      equipment: x.equipment || "",
      equipment_name: x.equipment_name || "",
      ip_address: x.ip_address || "",
      mac_address: x.mac_address || "",
      hostname: x.hostname || "",
      vlan_id: x.vlan_id ?? "",
      os_version: x.os_version || "",
      firmware_version: x.firmware_version || "",
      ports_total: x.ports_total ?? "",
      ports_used: x.ports_used ?? "",
      port_notes: x.port_notes || "",
    };
  }

  function parsePhotos(p) {
    if (!p) return [];
    try {
      const arr = JSON.parse(p);
      if (Array.isArray(arr)) return arr.filter(Boolean).map(String);
    } catch {}
    if (typeof p === "string") {
      return p
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function requestClose() {
    onClose?.();
  }

  /* ===== Photo handlers ===== */
  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }
  function onDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }
  function onDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }
  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = Array.from(e.dataTransfer?.files || []);
    const valid = files.filter((f) => /^image\//i.test(f.type));
    if (!valid.length) return;
    setPhotoFiles((prev) => [...prev, ...valid]);
  }
  function removeExisting(idx) {
    setExistingPhotos((arr) => arr.filter((_, i) => i !== idx));
  }
  function removeNew(idx) {
    setPhotoFiles((arr) => arr.filter((_, i) => i !== idx));
  }

  async function submit(e) {
    e.preventDefault();
    if (!String(form.name || "").trim()) {
      alert("Name is required.");
      return;
    }

    // upload new photos if any
    let uploaded = [];
    if (photoFiles.length > 0) {
      for (const f of photoFiles) {
        const url = await uploadImageReturnUrl(f);
        if (url) uploaded.push(url);
      }
    }
    const allPhotos = [...existingPhotos, ...uploaded];
    const photosField = allPhotos.length ? JSON.stringify(allPhotos) : null;

    const payload = {
      name: (form.name || "").trim(),
      type: form.type || "IT",
      location: (form.location || "").trim() || null,
      floor: (form.floor || "").trim() || null,
      area: (form.area || "").trim() || null,
      manufacturer: (form.manufacturer || "").trim() || null,
      model_no: (form.model_no || "").trim() || null,
      serial_no: (form.serial_no || "").trim() || null,
      pm_frequency: (form.pm_frequency || "").trim() || null,
      install_date: form.install_date ? `${form.install_date}T00:00:00` : null,
      warranty_expiration: form.warranty_expiration
        ? `${form.warranty_expiration}T00:00:00`
        : null,
      next_service_at: form.next_service_at
        ? `${form.next_service_at}T00:00:00`
        : null,
      notes: (form.notes || "").trim() || null,     // 👈 send notes
      photos: photosField,
    };

    if (isIT) {
      payload.equipment = (form.equipment || "").trim() || null;
      payload.equipment_name = (form.equipment_name || "").trim() || null;
      payload.ip_address = (form.ip_address || "").trim() || null;
      payload.mac_address = normalizeMac(form.mac_address || "") || null;
      payload.hostname = (form.hostname || "").trim() || null;
      payload.vlan_id =
        form.vlan_id === "" ? null : clampInt(form.vlan_id, 1, 4094);
      payload.os_version = (form.os_version || "").trim() || null;
      payload.firmware_version = (form.firmware_version || "").trim() || null;
      payload.ports_total =
        form.ports_total === "" ? null : clampInt(form.ports_total, 0, 100000);
      payload.ports_used =
        form.ports_used === "" ? null : clampInt(form.ports_used, 0, 100000);
      if (
        payload.ports_total != null &&
        payload.ports_used != null &&
        payload.ports_used > payload.ports_total
      ) {
        payload.ports_used = payload.ports_total;
      }
      payload.port_notes = (form.port_notes || "").trim() || null;
    }

    onSave?.(payload);
  }

  if (!mounted && !open) return null;

  function handleTransitionEnd(e) {
    if (!open && e.target === e.currentTarget) {
      setMounted(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        onClick={requestClose}
        onTransitionEnd={handleTransitionEnd}
        className={[
          "absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* Drawer */}
      <div
        onTransitionEnd={handleTransitionEnd}
        className={[
          "absolute right-0 top-0 h-full w-full max-w-3xl",
          "border-l border-slate-200 bg-white shadow-2xl",
          "dark:border-white/10 dark:bg-[#0b0b0b]",
          "transform transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
          "overflow-y-auto",
        ].join(" ")}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-[#0b0b0b]/90">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            New Asset
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={requestClose}
              className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#111]"
            >
              Cancel
            </button>
            <button
              form="asset-form"
              type="submit"
              className="rounded-lg px-3 py-1.5 font-medium text-white"
              style={{ backgroundColor: "#083A39" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#0A4644";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#083A39";
              }}
            >
              Save
            </button>
            <button
              onClick={requestClose}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#111]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form id="asset-form" onSubmit={submit} className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Name */}
            <Field label="Name">
              <CardInput>
                <input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className={INPUT_GHOST}
                  placeholder="e.g., Core Switch MDF"
                  required
                />
              </CardInput>
            </Field>

            {/* Type */}
            <Field label="Type">
              <CardInput>
                <div className="relative">
                  <select
                    value={form.type}
                    onChange={(e) => setField("type", e.target.value)}
                    className={`${INPUT_GHOST} appearance-none rounded-xl pr-9 dark:[color-scheme:dark]`}
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                </div>
              </CardInput>
            </Field>

            {/* Location */}
            <Field label="Location">
              <CardInput>
                <input
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                  className={INPUT_GHOST}
                  placeholder="MDF - Rack A"
                />
              </CardInput>
            </Field>

            {/* Floor */}
            <Field label="Floor">
              <CardInput>
                <input
                  value={form.floor}
                  onChange={(e) => setField("floor", e.target.value)}
                  className={INPUT_GHOST}
                  placeholder="2 / 3 / Roof"
                />
              </CardInput>
            </Field>

            {/* Area */}
            <Field label="Area">
              <CardInput>
                <input
                  value={form.area}
                  onChange={(e) => setField("area", e.target.value)}
                  className={INPUT_GHOST}
                  placeholder="Lobby / Kitchen / ..."
                />
              </CardInput>
            </Field>

            {/* Manufacturer */}
            <Field label="Manufacturer">
              <CardInput>
                <input
                  value={form.manufacturer}
                  onChange={(e) => setField("manufacturer", e.target.value)}
                  className={INPUT_GHOST}
                  placeholder="Cisco"
                />
              </CardInput>
            </Field>

            {/* Model / Serial */}
            <Field label="Model">
              <CardInput>
                <input
                  value={form.model_no}
                  onChange={(e) => setField("model_no", e.target.value)}
                  className={INPUT_GHOST}
                  placeholder="C9300-24T"
                />
              </CardInput>
            </Field>
            <Field label="Serial">
              <CardInput>
                <input
                  value={form.serial_no}
                  onChange={(e) => setField("serial_no", e.target.value)}
                  className={INPUT_GHOST}
                  placeholder="FCW1234ABC"
                />
              </CardInput>
            </Field>

            {/* PM Frequency (Dropdown) */}
            <Field label="PM Frequency">
              <CardInput>
                <div className="relative">
                  <select
                    value={form.pm_frequency}
                    onChange={(e) => setField("pm_frequency", e.target.value)}
                    className={`${INPUT_GHOST} appearance-none rounded-xl pr-9 dark:[color-scheme:dark]`}
                  >
                    <option value="">Select…</option>
                    {PM_FREQ_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                </div>
              </CardInput>
            </Field>

            {/* Dates */}
            <Field label="Install Date">
              <CardInput>
                <DatePicker
                  value={form.install_date}
                  onChange={(v) => setField("install_date", v)}
                  placeholder="YYYY-MM-DD"
                />
              </CardInput>
            </Field>
            <Field label="Warranty Expiration">
              <CardInput>
                <DatePicker
                  value={form.warranty_expiration}
                  onChange={(v) => setField("warranty_expiration", v)}
                  placeholder="YYYY-MM-DD"
                />
              </CardInput>
            </Field>
            <Field label="Next Service">
              <CardInput>
                <DatePicker
                  value={form.next_service_at}
                  onChange={(v) => setField("next_service_at", v)}
                  placeholder="YYYY-MM-DD"
                />
              </CardInput>
            </Field>

            {/* Notes (ALL types) */}
            <Field label="Notes" className="md:col-span-2">
              <CardInput>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  className={`${INPUT_GHOST} min-h-24 resize-y`}
                  placeholder="General notes for this asset…"
                />
              </CardInput>
            </Field>

            {/* Photos */}
            <Field label="Photos (images)" className="md:col-span-2">
              <CardInput noPadding>
                <div
                  onDragOver={onDragOver}
                  onDragEnter={onDragEnter}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={
                    "relative flex w-full flex-col gap-3 rounded-2xl p-2 transition-all " +
                    (dragOver
                      ? "ring-2 ring-[#0B5150]/55 border border-[#0B5150] bg-[#0B5150]/5 dark:bg-[#0b0b0b]/30"
                      : "border border-transparent")
                  }
                >
                  <label
                    htmlFor="asset-photos"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-slate-300 p-3 text-center text-sm text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-[#111]"
                    role="button"
                    aria-label="Drag & drop images, or click to select"
                  >
                    <div className="mb-1 font-medium text-slate-700 dark:text-slate-200">
                      Drag & drop images, or click to select
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      PNG, JPG, JPEG, WEBP, GIF. You can add multiple files.
                    </div>
                  </label>

                  <input
                    id="asset-photos"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []).filter(
                        (f) => /^image\//i.test(f.type)
                      );
                      // allow picking the same file twice
                      e.target.value = "";
                      if (files.length) setPhotoFiles((prev) => [...prev, ...files]);
                    }}
                    className="sr-only"
                  />

                  {(existingPhotos.length > 0 || photoFiles.length > 0) && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {existingPhotos.map((u, idx) => (
                        <div
                          key={`ex-${idx}`}
                          className="relative aspect-video overflow-hidden rounded-lg border border-slate-200 dark:border-white/10"
                        >
                          <img
                            src={absolutize(u)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeExisting(idx)}
                            className="absolute right-1 top-1 rounded-md bg-black/60 px-1.5 py-0.5 text-xs text-white hover:bg-black/80"
                            title="Remove"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {photoFiles.map((f, idx) => {
                        const url = URL.createObjectURL(f);
                        return (
                          <div
                            key={`new-${idx}`}
                            className="relative aspect-video overflow-hidden rounded-lg border border-slate-200 dark:border-white/10"
                          >
                            <img
                              src={url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeNew(idx)}
                              className="absolute right-1 top-1 rounded-md bg-black/60 px-1.5 py-0.5 text-xs text-white hover:bg-black/80"
                              title="Remove"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardInput>
            </Field>

            {/* IT (only if type === "IT") */}
            {isIT && (
              <>
                <div className="md:col-span-2 mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  IT Details
                </div>

                <Field label="Equipment">
                  <CardInput>
                    <input
                      value={form.equipment}
                      onChange={(e) => setField("equipment", e.target.value)}
                      className={INPUT_GHOST}
                      placeholder="Switch / Router / AP / Firewall"
                    />
                  </CardInput>
                </Field>
                <Field label="Equipment Name">
                  <CardInput>
                    <input
                      value={form.equipment_name}
                      onChange={(e) => setField("equipment_name", e.target.value)}
                      className={INPUT_GHOST}
                      placeholder="Layer 3 Switch / Edge Router"
                    />
                  </CardInput>
                </Field>

                <Field label="Hostname">
                  <CardInput>
                    <input
                      value={form.hostname}
                      onChange={(e) => setField("hostname", e.target.value)}
                      className={`${INPUT_GHOST} font-mono`}
                      placeholder="sw-mdf-core-01"
                    />
                  </CardInput>
                </Field>

                <Field label="IP Address">
                  <CardInput>
                    <input
                      value={form.ip_address}
                      onChange={(e) => setField("ip_address", e.target.value)}
                      className={`${INPUT_GHOST} font-mono`}
                      placeholder="192.168.10.2"
                    />
                  </CardInput>
                </Field>

                <Field label="MAC Address">
                  <CardInput>
                    <input
                      value={form.mac_address}
                      onChange={(e) => setField("mac_address", e.target.value)}
                      className={`${INPUT_GHOST} font-mono`}
                      placeholder="00:1A:2B:3C:4D:5E"
                    />
                  </CardInput>
                </Field>

                <Field label="VLAN ID">
                  <CardInput>
                    <input
                      type="number"
                      min="1"
                      max="4094"
                      value={form.vlan_id}
                      onChange={(e) => setField("vlan_id", e.target.value)}
                      className={INPUT_GHOST}
                      placeholder="10"
                    />
                  </CardInput>
                </Field>

                <Field label="OS Version">
                  <CardInput>
                    <input
                      value={form.os_version}
                      onChange={(e) => setField("os_version", e.target.value)}
                      className={INPUT_GHOST}
                      placeholder="IOS-XE 17.3.4a"
                    />
                  </CardInput>
                </Field>

                <Field label="Firmware Version">
                  <CardInput>
                    <input
                      value={form.firmware_version}
                      onChange={(e) => setField("firmware_version", e.target.value)}
                      className={INPUT_GHOST}
                      placeholder="1.0.9.64"
                    />
                  </CardInput>
                </Field>

                <Field label="Ports Total">
                  <CardInput>
                    <input
                      type="number"
                      min="0"
                      value={form.ports_total}
                      onChange={(e) => setField("ports_total", e.target.value)}
                      className={INPUT_GHOST}
                      placeholder="48"
                    />
                  </CardInput>
                </Field>

                <Field label="Ports Used">
                  <CardInput>
                    <input
                      type="number"
                      min="0"
                      value={form.ports_used}
                      onChange={(e) => setField("ports_used", e.target.value)}
                      className={INPUT_GHOST}
                      placeholder="36"
                    />
                  </CardInput>
                </Field>

                <Field label="Port Notes" className="md:col-span-2">
                  <CardInput>
                    <textarea
                      rows={4}
                      value={form.port_notes}
                      onChange={(e) => setField("port_notes", e.target.value)}
                      className={`${INPUT_GHOST} min-h-24 resize-y`}
                      placeholder="SFP+ on Te1/1/49 and Te1/1/50; trunk to IDF-01 on Gi1/0/24"
                    />
                  </CardInput>
                </Field>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={requestClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-[#111]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl px-4 py-2 font-medium text-white"
              style={{ backgroundColor: "#083A39", borderColor: "#083A39", borderWidth: 1 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#0A4644";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#083A39";
              }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
