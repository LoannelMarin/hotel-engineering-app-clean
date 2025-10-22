from __future__ import annotations
from datetime import datetime, date, time
from typing import Any, Dict, Iterable

from flask import Blueprint, request, jsonify
from sqlalchemy import types as satypes, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

from backend.extensions import db
from backend.models.quote import Quote  # Modelo Quote con relación .vendor

bp = Blueprint("quotes", __name__, url_prefix="/api/quotes")

# ---- introspección de columnas/tipos del modelo ----
COLS = {c.name: c for c in Quote.__table__.columns}
COL_TYPES: dict[str, satypes.TypeEngine] = {c.name: c.type for c in COLS.values()}
DATE_COLS   = {n for n, t in COL_TYPES.items() if isinstance(t, (satypes.Date, satypes.DateTime))}
INT_COLS    = {n for n, t in COL_TYPES.items() if isinstance(t, (satypes.Integer, satypes.BigInteger, satypes.SmallInteger))}
FLOAT_COLS  = {n for n, t in COL_TYPES.items() if isinstance(t, (satypes.Float, satypes.Numeric, satypes.DECIMAL, satypes.REAL))}
STR_COLS    = {n for n, t in COL_TYPES.items() if isinstance(t, (satypes.String, satypes.Text))}

def _parse_iso_to_datetime(s: str) -> datetime | None:
    s = (s or "").strip()
    if not s:
        return None
    # YYYY-MM-DD
    if len(s) == 10 and s[4] == "-" and s[7] == "-":
        try:
            d = date.fromisoformat(s)
            return datetime.combine(d, time.min)
        except Exception:
            return None
    # ISO completo
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None

def _coerce_for_model(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Filtra y castea solo campos existentes en Quote, según tipos."""
    out: Dict[str, Any] = {}
    for k, v in (payload or {}).items():
        if k not in COL_TYPES:
            continue
        if v in ("", "null", "None"):
            out[k] = None
            continue
        if k in DATE_COLS and isinstance(v, str):
            out[k] = _parse_iso_to_datetime(v)
            continue
        if k in INT_COLS:
            try:
                out[k] = None if v is None or v == "" else int(v)
            except Exception:
                out[k] = None
            continue
        if k in FLOAT_COLS:
            try:
                out[k] = None if v is None or v == "" else float(v)
            except Exception:
                out[k] = None
            continue
        out[k] = v
    return out

def _serialize_value(v: Any) -> Any:
    if isinstance(v, datetime):
        return v.date().isoformat()
    if isinstance(v, date):
        return v.isoformat()
    return v

def _vendor_display_name(v):
    """Intenta devolver un nombre legible del vendor (robusto a distintos esquemas)."""
    if not v:
        return None
    for attr in (
        "name",
        "company",
        "display_name",
        "vendor_name",
        "legal_name",
        "business_name",
        "full_name",
        "contact_name",
        "title",
    ):
        val = getattr(v, attr, None)
        if val:
            return val
    return None

def serialize(q: Quote) -> Dict[str, Any]:
    """Serializa una Quote incluyendo vendor_name (no rompe nada existente)."""
    data: Dict[str, Any] = {}
    for k in COL_TYPES.keys():
        data[k] = _serialize_value(getattr(q, k, None))
    # Campo adicional para el frontend (eager-loaded)
    try:
        data["vendor_name"] = _vendor_display_name(getattr(q, "vendor", None))
    except Exception:
        data["vendor_name"] = None
    return data

# ------------------- Rutas -------------------

# GET /api/quotes  y /api/quotes/
@bp.get("")
@bp.get("/")
def list_quotes():
    # Eager load del vendor para asegurar vendor_name en la serialización
    qry = Quote.query.options(joinedload(Quote.vendor))

    # Filtros simples
    vendor_id = request.args.get("vendor_id")
    project_id = request.args.get("project_id")
    # Soporte para task_id (alias de linked_task_id)
    task_id = request.args.get("task_id") or request.args.get("linked_task_id")
    status = request.args.get("status")
    q = request.args.get("q")

    if vendor_id:
        try:
            qry = qry.filter(Quote.vendor_id == int(vendor_id))
        except Exception:
            pass
    if project_id and hasattr(Quote, "project_id"):
        try:
            qry = qry.filter(getattr(Quote, "project_id") == int(project_id))
        except Exception:
            pass
    if task_id:
        try:
            qry = qry.filter(Quote.linked_task_id == int(task_id))
        except Exception:
            pass
    if status and hasattr(Quote, "status"):
        qry = qry.filter(getattr(Quote, "status") == status)

    # Búsqueda básica en columnas de texto
    if q:
        terms: Iterable = []
        t = f"%{q}%"
        for name in STR_COLS:
            terms = (*terms, getattr(Quote, name).ilike(t))
        if terms:
            qry = qry.filter(or_(*terms))

    items = qry.order_by(Quote.id.desc()).all()
    return {"items": [serialize(x) for x in items]}

# POST /api/quotes  y /api/quotes/
@bp.post("")
@bp.post("/")
def create_quote():
    raw = request.get_json(silent=True) or {}
    data = _coerce_for_model(raw)
    try:
        q = Quote(**data)
        db.session.add(q)
        db.session.commit()
        return serialize(q), 201
    except IntegrityError as ie:
        db.session.rollback()
        return jsonify({"error": "Integrity error", "detail": str(ie.orig)}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Server error", "detail": str(e)}), 500

# PUT /api/quotes/<id>
@bp.put("/<int:id>")
def update_quote(id: int):
    q = Quote.query.options(joinedload(Quote.vendor)).get_or_404(id)
    raw = request.get_json(silent=True) or {}
    data = _coerce_for_model(raw)
    try:
        for k, v in data.items():
            setattr(q, k, v)
        db.session.commit()
        return serialize(q)
    except IntegrityError as ie:
        db.session.rollback()
        return jsonify({"error": "Integrity error", "detail": str(ie.orig)}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Server error", "detail": str(e)}), 500

# DELETE /api/quotes/<id>
@bp.delete("/<int:id>")
def delete_quote(id: int):
    q = Quote.query.get_or_404(id)
    db.session.delete(q)
    db.session.commit()
    return {"ok": True}
