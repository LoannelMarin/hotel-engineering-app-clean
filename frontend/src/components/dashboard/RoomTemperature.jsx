import React, { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Thermometer, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RoomTemperature() {
  const [rooms, setRooms] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [animating, setAnimating] = useState(false);
  const navigate = useNavigate();
  const API_URL = "http://127.0.0.1:5000/api/inncom/current_full";
  const autoRef = useRef(null);

  /* 🎨 Escala de color según temperatura */
  const getTempColor = (temp) => {
    if (temp == null) return "#9ca3af";
    const t = Math.min(Math.max(temp, 60), 84);
    const stops = [
      { t: 60, color: [37, 99, 235] },
      { t: 68, color: [14, 165, 233] },
      { t: 72, color: [16, 185, 129] },
      { t: 76, color: [250, 204, 21] },
      { t: 80, color: [251, 146, 60] },
      { t: 84, color: [239, 68, 68] },
    ];
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i],
        b = stops[i + 1];
      if (t >= a.t && t <= b.t) {
        const r = Math.round(
          a.color[0] + ((t - a.t) / (b.t - a.t)) * (b.color[0] - a.color[0])
        );
        const g = Math.round(
          a.color[1] + ((t - a.t) / (b.t - a.t)) * (b.color[1] - a.color[1])
        );
        const bch = Math.round(
          a.color[2] + ((t - a.t) / (b.t - a.t)) * (b.color[2] - a.color[2])
        );
        return `rgb(${r}, ${g}, ${bch})`;
      }
    }
    return "#9ca3af";
  };

  /* 🔁 Cargar datos + actualización cada 30 segundos */
  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(API_URL);
        const data = await r.json();
        const arr = Object.values(data.items || {});
        arr.sort((a, b) => Number(a.room_number) - Number(b.room_number));
        setRooms(arr);
      } catch (e) {
        console.error("Error loading rooms:", e);
      } finally {
        setLoading(false);
      }
    };

    load(); // inicial
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const total = Math.ceil(rooms.length / 4);

  const next = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => setAnimating(false), 600);
    setIndex((i) => (i + 1) % total);
  };

  const prev = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => setAnimating(false), 600);
    setIndex((i) => (i - 1 + total) % total);
  };

  /* ⏱️ Carrusel automático (pausable con hover) */
  useEffect(() => {
    if (rooms.length === 0 || paused) return;
    autoRef.current = setInterval(() => next(), 5000);
    return () => clearInterval(autoRef.current);
  }, [rooms, paused]);

  const visibleRooms = rooms.slice(index * 4, index * 4 + 4);

  return (
    <div
      className="rounded-2xl bg-white dark:bg-[#1d1f24]
                 border border-zinc-100 dark:border-zinc-800
                 shadow-md hover:shadow-lg hover:bg-zinc-50 dark:hover:bg-[#22232a]
                 p-6 flex flex-col justify-between
                 h-full min-h-[400px] relative overflow-hidden transition-all duration-300"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ---------- Header ---------- */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-semibold text-center w-full text-black dark:text-white">
          Room Temperature
        </h3>
        <div className="absolute right-6 top-6 flex items-center gap-2">
          <button
            onClick={prev}
            className="p-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="p-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* ---------- Content ---------- */}
      {loading ? (
        <div className="text-center text-zinc-400 py-16">Loading...</div>
      ) : visibleRooms.length === 0 ? (
        <p className="text-zinc-400 text-sm text-center mt-6">
          No room data available
        </p>
      ) : (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 flex-1 transform transition-transform duration-700 ease-in-out ${
            animating ? "translate-x-[-10px] opacity-70" : "translate-x-0 opacity-100"
          }`}
        >
          {visibleRooms.map((room) => {
            const tempColor = getTempColor(room.room_temp);
            const statusRaw = (room.status || room.guest_name || "").toUpperCase();
            const statusText = statusRaw.includes("OCC")
              ? "OCC"
              : statusRaw.includes("VAC")
              ? "VAC"
              : "";

            return (
              <div
                key={room.room_number}
                className="rounded-xl border-[1.5px] border-zinc-200 dark:border-zinc-700 
                           bg-white dark:bg-[#18191e] p-5 flex flex-col justify-center items-center 
                           shadow-sm hover:shadow-md transition-all relative 
                           hover:bg-zinc-50 dark:hover:bg-[#202125]"
              >
                {statusText && (
                  <div
                    className={`absolute top-1 right-2 text-[10px] font-semibold ${
                      statusText === "OCC"
                        ? "text-green-600 dark:text-green-400"
                        : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    {statusText}
                  </div>
                )}
                <div className="flex items-center gap-1 mb-1">
                  <Thermometer
                    size={14}
                    className="text-zinc-500 dark:text-zinc-400"
                  />
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    {room.display_name || room.room_number}
                  </span>
                </div>
                <div className="text-2xl font-bold" style={{ color: tempColor }}>
                  {room.room_temp ?? "—"}°F
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Set: {room.set_temp ?? "—"}°F
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------- Dots + Button ---------- */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
        <div className="flex justify-center gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === index
                  ? "bg-[#0B5150] scale-110"
                  : "bg-zinc-400 dark:bg-zinc-600 opacity-60"
              }`}
            ></div>
          ))}
        </div>

        <button
          onClick={() => navigate("/room-status")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl 
                     bg-[#0B5150] text-white font-medium text-sm sm:text-base
                     hover:bg-[#094543] active:scale-[.98] transition-all duration-150 shadow-sm"
        >
          Go to Room Status <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
