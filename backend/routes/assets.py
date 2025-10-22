# backend/routes/assets.py
from __future__ import annotations

from datetime import datetime, date
from flask import Blueprint, jsonify, request
from sqlalchemy import desc

from backend.extensions import db
from backend.models.asset import Asset

# ✅ Sin url_prefix aquí (evita duplicar /api/api)
bp = Blueprint("assets_bp", __name__)


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


@bp.get("/assets")
def list_assets():
    """
    Filtros:
      - floor=2
      - area=Lobby
      - type=FCU
      - q=texto (por nombre)
      - order=-created_at | name | -name | floor | -floor ...
      - page, page_size
    """
    order = request.args.get("order", "-created_at")
    floor = request.args.get("floor")
    area = request.args.get("area")
    typ = request.args.get("type")
    qstr = request.args.get("q")

    q = Asset.query
    if floor:
        q = q.filter(Asset.floor == floor)
    if area:
        q = q.filter(Asset.area == area)
    if typ:
        q = q.filter(Asset.type == typ)
    if qstr:
        like = f"%{qstr.strip()}%"
        q = q.filter(Asset.name.ilike(like))

    q = _apply_order(q, Asset, order)
    rows, total, page, page_size = _paginate(q)
    return jsonify({
        "items": [a.to_dict() for a in rows],
        "total": total,
        "page": page,
        "page_size": page_size
    }), 200


@bp.get("/assets/<int:item_id>")
def get_asset(item_id: int):
    a = Asset.query.get_or_404(item_id)
    return jsonify(a.to_dict()), 200


@bp.route("/assets/list", methods=["GET", "POST"])
def list_assets_alias():
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        order = data.get("order", "-created_at")
        floor = data.get("floor")
        area = data.get("area")
        typ = data.get("type")
        qstr = data.get("q")
        page = data.get("page")
        page_size = data.get("page_size")
        if page is not None:
            request.args = request.args.copy()
            request.args = request.args.to_dict(flat=True)
            request.args["page"] = str(page)
        if page_size is not None:
            request.args["page_size"] = str(page_size)
    else:
        order = request.args.get("order", "-created_at")
        floor = request.args.get("floor")
        area = request.args.get("area")
        typ = request.args.get("type")
        qstr = request.args.get("q")

    q = Asset.query
    if floor:
        q = q.filter(Asset.floor == floor)
    if area:
        q = q.filter(Asset.area == area)
    if typ:
        q = q.filter(Asset.type == typ)
    if qstr:
        like = f"%{(qstr or '').strip()}%"
        q = q.filter(Asset.name.ilike(like))

    q = _apply_order(q, Asset, order)
    rows, total, page, page_size = _paginate(q)
    return jsonify({
        "items": [a.to_dict() for a in rows],
        "total": total,
        "page": page,
        "page_size": page_size
    }), 200


def _to_date(value):
    if not value:
        return None
    s = str(value)
    try:
        if "T" in s:
            return datetime.fromisoformat(s).date()
        return date.fromisoformat(s)
    except Exception:
        return None


@bp.post("/assets")
def create_asset():
    data = request.get_json(silent=True) or {}

    a = Asset(
        name=(data.get("name") or "").strip(),
        type=(data.get("type") or "").strip() or None,
        location=(data.get("location") or "").strip() or None,
        floor=(data.get("floor") or "").strip() or None,
        area=(data.get("area") or "").strip() or None,
        manufacturer=(data.get("manufacturer") or "").strip() or None,
        model_no=(data.get("model_no") or "").strip() or None,
        serial_no=(data.get("serial_no") or "").strip() or None,
        pm_frequency=(data.get("pm_frequency") or "").strip() or None,
        install_date=_to_date(data.get("install_date")),
        warranty_expiration=_to_date(data.get("warranty_expiration")),
        next_service_at=_to_date(data.get("next_service_at")),
        photos=data.get("photos") or "",
        notes=(data.get("notes") or "").strip() or None,
        equipment=(data.get("equipment") or "").strip() or None,
        equipment_name=(data.get("equipment_name") or "").strip() or None,
        ip_address=(data.get("ip_address") or "").strip() or None,
        mac_address=(data.get("mac_address") or "").strip() or None,
        hostname=(data.get("hostname") or "").strip() or None,
        vlan_id=(data.get("vlan_id") if data.get("vlan_id") not in ("", None) else None),
        os_version=(data.get("os_version") or "").strip() or None,
        firmware_version=(data.get("firmware_version") or "").strip() or None,
        ports_total=(data.get("ports_total") if data.get("ports_total") not in ("", None) else None),
        ports_used=(data.get("ports_used") if data.get("ports_used") not in ("", None) else None),
        port_notes=(data.get("port_notes") or "").strip() or None,
    )

    if not a.name:
        return jsonify({"error": "name is required"}), 400

    db.session.add(a)
    db.session.commit()
    return jsonify(a.to_dict()), 201


@bp.put("/assets/<int:item_id>")
@bp.patch("/assets/<int:item_id>")
def update_asset(item_id: int):
    a = Asset.query.get_or_404(item_id)
    data = request.get_json(silent=True) or {}

    for key in [
        "name", "type", "location",
        "floor", "area",
        "manufacturer", "model_no", "serial_no",
        "pm_frequency", "equipment", "equipment_name", "ip_address", "mac_address",
        "hostname", "os_version", "firmware_version", "port_notes", "photos",
        "notes",
    ]:
        if key in data:
            val = (data.get(key) or "").strip()
            setattr(a, key, val or None)

    for key in ["vlan_id", "ports_total", "ports_used"]:
        if key in data:
            v = data.get(key)
            setattr(a, key, (None if v in ("", None) else int(v)))

    for key in ["install_date", "warranty_expiration", "next_service_at"]:
        if key in data:
            setattr(a, key, _to_date(data.get(key)))

    db.session.commit()
    return jsonify(a.to_dict()), 200


@bp.delete("/assets/<int:item_id>")
def delete_asset(item_id: int):
    a = Asset.query.get_or_404(item_id)
    db.session.delete(a)
    db.session.commit()
    return jsonify({"ok": True, "id": item_id}), 200


@bp.get("/assets/<int:asset_id>/linked")
def get_linked_docs(asset_id):
    """Devuelve todos los SOPs y Manuals asociados a un Asset."""
    from backend.models.sop import SOP
    from backend.models.manual import Manual

    sops = SOP.query.filter_by(asset_id=asset_id).all()
    manuals = Manual.query.filter_by(asset_id=asset_id).all()

    return jsonify({
        "asset_id": asset_id,
        "sops": [s.to_dict(include_steps=False) for s in sops],
        "manuals": [m.to_dict() for m in manuals],
    }), 200
