# -*- coding: utf-8 -*-
"""
Lista usuarios de la BD que esté usando la app (según backend/config.py + env var SQLALCHEMY_DATABASE_URI).
Uso:
  python backend/scripts/show_users.py
"""
from __future__ import annotations
from pathlib import Path
import sys

# Resolver imports del paquete 'backend'
THIS = Path(__file__).resolve()
BACKEND_DIR = THIS.parents[1]
PROJECT_ROOT = BACKEND_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app import create_app
from backend.config import Config
from backend.extensions import db
from backend.models.user import User


def main():
    app = create_app(Config)
    with app.app_context():
        uri = app.config.get("SQLALCHEMY_DATABASE_URI")
        print(f"[DB] URI efectiva: {uri}")

        users = db.session.query(User).order_by(getattr(User, "id")).all()
        print(f"[users] total = {len(users)}")
        for u in users:
            print(u.id, getattr(u, "email", None), getattr(u, "name", None), getattr(u, "role", None))


if __name__ == "__main__":
    main()
