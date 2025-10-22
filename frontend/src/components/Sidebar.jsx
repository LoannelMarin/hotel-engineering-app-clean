import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  ListTodo,
  Package,
  Building2,
  FileText,
  Receipt,
  Wrench,
  FolderKanban,
  Users as UsersIcon,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCircle2,
  Paintbrush,
  Calendar,
  ClipboardList,
  BarChart3,
  FolderOpen,
  BookOpen,
  ScrollText,
  Hotel,
  Menu,
  X,
} from "lucide-react";
import DarkModeButton from "./DarkModeButton";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/todo", label: "To Do", icon: ListTodo },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/vendors", label: "Vendors", icon: Building2 },
  { to: "/quotes", label: "Quotes", icon: FileText },
  { to: "/invoices", label: "Invoices", icon: Receipt },
  { to: "/assets", label: "Assets", icon: Wrench },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/users", label: "Users", icon: UsersIcon },
  { to: "/paint", label: "Paint", icon: Paintbrush },
  { to: "/schedule", label: "Schedule", icon: Calendar },
  { to: "/licenses-permits", label: "Licenses & Permits", icon: ScrollText },
  { to: "/pms", label: "PMs", icon: ClipboardList },
  { to: "/room-status", label: "Room Status", icon: Hotel },
  { to: "/inspections", label: "Inspections", icon: BarChart3 },
  { to: "/documents", label: "Documents", icon: FolderOpen },
  { to: "/manuals", label: "Manuals", icon: BookOpen },
  { to: "/calendar", label: "Calendar", icon: Calendar },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Cierra el sidebar móvil al navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* 🔹 Botón hamburguesa para móvil */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="bg-[var(--sidebar-bg)] border border-[var(--border-1)] 
                     p-2 rounded-md shadow-sm text-[var(--text-1)]"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* 🔹 Overlay oscuro para móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 🔹 Sidebar principal */}
      <aside
        className={`
          fixed left-0 top-0 h-screen
          bg-[var(--sidebar-bg)] text-[var(--text-1)] border-[var(--border-1)] border-r
          w-[var(--sidebar-w)]
          transition-all duration-300 ease-in-out z-50
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 border-b px-2 border-[var(--border-1)]">
          {!collapsed ? (
            <span className="font-semibold text-sm tracking-wide text-[var(--text-1)]">
              Hotel Engineering
            </span>
          ) : (
            <span className="w-full text-center font-semibold text-xs text-[var(--text-1)]">
              HE
            </span>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="hidden lg:block rounded p-1 hover:bg-[var(--surface-2)]"
            aria-label="toggle sidebar"
            title={collapsed ? "Expandir" : "Colapsar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100vh-150px)]">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm transition
                            hover:bg-[var(--surface-2)]
                            ${
                              active
                                ? "bg-[var(--surface-2)] font-medium"
                                : "text-[var(--text-1)]"
                            }
                            ${collapsed ? "justify-center" : ""}
                            `}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--border-1)] bg-[var(--sidebar-bg)]">
          <div className="px-2 py-2">
            <DarkModeButton collapsed={collapsed} />
          </div>

          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "justify-between"
            } px-2 py-3`}
          >
            {!collapsed ? (
              <div className="flex items-center gap-2 min-w-0">
                <UserCircle2 size={22} className="opacity-80" />
                <div className="truncate">
                  <div className="text-sm font-medium truncate">
                    {user?.name || "Usuario"}
                  </div>
                  <div className="text-[11px] opacity-70 truncate">
                    {user?.email || ""}
                  </div>
                </div>
              </div>
            ) : (
              <UserCircle2
                size={22}
                className="opacity-80"
                title={user?.name || "Usuario"}
              />
            )}

            <button
              onClick={handleLogout}
              className="rounded px-2 py-1 text-xs bg-[var(--accent-red)] 
                         text-white hover:opacity-90 flex items-center gap-1"
              title="Logout"
            >
              <LogOut size={14} />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
