import os
import uuid
from pathlib import Path
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from sqlalchemy import or_
from backend.extensions import db
from backend.models.manual import Manual
from backend.models.asset import Asset  # ✅ necesario para traer el nombre del asset

bp = Blueprint("manuals", __name__, url_prefix="/api/manuals")

ALLOWED_EXT = {".pdf"}
ALLOWED_CATEGORIES = {"Manual", "HowTo", "Troubleshooting"}


# ---------------- Helpers ----------------
def _uploads_base() -> Path:
    base = current_app.config.get("UPLOAD_FOLDER") or current_app.config.get("UPLOADS_DIR")
    if not base:
        base = str(Path(__file__).resolve().parents[2] / "uploads")
    Path(base).mkdir(parents=True, exist_ok=True)
    return Path(base)

def _manuals_dir() -> Path:
    d = _uploads_base() / "manuals"
    d.mkdir(parents=True, exist_ok=True)
    return d

def _save_pdf_to_manuals(file_storage) -> str:
    ext = os.path.splitext(file_storage.filename or "")[1].lower()
    if ext not in ALLOWED_EXT:
        raise ValueError("Only .pdf allowed")
    fname = f"{uuid.uuid4().hex}{ext}"
    safe = secure_filename(fname)
    file_storage.save(_manuals_dir() / safe)
    return f"/uploads/manuals/{safe}"

def _normalize_url(u: str | None) -> str | None:
    if not u:
        return u
    u = u.replace("\\", "/")
    if u.startswith("http://") or u.startswith("https://"):
        return u
    if u.startswith("/uploads/manuals/"):
        return u
    if u.startswith("manuals/"):
        return "/uploads/" + u.lstrip("/")
    if u.startswith("/uploads/"):
        return u
    return "/uploads/manuals/" + u.lstrip("/")

def _delete_local_if_manual(url: str | None):
    if not url:
        return
    url = _normalize_url(url)
    if not url or not url.startswith("/uploads/manuals/"):
        return
    fname = url.split("/uploads/manuals/", 1)[-1]
    try:
        os.remove(_manuals_dir() / fname)
    except FileNotFoundError:
        pass

def _coerce_category(cat: str | None) -> str:
    cat = (cat or "Manual").strip()
    return cat if cat in ALLOWED_CATEGORIES else "Manual"

def _manual_to_dict(m: Manual) -> dict:
    """Convierte Manual → dict incluyendo el nombre del Asset si existe."""
    asset_name = None
    if m.asset_id:
        asset = Asset.query.get(m.asset_id)
        if asset:
            asset_name = asset.name

    return {
        "id": m.id,
        "title": m.title,
        "description": m.description,
        "category": m.category,
        "file_url": _normalize_url(m.file_url),
        "asset_id": m.asset_id,
        "asset_name": asset_name,  # ✅ nuevo campo visible en frontend
        "created_at": m.created_at.isoformat() if m.created_at else None,
        "updated_at": m.updated_at.isoformat() if m.updated_at else None,
    }


# ---------------- Routes ----------------
@bp.get("/")
def get_all():
    q = (request.args.get("q") or "").strip()
    query = Manual.query.order_by(Manual.created_at.desc())
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Manual.title.ilike(like), Manual.description.ilike(like)))
    items = [_manual_to_dict(m) for m in query.all()]
    return jsonify({"items": items})

@bp.get("/<int:manual_id>")
def get_one(manual_id):
    manual = Manual.query.get_or_404(manual_id)
    return jsonify(_manual_to_dict(manual))

@bp.post("/")
def create():
    ct = request.content_type or ""
    if "multipart/form-data" in ct:
        title = (request.form.get("title") or "").strip()
        if not title:
            return jsonify({"error": "title is required"}), 400

        description = request.form.get("description") or ""
        category = _coerce_category(request.form.get("category"))
        asset_id = request.form.get("asset_id") or None

        file = request.files.get("file")
        if not file:
            return jsonify({"error": "file is required"}), 400

        try:
            file_url = _save_pdf_to_manuals(file)
        except Exception as e:
            return jsonify({"error": str(e)}), 400

        manual = Manual(
            title=title,
            description=description,
            category=category,
            file_url=file_url,
            asset_id=int(asset_id) if asset_id else None,
        )
        db.session.add(manual)
        db.session.commit()
        return jsonify(_manual_to_dict(manual)), 201

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "title is required"}), 400

    manual = Manual(
        title=title,
        description=data.get("description"),
        category=_coerce_category(data.get("category")),
        file_url=_normalize_url(data.get("file_url")),
        asset_id=data.get("asset_id"),
    )
    db.session.add(manual)
    db.session.commit()
    return jsonify(_manual_to_dict(manual)), 201

@bp.put("/<int:manual_id>")
def update(manual_id):
    manual = Manual.query.get_or_404(manual_id)
    data = request.get_json(silent=True) or {}

    if "title" in data and not (data.get("title") or "").strip():
        return jsonify({"error": "title cannot be empty"}), 400

    if "title" in data:
        manual.title = data.get("title") or manual.title
    if "description" in data:
        manual.description = data.get("description")
    if "category" in data:
        manual.category = _coerce_category(data.get("category"))
    if "file_url" in data:
        manual.file_url = _normalize_url(data.get("file_url"))
    if "asset_id" in data:
        manual.asset_id = data.get("asset_id")

    db.session.commit()
    return jsonify(_manual_to_dict(manual))

@bp.delete("/<int:manual_id>")
def delete(manual_id):
    manual = Manual.query.get_or_404(manual_id)
    _delete_local_if_manual(manual.file_url)
    db.session.delete(manual)
    db.session.commit()
    return jsonify({"ok": True, "id": manual_id})
