// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Building2, Users, BarChart3 } from "lucide-react";
import VendorsSummary from "../components/dashboard/VendorsSummary";
import MainOverview from "../components/dashboard/MainOverview";
import StatsCards from "../components/dashboard/StatsCards";
import RoomTemperature from "../components/dashboard/RoomTemperature"; // ✅ reemplaza TasksOverview
import InvoiceSummaryPanel from "../components/dashboard/InvoiceSummaryPanel";
import InventorySummaryCard from "../components/dashboard/InventorySummaryCard";
import { fetchWithAuth } from "../utils/api";

export default function Dashboard() {
  const [view, setView] = useState("summary");
  const [invoicesData, setInvoicesData] = useState([]);

  /* --------------------------- Vendors Dummy --------------------------- */
  const vendors = [
    { name: "HD Supply", projects: 8, invoices: 15 },
    { name: "Grainger", projects: 5, invoices: 9 },
    { name: "Ferguson", projects: 3, invoices: 4 },
  ];

  const stats = [
    { label: "Projects", value: 12 },
    { label: "Vendors", value: 24 },
    { label: "Invoices", value: 58 },
    { label: "Tasks", value: 94 },
  ];

  /* ---------------------- Fetch real invoices ---------------------- */
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchWithAuth("/api/invoices/?per_page=100");
        if (Array.isArray(data.items)) {
          setInvoicesData(data.items);
        } else if (Array.isArray(data)) {
          setInvoicesData(data);
        } else if (Array.isArray(data.results)) {
          setInvoicesData(data.results);
        } else {
          console.warn("⚠️ Unexpected invoices format:", data);
        }
      } catch (err) {
        console.error("❌ Error fetching invoices:", err);
      }
    })();
  }, []);

  /* ------------------------------ Render ------------------------------ */
  return (
    <div className="p-4 sm:p-6 flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text-1)]">
      {/* ---------- Toolbar ---------- */}
      <header
        className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b 
                   border-zinc-800 sticky top-0 z-30 bg-[var(--bg)]/90 backdrop-blur-sm"
      >
        <h1 className="text-xl sm:text-2xl font-semibold text-black dark:text-white">
          Dashboard
        </h1>

        <div className="flex gap-2 flex-wrap justify-end">
          {[
            { key: "summary", label: "Summary", icon: BarChart3 },
            { key: "vendors", label: "Vendors", icon: Users },
            { key: "general", label: "General", icon: Building2 },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border transition text-sm sm:text-base
                ${
                  view === key
                    ? "bg-[#0B5150] text-white border-[#0B5150]"
                    : "border-gray-300 bg-white dark:bg-zinc-900 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* ---------- Main View ---------- */}
      <div className="flex-1 mt-6 space-y-6 sm:space-y-8">
        {view === "summary" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* 🧩 Fila 1 → Active Project + Invoices */}
            <div className="xl:col-span-2 min-h-fit">
              <MainOverview stats={stats} />
            </div>
            <div className="xl:col-span-1 min-h-fit">
              <InvoiceSummaryPanel invoices={invoicesData} />
            </div>

            {/* 🧩 Fila 2 → Inventory + RoomTemperature */}
            <div className="xl:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InventorySummaryCard />
              <RoomTemperature /> {/* ✅ sustituido aquí */}
            </div>

            {/* 🧩 Fila 3 → Vendors */}
            <div className="xl:col-span-3">
              <VendorsSummary vendors={vendors} />
            </div>
          </div>
        )}

        {view === "vendors" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            <VendorsSummary vendors={vendors} />
            <div className="rounded-2xl border p-4 sm:p-6 bg-white dark:bg-[#1d1f24] dark:border-gray-700 shadow-sm flex flex-col justify-center items-center text-center">
              <p className="text-sm sm:text-base text-zinc-400">
                Aquí puedes agregar gráficos de desempeño, comparativas o totales
              </p>
            </div>
          </div>
        )}

        {view === "general" && <GeneralView />}
      </div>
    </div>
  );
}

/* ---------- General View ---------- */
function GeneralView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Activity */}
      <div className="rounded-2xl border border-zinc-800 bg-white dark:bg-[#1d1f24] dark:border-zinc-700 shadow-sm p-4 sm:p-6">
        <h3 className="font-semibold mb-3 text-[#0B5150] text-base sm:text-lg">
          Recent Activity
        </h3>
        <ul className="space-y-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-300">
          <li>• 2 new invoices added</li>
          <li>• Project “Pool Pump Replacement” completed</li>
          <li>• 3 inventory items updated</li>
        </ul>
      </div>

      {/* Quick Links */}
      <div className="rounded-2xl border border-zinc-800 bg-white dark:bg-[#1d1f24] dark:border-zinc-700 shadow-sm p-4 sm:p-6">
        <h3 className="font-semibold mb-3 text-[#0B5150] text-base sm:text-lg">
          Quick Links
        </h3>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
          {[
            { href: "/projects", label: "Projects" },
            { href: "/inventory", label: "Inventory" },
            { href: "/vendors", label: "Vendors" },
            { href: "/invoices", label: "Invoices" },
          ].map(({ href, label }) => (
            <a
              key={label}
              href={href}
              className="text-center px-4 py-2 rounded-xl border border-zinc-700 hover:bg-zinc-800 dark:hover:bg-zinc-700 transition text-[#0B5150] dark:text-[#5ad5d3] text-sm sm:text-base"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
