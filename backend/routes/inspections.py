# backend/routes/inspections.py
from __future__ import annotations
from datetime import datetime
from typing import List, Dict
import os

from flask import Blueprint, jsonify, request, current_app
from sqlalchemy import desc, func
from werkzeug.utils import secure_filename

from backend.extensions import db
from backend.models.inspection import Inspection
from backend.models.inspection_item import InspectionItem
from backend.models.asset import Asset
from backend.models.asset_status import AssetStatus

# ✅ Sin url_prefix aquí (ya se aplica en __init__.py)
bp = Blueprint("inspections", __name__)

# ------------------ helpers ------------------
def _order_cols():
    cols = []
    if hasattr(Inspection, "inspection_date"):
        cols.append(Inspection.inspection_date)
    if hasattr(Inspection, "created_at"):
        cols.append(Inspection.created_at)
    cols.append(Inspection.id)
    return cols


def _actor_name() -> str:
    return request.headers.get("X-Actor-Name") or "anonymous"


def _map_item_status_to_asset_state(item_status: str) -> str:
    """
    item.status -> AssetStatus.state
    - fail  => failed
    - ooo   => ooo
    - ok    => ok
    - open/na no cambian el estado (se ignoran)
    """
    s = (item_status or "").lower()
    if s == "fail":
        return "failed"
    if s == "ooo":
        return "ooo"
    if s == "ok":
        return "ok"
    return ""  # sin cambio


def _update_asset_status(asset_id: int, state: str, inspection_id: int | None, who: str):
    if not asset_id or not state:
        return
    row = db.session.get(AssetStatus, asset_id)
    if not row:
        row = AssetStatus(asset_id=asset_id)
        db.session.add(row)
    row.state = state
    row.last_inspection_id = inspection_id
    row.updated_by = who
    row.updated_at = datetime.utcnow()


def _ensure_items_for_inspection(ins: Inspection) -> List[InspectionItem]:
    existing = InspectionItem.query.filter_by(inspection_id=ins.id).all()
    if existing:
        return existing

    q = Asset.query
    if ins.scope_type == "floors":
        floors = [str(f) for f in (ins.floors or [])]
        if floors:
            q = q.filter(Asset.floor.in_(floors))
        else:
            return []
    elif ins.scope_type == "area":
        q = q.filter(Asset.area == ins.scope_value)
    elif ins.scope_type == "type":
        q = q.filter(Asset.type == ins.scope_value)

    q = q.order_by(Asset.name.asc())
    assets = q.all()

    rows: List[InspectionItem] = []
    now = datetime.utcnow()
    for a in assets:
        label_text = a.name or f"Asset {a.id}"
        rows.append(
            InspectionItem(
                inspection_id=ins.id,
                asset_id=a.id,
                name=label_text,
                label=label_text,
                floor=a.floor,
                area=a.area,
                type=a.type,
                status="open",
                notes="",
                photos=[],
                updated_by=ins.started_by_name or "system",
                created_at=now,
                updated_at=now,
            )
        )
    if rows:
        db.session.bulk_save_objects(rows)
        db.session.commit()
        return InspectionItem.query.filter_by(inspection_id=ins.id).all()
    return []

# ------------------ scopes for hub ------------------
@bp.get("/inspections/scopes")
def scopes():
    floors_default = ["Roof", "Penthouse", "8", "7", "6", "5", "4", "3", "2", "1", "Basement"]
    areas_default = ["Lobby", "Bar", "Kitchen", "Back of House", "MDF", "Gym"]
    types_default = ["FCU", "Pump", "Detector", "Extinguisher", "Panel", "Door"]

    try:
        in_progress = (
            Inspection.query.filter(Inspection.status == "in_progress")
            .order_by(desc(_order_cols()[0]))
            .limit(10)
            .all()
        )
    except Exception:
        in_progress = []

    try:
        completed = (
            Inspection.query.filter(Inspection.status == "completed")
            .order_by(desc(_order_cols()[0]))
            .limit(10)
            .all()
        )
    except Exception:
        completed = []

    return jsonify({
        "floors": floors_default,
        "areas": areas_default,
        "types": types_default,
        "inProgress": [x.to_dict() for x in in_progress],
        "completed": [x.to_dict() for x in completed],
    }), 200


