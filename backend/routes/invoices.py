# backend/routes/invoices.py
from __future__ import annotations
from datetime import datetime, date, time
from typing import Any, Dict

from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import types as satypes
from sqlalchemy.exc import IntegrityError

from backend.extensions import db
from backend.models.invoice import Invoice

bp = Blueprint("invoices", __name__, url_prefix="/api/invoices")

# ===== introspección de columnas/tipos =====
COL_TYPES: dict[str, satypes.TypeEngine] = {c.name: c.type for c in Invoice.__table__.columns}
DATE_COLS     = {n for n, t in COL_TYPES.items() if isinstance(t, satypes.Date)}
DATETIME_COLS = {n for n, t in COL_TYPES.items() if isinstance(t, satypes.DateTime)}
INT_COLS      = {n for n, t in COL_TYPES.items() if isinstance(t, (satypes.Integer, satypes.BigInteger, satypes.SmallInteger))}
FLOAT_COLS    = {n for n, t in COL_TYPES.items() if isinstance(t, (satypes.Float, satypes.Numeric, satypes.DECIMAL, satypes.REAL))}
REQ_COLS      = {"invoice_number", "vendor_id"}

# ===== helpers de parseo =====
def _parse_iso_to_date(s: str) -> date | None:
    s = (s or "").strip()
    if not s:
        return None
    try:
        if len(s) == 10 and s[4] == "-" and s[7] == "-":
            return date.fromisoformat(s)
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return dt.date()
    except Exception:
        return None

def _parse_iso_to_datetime(s: str) -> datetime | None:
    s = (s or "").strip()
    if not s:
        return None
    if len(s) == 10 and s[4] == "-" and s[7] == "-":
        try:
            d = date.fromisoformat(s)
            return datetime.combine(d, time.min)
        except Exception:
            return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None

def _apply_aliases(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Normaliza alias de entrada sin perder compat."""
    data = dict(raw or {})

    # delivery_date -> due_date
    if "delivery_date" in data and "due_date" not in data:
        data["due_date"] = data["delivery_date"]

    # order_description / description -> notes
    if "notes" not in data:
        if "order_description" in data:
            data["notes"] = data.get("order_description")
        elif "description" in data:
            data["notes"] = data.get("description")

    # terms -> payment_terms (compatibilidad con payloads antiguos)
    if "payment_terms" not in data and "terms" in data:
        data["payment_terms"] = data.get("terms")

    return data

def _coerce_for_model(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Filtra y castea solo campos existentes en Invoice, según tipos."""
    payload = _apply_aliases(payload)
    out: Dict[str, Any] = {}
    for k, v in (payload or {}).items():
        if k not in COL_TYPES:
            continue

        if v in ("", "null", "None"):
            out[k] = None
            continue

        if k in DATE_COLS and isinstance(v, str):
            out[k] = _parse_iso_to_date(v)
            continue

        if k in DATETIME_COLS and isinstance(v, str):
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

def _serialize_value(col_name: str, v: Any) -> Any:
    if v is None:
        return None
    if col_name in DATETIME_COLS and isinstance(v, datetime):
        return v.date().isoformat()
    if col_name in DATE_COLS and isinstance(v, date):
        return v.isoformat()
    return v

def serialize(i: Invoice) -> Dict[str, Any]:
    data: Dict[str, Any] = {}
    for k in COL_TYPES.keys():
        data[k] = _serialize_value(k, getattr(i, k, None))

    # enriquecer con vendor_name y objeto mínimo
    vendor_name = None
    vendor_min = None
    try:
        if i.vendor is not None:
            vendor_name = getattr(i.vendor, "name", None)
            vendor_min = {"id": i.vendor.id, "name": vendor_name}
    except Exception:
        pass
    data["vendor_name"] = vendor_name
    data["vendor"] = vendor_min

    # alias de salida para compat con el front
    data["delivery_date"] = data.get("due_date")
    data["order_description"] = data.get("notes")
    data["terms"] = data.get("payment_terms")  # alias opcional

    return data

def _validate_required(data: Dict[str, Any]) -> list[str]:
    missing = []
    for k in REQ_COLS:
        v = data.get(k, None)
        if v is None or (isinstance(v, str) and not v.strip()):
            missing.append(k)
    return missing

# ===== Rutas =====
@bp.get("")
@bp.get("/")
def list_invoices():
    q = Invoice.query
    vendor_id = request.args.get("vendor_id", type=int)
    if vendor_id is not None:
        q = q.filter(Invoice.vendor_id == vendor_id)

    inv_number = request.args.get("invoice_number", type=str)
    if inv_number:
        q = q.filter(Invoice.invoice_number == inv_number)

    items = q.order_by(Invoice.id.desc()).all()
    return {"items": [serialize(x) for x in items]}

@bp.post("")
@bp.post("/")
def create_invoice():
    raw = request.get_json(silent=True) or {}
    data = _coerce_for_model(raw)

    missing = _validate_required(data)
    if missing:
        return jsonify({"error": "Missing required fields", "fields": missing}), 400

    try:
        i = Invoice(**data)
        db.session.add(i)
        db.session.commit()
        return serialize(i), 201
    except IntegrityError as ie:
        db.session.rollback()
        return jsonify({
            "error": "Integrity error",
            "detail": str(ie.orig),
            "code": "UNIQUE_CONSTRAINT"
        }), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Server error", "detail": str(e)}), 500

@bp.put("/<int:id>")
def update_invoice(id: int):
    i = Invoice.query.get_or_404(id)
    raw = request.get_json(silent=True) or {}
    data = _coerce_for_model(raw)

    if "vendor_id" in data and data["vendor_id"] is None:
        return jsonify({"error": "vendor_id cannot be null"}), 400

    try:
        for k, v in data.items():
            setattr(i, k, v)
        db.session.commit()
        return serialize(i)
    except IntegrityError as ie:
        db.session.rollback()
        return jsonify({
            "error": "Integrity error",
            "detail": str(ie.orig),
            "code": "UNIQUE_CONSTRAINT"
        }), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Server error", "detail": str(e)}), 500

@bp.delete("/<int:id>")
def delete_invoice(id: int):
    i = Invoice.query.get_or_404(id)
    db.session.delete(i)
    db.session.commit()
    return {"ok": True}
