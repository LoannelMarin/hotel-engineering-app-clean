# backend/seed_admin.py
# -*- coding: utf-8 -*-
"""
Crea/actualiza el usuario admin en la MISMA BD que usa app.py
Email: admin@example.com
Password: Admin123!@#
"""

import os
import sys
from werkzeug.security import generate_password_hash

# Asegurar import de 'backend' aunque se ejecute dentro de /backend
CURRENT_DIR = os.path.dirname(__file__)
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Imports compatibles
try:
    from backend.app import create_app
    from backend.extensions import db
    from backend.models.user import User
except ModuleNotFoundError:
    from app import create_app        # type: ignore
    from extensions import db          # type: ignore
    from models.user import User       # type: ignore


def resolved_sqlite_path(uri: str) -> str:
    if not uri.startswith("sqlite:"):
        return uri
    if uri == "sqlite:///:memory:":
        return ":memory:"
    db_file = uri.replace("sqlite:///", "")
    return os.path.abspath(db_file)


def main():
    app = create_app()
    uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
    path = resolved_sqlite_path(uri)

    with app.app_context():
        # crea las tablas si no existen (dev)
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        if "user" not in inspector.get_table_names():
            db.create_all()
            print("[seed] tablas creadas (create_all)")

        email = "admin@example.com"
        password = "Admin123!@#"

        u = User.query.filter_by(email=email).first()
        if u:
            # actualizar datos clave y re-hashear password por si estaba plano
            u.name = "Admin"
            u.role = getattr(u, "role", "admin") or "admin"
            if hasattr(u, "is_active"):
                u.is_active = True
            if hasattr(u, "set_password"):
                u.set_password(password)
            else:
                u.password_hash = generate_password_hash(password)
            db.session.commit()
            print(f"[OK] Admin actualizado: {email} / {password}")
        else:
            # crear nuevo
            u = User(
                name="Admin",
                email=email,
                role="admin",
                **({"is_active": True} if "is_active" in User.__table__.columns else {}),
            )
            if hasattr(u, "set_password"):
                u.set_password(password)
            else:
                u.password_hash = generate_password_hash(password)
            db.session.add(u)
            db.session.commit()
            print(f"[OK] Admin creado: {email} / {password}")

        # Mostrar resumen y la ruta exacta del archivo SQLite
        total = db.session.query(User).count()
        print(f"[DB] URI: {uri}")
        print(f"[DB] Archivo: {path}")
        print(f"[DB] Usuarios totales: {total}")


if __name__ == "__main__":
    main()
