# backend/models/asset_status.py
from __future__ import annotations
from datetime import datetime
from typing import Any, Dict
from sqlalchemy.sql import func

from backend.extensions import db


class AssetStatus(db.Model):
    """
    Estado persistente por asset (independiente de cada inspección).
    Mantiene si un asset está ok / failed / ooo / na / open.
    """
    __tablename__ = "asset_status"

    asset_id = db.Column(db.Integer, primary_key=True)  # FK lógico a asset.id
    state = db.Column(db.String(16), nullable=False, default="open")  # open|ok|fail|ooo|na
    notes = db.Column(db.Text, nullable=True)

    last_inspection_id = db.Column(db.Integer, nullable=True)
    updated_by = db.Column(db.String(120), nullable=True)

    # ✅ Compatible con PostgreSQL y mantiene precisión temporal
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "asset_id": self.asset_id,
            "state": self.state,
            "notes": self.notes or "",
            "last_inspection_id": self.last_inspection_id,
            "updated_by": self.updated_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
