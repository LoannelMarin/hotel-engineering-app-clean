import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import InvoiceFormBody from "./InvoiceFormBody";
import { computePastDueDate, parseDate } from "./invoiceUtils";

const BRAND_GREEN = "#0B5150";
const BRAND_GREEN_HOVER = "#094543";

const STATUS_SEGMENTS = ["Paid", "Posted", "Submitted", "Processing", "Draft", "Overdue"];
const TERMS_OPTIONS = [
  { id: "30 Days Net", name: "30 Days Net" },
  { id: "Due on receipt", name: "Due on receipt" },
];
const ANIM_MS = 220;

export default function InvoiceFormModal({ open, initial, vendors = [], onClose, onSave }) {
  const [form, setForm] = useState(empty());
  const [pdfFile, setPdfFile] = useState(null);
  const [existingAttachment, setExistingAttachment] = useState(null);
  const initialRef = useRef(empty());
  const [dup, setDup] = useState({ checking: false, exists: false, message: "" });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [mounted, setMounted] = useState(false);
  const [showing, setShowing] = useState(false);

  // --- Transición IN/OUT ---
  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setShowing(true));
    } else {
      setShowing(false);
      const t = setTimeout(() => setMounted(false), ANIM_MS);
      return () => clearTimeout(t);
    }
  }, [open]);

  const API_BASE =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
    (typeof window !== "undefined"
      ? window.location.origin.replace(":5173", ":5000")
      : "http://localhost:5000");

  const INVOICES_BASE = `${API_BASE}/api/invoices`;

  /* ------------------ Al abrir modal ------------------ */
  useEffect(() => {
    if (!open) return;

    if (initial && initial.id) {
      const base = normalizeFromBackend(initial);
      setForm(base);
      setExistingAttachment(normalizeAttachment(initial.attachments));
      initialRef.current = base;
      setPdfFile(null);
    } else {
      const base = empty();
      setForm(base);
      setExistingAttachment(null);
      initialRef.current = base;
      setPdfFile(null);
    }

    setDup({ checking: false, exists: false, message: "" });
    setDragOver(false);
  }, [open, initial]);

  // --- ESC para cerrar ---
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e) => e.key === "Escape" && requestClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mounted, form]);

  // --- Duplicado de invoice_number ---
  useEffect(() => {
    if (!open) return;
    const num = (form.invoice_number || "").trim();
    if (!num) {
      setDup({ checking: false, exists: false, message: "" });
      return;
    }

    let alive = true;
    setDup((d) => ({ ...d, checking: true }));

    const t = setTimeout(async () => {
      try {
        const exists = await checkInvoiceExists(num, INVOICES_BASE, initial?.id);
        if (!alive) return;
        setDup({
          checking: false,
          exists,
          message: exists ? "Warning: this invoice number already exists." : "",
        });
      } catch {
        if (!alive) return;
        setDup({ checking: false, exists: false, message: "" });
      }
    }, 350);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [form.invoice_number, open, initial?.id]);

  // --- Past Due Preview ---
  const pastDueOn = useMemo(
    () => computePastDueDate(form.payment_terms, form.due_date),
    [form.payment_terms, form.due_date]
  );
  const isCurrentlyPastDue = useMemo(() => {
    if (!pastDueOn) return false;
    const now = new Date();
    const pd = parseDate(pastDueOn);
    if (!pd) return false;
    if ((form.status || "").toLowerCase() === "paid") return false;
    return now > pd;
  }, [pastDueOn, form.status]);

  if (!mounted) return null;

  /* ------------------ Helpers ------------------ */
  function empty() {
    return {
      invoice_number: "",
      vendor_id: "",
      notes: "",
      due_date: "",
      amount: "",
      currency: "$",
      status: "Posted",
      po_number: "",
      order_date: "",
      post_date: new Date().toISOString().slice(0, 10),
      payment_terms: "30 Days Net",
    };
  }

  function normalizeFromBackend(x) {
    return {
      id: x.id,
      invoice_number: x.invoice_number || "",
      vendor_id: String(x.vendor_id ?? ""),
      notes: x.notes || x.order_description || x.description || "",
      due_date: x.due_date
        ? x.due_date.slice(0, 10)
        : x.delivery_date
        ? x.delivery_date.slice(0, 10)
        : "",
      amount: x.amount ?? "",
      currency: x.currency || "USD",
      status: x.status || "Posted",
      po_number: x.po_number || "",
      order_date: x.order_date ? x.order_date.slice(0, 10) : "",
      post_date: x.post_date
        ? x.post_date.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      payment_terms: x.payment_terms ?? x.terms ?? "30 Days Net",
    };
  }

  function normalizeAttachment(att) {
    if (!att) return null;
    if (Array.isArray(att)) return att[0] || null;
    if (typeof att === "string") return att;
    return null;
  }

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function isDirty() {
    return JSON.stringify(form) !== JSON.stringify(initialRef.current) || !!pdfFile;
  }

  function requestClose() {
    if (isDirty() && !window.confirm("Discard changes? Your edits will be lost.")) return;
    onClose?.();
  }

  /* ------------------ PDF Handlers ------------------ */
  function onPickPdf(e) {
    const f = e.target.files?.[0];
    attachPdf(f);
  }
  function attachPdf(f) {
    if (!f) return;
    if (f.type !== "application/pdf") {
      alert("Only PDF is allowed.");
      fileInputRef.current.value = "";
      setPdfFile(null);
      return;
    }
    setPdfFile(f);
  }
  function onDragOverPdf(e) {
    e.preventDefault();
    setDragOver(true);
  }
  function onDragLeavePdf(e) {
    e.preventDefault();
    setDragOver(false);
  }
  function onDropPdf(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    attachPdf(f);
  }

  async function uploadPdfReturnUrl(file) {
    const fd = new FormData();
    fd.append("file", file, file.name);
    const res = await fetch(`${API_BASE}/api/uploads`, { method: "POST", body: fd, credentials: "include" });
    if (!res.ok) throw new Error("Upload failed.");
    const data = await res.json().catch(() => ({}));
    return data.url || data.path || "";
  }

  async function checkInvoiceExists(number, baseUrl, currentId) {
    try {
      const res = await fetch(`${baseUrl}?invoice_number=${encodeURIComponent(number)}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return false;
      const data = await res.json().catch(() => ({}));
      const list = Array.isArray(data) ? data : data.items || [];
      const found = list.find((x) => (x.invoice_number || "") === number);
      if (!found) return false;
      if (currentId != null && found.id === currentId) return false;
      return true;
    } catch {
      return false;
    }
  }

  /* ------------------ Submit ------------------ */
  async function submit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      vendor_id: form.vendor_id ? Number(form.vendor_id) : null,
      amount: form.amount === "" ? null : Number(form.amount),
      due_date: form.due_date || null,
      order_date: form.order_date || null,
      post_date: form.post_date || null,
      payment_terms: form.payment_terms || null,
      attachments: existingAttachment || null,
    };

    const isEditing = !!initial?.id;
    if (!isEditing && isCurrentlyPastDue && String(form.status || "").toLowerCase() !== "paid") {
      payload.status = "Overdue";
    }

    try {
      if (pdfFile) {
        const uploadedUrl = await uploadPdfReturnUrl(pdfFile);
        if (uploadedUrl) payload.attachments = uploadedUrl;
      }
      onSave(payload);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Upload failed.");
    }
  }

  /* ------------------ Render ------------------ */
  return (
    <div className="fixed inset-0 z-[70]" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 ${
          showing ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => e.target === e.currentTarget && requestClose()}
      />

      {/* Drawer */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-2xl transition-transform duration-200 ease-out ${
          showing ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full overflow-y-auto rounded-l-2xl bg-white/95 ring-1 ring-slate-200 shadow-2xl dark:bg-[#111010] dark:ring-white/10">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-[#0F141B]/10">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {initial?.id ? "Edit Invoice" : "New Invoice"}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={requestClose}
                className="rounded-2xl border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                form="invoice-form"
                type="submit"
                className="rounded-2xl px-3 py-1.5 text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.15)]"
                style={{ backgroundColor: BRAND_GREEN }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND_GREEN_HOVER)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND_GREEN)}
              >
                Save
              </button>
              <button
                onClick={requestClose}
                className="rounded-2xl p-1.5 text-slate-600 hover:bg-slate-700 dark:text-slate-700 dark:hover:bg-white/5"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form id="invoice-form" onSubmit={submit} className="p-4">
            <InvoiceFormBody
              form={form}
              setField={setField}
              pdfFile={pdfFile}
              fileInputRef={fileInputRef}
              existingAttachment={existingAttachment}
              dup={dup}
              dragOver={dragOver}
              onPickPdf={onPickPdf}
              onDragOverPdf={onDragOverPdf}
              onDragLeavePdf={onDragLeavePdf}
              onDropPdf={onDropPdf}
              API_BASE={API_BASE}
              vendors={vendors}
              TERMS_OPTIONS={TERMS_OPTIONS}
              pastDueOn={pastDueOn}
              isCurrentlyPastDue={isCurrentlyPastDue}
            />

            {/* Status Buttons */}
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {STATUS_SEGMENTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setField("status", s)}
                    className={`rounded-2xl px-4 py-2 text-sm transition ${
                      form.status === s
                        ? "bg-indigo-600 text-white shadow"
                        : "border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
