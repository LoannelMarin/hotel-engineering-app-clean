# backend/models/inspection.py
from __future__ import annotations
from typing import Any, Dict
from sqlalchemy.sql import func

from backend.extensions import db


class Inspection(db.Model):
    __tablename__ = "inspection"

    id = db.Column(db.Integer, primary_key=True)

    # Alcance: "floors" | "area" | "type"
    scope_type = db.Column(db.String(20), nullable=False)

    # Para "area" o "type" guardamos el valor; para "floors" usamos la lista JSON
    scope_value = db.Column(db.String(120), nullable=True)

    # Lista de pisos seleccionados cuando scope_type == "floors"
    floors = db.Column(db.JSON, nullable=True, default=list)

    # Estado y progreso
    status = db.Column(db.String(20), nullable=False, default="in_progress")  # in_progress | completed | paused
    progress = db.Column(db.Integer, nullable=False, default=0)

    # Actor que inició / metadatos
    started_by_name = db.Column(db.String(120), nullable=True)

    # ✅ PostgreSQL-compatible timestamps
    inspection_date = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "scope_type": self.scope_type,
            "scope_value": self.scope_value,
            "floors": self.floors or [],
            "status": self.status,
            "progress": self.progress,
            "started_by_name": self.started_by_name,
            "inspection_date": self.inspection_date.isoformat() if self.inspection_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
