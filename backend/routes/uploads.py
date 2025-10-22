# backend/routes/uploads.py
from __future__ import annotations
import os
import mimetypes
from uuid import uuid4
from pathlib import Path
from flask import Blueprint, current_app, jsonify, request, send_from_directory, abort, make_response
from werkzeug.utils import secure_filename

# ⚙️ Ya no usamos url_prefix aquí, se define en __init__.py
bp = Blueprint("uploads", __name__)

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".pdf"}
DEFAULT_MAX_SIZE = 20 * 1024 * 1024  # 20MB


def _uploads_path() -> str:
    """Devuelve la ruta absoluta al folder /uploads (fuera del backend)."""
    root = Path(__file__).resolve().parents[1].parent / "uploads"
    os.makedirs(root, exist_ok=True)
    return str(root)


UPLOADS_DIR = _uploads_path()


def _allow_ext(filename: str):
    ext = os.path.splitext(filename)[1].lower()
    return ext, ext in ALLOWED_EXTENSIONS


@bp.post("/uploads")
def upload_file():
    """Sube un archivo al folder /uploads y devuelve la URL pública /uploads/<filename>."""
    if "MAX_CONTENT_LENGTH" not in current_app.config:
        current_app.config["MAX_CONTENT_LENGTH"] = DEFAULT_MAX_SIZE

    file = (
        request.files.get("file")
        or request.files.get("image")
        or request.files.get("attachment")
    )
    if not file or not file.filename:
        return jsonify({"error": "No file provided"}), 400

    original = secure_filename(file.filename)
    ext, ok = _allow_ext(original)
    if not ok:
        return jsonify({"error": f"Invalid extension: {ext}"}), 400

    filename = f"{uuid4().hex}{ext}"
    save_path = os.path.join(UPLOADS_DIR, filename)
    file.save(save_path)

    public_url = f"/uploads/{filename}"
    return jsonify({
        "path": public_url,
        "url": public_url,
        "filename": filename,
        "size": os.path.getsize(save_path),
    }), 201


@bp.get("/uploads/<path:filename>")
def serve_upload(filename: str):
    """Sirve archivos desde la carpeta raíz /uploads."""
    safe = os.path.basename(filename)
    if ".." in safe or safe.startswith("/"):
        abort(400)

    full = os.path.join(UPLOADS_DIR, safe)
    if not os.path.isfile(full):
        print(f"⚠️ Archivo no encontrado: {full}")
        abort(404)

    mime, _ = mimetypes.guess_type(full)
    resp = make_response(send_from_directory(UPLOADS_DIR, safe, mimetype=mime))

    if mime == "application/pdf":
        resp.headers["Content-Type"] = "application/pdf"
        resp.headers["Content-Disposition"] = f'inline; filename="{safe}"'

    resp.headers.setdefault("Cache-Control", "public, max-age=3600")
    resp.headers["Access-Control-Allow-Origin"] = current_app.config.get("FRONTEND_ORIGIN", "*")
    return resp
