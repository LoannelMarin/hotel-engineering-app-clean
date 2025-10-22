# backend/routes/auth.py
# -*- coding: utf-8 -*-
from datetime import timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

# Imports compatibles (ejecutando como paquete "backend" o dentro de /backend)
try:
    from backend.extensions import db
    from backend.models.user import User
except ModuleNotFoundError:
    from extensions import db
    from models.user import User

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _serialize_user(u: User) -> dict:
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": getattr(u, "role", "user"),
        "is_active": getattr(u, "is_active", True),
    }


def _password_is_hashed(value: str | None) -> bool:
    """Heurística simple para saber si luce como hash soportado por werkzeug."""
    if not value or not isinstance(value, str):
        return False
    prefixes = ("pbkdf2:", "scrypt:", "sha1:", "md5:", "argon2", "bcrypt")
    return value.startswith(prefixes)


@bp.post("/login")
def login():
    """
    Body: { email, password }
    Responde: { access_token, user }
    Incluye claims 'role', 'name', 'email' en el JWT.
    Migra contraseñas en texto plano a hash si detecta legado.
    """
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not email or not password:
        return jsonify({"msg": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"msg": "Invalid credentials"}), 401

    # 1) Si el modelo trae método propio de validación:
    if hasattr(user, "check_password"):
        try:
            if user.check_password(password):
                pass
            else:
                return jsonify({"msg": "Invalid credentials"}), 401
        except Exception:
            pass
    else:
        # 2) Validación estándar con werkzeug si hay hash conocido
        stored_hash = getattr(user, "password_hash", None)
        plain_alt = getattr(user, "password", None)  # posibles bases legadas

        valid = False
        migrated = False

        if _password_is_hashed(stored_hash):
            try:
                valid = check_password_hash(stored_hash, password)
            except Exception:
                valid = False

        # 3) Soporte legado: si venía en texto plano y coincide, autenticamos y migramos
        if not valid:
            if stored_hash and not _password_is_hashed(stored_hash) and stored_hash == password:
                valid = True
                user.password_hash = generate_password_hash(password)
                migrated = True
            elif plain_alt and plain_alt == password:
                valid = True
                user.password_hash = generate_password_hash(password)
                if hasattr(user, "password"):
                    try:
                        setattr(user, "password", None)
                    except Exception:
                        pass
                migrated = True

        if not valid:
            return jsonify({"msg": "Invalid credentials"}), 401

        if migrated:
            try:
                db.session.commit()
                print("[auth] password migrated to hashed for", user.email)
            except Exception:
                db.session.rollback()

    if hasattr(user, "is_active") and not user.is_active:
        return jsonify({"msg": "User is inactive"}), 403

    # Claims enriquecidos: role, name, email
    claims = {
        "role": getattr(user, "role", "user"),
        "name": user.name,
        "email": user.email,
    }
    token = create_access_token(
        identity=str(user.id),
        additional_claims=claims,
        expires_delta=timedelta(hours=12),
    )

    return jsonify({"access_token": token, "user": _serialize_user(user)}), 200


@bp.get("/me")
@jwt_required()
def me():
    identity = get_jwt_identity()
    if not identity:
        return jsonify({"msg": "Unauthorized"}), 401
    u = User.query.get(int(identity))
    if not u:
        return jsonify({"msg": "User not found"}), 404
    return jsonify(_serialize_user(u)), 200