# -------- summary de “failed/ooo” por floor/area/type --------
@bp.get("/assets/status/summary")
def asset_status_summary():
    bad_states = ["failed", "ooo"]

    af = db.session.query(Asset.floor, func.count(AssetStatus.asset_id))\
        .join(Asset, Asset.id == AssetStatus.asset_id)\
        .filter(AssetStatus.state.in_(bad_states))\
        .group_by(Asset.floor).all()

    aa = db.session.query(Asset.area, func.count(AssetStatus.asset_id))\
        .join(Asset, Asset.id == AssetStatus.asset_id)\
        .filter(AssetStatus.state.in_(bad_states))\
        .group_by(Asset.area).all()

    at = db.session.query(Asset.type, func.count(AssetStatus.asset_id))\
        .join(Asset, Asset.id == AssetStatus.asset_id)\
        .filter(AssetStatus.state.in_(bad_states))\
        .group_by(Asset.type).all()

    def to_map(rows):
        m: Dict[str, int] = {}
        for k, c in rows:
            if k is None:
                continue
            m[str(k)] = int(c)
        return m

    return jsonify({
        "byFloor": to_map(af),
        "byArea": to_map(aa),
        "byType": to_map(at),
    }), 200


# ------------------ CRUD inspection ------------------
@bp.post("/inspections")
def create_inspection():
    data = request.get_json(silent=True) or {}
    scope_type = (data.get("scope_type") or "").strip()
    if scope_type not in {"floors", "area", "type"}:
        return jsonify({"error": "Invalid scope_type"}), 400

    actor = data.get("actor_name") or _actor_name()

    floors = None
    scope_value = None
    if scope_type == "floors":
        floors = data.get("floors") or []
        if not isinstance(floors, list) or not floors:
            return jsonify({"error": "floors must be a non-empty list"}), 400
        scope_value = ", ".join(map(str, floors))
    else:
        scope_value = (data.get("scope_value") or "").strip()
        if not scope_value:
            return jsonify({"error": "scope_value is required"}), 400

    ins = Inspection(
        scope_type=scope_type,
        scope_value=scope_value,
        floors=floors,
        status="in_progress",
        progress=0,
        started_by_name=actor,
        created_at=datetime.utcnow(),
        inspection_date=datetime.utcnow(),
    )
    db.session.add(ins)
    db.session.commit()
    return jsonify(ins.to_dict()), 201


@bp.get("/inspections")
def list_inspections():
    status = (request.args.get("status") or "all").lower()
    q = Inspection.query
    if status != "all":
        q = q.filter(Inspection.status == status)
    q = q.order_by(desc(_order_cols()[0]))
    rows = q.limit(200).all()
    return jsonify([i.to_dict() for i in rows]), 200


@bp.get("/inspections/<int:inspection_id>")
def get_inspection(inspection_id: int):
    ins = Inspection.query.get_or_404(inspection_id)
    return jsonify(ins.to_dict()), 200


@bp.patch("/inspections/<int:inspection_id>")
def patch_inspection(inspection_id: int):
    ins = Inspection.query.get_or_404(inspection_id)
    data = request.get_json(silent=True) or {}
    updated = False

    if "progress" in data:
        try:
            p = int(data.get("progress"))
            ins.progress = max(0, min(100, p))
            updated = True
        except Exception:
            return jsonify({"error": "progress must be int 0..100"}), 400

    if "status" in data:
        st = str(data.get("status") or "").lower().strip()
        if st not in {"in_progress", "paused", "completed"}:
            return jsonify({"error": "invalid status"}), 400
        ins.status = st
        if st == "completed" and (ins.progress or 0) < 100:
            ins.progress = 100
        updated = True

    if "started_by_name" in data:
        ins.started_by_name = (data.get("started_by_name") or "")[:120]
        updated = True

    if updated:
        ins.updated_at = datetime.utcnow()
        db.session.commit()
    return jsonify(ins.to_dict()), 200


@bp.post("/inspections/<int:inspection_id>/complete")
def complete_inspection(inspection_id: int):
    ins = Inspection.query.get_or_404(inspection_id)
    ins.status = "completed"
    ins.progress = 100
    ins.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(ins.to_dict()), 200


