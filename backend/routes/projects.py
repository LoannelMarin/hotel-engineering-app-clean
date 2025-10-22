# -*- coding: utf-8 -*-
from datetime import datetime
from typing import Dict, Any, List

from flask import Blueprint, request, jsonify, g, abort
from sqlalchemy import asc

from backend.extensions import db
from backend.models.project import (
    Project,
    ProjectRoomStatus,
    ProjectRoomAudit,
)

bp = Blueprint("projects", __name__, url_prefix="/projects")

# ---------- Utilidades ----------

DEFAULT_LEGEND = {
    "Not Started": "#FFFFFF",   # blanco
    "In Progress": "#4F46E5",   # indigo
    "Completed": "#15803D",     # verde
    "N/A": "#94A3B8",           # gris
}


def _current_user_email() -> str:
    """Obtiene el usuario autenticado desde JWT (g.user) o headers."""
    user = getattr(g, "user", None)
    if user:
        if getattr(user, "email", None):
            return user.email
        if getattr(user, "username", None):
            return user.username

    # Si viene desde React (frontend)
    header_name = (
        request.headers.get("X-Actor-Name")
        or request.headers.get("X-User-Email")
        or ""
    )
    return header_name.strip() or "Unknown user"


def _serialize_room(rs: ProjectRoomStatus) -> Dict[str, Any]:
    return rs.to_dict()


def _room_ranges() -> List[range]:
    """Genera los rangos del Aloft: 201–216 y 301–317 para pisos 3–8."""
    ranges = [range(201, 217)]
    for floor in range(3, 9):
        start = floor * 100 + 1
        end = floor * 100 + 17
        ranges.append(range(start, end + 1))
    return ranges


def _all_room_numbers() -> List[str]:
    nums = []
    for r in _room_ranges():
        nums.extend([str(n) for n in r])
    return nums


def _ensure_rooms(project_id: int) -> None:
    """Crea registros ProjectRoomStatus para todas las habitaciones faltantes."""
    existing = {
        r.room_number
        for r in ProjectRoomStatus.query.with_entities(ProjectRoomStatus.room_number)
        .filter_by(project_id=project_id)
        .all()
    }
    missing = [rn for rn in _all_room_numbers() if rn not in existing]
    if not missing:
        return

    db.session.bulk_save_objects(
        [
            ProjectRoomStatus(
                project_id=project_id,
                room_number=rn,
                status="Not Started",
            )
            for rn in missing
        ]
    )
    db.session.commit()


# ---------- Endpoints de Proyectos ----------

@bp.route("", methods=["GET"])
@bp.route("/", methods=["GET"])
def list_projects():
    """Devuelve la lista de proyectos con leyenda normalizada."""
    items = Project.query.order_by(asc(Project.name)).all()

    def normalize_legend(legend):
        if not isinstance(legend, dict):
            return {}
        out = {}
        for label, color in legend.items():
            if isinstance(color, dict):
                lbl = color.get("label") or label
                clr = color.get("color")
                out[lbl.strip().lower().replace(" ", "_")] = {
                    "label": lbl,
                    "color": clr,
                }
            else:
                out[label.strip().lower().replace(" ", "_")] = {
                    "label": label,
                    "color": color,
                }
        return out

    normalized = []
    for p in items:
        data = p.to_dict()
        data["color_legend"] = normalize_legend(p.color_legend or DEFAULT_LEGEND)
        normalized.append(data)

    return jsonify({"items": normalized})


@bp.post("/")
def create_project():
    """Crea un nuevo proyecto con leyenda predeterminada y habitaciones iniciales."""
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        abort(400, description="Missing project name")

    legend = data.get("color_legend") or DEFAULT_LEGEND
    p = Project(name=name, color_legend=legend, status="In Progress")
    db.session.add(p)
    db.session.commit()

    # 🧹 Limpieza automática: borra registros previos con el mismo ID (si el ID fue reciclado)
    db.session.query(ProjectRoomStatus).filter_by(project_id=p.id).delete()
    db.session.query(ProjectRoomAudit).filter_by(project_id=p.id).delete()
    db.session.commit()

    # 🏗️ Crea habitaciones desde cero
    _ensure_rooms(p.id)

    # 🔁 Devuelve leyenda normalizada
    project_data = p.to_dict()
    project_data["color_legend"] = {
        k.strip().lower().replace(" ", "_"): {"label": k, "color": v}
        for k, v in legend.items()
    }

    return jsonify(project_data), 201


