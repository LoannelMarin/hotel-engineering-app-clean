// frontend/src/pages/ProjectGridPrint.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchWithAuth } from "../utils/api";

export default function ProjectGridPrint() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [printed, setPrinted] = useState(false);

  const FLOORS = [8, 7, 6, 5, 4, 3, 2];
  const roomsForFloor = (f) =>
    f === 2
      ? Array.from({ length: 16 }, (_, i) => 201 + i)
      : Array.from({ length: 17 }, (_, i) => f * 100 + 1 + i);

  useEffect(() => {
    (async () => {
      try {
        const p = await fetchWithAuth(`/api/projects/${id}`);
        const r = await fetchWithAuth(`/api/projects/${id}/rooms`);
        setProject(p);
        setRooms(r?.items || []);

        setTimeout(() => {
          if (!printed) {
            setPrinted(true);
            window.print();
          }
        }, 800);
      } catch (err) {
        console.error("Error loading project print view:", err);
      }
    })();
  }, [id, printed]);

  // ✅ Normaliza leyenda (soporta defaults y personalizados)
  const normalizeLegend = (legend) => {
    const base = {
      "not started": "#FFFFFF",
      "in progress": "#4F46E5",
      completed: "#15803D",
      "n/a": "#94A3B8",
    };

    const map = {};
    if (legend) {
      Object.entries(legend).forEach(([k, v]) => {
        if (typeof v === "string") {
          map[k.toLowerCase()] = v;
        } else if (v && typeof v === "object" && (v.label || v.color)) {
          const key = (v.label || k).toLowerCase();
          map[key] = v.color || "#94A3B8";
        }
      });
    }
    return { ...base, ...map };
  };

  const LEGEND = normalizeLegend(project?.color_legend);

  const getColor = (roomNum) => {
    const match = rooms.find((r) => String(r.room_number) === String(roomNum));
    if (!match) return "#FFFFFF";

    const statusKey = String(match.status || "not_started").toLowerCase();
    return (
      LEGEND[statusKey] ||
      LEGEND[statusKey.replace(/_/g, " ")] ||
      "#FFFFFF"
    );
  };

  const getTextColor = (bg) => {
    if (!bg) return "#111";
    const hex = bg.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 140 ? "#FFFFFF" : "#111111";
  };

  if (!project)
    return <div style={{ color: "#555", padding: "2rem" }}>Loading...</div>;

  return (
    <>
      <style>
        {`
        html, body {
          background: #ffffff !important;
          color: #000000 !important;
          margin: 0;
          padding: 0;
          box-shadow: none !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #root {
          background: #ffffff !important;
        }

        @page {
          size: A4 landscape;
          margin: 1cm;
          background: #ffffff !important;
        }

        @media print {
          nav, aside, header, footer, button, .no-print, .fixed, .sticky {
            display: none !important;
          }
          .room {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        .page {
          width: 27.7cm;
          height: 18cm;
          background: white !important;
          font-family: 'Inter', sans-serif;
          color: #111;
          margin: 0 auto;
          padding: 1cm;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }

        .print-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 0.4cm;
          border-bottom: 0.05cm solid #e5e7eb;
          margin-bottom: 0.4cm;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.4cm;
        }

        .header-logo {
          width: 1.2cm;
          height: 1.2cm;
          object-fit: contain;
        }

        .header-hotel {
          font-size: 0.55cm;
          font-weight: 700;
          color: #0B5150;
        }

        .header-system {
          font-size: 0.4cm;
          color: #6b7280;
        }

        .header-date {
          font-size: 0.38cm;
          color: #4b5563;
        }

        .project-title {
          background: #0B5150;
          color: white;
          border-radius: 10px 10px 0 0;
          padding: 0.25cm 0.5cm;
          font-weight: 600;
          font-size: 0.55cm;
          letter-spacing: 0.3px;
          margin-bottom: 0.3cm;
        }

        /* ✅ Horizontal legend */
        .legend-row {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 0.6cm 1cm;
          margin-bottom: 0.4cm;
          font-size: 0.38cm;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.25cm;
        }

        .legend-color {
          width: 0.8cm;
          height: 0.4cm;
          border-radius: 3px;
          border: 0.02cm solid #d1d5db;
        }

        .floors {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 0.15cm;
          font-size: 0.35cm;
        }

        .floor-label {
          color: #0B5150;
          font-weight: 700;
          margin-bottom: 0.1cm;
          font-size: 0.38cm;
        }

        .rooms {
          display: grid;
          gap: 0.07cm;
        }

        .room {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          border: 0.02cm solid #e5e7eb;
          font-weight: 600;
          font-size: 0.33cm;
          aspect-ratio: 2.5 / 1;
        }

        .footer {
          text-align: center;
          font-size: 0.35cm;
          color: #6b7280;
          margin-top: 0.4cm;
          border-top: 0.04cm solid #e5e7eb;
          padding-top: 0.15cm;
        }
        `}
      </style>

      <div className="page">
        {/* Header */}
        <div className="print-header">
          <div className="header-left">
            <img
              src="/static/logo.png"
              alt="Logo"
              className="header-logo"
              onError={(e) => (e.target.style.display = "none")}
            />
            <div>
              <div className="header-hotel">Aloft Orlando Downtown</div>
              <div className="header-system">Hotel Engineering System</div>
            </div>
          </div>
          <div className="header-date">{new Date().toLocaleString("en-US")}</div>
        </div>

        {/* Project Title */}
        <div className="project-title">{project.name}</div>

        {/* ✅ Legend (horizontal row) */}
        <div className="legend-row">
          {Object.entries(LEGEND).map(([label, color]) => (
            <div key={label} className="legend-item">
              <div
                className="legend-color"
                style={{ background: color }}
              ></div>
              <span>{label.toUpperCase()}</span>
            </div>
          ))}
        </div>

        {/* Floors */}
        <div className="floors">
          {FLOORS.map((f) => (
            <div key={f}>
              <div className="floor-label">FLOOR {f}</div>
              <div
                className="rooms"
                style={{
                  gridTemplateColumns:
                    f === 2 ? "repeat(16, 1fr)" : "repeat(17, 1fr)",
                }}
              >
                {roomsForFloor(f).map((room) => {
                  const bg = getColor(room);
                  const color = getTextColor(bg);
                  return (
                    <div
                      key={room}
                      className="room"
                      style={{ background: bg, color }}
                    >
                      {room}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="footer">
          Project Status: <strong>{project.status || "Unknown"}</strong>
        </div>
      </div>
    </>
  );
}
