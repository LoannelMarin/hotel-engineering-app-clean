import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext({
  theme: "system", // "light" | "dark" | "system"
  setTheme: () => {},
  toggleTheme: () => {},
});

function getSystemPrefersDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyHtmlClass(theme) {
  const root = document.documentElement;
  const wantsDark = theme === "dark" || (theme === "system" && getSystemPrefersDark());
  root.classList.toggle("dark", wantsDark);

  // Opcional: hint para scrollbars nativos y selects
  root.style.colorScheme = wantsDark ? "dark" : "light";

  // Opcional: meta theme-color para móvil
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", wantsDark ? "#0a0a0b" : "#f6f7fb");
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme_pref");
    return saved || "system";
  });

  // Aplica clase en <html> al montar y cuando cambie el theme
  useEffect(() => {
    applyHtmlClass(theme);
    localStorage.setItem("theme_pref", theme);
  }, [theme]);

  // Responde a cambios de sistema si estás en "system"
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyHtmlClass("system");
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
