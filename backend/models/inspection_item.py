# backend/models/inspection_item.py
from __future__ import annotations
from typing import Any, Dict
from sqlalchemy.sql import func

from backend.extensions import db


class InspectionItem(db.Model):
    __tablename__ = "inspection_item"

    id = db.Column(db.Integer, primary_key=True)

    inspection_id = db.Column(
        db.Integer,
        db.ForeignKey("inspection.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    asset_id = db.Column(db.Integer, nullable=True)

    # REQUERIDO POR LA BD (evita NOT NULL): usamos 'name' como canon
    name = db.Column(db.String(255), nullable=False)

    # Opcional/legacy para UI
    label = db.Column(db.String(200), nullable=True)

    # Snapshot de metadatos del asset en el momento de la inspección
    floor = db.Column(db.String(20), nullable=True, index=True)
    area = db.Column(db.String(120), nullable=True, index=True)
    type = db.Column(db.String(40), nullable=True, index=True)

    status = db.Column(db.String(10), default="open", nullable=False)  # open|ok|fail|na
    notes = db.Column(db.Text, nullable=True)
    photos = db.Column(db.JSON, default=list, nullable=True)  # lista de URLs

    updated_by = db.Column(db.String(120), nullable=True)

    # ✅ PostgreSQL-compatible timestamps
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        index=True
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "inspection_id": self.inspection_id,
            "asset_id": self.asset_id,
            "name": self.name,
            "label": self.label,
            "floor": self.floor,
            "area": self.area,
            "type": self.type,
            "status": self.status,
            "notes": self.notes or "",
            "photos": self.photos or [],
            "updated_by": self.updated_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
