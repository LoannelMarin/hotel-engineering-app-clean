# -*- coding: utf-8 -*-
from __future__ import annotations
from typing import Any, Dict
from sqlalchemy.sql import func
from backend.extensions import db
from backend.models.asset import Asset  # ✅ necesario para mostrar el nombre del asset


class SOP(db.Model):
    __tablename__ = "sop"
    __table_args__ = (
        db.Index("ix_sop_title", "title"),
        {"extend_existing": True},
    )

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(180), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), default="Manual", nullable=False)
    asset_id = db.Column(db.Integer, db.ForeignKey("asset.id"), nullable=True)

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

    steps = db.relationship(
        "SOPStep",
        backref="sop",
        lazy="dynamic",
        cascade="all, delete-orphan",
        order_by="SOPStep.order",
    )

    def __repr__(self):
        return f"<SOP id={self.id} title={self.title!r}>"

    def to_dict(self, include_steps: bool = False) -> Dict[str, Any]:
        """Convierte SOP → dict incluyendo asset_name (si existe)."""
        asset_name = None
        if self.asset_id:
            asset = Asset.query.get(self.asset_id)
            if asset:
                asset_name = f"{asset.name}{' - ' + asset.area if asset.area else ''}"

        data = {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "asset_id": self.asset_id,
            "asset_name": asset_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

        if include_steps:
            data["steps"] = [s.to_dict() for s in self.steps.order_by(SOPStep.order)]
        return data


class SOPStep(db.Model):
    __tablename__ = "sop_step"
    __table_args__ = (
        db.Index("ix_sop_step_sop_order", "sop_id", "order"),
        {"extend_existing": True},
    )

    id = db.Column(db.Integer, primary_key=True)
    sop_id = db.Column(db.Integer, db.ForeignKey("sop.id", ondelete="CASCADE"), nullable=False)
    order = db.Column(db.Integer, nullable=False, default=1)
    text = db.Column(db.Text, nullable=True)
    # ✅ cambiado de String(255) → Text para permitir imágenes base64 largas
    image_url = db.Column(db.Text, nullable=True)

    # ✅ PostgreSQL-compatible timestamps
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
        return f"<SOPStep id={self.id} sop_id={self.sop_id} order={self.order}>"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "sop_id": self.sop_id,
            "order": self.order,
            "text": self.text,
            "image_url": self.image_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
