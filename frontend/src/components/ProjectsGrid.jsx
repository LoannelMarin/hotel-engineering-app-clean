import React, { useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";
import RoomTile from "./RoomTile";

// Piso 8 → 2
const FLOORS = [8, 7, 6, 5, 4, 3, 2];

function useRoomsByFloor(rooms) {
  return useMemo(() => {
    const map = {};
    FLOORS.forEach((f) => (map[f] = []));
    (rooms || []).forEach((n) => {
      const floor = Math.floor(n / 100);
      if (map[floor]) map[floor].push(n);
    });
    FLOORS.forEach((f) => map[f].sort((a, b) => a - b));
    return map;
  }, [rooms]);
}

/** Separador MUY visible */
function FloorDivider({ floor }) {
  return (
    <div className="my-4 flex items-center gap-3 overflow-visible" data-testid={`floor-${floor}`}>
      <div className="h-2 rounded bg-gray-200 flex-1" />
      <span className="shrink-0 uppercase tracking-wide font-bold text-[11px] md:text-xs px-3 py-1 rounded-full bg-gray-800 text-white shadow">
        Piso {floor}
      </span>
      <div className="h-2 rounded bg-gray-200 flex-1" />
    </div>
  );
}

function ProjectCard({
  project,
  filterStatusId,
  onFilterClick,
  onRoomClick,
  onDeleteProject,
}) {
  const roomsByFloor = useRoomsByFloor(project.rooms);

  return (
    <section className="relative bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
      {/* header */}
      <div
        className="mb-3 md:mb-4 rounded-lg px-3 py-2 text-white font-medium flex items-center justify-between"
        style={{ background: project.color || "#16a34a" }}
      >
        <span className="truncate">{project.name}</span>

        <button
          onClick={() => onFilterClick?.(project.id)}
          className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-white/20 hover:bg-white/30 transition"
          title="Filtrar por estado"
        >
          <SlidersHorizontal className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* pisos */}
      <div className="space-y-2 overflow-visible">
        {FLOORS.map((floor) => {
          const row = roomsByFloor[floor] || [];
          if (!row.length) return null;

          return (
            <div key={floor} className="w-full overflow-visible">
              <FloorDivider floor={floor} />

              {/* una fila por piso, 17 columnas fijas */}
              <div className="w-full overflow-x-auto">
                <div
                  className="grid gap-2 md:gap-3"
                  style={{ gridTemplateColumns: "repeat(17, minmax(0, 1fr))" }}
                >
                  {row.map((room) => {
                    const info = project.roomMap?.[room];
                    const dimmed =
                      !!filterStatusId &&
                      info?.statusId &&
                      info.statusId !== filterStatusId;

                    return (
                      <div key={room} className={dimmed ? "opacity-40" : ""}>
                        <RoomTile
                          number={room}
                          status={info?.statusName}
                          color={info?.color}
                          textColor={info?.textColor}
                          onClick={() => onRoomClick?.(project, room)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* borrar proyecto */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onDeleteProject?.(project.id)}
          className="text-red-600 hover:text-red-700 text-xs md:text-sm border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 rounded-md px-3 py-1.5 transition"
        >
          Delete Project
        </button>
      </div>
    </section>
  );
}

/**
 * Props:
 *  - boards: [{ id, name, color, rooms, roomMap? }]
 *  - columns: 1 | 2
 *  - filterStatusId: string | null
 *  - onFilterClick(projectId)
 *  - onRoomClick(project, room)
 *  - onDeleteProject(projectId)
 */
export default function ProjectsGrid({
  boards = [],
  columns = 2,
  filterStatusId = null,
  onFilterClick,
  onRoomClick,
  onDeleteProject,
}) {
  // layout 2x2 automáticamente para 4 boards (el contenedor se encarga)
  return (
    <div className={`grid ${columns === 1 ? "grid-cols-1" : "grid-cols-2"} gap-6 md:gap-8`}>
      {boards.map((p) => (
        <ProjectCard
          key={p.id}
          project={p}
          filterStatusId={filterStatusId}
          onFilterClick={onFilterClick}
          onRoomClick={onRoomClick}
          onDeleteProject={onDeleteProject}
        />
      ))}
    </div>
  );
}
