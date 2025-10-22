// src/components/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";

/**
 * Sidebar colapsable que encaja con tu App.jsx:
 * <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
 *
 * - Ancho controlado por prop `collapsed`
 * - Usa Tailwind
 * - Items listos para tus rutas (incluye /hvac)
 */

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/todo", label: "To-Do", icon: "✅" },
  { to: "/todo/records", label: "To-Do Records", icon: "🗂️" },
  { to: "/inventory", label: "Inventory", icon: "📦" },
  { to: "/inventory/logs", label: "Inventory Logs", icon: "📜" },
  { to: "/vendors", label: "Vendors", icon: "🏢" },
  { to: "/quotes", label: "Quotes", icon: "💬" },
  { to: "/invoices", label: "Invoices", icon: "🧾" },
  { to: "/assets", label: "Assets", icon: "🛠️" },
  { to: "/projects", label: "Projects", icon: "📁" },
  { to: "/users", label: "Users", icon: "👥" },
  { to: "/paint", label: "Paint", icon: "🎨" },
  { to: "/schedule", label: "Schedule", icon: "🗓️" },
  { to: "/licenses-permits", label: "Licenses & Permits", icon: "📑" },
  { to: "/pms", label: "PMs", icon: "⏱️" },
  { to: "/documents", label: "Documents", icon: "📄" },
  { to: "/manuals", label: "Manuals", icon: "📘" },
  { to: "/calendar", label: "Calendar", icon: "📅" },
  // 🆕 HVAC panel:
  { to: "/hvac", label: "HVAC", icon: "🌡️" },
  // Inspections hub:
  { to: "/inspections", label: "Inspections", icon: "🧪" },
];

export default function Sidebar({
  collapsed,
  setCollapsed,
  className = "",
}) {
  const isCollapsed = !!collapsed;

  const baseW = isCollapsed ? "w-16" : "w-64";

  return (
    <aside
      className={cx(
        "fixed left-0 top-0 h-screen border-r border-zinc-200 bg-white/95 backdrop-blur",
        "shadow-sm z-30",
        baseW,
        className
      )}
    >
      {/* Header */}
      <div className="h-14 px-3 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="text-xl">🏨</div>
          {!isCollapsed && (
            <div className="truncate font-semibold">Engineering</div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!isCollapsed)}
          className={cx(
            "rounded-lg border border-zinc-200 px-2 py-1 text-sm hover:bg-zinc-50",
            isCollapsed && "mx-auto"
          )}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? "›" : "‹"}
        </button>
      </div>

      {/* Search (opcional simple) */}
      <div className="px-3 pb-2">
        <div
          className={cx(
            "flex items-center gap-2 rounded-lg border border-zinc-200 bg-white",
            isCollapsed ? "px-2 py-2 justify-center" : "px-3 py-2"
          )}
        >
          <span className="text-zinc-500">🔎</span>
          {!isCollapsed && (
            <input
              placeholder="Search…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            />
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-2 overflow-y-auto h-[calc(100vh-14rem)] px-2 pb-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cx(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                    "hover:bg-zinc-100 text-zinc-700",
                    isActive && "bg-zinc-900 text-white hover:bg-zinc-900"
                  )
                }
              >
                <span className="text-base">{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-200 p-3">
        <div
          className={cx(
            "flex items-center gap-3 rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2",
            isCollapsed && "justify-center"
          )}
        >
          <span>👤</span>
          {!isCollapsed && (
            <div className="text-xs">
              <div className="font-medium">Logged in</div>
              <div className="text-zinc-500">Hotel Engineering</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

/* 
  Si quieres acceder al estado desde fuera, tu App ya lo maneja:
  const [collapsed, setCollapsed] = useState(...);
  <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
*/
