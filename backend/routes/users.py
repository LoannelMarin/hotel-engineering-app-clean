# backend/routes/users.py
# -*- coding: utf-8 -*-
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from werkzeug.security import generate_password_hash

# Imports compatibles (ejecutando como paquete "backend" o dentro de /backend)
try:
    from backend.extensions import db
    from backend.models.user import User
except ModuleNotFoundError:
    from extensions import db
    from models.user import User

bp = Blueprint("users", __name__, url_prefix="/api/users")


# -------- Helpers --------

def _is_admin() -> bool:
    """Permite admin u owner basado en claims del JWT."""
    claims = get_jwt() or {}
    role = claims.get("role") or claims.get("roles") or "user"
    if isinstance(role, str):
        return role in ("admin", "owner")
    if isinstance(role, (list, tuple, set)):
        return any(r in ("admin", "owner") for r in role)
    return False


def _serialize(u: User) -> dict:
    """Serializa sin exponer password_hash."""
    data = getattr(u, "to_dict", lambda: {})()
    if not data:
        data = {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": getattr(u, "role", "user"),
            "is_active": getattr(u, "is_active", True),
            "created_at": getattr(u, "created_at", None).isoformat() if getattr(u, "created_at", None) else None,
            "updated_at": getattr(u, "updated_at", None).isoformat() if getattr(u, "updated_at", None) else None,
        }
    data.pop("password_hash", None)
    return data


# -------- Endpoints --------

@bp.get("/")
@jwt_required()
def list_users():
    if not _is_admin():
        return jsonify({"msg": "Forbidden"}), 403
    items = User.query.order_by(getattr(User, "created_at", User.id).desc()).all()
    return jsonify({"items": [_serialize(u) for u in items]}), 200


@bp.post("/")
@jwt_required()
def create_user():
    if not _is_admin():
        return jsonify({"msg": "Forbidden"}), 403

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    role = (data.get("role") or "user").strip().lower()
    is_active = bool(data.get("is_active", True))
    password = (data.get("password") or "").strip()

    if not name or not email or not password:
        return jsonify({"msg": "Name, email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "Email already registered"}), 400

    u = User(name=name, email=email, role=role, is_active=is_active)
    if hasattr(u, "set_password"):
        u.set_password(password)
    else:
        u.password_hash = generate_password_hash(password)

    db.session.add(u)
    db.session.commit()
    return jsonify(_serialize(u)), 201


@bp.put("/<int:uid>")
@jwt_required()
def update_user(uid: int):
    if not _is_admin():
        return jsonify({"msg": "Forbidden"}), 403

    u = User.query.get_or_404(uid)
    data = request.get_json(silent=True) or {}

    if "name" in data:
        u.name = (data.get("name") or "").strip()
    if "email" in data:
        new_email = (data.get("email") or "").strip().lower()
        if new_email and new_email != u.email:
            if User.query.filter_by(email=new_email).first():
                return jsonify({"msg": "Email already registered"}), 400
            u.email = new_email
    if "role" in data:
        u.role = (data.get("role") or "user").strip().lower()
    if "is_active" in data:
        u.is_active = bool(data.get("is_active"))
    if data.get("password"):
        if hasattr(u, "set_password"):
            u.set_password(data["password"])
        else:
            u.password_hash = generate_password_hash(data["password"])

    db.session.commit()
    return jsonify(_serialize(u)), 200


@bp.delete("/<int:uid>")
@jwt_required()
def delete_user(uid: int):
    if not _is_admin():
        return jsonify({"msg": "Forbidden"}), 403
    u = User.query.get_or_404(uid)
    db.session.delete(u)
    db.session.commit()
    return jsonify({"ok": True}), 200
