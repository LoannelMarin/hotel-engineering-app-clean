import sqlite3
from pathlib import Path

db_path = Path(__file__).resolve().parent.parent / "hotel_engineering.db"
print(f"Usando base de datos: {db_path}")

conn = sqlite3.connect(db_path)
cur = conn.cursor()

print("\n=== Tablas ===")
for row in cur.execute("SELECT name FROM sqlite_master WHERE type='table';"):
    print(row[0])

print("\n=== Inventario (primeros 20) ===")
for row in cur.execute("SELECT id, item_id, name, location, description, stock, minimum FROM inventory LIMIT 20;"):
    print(row)

print("\n=== Logs (últimos 20) ===")
for row in cur.execute("SELECT id, item_code, user_id, action, note, created_at FROM inventory_log ORDER BY created_at DESC LIMIT 20;"):
    print(row)

conn.close()
