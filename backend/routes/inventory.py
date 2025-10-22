# -*- coding: utf-8 -*-
from __future__ import annotations
from datetime import datetime
from typing import Optional

from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError, DataError, StatementError
from sqlalchemy import or_

from flask_jwt_extended import jwt_required  # <--- IMPORTADO

from backend.extensions import db
from backend.models.inventory import InventoryItem
from backend.models.inventory_log import InventoryLog
from backend.models.user import User  # <-- para filtrar por email/nombre

# JWT (si estás logueado, tomamos el id; si no, queda None)
try:
    from flask_jwt_extended import get_jwt_identity
except Exception:  # plugin no disponible
    def get_jwt_identity():
        return None

bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")

# ---------- helpers ----------
NUM_FIELDS = {"stock", "minimum", "supplier_id", "unit_cost"}
ALLOWED_FIELDS = {
    "item_id", "name", "category", "stock", "minimum",
    "location", "supplier_id", "part_no", "unit_cost",
    "description", "image", "image_url", "product_link",
}


def _to_number(v):
    if v is None or v == "":
        return None
    try:
        return float(v) if isinstance(v, str) and "." in v else int(v)
    except Exception:
        return None


def _payload(data: dict) -> dict:
    alias_item_id = (
        data.get("item_id") or data.get("sku") or data.get("itemId") or data.get("itemID")
        or (str(data.get("id")) if "id" in data and data.get("id") not in (None, "") else None)
    )
    out = {}
    if alias_item_id not in (None, ""):
        out["item_id"] = str(alias_item_id).strip()

    for k in ALLOWED_FIELDS:
        if k in {"item_id", "image_url"}:
            continue
        if k not in data:
            continue
        if k in NUM_FIELDS:
            out[k] = _to_number(data.get(k))
        elif k == "image":
            val = data.get("image") or data.get("image_url")

            # 🧩 FIX: si es un dict, tomar solo la URL o path
            if isinstance(val, dict):
                val = val.get("url") or val.get("path") or val.get("filename")

            # 🧩 Si es lista o tupla, tomar el primer valor
            if isinstance(val, (list, tuple)):
                val = val[0] if val else None

            out[k] = val
        else:
            v = data.get(k)
            out[k] = v if v != "" else None
    return out


def _serialize(i: InventoryItem) -> dict:
    return {
        "id": i.id,
        "item_id": i.item_id,
        "name": i.name,
        "category": i.category,
        "stock": i.stock,
        "minimum": i.minimum,
        "location": i.location,
        "supplier_id": i.supplier_id,
        "supplier_name": getattr(i.supplier, "name", None),  # ✅ nombre real del vendor
        "part_no": i.part_no,
        "unit_cost": i.unit_cost,
        "description": i.description,
        "image": i.image,
        "product_link": i.product_link,
        "image_url": i.image,
    }


def _current_user_id():
    """
    Obtiene el user_id desde JWT o cabecera X-User-Id y lo convierte a int si es posible.
    """
    uid = None
    try:
        uid = get_jwt_identity()
    except Exception:
        uid = None

    header_uid = request.headers.get("X-User-Id")
    raw = header_uid if header_uid not in (None, "") else uid
    if raw is None:
        return None
    try:
        return int(str(raw))
    except Exception:
        return None


def _log(item: InventoryItem, *, action: str, delta=None, prev=None, new=None, note=None):
    log = InventoryLog(
        item_db_id=item.id,
        item_code=item.item_id,
        user_id=_current_user_id(),
        action=action,
        delta=delta,
        prev_stock=prev,
        new_stock=new,
        note=note,
        created_at=datetime.utcnow(),
    )
    db.session.add(log)


# ---------- routes ----------
@bp.get("/")
def list_items():
    items = InventoryItem.query.order_by(InventoryItem.name.asc()).all()
    return jsonify({"items": [_serialize(i) for i in items]})


