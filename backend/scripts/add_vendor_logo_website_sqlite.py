# guarda esto como backend/scripts/add_vendor_logo_website_sqlite.py y ejecútalo con:  python backend/scripts/add_vendor_logo_website_sqlite.py
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "hotel_engineering.db")
DB_PATH = os.path.abspath(DB_PATH)

def column_exists(cur, table, col):
    cur.execute(f"PRAGMA table_info({table});")
    return any(r[1] == col for r in cur.fetchall())

def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    if not column_exists(cur, "vendor", "logo_url"):
        cur.execute("ALTER TABLE vendor ADD COLUMN logo_url TEXT;")
        print("✔ Column 'logo_url' added.")

    if not column_exists(cur, "vendor", "website"):
        cur.execute("ALTER TABLE vendor ADD COLUMN website TEXT;")
        print("✔ Column 'website' added.")

    conn.commit()
    conn.close()
    print("Done.")

if __name__ == "__main__":
    main()
