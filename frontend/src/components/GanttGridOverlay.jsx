// src/components/GanttGridOverlay.jsx
import React from "react";
import "../styles/gantt-grid.css";

/**
 * Overlay de cuadriculas para el Gantt.
 * Colócalo dentro del contenedor del timeline (position: relative).
 *
 * Props:
 *  - pxPerDay: ancho en px de 1 día en el Gantt
 *  - rowHeight: alto en px de cada fila
 *  - showMonths/weeks/days: activar líneas de mes/semana/día
 */
export default function GanttGridOverlay({
  pxPerDay = 24,
  rowHeight = 56,
  showMonths = true,
  showWeeks = true,
  showDays = true,
}) {
  const style = {
    // tamaños
    "--day-w": `${pxPerDay}px`,
    "--row-h": `${rowHeight}px`,
    // colores (ajustan bien para dark y light)
    "--grid-day": showDays ? "rgba(100,116,139,.18)" : "transparent",
    "--grid-week": showWeeks ? "rgba(100,116,139,.30)" : "transparent",
    "--grid-month": showMonths ? "rgba(100,116,139,.55)" : "transparent",
    "--grid-row": "rgba(148,163,184,.18)",
  };

  return <div className="gantt-grid-overlay pointer-events-none" style={style} />;
}
