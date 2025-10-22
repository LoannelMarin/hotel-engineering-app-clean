// src/components/DarkModeButton.jsx
import React from "react";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun } from "lucide-react";

export default function DarkModeButton({ collapsed = false }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm transition
                  border bg-[var(--btn-bg)] border-[var(--border-1)] text-[var(--text-1)]
                  hover:bg-[var(--surface-2)]
                  ${collapsed ? "justify-center" : ""}`}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
      {!collapsed && <span className="font-medium">{isDark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
