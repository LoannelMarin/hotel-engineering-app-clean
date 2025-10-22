import React from "react";

/* ------------------ Contraste de texto sobre color ------------------ */
function textOn(bg) {
  const hex = String(bg || "#000").replace("#", "");
  const n =
    hex.length === 3
      ? hex.split("").map((c) => c + c).join("")
      : hex.padEnd(6, "0").slice(0, 6);
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return L > 0.6 ? "#111827" : "#ffffff";
}

/* ------------------ Room Tile Component ------------------ */
export default function RoomTile({ number, color, onClick }) {
  // 🔁 POR DEFECTO: BLANCO (Not Started)
  const fill = color || "#FFFFFF";
  const fg = textOn(fill);

  return (
    <button
      type="button"
      onClick={onClick}
      title={`Room ${number}`}
      className="relative w-full h-8 min-h-8 rounded-md border border-[var(--border-1)]
                 bg-[var(--surface-1)] dark:bg-[var(--surface-1)] overflow-hidden
                 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]
                 shadow-sm hover:shadow-md focus:outline-none"
      style={{ background: "transparent" }}
    >
      {/* Background fill */}
      <span
        className="absolute inset-[1px] rounded-[inherit] transition-all duration-200"
        style={{ background: fill }}
      />
      {/* Room number */}
      <span
        className="relative z-10 font-semibold text-[11px] select-none"
        style={{ color: fg }}
      >
        {number}
      </span>
    </button>
  );
}

