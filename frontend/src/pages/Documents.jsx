// frontend/src/pages/Documents.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Pencil,
  Trash2,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import api from "../api/client";
import PdfPreviewModal from "../components/PdfPreviewModal";
import DocumentFormModal from "../components/DocumentFormModal";
import Page from "../ui/Page";

export default function Documents() {
  const [items, setItems] = useState([]);
  const [vendorById, setVendorById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfOpen, setPdfOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  /* ---------- Load all ---------- */
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const [docsRes, vendorsRes] = await Promise.all([
          api.get("/api/documents"),
          api.get("/api/vendors/?per_page=1000").catch(() => ({ items: [] })),
        ]);
        const list = Array.isArray(docsRes?.items)
          ? docsRes.items
          : Array.isArray(docsRes)
          ? docsRes
          : [];
        setItems(list);
        const map = {};
        (vendorsRes?.items || []).forEach((v) => {
          map[String(v.id)] =
            v.name || v.company || v.contact_name || `#${v.id}`;
        });
        setVendorById(map);
      } catch (e) {
        console.error(e);
        setError("Failed to load documents.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ---------- Filter ---------- */
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    const norm = (x) => (x == null ? "" : String(x)).toLowerCase();
    return items.filter((r) => {
      const vendor =
        vendorById[String(r.vendor_id)] ||
        r.vendor?.name ||
        r.vendor?.company ||
        "";
      return (
        norm(r.name).includes(t) ||
        norm(r.description).includes(t) ||
        norm(vendor).includes(t)
      );
    });
  }, [items, q, vendorById]);

  /* ---------- Sorting ---------- */
  function handleSort(key) {
    setSortConfig((prev) => {
      if (prev.key === key) {
        const nextDir = prev.direction === "asc" ? "desc" : "asc";
        return { key, direction: nextDir };
      }
      return { key, direction: "asc" };
    });
  }

  const sorted = useMemo(() => {
    if (!sortConfig.key) return filtered;
    const sortedData = [...filtered].sort((a, b) => {
      const aVal = a[sortConfig.key] ?? "";
      const bVal = b[sortConfig.key] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return sortedData;
  }, [filtered, sortConfig]);

  /* ---------- CRUD ---------- */
  function openCreate() {
    setEditing(null);
    setOpenModal(true);
  }

  function openEdit(row) {
    setEditing(row || null);
    setOpenModal(true);
  }

  async function onDelete(row) {
    if (!row?.id) return;
    const ok = confirm(`Delete "${row.name}"?`);
    if (!ok) return;
    try {
      await api.delete(`/api/documents/${row.id}`);
      setItems((prev) => prev.filter((it) => it.id !== row.id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete document.");
    }
  }

  async function onSave(payload) {
    try {
      const isEdit = !!editing?.id;
      if (isEdit) await api.put(`/api/documents/${editing.id}`, payload);
      else await api.post("/api/documents", payload);
      setOpenModal(false);
      setEditing(null);
      const refreshed = await api.get("/api/documents");
      setItems(refreshed?.items || []);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Error saving document.");
    }
  }

  function openPdf(url) {
    if (!url) return;
    setPdfUrl(url);
    setPdfOpen(true);
  }

  function fmtDateLocal(s) {
    if (!s) return "—";
    try {
      const d = new Date(s);
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return s;
    }
  }

  const TD =
    "px-4 sm:px-5 py-2.5 border-b border-zinc-200 dark:border-zinc-800";

  /* ---------- Render ---------- */
  return (
    <Page title="">
      <div className="flex flex-col h-screen overflow-hidden bg-transparent page-fade-in">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-800 px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
          <h1 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Documents
          </h1>

          <div className="flex gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search documents..."
                className="w-[260px] md:w-[300px] pl-9 pr-3 py-2 rounded-2xl bg-transparent border border-zinc-400 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-[#0B5150]/30"
              />
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-gray-300 bg-white hover:shadow-sm transition dark:bg-zinc-800 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100"
            >
              <Plus size={18} />
              <span>Add</span>
            </button>
          </div>
        </header>

        {/* Tabla estilo Quotes */}
        <div className="relative flex-1 overflow-y-auto">
          <table className="w-full text-[15px] leading-6 border-separate [border-spacing:0] select-none">
            <thead className="bg-zinc-900 sticky top-0 z-10">
              <tr>
                {[
                  { label: "File", key: null, align: "center" },
                  { label: "Name", key: "name" },
                  { label: "Description", key: "description" },
                  { label: "Vendor", key: "vendor_id" },
                  { label: "Created", key: "created_at" },
                  { label: "Actions", key: null, align: "center" },
                ].map((col) => {
                  const isSorted = sortConfig.key === col.key;
                  const dirIcon =
                    isSorted && sortConfig.direction === "asc"
                      ? "▲"
                      : isSorted
                      ? "▼"
                      : "";
                  return (
                    <th
                      key={col.label}
                      onClick={() => col.key && handleSort(col.key)}
                      className={[
                        "px-4 sm:px-5 py-3 font-medium text-zinc-300 border-b border-zinc-800 bg-zinc-900 select-none",
                        col.key ? "cursor-pointer" : "",
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                          ? "text-right"
                          : "text-left",
                      ].join(" ")}
                    >
                      <div
                        className={`flex ${
                          col.align === "center"
                            ? "justify-center"
                            : col.align === "right"
                            ? "justify-end"
                            : "justify-between"
                        } items-center gap-1`}
                      >
                        <span>{col.label}</span>
                        {dirIcon && (
                          <span className="text-xs opacity-60">{dirIcon}</span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 sm:px-5 py-6 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    <Loader2 className="animate-spin inline-block mr-2 w-4 h-4" />
                    Loading…
                  </td>
                </tr>
              )}

              {!loading &&
                sorted.map((row) => {
                  const vendorName =
                    vendorById[String(row.vendor_id)] ||
                    row.vendor?.name ||
                    row.vendor?.company ||
                    "—";
                  return (
                    <tr
                      key={row.id}
                      className="bg-transparent text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-[#1a1a1a] transition"
                    >
                      <td className={TD + " text-center"}>
                        {row.file_url ? (
                          <button
                            type="button"
                            onClick={() => openPdf(row.file_url)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-transparent text-[#0B5150] hover:bg-zinc-100 dark:text-[#5ad5d3] dark:hover:bg-zinc-800"
                            title="Open PDF"
                          >
                            <FileText size={16} />
                          </button>
                        ) : (
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 text-zinc-500">
                            <FileText size={16} />
                          </span>
                        )}
                      </td>

                      <td className={`${TD} font-semibold`}>
                        {row.name || "—"}
                      </td>
                      <td className={TD}>{row.description || "—"}</td>
                      <td className={TD}>{vendorName}</td>
                      <td className={TD}>{fmtDateLocal(row.created_at)}</td>

                      <td className={TD + " text-center"}>
                        <div className="inline-flex justify-center gap-2 flex-wrap">
                          <button
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border border-zinc-300 bg-transparent text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            onClick={() => openEdit(row)}
                            type="button"
                          >
                            <Pencil size={13} />
                            Edit
                          </button>
                          <button
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border border-rose-300 bg-transparent text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/30"
                            onClick={() => onDelete(row)}
                            type="button"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!loading && !sorted.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 sm:px-5 py-6 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    No results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modals */}
        <DocumentFormModal
          open={openModal}
          initial={editing}
          onClose={() => {
            setOpenModal(false);
            setEditing(null);
          }}
          onSave={onSave}
        />

        <PdfPreviewModal
          open={pdfOpen}
          url={pdfUrl}
          onClose={() => setPdfOpen(false)}
        />
      </div>
    </Page>
  );
}
