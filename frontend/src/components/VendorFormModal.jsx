// frontend/src/components/VendorFormModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { X, Image as ImageIcon, Mail, Phone, Globe } from "lucide-react";

const INPUT_GHOST =
  "w-full bg-transparent px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-100 transition-colors duration-150";
const FILE_INPUT_OVERLAY = "absolute inset-0 opacity-0 cursor-pointer";

export default function VendorFormModal({ open, initial, onClose, onSave }) {
  const [form, setForm] = useState(empty());
  const [logoFile, setLogoFile] = useState(null);

  const initialRef = useRef(empty());
  const [touched, setTouched] = useState({ company_name: false, email: false, web: false });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const base = initial ? normalize(initial) : empty();
    setForm(base);
    initialRef.current = base;
    setLogoFile(null);
    setTouched({ company_name: false, email: false, web: false });
    setDragOver(false);
  }, [open, initial]);

  function empty() {
    return {
      id: "",
      company_name: "",
      contact_name: "",
      phone: "",
      email: "",
      services: "",
      comment: "",
      web: "",
      logo_url: "",
    };
  }

  function normalize(v) {
    return {
      id: v.id ?? "",
      company_name: v.name || v.company_name || "",
      contact_name: v.contact_name || "",
      phone: v.phone || "",
      email: v.email || "",
      services: v.services || v.categories || "",
      comment: v.comment || v.notes || "",
      web: v.website || v.web || "",
      logo_url: v.logo_url || v.logo || "",
    };
  }

  function setField(k, val) {
    setForm((f) => ({ ...f, [k]: val }));
  }

  function isDirty() {
    return JSON.stringify(form) !== JSON.stringify(initialRef.current) || !!logoFile;
  }

  function requestClose() {
    if (isDirty()) {
      const ok = window.confirm("Discard changes? Your edits will be lost.");
      if (!ok) return;
    }
    onClose?.();
  }

  // --- logo handlers ---
  function onPickLogo(e) {
    const f = e.target.files?.[0];
    attachLogo(f);
  }
  function attachLogo(f) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("Only image files are allowed (PNG/JPG/SVG).");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setLogoFile(null);
      return;
    }
    setLogoFile(f);
  }
  function onDragOverLogo(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }
  function onDragLeaveLogo(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }
  function onDropLogo(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    attachLogo(f);
  }

  // --- validations ---
  const companyErr = validateCompany(form.company_name);
  const emailErr = form.email ? validateEmail(form.email) : "";
  const webErr = form.web ? validateURL(form.web) : "";

  // --- submit (corregido) ---
  async function submit(e) {
    e.preventDefault();
    const hasErr = !!validateCompany(form.company_name) || !!emailErr || !!webErr;
    if (hasErr) {
      setTouched({ company_name: true, email: true, web: true });
      return;
    }

    let payload = {
      id: form.id || undefined,
      company_name: form.company_name,
      contact_name: form.contact_name || null,
      phone: form.phone || null,
      email: form.email || null,
      services: form.services || null,
      comment: form.comment || null,
      web: form.web || null,
      logo_url: form.logo_url || null,
    };

    try {
      // ✅ Si hay logo nuevo, primero súbelo al backend
      if (logoFile) {
        const fd = new FormData();
        fd.append("file", logoFile, logoFile.name);
        const res = await fetch("/api/uploads", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        payload.logo_url = data.path; // guarda /uploads/<uuid>.png
      }

      onSave?.(payload);
    } catch (err) {
      console.error("❌ Error uploading logo:", err);
      alert("Failed to upload logo. Check console for details.");
    }
  }

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={(e) => open && e.target === e.currentTarget && requestClose()}
      />

      {/* Drawer */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-zinc-200/60 dark:border-zinc-800
        bg-zinc-50 dark:bg-zinc-950/80 shadow-2xl transform transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur px-4 py-3">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {form.id ? "Edit Vendor" : "New Vendor"}
          </h3>
          <button
            onClick={requestClose}
            className="rounded-lg p-1.5 text-zinc-700 hover:bg-zinc-200/50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form id="vendor-form" onSubmit={submit} className="p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="ID">
              <CardInput>
                <input
                  value={form.id}
                  readOnly
                  className={INPUT_GHOST + " cursor-not-allowed text-zinc-500 dark:text-zinc-400"}
                  placeholder="(auto)"
                />
              </CardInput>
            </Field>

            <Field label="Company Name *">
              <CardInput
                status={
                  touched.company_name
                    ? companyErr
                      ? "invalid"
                      : "valid"
                    : "neutral"
                }
              >
                <input
                  value={form.company_name}
                  onChange={(e) => setField("company_name", e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, company_name: true }))}
                  className={INPUT_GHOST}
                  placeholder="e.g., American Pool"
                  required
                />
              </CardInput>
              {touched.company_name && (
                <HelperText error={!!companyErr} text={companyErr || "Looks good."} />
              )}
            </Field>

            {/* Logo */}
            <Field label="Logo" className="md:col-span-2">
              <CardInput noPadding>
                <div
                  onDragOver={onDragOverLogo}
                  onDragEnter={onDragOverLogo}
                  onDragLeave={onDragLeaveLogo}
                  onDrop={onDropLogo}
                  className={`relative flex w-full items-center gap-3 rounded-2xl p-2 transition-all ${
                    dragOver
                      ? "ring-2 ring-[#0B5150]/40 border border-[#0B5150]/50 bg-[#0B5150]/5 dark:bg-[#0B5150]/10"
                      : "border border-transparent"
                  }`}
                >
                  <div className="relative flex w-full items-center gap-3 rounded-xl border border-zinc-300/70 p-2 dark:border-zinc-700/70">
                    <span className="inline-flex items-center justify-center rounded-lg bg-zinc-100 p-2 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                      <ImageIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-zinc-700 dark:text-zinc-200">
                        Drag & drop or click to select
                      </div>
                      <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {logoFile
                          ? `${logoFile.name} (${Math.ceil(logoFile.size / 1024)} KB)`
                          : form.logo_url
                          ? `Existing: ${form.logo_url}`
                          : "No file selected"}
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onPickLogo}
                      className={FILE_INPUT_OVERLAY}
                    />
                  </div>
                </div>
              </CardInput>
            </Field>

            <Field label="Contact Name">
              <CardInput>
                <input
                  value={form.contact_name}
                  onChange={(e) => setField("contact_name", e.target.value)}
                  className={INPUT_GHOST}
                  placeholder="e.g., Jon Wynes"
                />
              </CardInput>
            </Field>

            <Field label="Phone">
              <CardInput>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  <input
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    className={INPUT_GHOST}
                    placeholder="e.g., 407-555-1234"
                  />
                </div>
              </CardInput>
            </Field>

            <Field label="Email">
              <CardInput status={touched.email ? (emailErr ? "invalid" : "valid") : "neutral"}>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <input
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    className={INPUT_GHOST}
                    type="email"
                    placeholder="vendor@example.com"
                  />
                </div>
              </CardInput>
              {touched.email && form.email && (
                <HelperText error={!!emailErr} text={emailErr || "Looks good."} />
              )}
            </Field>

            <Field label="Services">
              <CardInput>
                <input
                  value={form.services}
                  onChange={(e) => setField("services", e.target.value)}
                  className={INPUT_GHOST}
                  placeholder="e.g., Pool Services"
                />
              </CardInput>
            </Field>

            <Field label="Comment" className="md:col-span-2">
              <CardInput>
                <textarea
                  rows={4}
                  value={form.comment}
                  onChange={(e) => setField("comment", e.target.value)}
                  className={`${INPUT_GHOST} min-h-24 resize-y`}
                  placeholder="Notes…"
                />
              </CardInput>
            </Field>

            <Field label="Web" className="md:col-span-2">
              <CardInput status={touched.web ? (webErr ? "invalid" : "valid") : "neutral"}>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-zinc-400" />
                  <input
                    value={form.web}
                    onChange={(e) => setField("web", e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, web: true }))}
                    className={INPUT_GHOST}
                    placeholder="https://"
                  />
                </div>
              </CardInput>
              {touched.web && form.web && (
                <HelperText error={!!webErr} text={webErr || "Looks good."} />
              )}
            </Field>
          </div>

          {/* Footer Buttons */}
          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={requestClose}
              className="rounded-xl border border-zinc-300/70 px-4 py-2 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700/70 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl border border-[#0B5150] bg-[#0B5150] px-4 py-2 font-medium text-white hover:bg-[#094543] active:scale-[.98] transition-all"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- helpers UI ---------- */
function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</div>
      {children}
    </label>
  );
}

function CardInput({ children, status = "neutral", noPadding = false }) {
  const statusClass =
    status === "valid"
      ? "border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/40"
      : status === "invalid"
      ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500/40"
      : "border-zinc-300/60 focus-within:ring-2 focus-within:ring-[#0B5150]/30";
  return (
    <div
      className={`rounded-2xl border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:bg-zinc-900 dark:border-zinc-700 transition-all duration-150 ${statusClass} ${
        noPadding ? "p-0" : "p-2"
      }`}
    >
      {children}
    </div>
  );
}

function HelperText({ error, text }) {
  return (
    <div
      className={
        "mt-1 text-xs " +
        (error ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")
      }
    >
      {text}
    </div>
  );
}

/* ---------- validations ---------- */
function validateCompany(v) {
  if (!v || v.trim().length < 2) return "Company name is required.";
  return "";
}
function validateEmail(v) {
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  return ok ? "" : "Invalid email.";
}
function validateURL(v) {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:" ? "" : "URL must start with http(s)://";
  } catch {
    return "Invalid URL.";
  }
}
