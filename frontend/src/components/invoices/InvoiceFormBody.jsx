// frontend/src/components/invoices/InvoiceFormBody.jsx
import React, { Suspense, lazy } from "react";
import { DollarSign, Paperclip, ExternalLink } from "lucide-react";

/* === Lazy imports (optimizados para bundle) === */
const VendorSelect = lazy(() => import("./VendorSelect"));
const DatePicker = lazy(() => import("./DatePicker"));

/* === Fallback visual “Loannel style” === */
const LazyFallback = () => (
  <div className="flex items-center justify-center py-3 text-zinc-400 text-sm">
    <div className="w-4 h-4 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin"></div>
    <span className="ml-2">Loading…</span>
  </div>
);

/* === Input base === */
const INPUT_GHOST =
  "w-full bg-transparent px-3 py-2 text-slate-900 placeholder-slate-400 " +
  "focus:outline-none focus:ring-2 focus:ring-[#0B5150]/30 " +
  "dark:text-slate-200 dark:placeholder-slate-500 dark:focus:ring-[#0B5150]/40 " +
  "transition-colors duration-150";

export default function InvoiceFormBody({
  form,
  setField,
  vendors,
  pdfFile,
  existingAttachment,
  onPickPdf,
  fileInputRef,
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {/* === Post Date === */}
      <Field label="Post Date">
        <CardInput>
          <Suspense fallback={<LazyFallback />}>
            <DatePicker
              value={form.post_date}
              onChange={(v) => setField("post_date", v)}
              placeholder="YYYY-MM-DD"
            />
          </Suspense>
        </CardInput>
      </Field>

      {/* === Order Date === */}
      <Field label="Order Date">
        <CardInput>
          <Suspense fallback={<LazyFallback />}>
            <DatePicker
              value={form.order_date}
              onChange={(v) => setField("order_date", v)}
              placeholder="YYYY-MM-DD"
            />
          </Suspense>
        </CardInput>
      </Field>

      {/* === Vendor === */}
      <Field label="Vendor" className="md:col-span-2">
        <CardInput>
          <Suspense fallback={<LazyFallback />}>
            <VendorSelect
              value={form.vendor_id}
              onChange={(v) => setField("vendor_id", v)}
              options={vendors}
              placeholder="Select vendor…"
            />
          </Suspense>
        </CardInput>
      </Field>

      {/* === Description === */}
      <Field label="Order Description" className="md:col-span-2">
        <CardInput>
          <textarea
            rows={6}
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            className={`${INPUT_GHOST} min-h-32 resize-y`}
            placeholder="Describe the order (items, scope, notes)"
            aria-label="Order description"
          />
        </CardInput>
      </Field>

      {/* === Delivery Date === */}
      <Field label="Delivery Date">
        <CardInput>
          <Suspense fallback={<LazyFallback />}>
            <DatePicker
              value={form.due_date}
              onChange={(v) => setField("due_date", v)}
              placeholder="YYYY-MM-DD"
            />
          </Suspense>
        </CardInput>
      </Field>

      {/* === Payment Terms === */}
      <Field label="Payment Terms">
        <CardInput>
          <Suspense fallback={<LazyFallback />}>
            <VendorSelect
              value={form.payment_terms}
              onChange={(v) => setField("payment_terms", v)}
              options={[
                { id: "30 Days Net", name: "30 Days Net" },
                { id: "Due on receipt", name: "Due on receipt" },
              ]}
              placeholder="Select terms…"
            />
          </Suspense>
        </CardInput>
      </Field>

      {/* === Invoice Number === */}
      <Field label="Invoice #">
        <CardInput>
          <input
            value={form.invoice_number}
            onChange={(e) => setField("invoice_number", e.target.value)}
            className={INPUT_GHOST}
            required
            placeholder="e.g. INV-12345, #A001"
            aria-label="Invoice number"
          />
        </CardInput>
      </Field>

      {/* === Order Total === */}
      <Field label="Order Total" className="md:col-span-2">
        <CardInput>
          <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-300 dark:border-white/10">
            <span className="inline-flex items-center px-3 text-slate-500 dark:text-slate-400">
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
              aria-label="Order total"
            />
          </div>
        </CardInput>
      </Field>

      {/* === PDF Attachment (corregido) === */}
      <Field label="Attachment (PDF)" className="md:col-span-2">
        {existingAttachment && !pdfFile && (
          <div className="mb-2 flex items-center justify-between rounded-xl border border-slate-300 p-2 text-sm dark:border-white/10">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-slate-500" />
              <a
                href={existingAttachment}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Open current PDF <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <label
              htmlFor="pdf-input"
              className="rounded-2xl border px-2 py-1 text-xs dark:border-white/10 cursor-pointer"
            >
              Replace
            </label>
          </div>
        )}

        <CardInput noPadding>
          <label
            htmlFor="pdf-input"
            className="relative flex w-full items-center gap-3 rounded-2xl p-2 border border-slate-300 dark:border-white/10 cursor-pointer"
          >
            <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 p-2 text-slate-500 dark:bg-white/5 dark:text-slate-300">
              <Paperclip className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-slate-700 dark:text-slate-200">
                Drag & drop or click to select a PDF
              </div>
              <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                {pdfFile
                  ? `${pdfFile.name} (${Math.ceil(pdfFile.size / 1024)} KB)`
                  : existingAttachment
                  ? "Using current attachment"
                  : "No file selected"}
              </div>
            </div>
            <input
              id="pdf-input"
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={onPickPdf}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </CardInput>
      </Field>
    </div>
  );
}

/* === Subcomponentes auxiliares === */
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

function CardInput({ children, noPadding = false }) {
  return (
    <div
      className={
        "rounded-2xl border border-slate-200 bg-white shadow-sm dark:bg-[#0e0e0e] dark:border-white/10 " +
        (noPadding ? "" : "p-2")
      }
    >
      {children}
    </div>
  );
}
