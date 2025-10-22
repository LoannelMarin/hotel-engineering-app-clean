// src/context/StatusContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const StatusContext = createContext(null);

const DEFAULT_STATUSES = [
  { id: "completed",   name: "Completed",    color: "#22c55e" }, // verde
  { id: "in_progress", name: "In progress",  color: "#3b82f6" }, // azul
  { id: "not_started", name: "Not started",  color: "#9ca3af" }, // gris (default al crear proyecto)
  { id: "na",          name: "N/A",          color: "#111827" }, // negro
];

const lsKey = "statuses_v1";

export function StatusProvider({ children }) {
  const [statuses, setStatuses] = useState(() => {
    try {
      const raw = localStorage.getItem(lsKey);
      return raw ? JSON.parse(raw) : DEFAULT_STATUSES;
    } catch {
      return DEFAULT_STATUSES;
    }
  });

  useEffect(() => {
    localStorage.setItem(lsKey, JSON.stringify(statuses));
  }, [statuses]);

  const addStatus = (name, color) => {
    const id = name.toLowerCase().replace(/\s+/g, "_");
    if (!statuses.some(s => s.id === id)) {
      setStatuses(prev => [...prev, { id, name, color }]);
    }
    return id;
  };

  const byId = useMemo(() => {
    const map = new Map();
    statuses.forEach(s => map.set(s.id, s));
    return map;
  }, [statuses]);

  const value = { statuses, byId, addStatus };
  return <StatusContext.Provider value={value}>{children}</StatusContext.Provider>;
}

export function useStatuses() {
  const ctx = useContext(StatusContext);
  if (!ctx) throw new Error("useStatuses must be used within <StatusProvider>");
  return ctx;
}

// Utilidades de color
export function hexToRgb(hex) {
  const n = hex.replace("#", "");
  const bigint = parseInt(n.length === 3 ? n.split("").map(c => c + c).join("") : n, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
export function contrastText(hex) {
  try {
    const { r, g, b } = hexToRgb(hex);
    // luminancia relativa sencilla
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 150 ? "#111827" : "#ffffff"; // oscuro si fondo claro, blanco si fondo oscuro
  } catch {
    return "#111827";
  }
}
