# -*- coding: utf-8 -*-
import os
from pathlib import Path

# Directorio absoluto de /backend
BASE_DIR = Path(__file__).resolve().parent


def _bool(env_name: str, default: bool = False) -> bool:
    """Helper para leer booleanos desde variables de entorno."""
    v = os.getenv(env_name)
    if v is None:
        return default
    return v.strip().lower() not in ("0", "false", "no", "off")


class Config:
    """Configuración base para todos los entornos."""
    # --- Claves ---
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt")
    JWT_TOKEN_LOCATION = ["headers"]

    # --- Base de datos (solo PostgreSQL) ---
    SQLALCHEMY_DATABASE_URI = "postgresql+psycopg2://he_user:Aloft@localhost:5432/hotel_engineering"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_size": int(os.getenv("DB_POOL_SIZE", "5")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "10")),
        "pool_timeout": int(os.getenv("DB_POOL_TIMEOUT", "30")),
    }

    # --- Tablas ---
    # En dev puede crear tablas automáticamente; en prod usa migraciones (Alembic)
    CREATE_ALL_ON_START = _bool("CREATE_ALL_ON_START", default=True)

    # --- Archivos y límites ---
    UPLOAD_FOLDER = os.getenv(
        "UPLOAD_FOLDER",
        str((BASE_DIR.parent / "uploads").resolve())
    )
    MAX_CONTENT_LENGTH = int(
        os.getenv("MAX_CONTENT_LENGTH", str(20 * 1024 * 1024))
    )  # 20 MB


class DevelopmentConfig(Config):
    """Configuración para entorno local (usa PostgreSQL)."""
    DEBUG = True


class ProductionConfig(Config):
    """Configuración para entorno de producción (AWS/PostgreSQL)."""
    DEBUG = False
    CREATE_ALL_ON_START = _bool("CREATE_ALL_ON_START", default=False)
