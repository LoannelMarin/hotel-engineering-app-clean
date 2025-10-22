# -*- coding: utf-8 -*-
"""
Crea o actualiza el usuario admin@example.com con password 'Admin#2025'.
Funciona sin importar desde qué carpeta ejecutes el script.
Uso:
  python backend/scripts/upsert_admin_user.py
"""
from __future__ import annotations
from pathlib import Path
import sys
from werkzeug.security import generate_password_hash

# --- Resolver imports del paquete 'backend' sin depender del cwd ---
THIS_FILE = Path(__file__).resolve()
BACKEND_DIR = THIS_FILE.parents[1]
PROJECT_ROOT = BACKEND_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app import create_app
from backend.config import Config
from backend.extensions import db
from backend.models.user import User

EMAIL = "admin@example.com"
NAME = "Admin"
PASSWORD = "Admin#2025"
ROLE = "admin"

def main():
    app = create_app(Config)
    with app.app_context():
        user = User.query.filter(User.email.ilike(EMAIL)).first()
        if not user:
            user = User(email=EMAIL, name=NAME, role=ROLE)
            db.session.add(user)

        pwd_hash = generate_password_hash(PASSWORD)

        if hasattr(user, "password_hash"):
            setattr(user, "password_hash", pwd_hash)
        else:
            setattr(user, "password", pwd_hash)

        if hasattr(user, "role") and not getattr(user, "role", None):
            setattr(user, "role", ROLE)
        if hasattr(user, "active"):
            setattr(user, "active", True)

        db.session.commit()
        print(f"[ok] user id={user.id} email={user.email}")

if __name__ == "__main__":
    main()
