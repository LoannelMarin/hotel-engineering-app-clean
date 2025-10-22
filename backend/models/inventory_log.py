# -*- coding: utf-8 -*-
from __future__ import annotations
from sqlalchemy.sql import func

from backend.extensions import db


class InventoryLog(db.Model):
    __tablename__ = "inventory_log"

    id = db.Column(db.Integer, primary_key=True)

    # Ítem
    item_db_id = db.Column(db.Integer, nullable=False, index=True)
    item_code = db.Column(db.String(128), nullable=True, index=True)

    # Usuario
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True, index=True)
    user = db.relationship("User", lazy="joined")

    # Movimiento
    action = db.Column(db.String(20), nullable=False)  # in|out|set|create|update|delete
    delta = db.Column(db.Integer, nullable=True)
    prev_stock = db.Column(db.Integer, nullable=True)
    new_stock = db.Column(db.Integer, nullable=True)

    # Nota
    note = db.Column(db.Text, nullable=True)

    # Fecha
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True
    )

    def as_dict(self) -> dict:
        # name/email como fallback
        u = getattr(self, "user", None)
        user_name = None
        user_email = None
        if u is not None:
            user_name = getattr(u, "name", None) or getattr(u, "full_name", None)
            user_email = getattr(u, "email", None)

        return {
            "id": self.id,
            "item_db_id": self.item_db_id,
            "item_code": self.item_code,
            "user_id": self.user_id,
            "user_name": user_name or user_email,
            "user_email": user_email,
            "action": self.action,
            "delta": self.delta,
            "prev_stock": self.prev_stock,
            "new_stock": self.new_stock,
            "note": self.note,
            "created_at": (self.created_at.isoformat() + "Z") if self.created_at else None,
        }
