# -*- coding: utf-8 -*-
"""
Migra la columna user_id de inventory_log a INTEGER (corrige casos guardados como texto).
Uso:
  python backend/scripts/migrate_inventory_log_user_id_to_int.py
"""
from __future__ import annotations
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "hotel_engineering.db"

DDL_NEW = """
CREATE TABLE IF NOT EXISTS inventory_log__new (
    id INTEGER PRIMARY KEY,
    item_db_id INTEGER,
    item_code TEXT,
    user_id INTEGER,
    action TEXT NOT NULL,
    delta INTEGER,
    prev_stock INTEGER,
    new_stock INTEGER,
    note TEXT,
    created_at TEXT
)
"""

COPY_SQL = """
INSERT INTO inventory_log__new
(id, item_db_id, item_code, user_id, action, delta, prev_stock, new_stock, note, created_at)
SELECT
    id,
    item_db_id,
    item_code,
    CASE
        WHEN user_id IS NULL OR user_id = '' THEN NULL
        WHEN typeof(user_id) = 'integer' THEN user_id
        ELSE CAST(user_id AS INTEGER)
    END AS user_id,
    action,
    delta,
    prev_stock,
    new_stock,
    note,
    created_at
FROM inventory_log
"""

INDEXES = [
    "CREATE INDEX IF NOT EXISTS ix_inventory_log_item_db_id ON inventory_log (item_db_id)",
    "CREATE INDEX IF NOT EXISTS ix_inventory_log_item_code   ON inventory_log (item_code)",
    "CREATE INDEX IF NOT EXISTS ix_inventory_log_user_id     ON inventory_log (user_id)",
    "CREATE INDEX IF NOT EXISTS ix_inventory_log_created_at  ON inventory_log (created_at)",
]

def get_user_id_decl(cur) -> str | None:
    cur.execute("PRAGMA table_info('inventory_log');")
    for _, name, coltype, *_ in cur.fetchall():
        if name == "user_id":
            return (coltype or "").upper()
    return None

def main():
    if not DB_PATH.exists():
        print(f"[x] No existe la BD SQLite en: {DB_PATH}")
        return

    con = sqlite3.connect(str(DB_PATH))
    try:
        cur = con.cursor()

        decl = get_user_id_decl(cur)
        if decl in ("INT", "INTEGER", "BIGINT"):
            print("[ok] user_id ya es INTEGER. No se requiere migración.")
            return

        print(f"[i] user_id actual = {decl or '(sin tipo)'} → migrando a INTEGER…")

        cur.execute("BEGIN;")
        cur.execute(DDL_NEW)
        cur.execute(COPY_SQL)
        # DROP y ALTER por separado
        cur.execute("DROP TABLE inventory_log;")
        cur.execute("ALTER TABLE inventory_log__new RENAME TO inventory_log;")
        for ddl in INDEXES:
            cur.execute(ddl)
        con.commit()

        new_decl = get_user_id_decl(cur)
        print(f"[ok] user_id ahora = {new_decl}")

        print("\n=== Últimos 10 logs (id, item_code, user_id, action, note, created_at) ===")
        for row in cur.execute(
            "SELECT id, item_code, user_id, action, note, created_at "
            "FROM inventory_log ORDER BY id DESC LIMIT 10;"
        ):
            print(row)

    except Exception as e:
        con.rollback()
        print(f"[x] Error en migración: {e}")
    finally:
        con.close()

if __name__ == "__main__":
    main()
