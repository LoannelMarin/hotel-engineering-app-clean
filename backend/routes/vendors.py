from __future__ import annotations
from flask import Blueprint, request
from backend.extensions import db
from backend.models.vendor import Vendor

# 👇 Todas las rutas quedan bajo /api/vendors
bp = Blueprint("vendors", __name__, url_prefix="/api/vendors")


# ---------- helpers opcionales (compat con notas antiguas) ----------
def _derive_from_notes(notes: str) -> dict:
    """
    Intenta extraer 'website' y 'logo_url' de notes si vienen como:
      'Website: http://...'  /  'Logo: /uploads/...'
    Devuelve dict solo con claves encontradas.
    """
    out = {}
    if not notes:
        return out

    try:
        for raw in str(notes).splitlines():
            s = raw.strip()
            if not s:
                continue
            if s.lower().startswith("website:"):
                val = s.split(":", 1)[1].strip()
                if val:
                    out["website"] = val
            elif s.lower().startswith("logo:"):
                val = s.split(":", 1)[1].strip()
                if val:
                    out["logo_url"] = val
    except Exception:
        pass
    return out


def serialize(v: Vendor) -> dict:
    data = {
        "id": v.id,
        "name": v.name,
        "contact_name": v.contact_name,
        "email": v.email,
        "phone": v.phone,
        "categories": v.categories,
        "address": v.address,
        "notes": v.notes,
        "rating": v.rating,
        "status": v.status,
        "created_at": v.created_at.isoformat() if getattr(v, "created_at", None) else None,
        # 👇 nuevos campos
        "logo_url": getattr(v, "logo_url", None),
        "website": getattr(v, "website", None),
    }

    # Compat: si no hay logo/website en columnas nuevas, intenta leerlos de notes
    if not data.get("website") or not data.get("logo_url"):
        derived = _derive_from_notes(v.notes or "")
        data.setdefault("website", derived.get("website"))
        data.setdefault("logo_url", derived.get("logo_url"))

    return data


# ========================= RUTAS =========================

# GET /api/vendors
@bp.get("")
@bp.get("/")
def list_vendors():
    v = Vendor.query.order_by(Vendor.name.asc()).all()
    return {"items": [serialize(x) for x in v]}


# POST /api/vendors
@bp.post("")
@bp.post("/")
def create_vendor():
    """
    Crea un nuevo vendor.
    Soporta tanto JSON como multipart/form-data (para subir logo).
    """
    # Detectar si es multipart (FormData desde React)
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        data = request.form.to_dict()
        logo = request.files.get("logo")
        if logo:
            # ⚙️ Aquí podrías guardar el archivo en disco real:
            # path = Path("uploads") / logo.filename
            # logo.save(path)
            # data["logo_url"] = f"/uploads/{logo.filename}"
            data["logo_url"] = f"/uploads/{logo.filename}"
    else:
        data = request.get_json(silent=True) or {}

    # Compatibilidad con campos alternos del frontend
    name = data.get("company_name") or data.get("name")
    if not name:
        return {"error": "Missing company_name or name"}, 400
    data["name"] = name

    # Derivados opcionales desde notes
    if not data.get("website") or not data.get("logo_url"):
        derived = _derive_from_notes(data.get("notes", "") or "")
        data.setdefault("website", derived.get("website"))
        data.setdefault("logo_url", derived.get("logo_url"))

    allowed = [
        "name",
        "contact_name",
        "email",
        "phone",
        "categories",
        "address",
        "notes",
        "rating",
        "status",
        "logo_url",
        "website",
    ]
    v = Vendor(**{k: data.get(k) for k in allowed if k in data})
    db.session.add(v)
    db.session.commit()
    return serialize(v), 201


# PUT /api/vendors/<id>
@bp.put("/<int:id>")
def update_vendor(id: int):
    v = Vendor.query.get_or_404(id)

    # Detectar si el update viene como JSON o multipart
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        data = request.form.to_dict()
        logo = request.files.get("logo")
        if logo:
            data["logo_url"] = f"/uploads/{logo.filename}"
    else:
        data = request.get_json(silent=True) or {}

    # Compat: permite seguir escribiendo Website:/Logo: en notes si no pasaron campos directos
    if ("website" not in data or "logo_url" not in data) and "notes" in data:
        derived = _derive_from_notes(data.get("notes") or "")
        data.setdefault("website", derived.get("website"))
        data.setdefault("logo_url", derived.get("logo_url"))

    for k, val in data.items():
        if hasattr(v, k):
            setattr(v, k, val)

    db.session.commit()
    return serialize(v)


# DELETE /api/vendors/<id>
@bp.delete("/<int:id>")
def delete_vendor(id: int):
    v = Vendor.query.get_or_404(id)
    db.session.delete(v)
    db.session.commit()
    return {"ok": True}
