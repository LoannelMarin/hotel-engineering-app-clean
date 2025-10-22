# -*- coding: utf-8 -*-
"""
Limpia campos de texto dañados en la tabla 'inventory' (InventoryItem):
- name, location, description

Uso:
  DRY RUN:  python backend/scripts/clean_inventory_text.py
  APLICAR:  python backend/scripts/clean_inventory_text.py --apply

Genera respaldo CSV en ./backup_inventory_before_clean_<timestamp>.csv cuando --apply.
Funciona aunque se ejecute desde la carpeta backend/scripts o desde la raíz del proyecto.
"""
from __future__ import annotations
import re
import sys
import csv
import json
from datetime import datetime
from pathlib import Path
import logging

# Configurar el logging
logging.basicConfig(level=logging.INFO, format='[%(name)s] %(message)s')
logger = logging.getLogger('clean_inventory')

# ---------------------------------------------------------------------
# Resolver sys.path para importar el paquete 'backend' desde cualquier cwd
# ---------------------------------------------------------------------
THIS_FILE = Path(__file__).resolve()
BACKEND_DIR = THIS_FILE.parents[1] 
PROJECT_ROOT = BACKEND_DIR.parent 

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ---------------------------------------------------------------------
# Imports de la app y modelos
# ---------------------------------------------------------------------
try:
    from backend.app import create_app
    from backend.config import Config
    from backend.extensions import db
    from backend.models.inventory import InventoryItem
except Exception as e:
    logger.error(f"[import-error] {e}")
    sys.exit(1)

# Campos a limpiar
FIELDS_TO_CLEAN = ["name", "location", "description"]

# Patrones para detectar JSON corrupto
# Este patrón es más específico para el caso que encontramos
JSON_FRAGMENT_RE = re.compile(
    r'("?\s*id\s*":\s*\d+\s*,?|"*\s*minimum\s*":\s*\d+\s*,?|"*\s*name\s*":.*)',
    flags=re.IGNORECASE | re.DOTALL
)

def sanitize_text(field: str, raw: str | None) -> tuple[str | None, bool]:
    """
    Intenta limpiar una cadena de texto de fragmentos JSON no deseados.
    """
    if raw is None:
        return None, False
    
    s = str(raw).strip()
    original = s
    
    # Intento 1: Eliminar fragmentos específicos del error visto
    # Esto es una limpieza muy agresiva, ideal para el caso específico
    s = JSON_FRAGMENT_RE.sub("", s).strip()
    
    if s == "":
        s = None
        
    return s, (s != original)


def main(apply: bool = False):
    """
    Función principal para ejecutar la limpieza de la base de datos.
    """
    app = create_app(Config)
    with app.app_context():
        q = InventoryItem.query
        total = q.count()
        logger.info(f"[clean] Inventario total: {total}")

        rows = q.all()
        changed_rows = []
        updates = 0
        
        # Lógica para crear un respaldo CSV si se aplica
        backup_path = None
        backup_file = None
        backup_writer = None
        if apply:
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = PROJECT_ROOT / f"backup_inventory_before_clean_{ts}.csv"
            try:
                backup_file = open(backup_path, "w", newline="", encoding="utf-8")
                backup_writer = csv.writer(backup_file)
                backup_writer.writerow(["id"] + FIELDS_TO_CLEAN)
                logger.info(f"[clean] Creando respaldo en: {backup_path}")
            except Exception as e:
                logger.error(f"No se pudo crear el archivo de respaldo: {e}")
                backup_writer = None

        for r in rows:
            row_changed = False
            before = {f: getattr(r, f) for f in FIELDS_TO_CLEAN}

            for f in FIELDS_TO_CLEAN:
                new_val, changed = sanitize_text(f, before[f])
                if changed:
                    setattr(r, f, new_val)
                    row_changed = True

            if row_changed:
                changed_rows.append(r.id)
                updates += 1
                if apply and backup_writer:
                    backup_writer.writerow([r.id] + [before[f] if before[f] is not None else "" for f in FIELDS_TO_CLEAN])

        if apply:
            if updates:
                try:
                    db.session.commit()
                    logger.info(f"[clean] ¡Se han limpiado {updates} registros con éxito!")
                except Exception as e:
                    db.session.rollback()
                    logger.error(f"[error] Falló la limpieza de la base de datos: {e}")
            else:
                logger.info("[clean] No se encontraron registros que necesiten limpieza. No se realizaron cambios.")
        else:
            logger.info(f"[dry-run] Registros que cambiarían: {updates}")
            if changed_rows:
                sample = ", ".join(map(str, changed_rows[:20]))
                if len(changed_rows) > 20:
                    sample += " ..."
                logger.info(f"[dry-run] Ejemplo IDs: {sample}")

        if backup_file:
            backup_file.close()

    logger.info("[clean] Script finalizado.")

if __name__ == "__main__":
    apply_flag = "--apply" in sys.argv
    main(apply=apply_flag)