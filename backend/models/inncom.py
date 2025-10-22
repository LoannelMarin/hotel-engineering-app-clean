# backend/models/inncom.py
from __future__ import annotations
from sqlalchemy.sql import func
from backend.extensions import db


class InncomData(db.Model):
    __tablename__ = "inncom_data"

    id = db.Column(db.Integer, primary_key=True)
    room_number = db.Column(db.String(10), nullable=False)
    guest_name = db.Column(db.String(50))
    status = db.Column(db.String(20))  # OCC / VAC

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

    def to_dict(self):
        return {
            "id": self.id,
            "room_number": self.room_number,
            "guest_name": self.guest_name,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