@bp.get("/<int:pid>")
def get_project(pid: int):
    """Obtiene los datos de un proyecto."""
    p = Project.query.get_or_404(pid)
    data = p.to_dict()
    data["color_legend"] = {
        k.strip().lower().replace(" ", "_"): {"label": k, "color": v}
        for k, v in (p.color_legend or DEFAULT_LEGEND).items()
    }
    return jsonify(data)


@bp.put("/<int:pid>")
def update_project(pid: int):
    """Actualiza nombre, colores o estado de un proyecto."""
    p = Project.query.get_or_404(pid)
    data = request.get_json() or {}

    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            abort(400, description="Invalid name")
        p.name = name

    if "color_legend" in data and isinstance(data["color_legend"], dict):
        p.color_legend = data["color_legend"]

    if "status" in data:
        p.status = data["status"]

    db.session.commit()
    return jsonify(p.to_dict())


@bp.delete("/<int:pid>")
def delete_project(pid: int):
    """Elimina un proyecto por ID."""
    p = Project.query.get_or_404(pid)
    db.session.delete(p)
    db.session.commit()
    return jsonify({"ok": True})


# ---------- Habitaciones & Leyenda ----------

@bp.get("/<int:pid>/rooms")
def list_rooms(pid: int):
    """Lista todas las habitaciones del proyecto."""
    Project.query.get_or_404(pid)
    _ensure_rooms(pid)
    rows = (
        ProjectRoomStatus.query
        .filter_by(project_id=pid)
        .order_by(asc(ProjectRoomStatus.room_number))
        .all()
    )
    return jsonify({"items": [_serialize_room(r) for r in rows]})


@bp.put("/<int:pid>/legend")
def update_legend(pid: int):
    """Actualiza la leyenda de colores de un proyecto."""
    p = Project.query.get_or_404(pid)
    data = request.get_json() or {}
    legend = data.get("color_legend")
    if not isinstance(legend, dict):
        abort(400, description="color_legend must be an object")

    p.color_legend = legend
    db.session.commit()

    # Devuelve ya normalizado
    return jsonify({
        "id": p.id,
        "name": p.name,
        "color_legend": {
            k.strip().lower().replace(" ", "_"): {"label": k, "color": v}
            for k, v in legend.items()
        },
        "status": p.status,
    })


# ---------- Estado de habitación + Auditoría ----------

@bp.put("/<int:pid>/room/<string:room>")
def set_room_status(pid: int, room: str):
    """Actualiza el estado de una habitación dentro del proyecto."""
    Project.query.get_or_404(pid)
    _ensure_rooms(pid)

    rs = ProjectRoomStatus.query.filter_by(project_id=pid, room_number=str(room)).first()
    if not rs:
        rs = ProjectRoomStatus(project_id=pid, room_number=str(room), status="Not Started")
        db.session.add(rs)
        db.session.flush()

    data = request.get_json() or {}
    prev_status = rs.status
    new_status = data.get("status", prev_status)
    rs.status = new_status
    rs.notes = data.get("notes", rs.notes or "")
    rs.updated_by = _current_user_email()
    rs.updated_at = datetime.utcnow()

    audit = ProjectRoomAudit(
        project_id=pid,
        room_number=str(room),
        prev_status=prev_status,
        new_status=new_status,
        notes=data.get("notes", ""),
        updated_by=rs.updated_by,
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(_serialize_room(rs))


@bp.get("/<int:pid>/room/<string:room>/audits")
def list_room_audits(pid: int, room: str):
    """Devuelve el historial de cambios de una habitación."""
    Project.query.get_or_404(pid)
    q = (
        ProjectRoomAudit.query
        .filter_by(project_id=pid, room_number=str(room))
        .order_by(ProjectRoomAudit.id.desc())
        .limit(200)
    )
    return jsonify({"items": [a.to_dict() for a in q.all()]})


# ---------- Estado de completado del proyecto ----------

@bp.put("/<int:pid>/complete")
def toggle_complete(pid: int):
    """
    Marca o desmarca un proyecto como completado.
    Si ya está completado → lo reabre.
    Si no lo está → lo marca como completado con usuario y timestamp.
    """
    p = Project.query.get_or_404(pid)
    user_email = _current_user_email() or "Unknown user"

    if p.completed_at:
        # 🔄 Reopen
        p.completed_at = None
        p.completed_by = None
        p.status = "In Progress"
        status = "reopened"
    else:
        # ✅ Complete
        p.completed_at = datetime.utcnow()
        p.completed_by = user_email
        p.status = "Completed"
        status = "completed"

    db.session.commit()
    return jsonify({
        "status": status,
        "project": p.to_dict(),
    })
