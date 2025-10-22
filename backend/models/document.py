# backend/models/document.py
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.sql import func

from backend.extensions import db


def isoformat_z(dt: Optional[datetime]) -> Optional[str]:
    """
    Return an ISO-8601 string in UTC with 'Z' suffix, or None.
    Accepts aware or naive datetimes; naive are assumed to be UTC.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


class Document(db.Model):
    __tablename__ = "document"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(180), nullable=False)
    description = db.Column(db.Text)
    vendor_id = db.Column(db.Integer, db.ForeignKey("vendor.id"), nullable=True)
    file_url = db.Column(db.String(255), nullable=False)

    # ✅ Compatible con PostgreSQL: timestamps con zona horaria y server_default manejado por el motor
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    # Relationships
    vendor = db.relationship("Vendor", backref="documents", lazy=True)

    # ---- Helpers / Serialization -------------------------------------------------

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "vendor_id": self.vendor_id,
            "file_url": self.file_url,
            # Emit ISO 8601 UTC with 'Z' so the frontend can reliably render local time
            "created_at": isoformat_z(self.created_at),
        }

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Document id={self.id} name={self.name!r}>"
