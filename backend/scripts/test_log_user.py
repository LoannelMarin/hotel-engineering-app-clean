# -*- coding: utf-8 -*-
"""
Prueba para verificar que inventory_log.user_id se llena.

Modos:
- JWT: --email --password  (usa /api/auth/login y /api/auth/me)
- Header: --x-user-id  (envía X-User-Id sin JWT)

Uso (JWT):
  python backend/scripts/test_log_user.py --email admin@example.com --password "Admin#2025" --item-id 1 --delta 1 --verbose

Uso (Header):
  python backend/scripts/test_log_user.py --x-user-id 1 --item-id 1 --delta 1
"""
from __future__ import annotations
import argparse
import json
import sqlite3
from pathlib import Path
import sys

import requests

# --- Resolver imports del paquete 'backend' sin depender del cwd ---
THIS_FILE = Path(__file__).resolve()
BACKEND_DIR = THIS_FILE.parents[1]
PROJECT_ROOT = BACKEND_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app import create_app
from backend.config import Config
from backend.extensions import db
from backend.models.inventory_log import InventoryLog

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--api-base", default="http://127.0.0.1:5000")
    p.add_argument("--email")
    p.add_argument("--password")
    p.add_argument("--x-user-id", type=int)
    p.add_argument("--item-id", type=int, required=True)
    p.add_argument("--delta", type=int, default=1)
    p.add_argument("--note", default="e2e test adjust")
    p.add_argument("--db", default=str(BACKEND_DIR / "hotel_engineering.db"))
    p.add_argument("--verbose", action="store_true")
    return p.parse_args()

def login_with_jwt(s: requests.Session, api_base: str, email: str, password: str, verbose: bool = False) -> int | None:
    url_login = f"{api_base}/api/auth/login"
    r = s.post(url_login, json={"email": email, "password": password})
    if verbose:
        print(f"[login] POST {url_login} -> {r.status_code}")
        try:
            print("[login][body]", r.text[:400])
        except Exception:
            pass
    if r.status_code != 200:
        return None

    try:
        data = r.json()
    except Exception:
        data = {}
    token = data.get("access_token")
    if not token:
        if verbose:
            print("[login] sin access_token en respuesta JSON")
        return None

    s.headers.update({"Authorization": f"Bearer {token}"})

    url_me = f"{api_base}/api/auth/me"
    r2 = s.get(url_me)
    if verbose:
        print(f"[me] GET {url_me} -> {r2.status_code}")
        try:
            print("[me][body]", r2.text[:400])
        except Exception:
            pass
    if r2.status_code != 200:
        return None
    try:
        return r2.json().get("id")
    except Exception:
        return None

def main():
    args = parse_args()
    api_base = args.api_base.rstrip("/")

    s = requests.Session()

    user_id = None
    if args.email and args.password:
        user_id = login_with_jwt(s, api_base, args.email, args.password, verbose=args.verbose)

    if user_id is None and args.x_user_id:
        s.headers.update({"X-User-Id": str(args.x_user_id)})
        user_id = args.x_user_id

    if user_id is None:
        print("[auth] fallo autenticación (JWT) y no se proporcionó --x-user-id.")
        return

    adj_url = f"{api_base}/api/inventory/{args.item_id}/adjust"
    payload = {"delta": args.delta, "note": args.note}
    r = s.post(adj_url, json=payload)
    print(f"[adjust] HTTP {r.status_code}")
    try:
        print("[adjust][json]", json.dumps(r.json(), ensure_ascii=False)[:300], "...")
    except Exception:
        print("[adjust] (sin JSON)")
    if r.status_code >= 400:
        return

    db_path = Path(args.db)
    if db_path.exists():
        con = sqlite3.connect(str(db_path))
        cur = con.cursor()
        print("\n=== Últimos 10 logs (SQLite) ===")
        for row in cur.execute(
            "SELECT id, item_code, user_id, action, note, created_at "
            "FROM inventory_log ORDER BY id DESC LIMIT 10;"
        ):
            print(row)
        con.close()
    else:
        # Si no hay SQLite, leemos por SQLAlchemy (por si estás en Postgres con la URI de entorno)
        app = create_app(Config)
        with app.app_context():
            print("\n=== Últimos 10 logs (SQLAlchemy) ===")
            for l in db.session.query(InventoryLog).order_by(InventoryLog.id.desc()).limit(10).all():
                print(l.id, l.item_code, l.user_id, l.action, l.note, l.created_at)

if __name__ == "__main__":
    main()
