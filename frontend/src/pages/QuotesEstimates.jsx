import React, { useEffect, useState } from "react";
import QuotesTable from "../components/QuotesTable";
import QuoteFormDrawer from "../components/QuoteFormDrawer";
import { fetchWithAuth } from "../utils/api";
import * as XLSX from "xlsx";
import { Plus, FileSpreadsheet } from "lucide-react";
import PageWithToolbar from "../layout/PageWithToolbar";

/**
 * Quotes & Estimates Page
 * - Tabla ocupa toda la vista
 * - Header de la tabla fijo
 * - Scroll solo en las filas
 * - Sin márgenes ni padding alrededor
 * - ✅ Responsive (scroll horizontal en pantallas pequeñas)
 */
export default function QuotesEstimates() {
  const [open, setOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [reloadToken, setReloadToken] = useState(0);
  const [editRow, setEditRow] = useState(null);
  const [q, setQ] = useState("");
  const [quotesData, setQuotesData] = useState([]);

  // === Cargar vendors ===
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchWithAuth("/api/vendors/?per_page=1000");
        if (alive) setVendors(res?.items || []);
      } catch {
        if (alive) setVendors([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // === Cargar quotes ===
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchWithAuth("/api/quotes?per_page=1000");
        if (alive) setQuotesData(res?.items || []);
      } catch {
        if (alive) setQuotesData([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadToken]);

  function openCreate() {
    setEditRow(null);
    setOpen(true);
  }
  function openEdit(row) {
    setEditRow(row);
    setOpen(true);
  }
  function closeDrawer() {
    setOpen(false);
  }
  function handleSaved() {
    setReloadToken((x) => x + 1);
  }

  // === Exportar a Excel ===
  function handleExportExcel() {
    if (!quotesData || quotesData.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const exportData = quotesData.map((q) => ({
      "Quote ID": q.id || "",
      "Project Name": q.project_name || "",
      Vendor: q.vendor_name || "",
      Status: q.status || "",
      Amount: q.amount || q.total || "",
      Created: q.created_at || "",
      Updated: q.updated_at || "",
      Notes: q.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Quotes");

    const now = new Date();
    const filename = `Quotes_${now.toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  // 🔹 Props para ToolbarLoannel
  const toolbarProps = {
    value: q,
    onChange: setQ,
    onAdd: openCreate,
    onExport: handleExportExcel,
  };

  return (
    <PageWithToolbar toolbarProps={toolbarProps}>
      {/* === Tabla ocupa toda la pantalla === */}
      <div className="relative flex-1 h-[calc(100vh-6rem)] overflow-y-auto overflow-x-auto">
        <div className="min-w-full w-full">
          <QuotesTable
            reloadToken={reloadToken}
            onEdit={openEdit}
            filterQ={q}
          />
        </div>
      </div>

      {/* === Drawer Crear/Editar === */}
      <QuoteFormDrawer
        open={open}
        initial={editRow}
        vendors={vendors}
        onClose={closeDrawer}
        onSaved={handleSaved}
      />
    </PageWithToolbar>
  );
}
