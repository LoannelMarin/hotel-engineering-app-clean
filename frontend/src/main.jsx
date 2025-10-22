// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext.jsx"; // ← mantenida

/** ========= THEME MANAGER =========
 * Lee localStorage.theme ('dark'|'light'|'auto') y aplica la clase .dark en <html>.
 * Reacciona a: cambios del sistema, cambios en localStorage y un evento custom.
 * Atajo global: window.__setTheme('dark'|'light'|'auto')
 */
const THEME_KEY = "theme";

function isSystemDark() {
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
}

function applyTheme(theme) {
  const root = document.documentElement;
  const mode =
    theme === "dark" ? "dark" :
    theme === "light" ? "light" :
    (isSystemDark() ? "dark" : "light"); // 'auto'

  root.classList.toggle("dark", mode === "dark");
  // Hace que los popups nativos (select, date, etc.) respeten el modo
  root.style.colorScheme = mode === "dark" ? "dark" : "light";
}

function initTheme() {
  let stored = localStorage.getItem(THEME_KEY);
  if (stored !== "dark" && stored !== "light" && stored !== "auto") stored = "auto";
  applyTheme(stored);

  const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (mql?.addEventListener) {
    mql.addEventListener("change", () => {
      if ((localStorage.getItem(THEME_KEY) || "auto") === "auto") applyTheme("auto");
    });
  }

  window.addEventListener("storage", (e) => {
    if (e.key === THEME_KEY) applyTheme(e.newValue || "auto");
  });

  window.addEventListener("theme:apply", (e) => {
    const val =
      e?.detail === "dark" || e?.detail === "light" || e?.detail === "auto"
        ? e.detail
        : (localStorage.getItem(THEME_KEY) || "auto");
    applyTheme(val);
  });

  // Atajo global opcional para toggles
  window.__setTheme = (val) => {
    const v = val === "dark" || val === "light" || val === "auto" ? val : "auto";
    localStorage.setItem(THEME_KEY, v);
    applyTheme(v);
  };
}

initTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
