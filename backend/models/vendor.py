# -*- coding: utf-8 -*-
from sqlalchemy.sql import func
from backend.extensions import db


class Vendor(db.Model):
    __tablename__ = "vendor"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(180), nullable=False)
    contact_name = db.Column(db.String(120))
    email = db.Column(db.String(180))
    phone = db.Column(db.String(50))
    categories = db.Column(db.String(255))  # "HVAC,Electrical"
    address = db.Column(db.String(255))
    notes = db.Column(db.Text, default="")
    rating = db.Column(db.Integer, default=0)
    status = db.Column(db.String(40), default="Active")
    logo_url = db.Column(db.String(255))     # <— NUEVO
    website = db.Column(db.String(255))      # <— NUEVO

    # ✅ PostgreSQL-compatible timestamp con zona horaria
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    def __repr__(self):
        return f"<Vendor id={self.id} name={self.name!r}>"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "contact_name": self.contact_name,
            "email": self.email,
            "phone": self.phone,
            "categories": self.categories,
            "address": self.address,
            "notes": self.notes,
            "rating": self.rating,
            "status": self.status,
            "logo_url": self.logo_url,
            "website": self.website,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
