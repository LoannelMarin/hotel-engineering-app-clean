# -*- coding: utf-8 -*-
from __future__ import annotations
from backend.extensions import db


class InventoryItem(db.Model):
    __tablename__ = "inventory"

    id = db.Column(db.Integer, primary_key=True)

    # Código visible / SKU
    item_id = db.Column(db.String(128), unique=False, nullable=True, index=True)

    # Datos básicos
    name = db.Column(db.String(255), nullable=True, index=True)
    category = db.Column(db.String(120), nullable=True, index=True)

    # Stock
    stock = db.Column(db.Integer, nullable=True, default=0)
    minimum = db.Column(db.Integer, nullable=True, default=0)

    # Ubicación y proveedor
    location = db.Column(db.String(255), nullable=True)

    # 👇 Nueva relación con Vendor (vendors.id)
    supplier_id = db.Column(db.Integer, db.ForeignKey("vendor.id"), nullable=True)
    supplier = db.relationship("Vendor", backref="items")

    # Otros campos
    part_no = db.Column(db.String(120), nullable=True)
    unit_cost = db.Column(db.Float, nullable=True)
    description = db.Column(db.Text, nullable=True)

    # Medios / links
    image = db.Column(db.String(512), nullable=True)         # guarda URL o path
    product_link = db.Column(db.String(1024), nullable=True)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<InventoryItem id={self.id} item_id={self.item_id} name={self.name}>"

    # ---------- SERIALIZADOR ----------
    def serialize(self) -> dict:
        """
        Devuelve el diccionario serializado, incluyendo el nombre del supplier si existe.
        """
        return {
            "id": self.id,
            "item_id": self.item_id,
            "name": self.name,
            "category": self.category,
            "stock": self.stock,
            "minimum": self.minimum,
            "location": self.location,
            "supplier_id": self.supplier_id,
            "supplier_name": getattr(self.supplier, "name", None),  # ✅ nombre real del vendor
            "part_no": self.part_no,
            "unit_cost": self.unit_cost,
            "description": self.description,
            "image": self.image,
            "product_link": self.product_link,
            "image_url": self.image,
        }
