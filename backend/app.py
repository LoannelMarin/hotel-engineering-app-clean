# -*- coding: utf-8 -*-
import os
import sys
from importlib import import_module
from flask import Flask, jsonify, request, make_response, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# ==========================================================
# í ½í PATH FIXER: Asegura que Python vea /hotel-engineering-app/
# ==========================================================
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

# ==========================================================
# ´§í ½í Carga .env y Config / Extensions
# ==========================================================
load_dotenv(os.path.join(CURRENT_DIR, ".env"))
try:
    from backend.config import Config
    from backend.extensions import db, migrate, jwt
except ModuleNotFoundError:
    from config import Config
    from extensions import db, migrate, jwt

# ==========================================================
# ´§í ½í Import din´§mico tolerante
# ==========================================================
def safe_import(*candidates):
    for name in candidates:
        try:
            return import_module(name)
        except ModuleNotFoundError:
            continue
    return None

# ==========================================================
# Ã¡í ½í Importa modelos
# ==========================================================
def import_models():
    modules = [
        "asset", "manual", "inventory", "invoice",
        "project_room_status", "project", "quote", "task",
        "task_comment", "user", "vendor", "document",
        "inspection", "sop"
    ]
    for m in modules:
        mod = safe_import(f"backend.models.{m}", f"models.{m}")
        print(f"[models] {'loaded' if mod else 'skip'}: {m}")

# ==========================================================
# ´§í ½í Registra rutas din´§micamente
# ==========================================================
def register_routes(app):
    routes = [
        "auth", "assets", "inventory", "invoices", "projects", "quotes",
        "tasks", "task_comments", "vendors", "users", "uploads",
        "documents", "inspections", "manuals", "sops"
    ]
    for r in routes:
        mod = safe_import(f"backend.routes.{r}", f"routes.{r}")
        if not mod:
            print(f"[routes] skip: {r}")
            continue
        bp = getattr(mod, "bp", None)
        if not bp:
            print(f"[routes] missing bp in {r}")
            continue
        if not bp.url_prefix or not bp.url_prefix.startswith("/api/"):
            bp.url_prefix = f"/api{bp.url_prefix or ''}"
        app.register_blueprint(bp)
        print(f"[routes] registered: {r} Ã¡â†’ {bp.url_prefix}")

    # INNCOM opcional
    mod = safe_import("backend.routes.inncom", "routes.inncom")
    if mod and hasattr(mod, "inncom_bp"):
        bp = getattr(mod, "inncom_bp")
        if not bp.url_prefix.startswith("/api/"):
            bp.url_prefix = f"/api{bp.url_prefix or ''}"
        app.register_blueprint(bp)
        print("[routes] registered: inncom")

# ==========================================================
# í ¾í App Factory
# ==========================================================
def create_app(config_class=Config):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    import_models()

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    @app.route("/api/health")
    def health():
        return jsonify({"message": "Hotel Engineering API running", "status": "ok"})

    register_routes(app)
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            print(f"[db] Error creating tables: {e}")

    @app.route("/uploads/<path:filename>")
    def serve_upload(filename):
        uploads_dir = app.config.get("UPLOADS_DIR", os.path.join(PROJECT_ROOT, "uploads"))
        return send_from_directory(uploads_dir, filename)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000)
