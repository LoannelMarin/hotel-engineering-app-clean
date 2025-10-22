# backend/routes/documents.py
from __future__ import annotations

from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.models.document import Document, isoformat_z

bp = Blueprint("documents", __name__, url_prefix="/api/documents")


def serialize(doc: Document) -> dict:
    return {
        "id": doc.id,
        "name": doc.name,
        "description": doc.description,
        "vendor_id": doc.vendor_id,
        "file_url": doc.file_url,
        # ¡Clave! Emitimos siempre UTC con 'Z'.
        # Si el datetime está naive, isoformat_z lo trata como UTC.
        "created_at": isoformat_z(doc.created_at),
    }


# GET /api/documents
@bp.get("")
@bp.get("/")
def list_documents():
    docs = (
        Document.query
        .order_by(Document.created_at.desc(), Document.id.desc())
        .all()
    )
    return jsonify({"items": [serialize(d) for d in docs]})


# POST /api/documents
@bp.post("")
@bp.post("/")
def create_document():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    file_url = (data.get("file_url") or "").strip()

    if not name or not file_url:
        return jsonify({"error": "Name and file_url are required"}), 400

    doc = Document(
        name=name,
        description=(data.get("description") or "").strip(),
        vendor_id=data.get("vendor_id"),
        file_url=file_url,
    )
    db.session.add(doc)
    db.session.commit()
    return jsonify(serialize(doc)), 201


# PUT /api/documents/<id>
@bp.put("/<int:id>")
def update_document(id: int):
    doc = Document.query.get_or_404(id)
    data = request.get_json(silent=True) or {}

    for k in ("name", "description", "vendor_id", "file_url"):
        if k in data:
            setattr(doc, k, data[k])

    db.session.commit()
    return jsonify(serialize(doc))


# DELETE /api/documents/<id>
@bp.delete("/<int:id>")
def delete_document(id: int):
    doc = Document.query.get_or_404(id)
    db.session.delete(doc)
    db.session.commit()
    return jsonify({"ok": True})
