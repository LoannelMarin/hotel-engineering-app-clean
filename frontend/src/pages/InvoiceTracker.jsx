// frontend/src/pages/InvoiceTracker.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import InvoiceFormModal from "../components/invoices/InvoiceFormModal";
import InvoicesTable from "../components/invoices/InvoicesTable";
import InvoiceToolbar from "../components/invoices/InvoiceToolbar";
import InvoiceSummaryDonuts from "../components/invoices/InvoiceSummaryDonuts";
import PdfPreviewModal from "../components/PdfPreviewModal";
import { buildInvoiceReportHTML } from "../components/invoices/InvoicePrintReport";
import Page from "../ui/Page";

/* ---------------- API base ---------------- */
const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  (typeof window !== "undefined"
    ? window.location.origin.replace(":5173", ":5000")
    : "http://localhost:5000");

const INVOICES_BASE = `${API_BASE}/api/invoices`;
const VENDORS_BASE = `${API_BASE}/api/vendors`;

async function fetchWithSlashFallback(url, init) {
  const doFetch = async (u) => fetch(u, init);
  let res = await doFetch(url);
  if (res.status === 405) {
    const alt = url.endsWith("/") ? url.slice(0, -1) : `${url}/`;
    res = await doFetch(alt);
  }
  return res;
}

async function getList(urlBase) {
  const res = await fetchWithSlashFallback(urlBase, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : data.items || [];
}

function absolutize(u) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return `${API_BASE}${u}`;
  return `${API_BASE}/${u.replace(/^\/+/, "")}`;
}

/* ---------------- Page ---------------- */
export default function InvoiceTracker() {
  const [rows, setRows] = useState([]);
  const [vendorMap, setVendorMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [initial, setInitial] = useState(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [tableHeight, setTableHeight] = useState("auto");

  const headerRef = useRef(null);

  /* === Altura dinámica del contenedor de tabla === */
  useEffect(() => {
    function recalcHeight() {
      const headerH = headerRef.current?.offsetHeight || 0;
      const viewportH =
        window.visualViewport?.height || window.innerHeight || 800;
      const marginBottom = 12;
      const available = viewportH - headerH - marginBottom;
      setTableHeight(`${available}px`);
    }

    recalcHeight();
    const resizeObs = new ResizeObserver(recalcHeight);
    if (headerRef.current) resizeObs.observe(headerRef.current);

    window.addEventListener("resize", recalcHeight);
    window.visualViewport?.addEventListener("resize", recalcHeight);

    return () => {
      resizeObs.disconnect();
      window.removeEventListener("resize", recalcHeight);
      window.visualViewport?.removeEventListener("resize", recalcHeight);
    };
  }, []);

  /* === Cargar datos === */
  async function loadAll() {
    setLoading(true);
    try {
      const [vendors, invoices] = await Promise.all([
        getList(VENDORS_BASE),
        getList(INVOICES_BASE),
      ]);
      const map = {};
      vendors.forEach((v) => {
        map[String(v.id)] =
          v.name || v.company || v.vendor_name || v.contact_name || `#${v.id}`;
      });
      setVendorMap(map);
      setRows(invoices);
    } catch (e) {
      console.error("Load failed:", e);
      setVendorMap({});
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    const norm = (x) => (x == null ? "" : String(x)).toLowerCase();
    return rows.filter((r) => {
      const vendor = vendorMap[String(r.vendor_id)] || r.vendor?.name || "";
      return (
        norm(r.invoice_number).includes(needle) ||
        norm(vendor).includes(needle) ||
        norm(r.status).includes(needle) ||
        norm(r.amount).includes(needle) ||
        norm(r.notes || r.order_description || r.description).includes(needle) ||
        norm(r.po_number).includes(needle)
      );
    });
  }, [rows, vendorMap, q]);

  /* === CRUD === */
  const openNew = () => {
    setInitial(null);
    setOpenForm(true);
  };
  const openEdit = (row) => {
    setInitial(row);
    setOpenForm(true);
  };
  const closeForm = () => {
    setOpenForm(false);
    setInitial(null);
  };

  async function saveInvoice(payload) {
    try {
      const isEdit = !!initial?.id;
      const url = isEdit ? `${INVOICES_BASE}/${initial.id}` : INVOICES_BASE;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      closeForm();
      await loadAll();
    } catch (e) {
      console.error("Save failed:", e);
      alert("Save invoice failed.");
    }
  }

  async function deleteInvoice(row) {
    const ok = window.confirm(`Delete invoice "${row.invoice_number}"?`);
    if (!ok) return;
    try {
      const res = await fetch(`${INVOICES_BASE}/${row.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadAll();
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Delete invoice failed.");
    }
  }

  async function markPaid(row) {
    const ok = window.confirm(`Mark invoice "${row.invoice_number}" as Paid?`);
    if (!ok) return;
    try {
      const res = await fetch(`${INVOICES_BASE}/${row.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Paid" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadAll();
    } catch (e) {
      console.error("Update failed:", e);
      alert("Failed to update status.");
    }
  }

  function onOpenPdf(url) {
    if (!url) {
      alert("This invoice does not have a PDF attached.");
      return;
    }
    setPdfUrl(absolutize(url));
    setPdfOpen(true);
  }

  function printReport() {
    const html = buildInvoiceReportHTML(filtered, vendorMap);
    const w = window.open("", "_blank");
    if (!w) return alert("Popup blocked");
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  /* === Render === */
  return (
    <Page title="">
      <div className="flex flex-col h-screen overflow-hidden bg-transparent page-fade-in">
        {/* Header con modo dark/day (idéntico a Quotes & Estimates) */}
        <header
          ref={headerRef}
          className="
            sticky top-0 z-30
            bg-zinc-100 dark:bg-zinc-900
            border-b border-zinc-300 dark:border-zinc-800
            px-6 py-3
            flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6
            shadow-sm
          "
        >
          <h1 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Invoices
          </h1>

          <div className="flex-1 min-w-0">
            <InvoiceToolbar
              value={q}
              onChange={setQ}
              onPrint={printReport}
              onAdd={openNew}
            />
          </div>

          <div className="flex-shrink-0">
            <InvoiceSummaryDonuts items={filtered} />
          </div>
        </header>

        {/* Tabla estilo Loannel */}
        <div
          className="flex-1 min-h-0 overflow-hidden border-t border-zinc-200 dark:border-zinc-800 bg-transparent"
          style={{ height: tableHeight, transition: "height 0.3s ease" }}
        >
          <InvoicesTable
            items={filtered}
            vendorMap={vendorMap}
            loading={loading}
            onEdit={openEdit}
            onDelete={deleteInvoice}
            onMarkPaid={markPaid}
            onOpenPdf={onOpenPdf}
          />
        </div>

        {/* Modales */}
        <InvoiceFormModal
          open={openForm}
          initial={initial}
          vendors={Object.entries(vendorMap).map(([id, name]) => ({ id, name }))}
          onClose={closeForm}
          onSave={saveInvoice}
        />

        <PdfPreviewModal
          open={pdfOpen}
          url={pdfUrl}
          onClose={() => setPdfOpen(false)}
        />

        <style>{`
          .page-fade-in { animation: inv-page-fade .25s ease-out; }
          @keyframes inv-page-fade { from { opacity: 0 } to { opacity: 1 } }
        `}</style>
      </div>
    </Page>
  );
}