# ------------------ Items ------------------
@bp.get("/inspections/<int:inspection_id>/items")
def list_items(inspection_id: int):
    ins = Inspection.query.get_or_404(inspection_id)
    items = _ensure_items_for_inspection(ins)
    return jsonify({"items": [it.to_dict() for it in items], "total": len(items)}), 200


@bp.patch("/inspections/<int:inspection_id>/items/<int:item_id>")
def update_item_status(inspection_id: int, item_id: int):
    ins = Inspection.query.get_or_404(inspection_id)
    item = InspectionItem.query.filter_by(id=item_id, inspection_id=ins.id).first()
    if not item:
        return jsonify({"error": "item not found"}), 404

    payload = request.get_json(silent=True) or {}
    status = (payload.get("status") or "").lower()
    if status and status not in {"open", "ok", "fail", "na", "ooo"}:
        return jsonify({"error": "invalid status"}), 400
    if status:
        item.status = status

    if "notes" in payload:
        item.notes = payload.get("notes") or ""

    who = _actor_name()
    item.updated_by = who
    item.updated_at = datetime.utcnow()

    if item.asset_id:
        mapped = _map_item_status_to_asset_state(item.status)
        if mapped:
            _update_asset_status(item.asset_id, mapped, ins.id, who)

    db.session.commit()
    return jsonify({"ok": True, "item": item.to_dict()}), 200


@bp.post("/inspections/<int:inspection_id>/items/<int:item_id>/comment")
def add_item_comment(inspection_id: int, item_id: int):
    ins = Inspection.query.get_or_404(inspection_id)
    item = InspectionItem.query.filter_by(id=item_id, inspection_id=ins.id).first()
    if not item:
        return jsonify({"error": "item not found"}), 404
    body = request.get_json(silent=True) or {}
    note = (body.get("note") or body.get("notes") or "").strip()
    item.notes = note
    item.updated_by = _actor_name()
    item.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"ok": True, "item": item.to_dict()}), 200


# ------------------ Add photo (URL o archivo) ------------------
ALLOWED_IMG_EXTS = {"jpg", "jpeg", "png", "webp", "gif", "bmp"}


def _save_uploaded_photo(file_storage):
    if not file_storage:
        return None
    filename = secure_filename(file_storage.filename or "")
    ext = (filename.rsplit(".", 1)[-1].lower() if "." in filename else "")
    if ext not in ALLOWED_IMG_EXTS:
        if file_storage.mimetype and "image/" in file_storage.mimetype:
            ext = file_storage.mimetype.split("/")[-1].lower()
        if ext not in ALLOWED_IMG_EXTS:
            return None

    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    filename = f"inspection_{ts}.{ext}"

    upload_folder = getattr(current_app.config, "UPLOAD_FOLDER", None)
    if not upload_folder:
        upload_folder = os.path.join(current_app.root_path, "..", "uploads")
    os.makedirs(upload_folder, exist_ok=True)

    path = os.path.join(upload_folder, filename)
    file_storage.save(path)

    public_prefix = current_app.config.get("UPLOADS_PUBLIC_PATH", "/uploads")
    return f"{public_prefix}/{filename}"


@bp.post("/inspections/<int:inspection_id>/items/<int:item_id>/photos")
def add_item_photo(inspection_id: int, item_id: int):
    ins = Inspection.query.get_or_404(inspection_id)
    item = InspectionItem.query.filter_by(id=item_id, inspection_id=ins.id).first()
    if not item:
        return jsonify({"error": "item not found"}), 404

    url = None
    if request.is_json:
        data = request.get_json(silent=True) or {}
        url = (data.get("url") or "").strip()

    if not url and "file" in request.files:
        saved_url = _save_uploaded_photo(request.files.get("file"))
        if not saved_url:
            return jsonify({"error": "invalid file type"}), 400
        url = saved_url

    if not url:
        return jsonify({"error": "send JSON {url: ...} or multipart 'file'"}), 400

    photos = item.photos or []
    photos.append(url)
    item.photos = photos
    item.updated_by = _actor_name()
    item.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"ok": True, "item": item.to_dict()}), 200
