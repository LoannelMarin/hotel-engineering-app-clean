import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  ChevronRight,
  Loader2,
  FileText,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import VendorFormModal from "../components/VendorFormModal";
import PdfPreviewModal from "../components/PdfPreviewModal";

// UI base
import Page from "../ui/Page";
import DataTableLoannel from "../ui/DataTableLoannel";

export default function Vendors() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [errorList, setErrorList] = useState("");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const selected = useMemo(
    () => items.find((v) => v.id === selectedId) || null,
    [items, selectedId]
  );

  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [tab, setTab] = useState("quotes");
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfOpen, setPdfOpen] = useState(false);

  // ========== Load vendors ==========
  async function reloadVendors(preserveSelection = true) {
    setLoadingList(true);
    setErrorList("");
    try {
      const res = await api.get("/api/vendors/");
      const list = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res)
        ? res
        : [];
      setItems(list);
      if (!preserveSelection) setSelectedId(list.length ? list[0].id : null);
      else if (list.length && selectedId == null) setSelectedId(list[0].id);
      else if (selectedId != null && !list.some((v) => v.id === selectedId))
        setSelectedId(list.length ? list[0].id : null);
    } catch (e) {
      console.error(e);
      setErrorList("Failed to load vendors.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    reloadVendors(false);
  }, []);

  // ========== Filter ==========
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    const norm = (s) => (s || "").toString().toLowerCase();
    return items.filter(
      (v) =>
        norm(v.name).includes(t) ||
        norm(v.company_name).includes(t) ||
        norm(v.contact_name).includes(t) ||
        norm(v.email).includes(t) ||
        norm(v.phone).includes(t) ||
        norm(v.categories).includes(t)
    );
  }, [items, q]);

  // ========== Keyboard navigation ==========
  const handleKeyDown = useCallback(
    (e) => {
      if (!filtered.length) return;
      const currentIndex = filtered.findIndex((v) => v.id === selectedId);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next =
          currentIndex < filtered.length - 1
            ? filtered[currentIndex + 1]
            : filtered[0];
        setSelectedId(next.id);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev =
          currentIndex > 0
            ? filtered[currentIndex - 1]
            : filtered[filtered.length - 1];
        setSelectedId(prev.id);
      }
    },
    [filtered, selectedId]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ========== Helpers ==========
  const BTN_SOFT =
    "px-3 py-1.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800";
  const BTN_DANGER =
    "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-all duration-200 shadow-sm hover:shadow-[0_0_8px_rgba(244,63,94,0.3)]";

  function StatusBadge({ status }) {
    const s = (status || "Draft").toString().toLowerCase();
    const cls =
      s === "approved" || s === "paid"
        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
        : s === "rejected" || s === "overdue"
        ? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300"
        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}
      >
        {status ?? "—"}
      </span>
    );
  }

  function fmtMoney(n, isInvoice = false) {
    const value = Number(n || 0);
    if (isInvoice) return `$${value.toFixed(2)}`;
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatDate(dateString) {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (isNaN(d)) return dateString;
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function openPdf(url) {
    if (!url) return;
    setPdfUrl(url);
    setPdfOpen(true);
  }

  async function deleteVendor(id) {
    if (!window.confirm("Delete this vendor?")) return;
    try {
      await api.delete(`/api/vendors/${id}`);
      await reloadVendors(false);
      setSelectedId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete vendor.");
    }
  }

  // ========== Related ==========
  useEffect(() => {
    async function loadRelated() {
      if (!selectedId) return;
      try {
        setLoadingRelated(true);
        const [qRes, iRes, dRes] = await Promise.all([
          api.get(`/api/quotes?vendor_id=${selectedId}`).catch(() => []),
          api.get(`/api/invoices?vendor_id=${selectedId}`).catch(() => []),
          api.get(`/api/documents?vendor_id=${selectedId}`).catch(() => []),
        ]);
        const toList = (r) =>
          Array.isArray(r?.items)
            ? r.items
            : Array.isArray(r)
            ? r
            : Array.isArray(r?.data)
            ? r.data
            : [];
        setQuotes(toList(qRes));
        setInvoices(toList(iRes));
        setDocuments(toList(dRes).filter((d) => d.vendor_id === selectedId));
      } finally {
        setLoadingRelated(false);
      }
    }
    loadRelated();
  }, [selectedId]);

  const columns = useMemo(() => {
    if (tab === "documents") {
      return [
        {
          key: "pdf",
          title: "PDF",
          render: (r) => (
            <button
              onClick={() => openPdf(r.file_url || r.url)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-brand/50 text-brand hover:bg-brand/10"
            >
              <FileText size={14} />
            </button>
          ),
        },
        {
          key: "name",
          title: "Name",
          render: (r) => r.name || r.filename || "(untitled)",
        },
        {
          key: "description",
          title: "Description",
          render: (r) => r.description || r.notes || "—",
        },
        {
          key: "uploaded",
          title: "Uploaded",
          render: (r) => formatDate(r.uploaded_at || r.created_at),
        },
      ];
    }
    const isQuotes = tab === "quotes";
    const isInvoices = tab === "invoices";
    return [
      {
        key: "pdf",
        title: "PDF",
        render: (r) => (
          <button
            onClick={() => openPdf(r.file_url || r.url)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-brand/50 text-brand hover:bg-brand/10"
          >
            <FileText size={14} />
          </button>
        ),
      },
      { key: "status", title: "Status", render: (r) => <StatusBadge status={r.status} /> },
      {
        key: "name",
        title: isQuotes ? "Project" : "Invoice #",
        render: (r) =>
          r.project_name || r.invoice_number || r.name || "(untitled)",
      },
      { key: "description", title: "Description", render: (r) => r.description || r.notes || "—" },
      {
        key: "amount",
        title: "Amount / Total",
        align: "right",
        render: (r) => fmtMoney(r.amount || r.order_total || 0, isInvoices),
      },
    ];
  }, [tab]);

  return (
    <Page title="Vendors">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px),1fr] gap-4">
        {/* Sidebar */}
        <aside className="bg-card-day dark:bg-card-dark border border-zinc-200/60 dark:border-zinc-700/60 rounded-2xl shadow-sm flex flex-col h-full">
          <div className="p-3 sm:p-4 border-b border-zinc-200/60 dark:border-zinc-700/60">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search vendor, contact, phone…"
              className="w-full px-3 py-1.5 rounded-xl text-sm bg-white border border-zinc-300 text-zinc-900 placeholder:text-zinc-500 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-600/50"
            />
          </div>

          <div className="flex-1 overflow-y-auto max-h-[60vh] sm:max-h-[580px] custom-scroll">
            {loadingList ? (
              <ListLoading />
            ) : errorList ? (
              <div className="p-4 text-rose-600 dark:text-rose-400">
                {errorList}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-zinc-500 dark:text-zinc-400">
                No vendors found.
              </div>
            ) : (
              <ul className="divide-y divide-zinc-200/60 dark:divide-zinc-700/60">
                {filtered.map((v) => (
                  <li
                    key={v.id}
                    onClick={() => setSelectedId(v.id)}
                    className={`relative px-3 py-3 cursor-pointer group flex items-center gap-3 transition-all ${
                      selectedId === v.id
                        ? "bg-brand/15 dark:bg-brand/30 border-l-4"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800/70"
                    }`}
                    style={
                      selectedId === v.id ? { borderLeftColor: "#0B5150" } : {}
                    }
                  >
                    <Avatar name={v.name || v.company_name || ""} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {v.name || v.company_name}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {v.contact_name || "—"}
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 opacity-60 group-hover:opacity-100">
                      <button
                        type="button"
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingVendor(v);
                          setModalOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <ChevronRight className="h-4 w-4 text-zinc-400" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-4 border-t border-zinc-200/60 dark:border-zinc-700/60">
            <button
              type="button"
              onClick={() => {
                setEditingVendor(null);
                setModalOpen(true);
              }}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#0B5150] text-white font-medium hover:bg-[#094543] active:scale-[.98]"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add Vendor</span>
            </button>
          </div>
        </aside>

        {/* Right panel */}
        <section className="bg-card-day dark:bg-card-dark border border-zinc-200/60 dark:border-zinc-700/60 rounded-2xl shadow-sm flex flex-col">
          {!selected ? (
            <div className="p-6 text-zinc-500 dark:text-zinc-400 text-center">
              Select a vendor from the list.
            </div>
          ) : (
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold break-words">
                    {selected.name || selected.company_name}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-300 break-words">
                    {selected.contact_name || "—"}
                  </div>
                </div>
                <button
                  onClick={() => deleteVendor(selected.id)}
                  className={BTN_DANGER}
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>

              <VendorDetail selected={selected} />

              <div className="mt-8 border-t border-zinc-200/60 dark:border-zinc-700/60 pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex flex-wrap gap-2">
                    {["quotes", "invoices", "documents"].map((key) => (
                      <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                          tab === key
                            ? "bg-[#0B5150] text-white"
                            : "border border-zinc-200/60 dark:border-zinc-700/60 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        }`}
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        tab === "quotes"
                          ? "/quotes"
                          : tab === "invoices"
                          ? "/invoices"
                          : "/documents"
                      )
                    }
                    className={BTN_SOFT}
                  >
                    Go to view
                  </button>
                </div>

                {loadingRelated ? (
                  <ListLoading />
                ) : (
                  <div className="dt-loannel-dark rounded-2xl overflow-x-auto border border-zinc-200/60 dark:border-zinc-700/60">
                    <DataTableLoannel
                      columns={columns}
                      rows={
                        tab === "quotes"
                          ? quotes
                          : tab === "invoices"
                          ? invoices
                          : documents
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      <VendorFormModal
        open={modalOpen}
        initial={editingVendor}
        onClose={() => {
          setModalOpen(false);
          setEditingVendor(null);
        }}
        onSave={async (payload) => {
          try {
            if (payload instanceof FormData) {
              if (editingVendor?.id)
                await api.put(`/api/vendors/${editingVendor.id}`, payload);
              else await api.post("/api/vendors/", payload);
            } else {
              if (editingVendor?.id)
                await api.put(`/api/vendors/${editingVendor.id}`, payload);
              else await api.post("/api/vendors/", payload);
            }
            await reloadVendors(false);
            setModalOpen(false);
            setEditingVendor(null);
          } catch (err) {
            console.error("❌ Error saving vendor:", err);
            alert("Failed to save vendor.");
          }
        }}
      />

      <PdfPreviewModal
        open={pdfOpen}
        url={pdfUrl}
        onClose={() => setPdfOpen(false)}
      />
    </Page>
  );
}

/* ---------- Subcomponents ---------- */
function VendorDetail({ selected }) {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  let logoSrc = null;
  if (selected.logo_url) {
    const cleanPath = selected.logo_url.trim().replace(/ /g, "_");
    if (cleanPath.startsWith("http")) logoSrc = cleanPath;
    else if (cleanPath.startsWith("/uploads/"))
      logoSrc = `${apiBase.replace(/\/$/, "")}${cleanPath}`;
    else if (cleanPath.startsWith("uploads/"))
      logoSrc = `${apiBase.replace(/\/$/, "")}/${cleanPath}`;
    else logoSrc = `${apiBase.replace(/\/$/, "")}/${cleanPath.replace(/^\//, "")}`;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 bg-zinc-50 dark:bg-zinc-800/50 shadow-sm">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-[320px] flex items-center justify-center bg-white dark:bg-zinc-900 p-3 sm:p-4">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="Vendor logo"
              className="w-full h-[200px] object-contain rounded-xl border border-zinc-300/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 p-2"
            />
          ) : (
            <div className="h-[200px] w-full grid place-items-center text-zinc-400 text-sm">
              No logo
            </div>
          )}
        </div>

        <div className="flex-1 p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
          <Detail label="Email" value={selected.email || "—"} />
          <Detail label="Phone" value={selected.phone || "—"} />
          <Detail
            label="Categories"
            value={selected.categories || selected.services || "—"}
          />
          <Detail label="Status" value={selected.status || "Active"} />
          <Detail label="Address" value={selected.address || "—"} full />
          {selected.notes && <Detail label="Notes" value={selected.notes} full />}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, full }) {
  return (
    <div className={full ? "sm:col-span-2 space-y-1" : "space-y-1"}>
      <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className="text-sm text-zinc-900 dark:text-zinc-100 break-words whitespace-pre-wrap">
        {value}
      </div>
    </div>
  );
}

function Avatar({ name = "" }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  return (
    <div className="h-9 w-9 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-100 grid place-items-center font-semibold">
      {initials || "V"}
    </div>
  );
}

function ListLoading() {
  return (
    <div className="p-4 text-zinc-600 dark:text-zinc-300 flex items-center justify-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading…
    </div>
  );
}
