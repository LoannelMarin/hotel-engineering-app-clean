// frontend/src/pages/RoomStatus.jsx
import React, { useEffect, useState, useMemo } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Pencil, Thermometer, Filter } from "lucide-react";

export default function RoomStatus() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editingRoom, setEditingRoom] = useState(null);
  const [newName, setNewName] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);

  const API_URL = "http://127.0.0.1:5000/api/inncom/current_full";
  const STREAM_URL = "http://127.0.0.1:5000/api/inncom/stream";

  // Rango válido de habitaciones por piso
  function isRoomNumberValid(num) {
    const n = parseInt(num);
    if (isNaN(n)) return false;
    const ranges = [
      [201, 216],
      [301, 317],
      [401, 417],
      [501, 517],
      [601, 617],
      [701, 717],
      [801, 817],
    ];
    return ranges.some(([min, max]) => n >= min && n <= max);
  }

  // Carga inicial y por SSE
  async function load() {
    try {
      const r = await fetch(API_URL);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      let arr = Object.values(data.items || {});
      arr.sort((a, b) => Number(a.room_number) - Number(b.room_number));
      setRooms(arr);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const es = new EventSource(STREAM_URL);
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "refresh") load();
      } catch {}
    };
    es.onerror = () => {
      es.close();
      setTimeout(load, 5000);
    };
    return () => es.close();
  }, []);

  // Historial para el modal de detalle
  useEffect(() => {
    if (!selectedRoom) return;
    fetch(`http://127.0.0.1:5000/api/inncom/history/${selectedRoom.room_number}`)
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? setHistory(data) : setHistory([])))
      .catch(() => setHistory([]));
  }, [selectedRoom]);

  // 🎨 Escala de colores solo para la temperatura
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

  // Filtros computados
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const isCommon = !isRoomNumberValid(r.room_number);
      const status = (r.status || r.guest_name || "").toUpperCase();
      const isOCC = status.includes("OCC") || status.includes("OCCUPIED");
      const isVAC = status.includes("VAC") || status.includes("VACANT");

      if (filter === "common" && !isCommon) return false;
      if (filter.startsWith("floor")) {
        const floorNum = filter.replace("floor", "");
        if (!r.room_number?.toString().startsWith(floorNum)) return false;
      }
      if (statusFilter === "occ" && !isOCC) return false;
      if (statusFilter === "vac" && !isVAC) return false;
      if (search && !(r.display_name || r.room_number)?.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [rooms, filter, statusFilter, search]);

  // Lista de pisos existentes
  const floors = Array.from(
    new Set(
      rooms
        .map((r) => r.room_number?.toString().charAt(0))
        .filter((f) => /^\d$/.test(f))
    )
  ).sort();

  // Guardar alias de áreas comunes
  async function saveDisplayName(room, newDisplayName) {
    const res = await fetch(`http://127.0.0.1:5000/api/inncom/update_name`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_number: room.room_number,
        display_name: newDisplayName,
      }),
    });
    if (res.ok) load();
    setEditingRoom(null);
  }

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  if (err) return <div className="text-red-500">{err}</div>;

  return (
    <main className="p-6 min-h-screen bg-zinc-50 dark:bg-[#121317] transition-colors">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B5150] dark:text-[#5ad5d3] mb-1">
            Room Status
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {rooms.length} monitored zones (Rooms & Common Areas)
          </p>
        </div>

        {/* 🔍 Search + Filter */}
        <div className="flex gap-2 flex-wrap items-center">
          {/* Filtro Móvil */}
          <button
            className="md:hidden p-2 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800"
            onClick={() => setShowFilterModal(true)}
            aria-label="Open filters"
          >
            <Filter size={18} />
          </button>

          {/* Buscador */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 min-w-[140px] md:w-auto border rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600"
          />

          {/* Filtros desktop */}
          <div className="hidden md:flex gap-2">
            <select
              className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Floors</option>
              {floors.map((f) => (
                <option key={f} value={`floor${f}`}>
                  Floor {f}
                </option>
              ))}
              <option value="common">Common Areas</option>
            </select>

            <select
              className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="occ">Occupied</option>
              <option value="vac">Vacant</option>
            </select>
          </div>
        </div>
      </header>

      {/* GRID RESPONSIVE (angosta, altura igual) */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8">
        {filteredRooms.map((room) => {
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
              className="relative rounded-xl shadow-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#1d1f24] hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer p-3 flex flex-col justify-center items-center text-center"
              onClick={() => setSelectedRoom(room)}
            >
              {/* 🔸 Estado en esquina superior derecha */}
              {statusText && (
                <div
                  className={`absolute top-1 right-2 text-[10px] font-semibold ${
                    statusText === "OCC"
                      ? "text-green-600 dark:text-green-400"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {statusText}
                </div>
              )}

              <div className="flex items-center justify-center gap-1">
                <Thermometer
                  size={16}
                  className="opacity-70 text-zinc-600 dark:text-zinc-400"
                />
                <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">
                  {room.display_name}
                </span>
                <button
                  className="ml-1 text-zinc-400 hover:text-[#0B5150]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingRoom(room);
                    setNewName(room.display_name);
                  }}
                  aria-label="Rename area"
                >
                  <Pencil size={14} />
                </button>
              </div>
              <div
                className="text-lg font-bold mt-1"
                style={{ color: tempColor }}
              >
                {room.room_temp ?? "—"}°F
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Set: {room.set_temp ?? "—"}°F
              </div>
            </div>
          );
        })}
      </div>

      {/* 🪟 Modal detalle con gráfico (RESTABLECIDO) */}
      {selectedRoom && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedRoom(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1d1f24] rounded-2xl shadow-2xl w-[95%] max-w-lg p-6 border border-zinc-200 dark:border-zinc-700"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#0B5150] dark:text-[#5ad5d3]">
                Room {selectedRoom.display_name}
              </h2>
              <button
                onClick={() => setSelectedRoom(null)}
                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-xl font-bold"
                aria-label="Close details"
              >
                ×
              </button>
            </div>

            {/* Mini gráfico historial */}
            <div className="h-24 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <Line
                    type="monotone"
                    dataKey="room_temp"
                    stroke="#5ad5d3"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="set_temp"
                    stroke="#0B5150"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 text-center">
                Last 20 readings (°F)
              </div>
            </div>

            <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              <p>
                <strong>Room:</strong> {selectedRoom.room_number}
              </p>
              <p>
                <strong>Room Temp:</strong> {selectedRoom.room_temp ?? "—"}°F
              </p>
              <p>
                <strong>Set Temp:</strong> {selectedRoom.set_temp ?? "—"}°F
              </p>
              <p>
                <strong>Δ:</strong> {selectedRoom.delta ?? "—"}
              </p>
              <p>
                <strong>HVAC:</strong> {selectedRoom.hvac || "—"}
              </p>
              <p>
                <strong>Mode:</strong> {selectedRoom.mode || "—"}
              </p>
              <p>
                <strong>Updated:</strong>{" "}
                {selectedRoom.updated_at
                  ? new Date(selectedRoom.updated_at).toLocaleTimeString()
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ Modal rename área común */}
      {editingRoom && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          onClick={() => setEditingRoom(null)}
        >
          <div
            className="bg-white dark:bg-[#1d1f24] rounded-xl p-6 shadow-2xl w-80 border border-zinc-200 dark:border-zinc-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold mb-3 text-[#0B5150] dark:text-[#5ad5d3]">
              Rename Area
            </h2>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg mb-4 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingRoom(null)}
                className="px-3 py-1 text-sm border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => saveDisplayName(editingRoom, newName)}
                className="px-3 py-1 text-sm rounded-lg bg-[#0B5150] text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📱 Modal filtros móvil */}
      {showFilterModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowFilterModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1d1f24] rounded-2xl p-6 shadow-2xl w-80 border border-zinc-200 dark:border-zinc-700"
          >
            <h2 className="font-semibold mb-3 text-[#0B5150] dark:text-[#5ad5d3]">
              Filters
            </h2>
            <div className="space-y-3">
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Floors</option>
                {floors.map((f) => (
                  <option key={f} value={`floor${f}`}>
                    Floor {f}
                  </option>
                ))}
                <option value="common">Common Areas</option>
              </select>

              <select
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="occ">Occupied</option>
                <option value="vac">Vacant</option>
              </select>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-3 py-1 text-sm rounded-lg bg-[#0B5150] text-white"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
