# backend/routes/sops.py
from __future__ import annotations
from flask import Blueprint, jsonify, request
from backend.extensions import db
from backend.models.sop import SOP, SOPStep
from backend.models.asset import Asset  # ✅ para traer el nombre del asset
from sqlalchemy import desc
from datetime import datetime

bp = Blueprint("sops", __name__, url_prefix="/api/sops")

# ==========================================================
# Helpers
# ==========================================================
def _apply_order(query, model, order_str: str | None, default="-created_at"):
    field = (order_str or default).strip()
    desc_sort = field.startswith("-")
    col_name = field[1:] if desc_sort else field
    col = getattr(model, col_name, None)
    if col is None:
        col = getattr(model, default[1:], model.id)
        desc_sort = default.startswith("-")
    return query.order_by(desc(col) if desc_sort else col)


def _paginate(query, default_size=50):
    try:
        page = max(1, int(request.args.get("page", "1")))
    except Exception:
        page = 1
    try:
        page_size = min(200, max(1, int(request.args.get("page_size", str(default_size)))))
    except Exception:
        page_size = default_size
    total = query.count()
    rows = query.offset((page - 1) * page_size).limit(page_size).all()
    return rows, total, page, page_size


def _sop_to_dict(s: SOP, include_steps=False) -> dict:
    """Convierte SOP → dict con nombre de Asset incluido"""
    asset_name = None
    if s.asset_id:
        asset = Asset.query.get(s.asset_id)
        if asset:
            asset_name = f"{asset.name}{' - ' + asset.area if asset.area else ''}"

    data = {
        "id": s.id,
        "title": s.title,
        "description": s.description,
        "category": s.category,
        "asset_id": s.asset_id,
        "asset_name": asset_name,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }

    if include_steps:
        data["steps"] = [
            {
                "id": st.id,
                "order": st.order,
                "text": st.text,
                "image_url": st.image_url,
            }
            for st in s.steps
        ]
    return data


# ==========================================================
# Routes
# ==========================================================
@bp.get("/")
def list_sops():
    """List SOPs with optional filters."""
    order = request.args.get("order", "-created_at")
    qstr = request.args.get("q")
    asset_id = request.args.get("asset_id")
    category = request.args.get("category")

    q = SOP.query
    if qstr:
        like = f"%{qstr.strip()}%"
        q = q.filter((SOP.title.ilike(like)) | (SOP.description.ilike(like)))
    if asset_id:
        q = q.filter(SOP.asset_id == asset_id)
    if category:
        q = q.filter(SOP.category == category)

    q = _apply_order(q, SOP, order)
    rows, total, page, page_size = _paginate(q)

    return jsonify({
        "items": [_sop_to_dict(s) for s in rows],
        "total": total,
        "page": page,
        "page_size": page_size
    }), 200


@bp.get("/<int:sop_id>")
def get_sop(sop_id: int):
    sop = SOP.query.get_or_404(sop_id)
    return jsonify(_sop_to_dict(sop, include_steps=True)), 200


@bp.post("/")
def create_sop():
    """Create a new SOP with steps and category."""
    data = request.get_json(silent=True) or {}

    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "title is required"}), 400

    category = (data.get("category") or "Manual").strip()
    if category not in ("Manual", "HowTo", "Troubleshooting"):
        category = "Manual"

    sop = SOP(
        title=title,
        description=(data.get("description") or "").strip() or None,
        category=category,
        asset_id=data.get("asset_id"),
    )
    db.session.add(sop)
    db.session.flush()

    steps = data.get("steps") or []
    for i, step in enumerate(steps):
        s = SOPStep(
            sop_id=sop.id,
            order=step.get("order") or (i + 1),
            text=(step.get("text") or "").strip() or None,
            image_url=(step.get("image_url") or step.get("image") or "").strip() or None,
        )
        db.session.add(s)

    db.session.commit()
    return jsonify(_sop_to_dict(sop, include_steps=True)), 201


@bp.put("/<int:sop_id>")
@bp.patch("/<int:sop_id>")
def update_sop(sop_id: int):
    """Update a SOP and optionally replace all steps."""
    sop = SOP.query.get_or_404(sop_id)
    data = request.get_json(silent=True) or {}

    if "title" in data:
        sop.title = (data.get("title") or "").strip() or sop.title
    if "description" in data:
        sop.description = (data.get("description") or "").strip() or None
    if "asset_id" in data:
        sop.asset_id = data.get("asset_id")
    if "category" in data:
        category = (data.get("category") or "Manual").strip()
        if category not in ("Manual", "HowTo", "Troubleshooting"):
            category = "Manual"
        sop.category = category

    if "steps" in data:
        SOPStep.query.filter_by(sop_id=sop.id).delete()
        steps = data.get("steps") or []
        for i, step in enumerate(steps):
            s = SOPStep(
                sop_id=sop.id,
                order=step.get("order") or (i + 1),
                text=(step.get("text") or "").strip() or None,
                image_url=(step.get("image_url") or step.get("image") or "").strip() or None,
            )
            db.session.add(s)

    db.session.commit()
    return jsonify(_sop_to_dict(sop, include_steps=True)), 200


@bp.delete("/<int:sop_id>")
def delete_sop(sop_id: int):
    sop = SOP.query.get_or_404(sop_id)
    db.session.delete(sop)
    db.session.commit()
    return jsonify({"ok": True, "id": sop_id}), 200
