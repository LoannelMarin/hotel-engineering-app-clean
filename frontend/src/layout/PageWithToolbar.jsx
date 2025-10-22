import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import ToolbarLoannel from "../components/layout/ToolbarLoannel";

/**
 * 📌 PageWithToolbar
 * Toolbar fija con título y placeholder automáticos según la ruta actual.
 *
 * Props:
 * - toolbarProps → (value, onChange, onAdd, etc.)
 * - children → contenido principal con scroll independiente
 * - hidePrint → opcional (oculta el botón Print cuando es true o según ruta)
 */
export default function PageWithToolbar({ toolbarProps = {}, children, hidePrint }) {
  const location = useLocation();

  // 🔧 Limpiar path (quita slash final y query params)
  const cleanPath = location.pathname.replace(/\/+$/, "").split("?")[0] || "/";

  // 🧭 Mapa de vistas con título + placeholder
  const views = {
    "/dashboard": ["Dashboard", "Search dashboard…"],
    "/inventory": ["Inventory", "Search inventory…"],
    "/inventory/logs": ["Inventory Logs", "Search logs…"],
    "/vendors": ["Vendors", "Search vendors…"],
    "/quotes": ["Quotes & Estimates", "Search quotes…"],
    "/invoices": ["Invoice Tracker", "Search invoices…"],
    "/assets": ["Asset Data", "Search assets…"],
    "/projects": ["Projects", "Search projects…"],
    "/users": ["Users", "Search users…"],
    "/paint": ["Paint Jobs", "Search paint jobs…"],
    "/schedule": ["Schedule", "Search schedule…"],
    "/licenses-permits": ["Licenses & Permits", "Search licenses…"],
    "/pms": ["Preventive Maintenance", "Search PMs…"],
    "/documents": ["Documents", "Search documents…"],
    "/manuals": ["Manuals", "Search manuals…"],
    "/calendar": ["Calendar", "Search events…"],
    "/inspections": ["Inspections", "Search inspections…"],
    "/room-status": ["Room Status", "Search rooms…"],
    "/sop/create": ["SOP Creator", "Search SOPs…"],
    "/sop/view": ["SOP Viewer", "Search SOPs…"],
  };

  // 🧠 Determinar coincidencia exacta o parcial más larga
  const match = useMemo(() => {
    if (views[cleanPath]) return views[cleanPath];
    const bestMatch = Object.keys(views)
      .filter((t) => cleanPath.startsWith(t))
      .sort((a, b) => b.length - a.length)[0];
    return views[bestMatch] || ["Overview", "Search…"];
  }, [cleanPath]);

  const [title, placeholder] = match;

  // 🔁 Combinar props del Toolbar
  const mergedToolbarProps = useMemo(() => {
    // 👇 Oculta el botón Print automáticamente si la ruta es /projects o hidePrint es true
    const isProjects = cleanPath.startsWith("/projects");
    return {
      ...toolbarProps,
      placeholder: toolbarProps.placeholder || placeholder,
      hidePrint: hidePrint || isProjects, // 🟩 Aquí está la lógica clave
    };
  }, [toolbarProps, placeholder, cleanPath, hidePrint]);

  return (
    <div key={cleanPath} className="relative w-full h-full flex flex-col">
      {/* 🔝 Toolbar fija */}
      <div className="sticky top-0 z-40 bg-zinc-100 dark:bg-zinc-950/20 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 gap-3">
          {/* 🏷️ Título automático */}
          <h2 className="text-base sm:text-lg font-semibold text-zinc-800 dark:text-zinc-100 truncate">
            {title}
          </h2>

          {/* 🔍 Toolbar con placeholder dinámico */}
          <ToolbarLoannel {...mergedToolbarProps} />
        </div>
      </div>

      {/* 📜 Contenido principal con scroll */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {children}
      </div>
    </div>
  );
}
