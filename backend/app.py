# backend/app.py
# -*- coding: utf-8 -*-
import os
import sys
from importlib import import_module

# 🟢 Carga las variables del archivo .env (antes de importar Config)
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

from flask import Flask, jsonify, request, make_response, send_from_directory
from flask_cors import CORS
CURRENT_DIR = os.path.dirname(__file__)
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

try:
    from backend.config import Config
    from backend.extensions import db, migrate, jwt
except ModuleNotFoundError:
    from config import Config          # type: ignore
    from extensions import db, migrate, jwt  # type: ignore


# ==========================================================
# Dynamic import helpers
# ==========================================================
def _try_import(candidates):
    last_exc = None
    for dotted in candidates:
        try:
            return import_module(dotted)
        except ModuleNotFoundError as e:
            last_exc = e
            continue
    if last_exc:
        raise last_exc


def _import_models():
    model_modules = [
        "asset",
        "manual",
        "inventory",
        "invoice",
        "project_room_status",
        "project",
        "quote",
        "task",
        "task_comment",
        "user",
        "vendor",
        "document",
        "inspection",
        "sop",  # ✅ include SOP models
    ]
    for mod in model_modules:
        candidates = [
            f"backend.models.{mod}",
            f"backend.{mod}",
            f"models.{mod}",
            f"{mod}",
        ]
        try:
            _try_import(candidates)
            print(f"[models] loaded: {mod}")
        except ModuleNotFoundError:
            print(f"[models] skip: {mod}")


# ==========================================================
# Blueprint registration (con prefijo /api automático)
# ==========================================================
def _register_blueprints(app: Flask):
    routes = [
        ("auth", "bp"),
        ("assets", "bp"),
        ("inventory", "bp"),
        ("invoices", "bp"),
        ("projects", "bp"),
        ("quotes", "bp"),
        ("tasks", "bp"),
        ("task_comments", "bp"),
        ("vendors", "bp"),
        ("users", "bp"),
        ("uploads", "bp"),
        ("documents", "bp"),
        ("inspections", "bp"),
        ("manuals", "bp"),
        ("sops", "bp"),  # ✅ Added line to register SOP blueprint
    ]

    for module_name, attr in routes:
        candidates = [
            f"backend.routes.{module_name}",
            f"backend.{module_name}",
            f"routes.{module_name}",
            f"{module_name}",
        ]
        try:
            mod = _try_import(candidates)
            bp = getattr(mod, attr)

            # 👇 Fuerza prefijo /api para TODOS los blueprints
            prefix = bp.url_prefix or ""
            if not prefix.startswith("/api/"):
                bp.url_prefix = f"/api{prefix}"

            app.register_blueprint(bp)
            print(f"[routes] registered: {module_name} → {bp.url_prefix}")

        except ModuleNotFoundError as e:
            print(f"[routes] not found: {module_name} ({e})")
        except AttributeError as e:
            print(f"[routes] missing '{attr}' in {module_name} ({e})")

    # 👇 Explicit registration for INNCOM integration
    try:
        mod = _try_import([
            "backend.routes.inncom",
            "backend.inncom",
            "routes.inncom",
            "inncom",
        ])
        inncom_bp = getattr(mod, "inncom_bp")
        if not inncom_bp.url_prefix.startswith("/api/"):
            inncom_bp.url_prefix = f"/api{inncom_bp.url_prefix or ''}"
        app.register_blueprint(inncom_bp)
        print("[routes] registered: inncom")
    except ModuleNotFoundError as e:
        print(f"[routes] not found: inncom ({e})")
    except AttributeError as e:
        print(f"[routes] missing 'inncom_bp' in inncom ({e})")


# ==========================================================
# Database setup
# ==========================================================
def _ensure_tables(app: Flask):
    uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
    with app.app_context():
        try:
            db.create_all()
            print(f"[db] ensured all tables created at: {uri}")
        except Exception as e:
            print(f"[db] error creating tables: {e}")


# ==========================================================
# Flask app factory
# ==========================================================
def create_app(config_object: type["Config"] | None = None) -> Flask:
    app = Flask(__name__, instance_relative_config=True)

    if config_object:
        app.config.from_object(config_object)
    else:
        app.config.from_object(Config)

    app.url_map.strict_slashes = False

    # 🟢 Unified uploads directory (project root)
    PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
    app.config.setdefault("UPLOADS_DIR", os.path.join(PROJECT_ROOT, "uploads"))
    app.config.setdefault("UPLOAD_FOLDER", app.config["UPLOADS_DIR"])

    app.config.setdefault("FRONTEND_ORIGIN", "http://localhost:5173")
    app.config.setdefault("MAX_CONTENT_LENGTH", 20 * 1024 * 1024)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    _import_models()

    allowed_origins = {"http://localhost:5173", "http://127.0.0.1:5173"}
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": list(allowed_origins),
                "supports_credentials": True,
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                "allow_headers": [
                    "Authorization",
                    "Content-Type",
                    "X-User-Id",
                    "X-Actor-Name",
                ],
                "expose_headers": ["Content-Type", "Content-Disposition"],
                "max_age": 86400,
            }
        },
    )

    # ======================================================
    # Handle CORS preflight requests manually
    # ======================================================
    @app.route("/api/<path:any_path>", methods=["OPTIONS"])
    def _cors_preflight(any_path: str):
        origin = request.headers.get("Origin", "")
        methods = request.headers.get(
            "Access-Control-Request-Method", "GET,POST,PUT,PATCH,DELETE,OPTIONS"
        )
        hdrs = request.headers.get("Access-Control-Request-Headers", "") or ""
        low = hdrs.lower()
        needed = []
        if "x-user-id" not in low:
            needed.append("X-User-Id")
        if "x-actor-name" not in low:
            needed.append("X-Actor-Name")
        if needed:
            hdrs = (hdrs + ("," if hdrs else "") + ",".join(needed))

        resp = make_response("", 204)
        if origin in allowed_origins:
            h = resp.headers
            h["Access-Control-Allow-Origin"] = origin
            h["Vary"] = "Origin"
            h["Access-Control-Allow-Credentials"] = "true"
            h["Access-Control-Allow-Methods"] = methods
            h["Access-Control-Allow-Headers"] = hdrs
            h["Access-Control-Max-Age"] = "86400"
        return resp

    _register_blueprints(app)
    _ensure_tables(app)

    # ======================================================
    # Test route
    # ======================================================
    @app.get("/api/test")
    def api_test():
        return jsonify({"msg": "API is working!"})

    # ======================================================
    # Serve uploaded files
    # ======================================================
    @app.route("/uploads/<path:filename>")
    def uploaded_files(filename: str):
        uploads_dir = app.config.get("UPLOADS_DIR")
        return send_from_directory(uploads_dir, filename)

    return app


# ==========================================================
# Run the app directly
# ==========================================================
if __name__ == "__main__":
    app = create_app(Config)
    app.run(host="0.0.0.0", port=5000)
