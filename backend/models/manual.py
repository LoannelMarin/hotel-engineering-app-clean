# -*- coding: utf-8 -*-
from sqlalchemy.sql import func
from sqlalchemy.orm import validates
from backend.extensions import db


class Manual(db.Model):
    __tablename__ = "manuals"

    id = db.Column(db.Integer, primary_key=True)
    # title requerido
    title = db.Column(db.String(180), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(80), nullable=True)  # "Manual", "Procedimiento", "Video", etc.
    file_url = db.Column(db.String(255), nullable=True)  # URL externa o ruta pública local

    # Relación con Asset (opcional)
    asset_id = db.Column(db.Integer, db.ForeignKey("asset.id"), nullable=True)
    asset = db.relationship("Asset", backref="manuals")

    # ✅ Compatible con PostgreSQL: timestamps con zona horaria
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

    def __repr__(self):
        return f"<Manual id={self.id} title={self.title!r}>"

    @validates("title")
    def validate_title(self, key, value):
        if value is None:
            raise ValueError("title is required")
        value = value.strip()
        if not value:
            raise ValueError("title is required")
        return value

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "file_url": self.file_url,
            "asset_id": self.asset_id,
            "asset_name": self.asset.name if self.asset else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