# ✅ NUEVO: items con stock bajo
@bp.get("/lowstock")
@jwt_required(optional=True)
def list_low_stock_items():
    """
    Devuelve solo los ítems con stock <= minimum.
    """
    try:
        items = (
            InventoryItem.query
            .filter(InventoryItem.stock <= InventoryItem.minimum)
            .order_by(InventoryItem.name.asc())
            .all()
        )
        return jsonify({"items": [_serialize(i) for i in items]})
    except Exception as e:
        return jsonify({"error": "Server error", "detail": str(e)}), 500


@bp.get("/<int:id>")
def get_item(id: int):
    i = InventoryItem.query.get_or_404(id)
    return jsonify(_serialize(i))


@bp.post("/")
def create_item():
    data = request.get_json(force=True, silent=True) or {}
    rec = InventoryItem(**_payload(data))
    try:
        db.session.add(rec)
        db.session.flush()
        _log(rec, action="create", prev=None, new=rec.stock, note="created")
        db.session.commit()
        return jsonify(_serialize(rec)), 201
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({"error": "IntegrityError", "detail": str(e.orig)}), 409
    except (DataError, StatementError) as e:
        db.session.rollback()
        return jsonify({"error": "Invalid data", "detail": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Server error", "detail": str(e)}), 500


@bp.put("/<int:id>")
def update_item(id: int):
    data = request.get_json(force=True, silent=True) or {}
    rec = InventoryItem.query.get_or_404(id)

    prev_stock = rec.stock
    new_values = _payload(data)
    for k, v in new_values.items():
        setattr(rec, k, v)

    try:
        delta = None
        if "stock" in new_values:
            new_stock = rec.stock
            try:
                delta = (new_stock or 0) - (prev_stock or 0)
            except Exception:
                delta = None
            _log(rec, action="set", delta=delta, prev=prev_stock, new=new_stock, note="update stock")

        if not ("stock" in new_values and delta == 0):
            _log(rec, action="update", note="field update")

        db.session.commit()
        return jsonify(_serialize(rec))
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({"error": "IntegrityError", "detail": str(e.orig)}), 409
    except (DataError, StatementError) as e:
        db.session.rollback()
        return jsonify({"error": "Invalid data", "detail": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Server error", "detail": str(e)}), 500


@bp.patch("/<int:id>")
def patch_item(id: int):
    data = request.get_json(force=True, silent=True) or {}
    rec = InventoryItem.query.get_or_404(id)

    prev_stock = rec.stock
    changed = False
    for k, v in _payload(data).items():
        changed = True
        setattr(rec, k, v)

    try:
        if "stock" in data:
            new_stock = rec.stock
            delta = (new_stock or 0) - (prev_stock or 0)
            _log(rec, action="set", delta=delta, prev=prev_stock, new=new_stock, note="patch stock")
        if changed:
            _log(rec, action="update", note="patch update")

        db.session.commit()
        return jsonify(_serialize(rec))
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({"error": "IntegrityError", "detail": str(e.orig)}), 409
    except (DataError, StatementError) as e:
        db.session.rollback()
        return jsonify({"error": "Invalid data", "detail": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Server error", "detail": str(e)}), 500


@bp.delete("/<int:id>")
def delete_item(id: int):
    rec = InventoryItem.query.get_or_404(id)
    try:
        _log(rec, action="delete", prev=rec.stock, new=None, note="deleted")
        db.session.delete(rec)
        db.session.commit()
        return jsonify({"ok": True})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Server error", "detail": str(e)}), 500


@bp.post("/<int:id>/adjust")
@jwt_required()  # <--- AÑADIDO
def adjust_item(id: int):
    """
    Body: { "delta": <int>, "mode": "in"|"out", "note": "optional" }
    - Si envías 'mode', se ignora el signo de delta: 'in' = +abs(delta), 'out' = -abs(delta)
    """
    data = request.get_json(force=True, silent=True) or {}
    rec = InventoryItem.query.get_or_404(id)

    delta = int(data.get("delta") or 0)
    mode = (data.get("mode") or "").lower().strip()
    if mode in ("in", "out"):
        delta = abs(delta) if mode == "in" else -abs(delta)

    prev_stock = rec.stock or 0
    new_stock = prev_stock + delta
    rec.stock = new_stock

    try:
        _log(rec, action=("in" if delta >= 0 else "out"), delta=delta, prev=prev_stock, new=new_stock, note=data.get("note"))
        db.session.commit()
        return jsonify(_serialize(rec))
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Server error", "detail": str(e)}), 500


@bp.get("/logs")
def list_logs():
    """
    Query params:
      - item_db_id: int  (id interno del ítem)
      - item_code:  str  (SKU / item_id)
      - user_id:    int  (id exacto)
      - user:       str  (id|email|name - filtra flexible)
      - action:     in|out|set|create|update|delete
      - from:       ISO date (incluyente)
      - to:         ISO date (incluyente)
      - page:       int (default 1)
      - per_page:   int (default 25, máx 200)
      - sort:       'desc'|'asc' por fecha
    """
    q = InventoryLog.query

    item_db_id = request.args.get("item_db_id")
    item_code  = request.args.get("item_code")
    user_id    = request.args.get("user_id")
    user_q     = request.args.get("user")  # <-- NUEVO filtro flexible
    action     = request.args.get("action")
    from_      = request.args.get("from")
    to_        = request.args.get("to")
    sort       = (request.args.get("sort") or "desc").lower()

    if item_db_id:
        q = q.filter(InventoryLog.item_db_id == int(item_db_id))
    if item_code:
        q = q.filter(InventoryLog.item_code == item_code)
    if user_id:
        try:
            q = q.filter(InventoryLog.user_id == int(user_id))
        except Exception:
            q = q.filter(InventoryLog.user_id == None)  # noqa: E711
    if user_q:
        if user_q.isdigit():
            q = q.filter(InventoryLog.user_id == int(user_q))
        else:
            q = q.join(User, isouter=True).filter(
                or_(
                    User.email.ilike(f"%{user_q}%"),
                    (User.name.ilike(f"%{user_q}%"))
                )
            )
    if action:
        q = q.filter(InventoryLog.action == action)

    def _parse_dt(s):
        try:
            return datetime.fromisoformat(s.replace("Z", ""))
        except Exception:
            return None

    dt_from = _parse_dt(from_) if from_ else None
    dt_to   = _parse_dt(to_) if to_ else None
    if dt_from:
        q = q.filter(InventoryLog.created_at >= dt_from)
    if dt_to:
        q = q.filter(InventoryLog.created_at <= dt_to)

    q = q.order_by(InventoryLog.created_at.desc() if sort != "asc" else InventoryLog.created_at.asc())

    page = max(int(request.args.get("page") or 1), 1)
    per_page = min(max(int(request.args.get("per_page") or 25), 1), 200)
    pagination = q.paginate(page=page, per_page=per_page, error_out=False)

    def _row(l: InventoryLog) -> dict:
        user = getattr(l, "user", None)
        user_name = None
        user_email = None
        if user is not None:
            user_name = getattr(user, "name", None) or getattr(user, "full_name", None)
            user_email = getattr(user, "email", None)

        return {
            "id": l.id,
            "item_db_id": l.item_db_id,
            "item_code": l.item_code,
            "user_id": l.user_id,
            "user_name": user_name or user_email,
            "user_email": user_email,
            "action": l.action,
            "delta": l.delta,
            "prev_stock": l.prev_stock,
            "new_stock": l.new_stock,
            "note": l.note,
            "created_at": (l.created_at.isoformat() + "Z") if l.created_at else None,
        }

    items = [_row(log) for log in pagination.items]

    return jsonify({
        "items": items,
        "page": pagination.page,
        "pages": pagination.pages,
        "total": pagination.total,
        "per_page": pagination.per_page,
    })
