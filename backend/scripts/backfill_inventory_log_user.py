# -*- coding: utf-8 -*-
"""
Rellena user_id en inventory_log cuando está NULL.
- Asigna un user_id fijo (por defecto: 1) a todos los registros con user_id NULL.
- Funciona tanto con SQLite local (backend/hotel_engineering.db) como con la URI que tengas configurada en la app (Postgres, etc).

Uso:
  python backend/scripts/backfill_inventory_log_user.py
  python backend/scripts/backfill_inventory_log_user.py --user-id 1
  python backend/scripts/backfill_inventory_log_user.py --dry-run
"""
from __future__ import annotations
import argparse
from pathlib import Path
import sys

# resolver imports del paquete backend sin depender del cwd
THIS_FILE = Path(__file__).resolve()
BACKEND_DIR = THIS_FILE.parents[1]
PROJECT_ROOT = BACKEND_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app import create_app
from backend.config import Config
from backend.extensions import db
from backend.models.inventory_log import InventoryLog
from backend.models.user import User


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--user-id", type=int, default=1)
    p.add_argument("--dry-run", action="store_true")
    return p.parse_args()


def main():
    args = parse_args()
    app = create_app(Config)
    with app.app_context():
        # validar usuario destino
        u = db.session.query(User).get(args.user_id)
        if not u:
            print(f"[x] user_id {args.user_id} no existe")
            return

        q = db.session.query(InventoryLog).filter(InventoryLog.user_id.is_(None))
        total = q.count()
        print(f"[i] registros con user_id NULL: {total}")
        if total == 0:
            return

        if args.dry_run:
            sample = [l.id for l in q.order_by(InventoryLog.id.desc()).limit(20).all()]
            print(f"[dry-run] ejemplo ids a actualizar: {sample}")
            return

        updated = 0
        # actualizar en lotes para no cargar todo a memoria
        batch_size = 500
        offset = 0
        while True:
            batch = q.order_by(InventoryLog.id.asc()).limit(batch_size).offset(offset).all()
            if not batch:
                break
            for l in batch:
                l.user_id = args.user_id
                updated += 1
            db.session.commit()
            offset += batch_size
            print(f"[ok] actualizados: {updated}/{total}")

        print("[done]")


if __name__ == "__main__":
    main()
