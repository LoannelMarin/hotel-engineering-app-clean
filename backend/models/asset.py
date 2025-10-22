# backend/models/asset.py
from __future__ import annotations
from datetime import date
from typing import Any, Dict
from sqlalchemy.sql import func

from backend.extensions import db


class Asset(db.Model):
    __tablename__ = "asset"

    # Índices + kwargs de la tabla (el dict SIEMPRE al final)
    __table_args__ = (
        db.Index("ix_asset_type", "type"),
        db.Index("ix_asset_area_floor", "area", "floor"),
        {"extend_existing": True},
    )

    id = db.Column(db.Integer, primary_key=True)

    # --------- General data ---------
    name = db.Column(db.String(180), nullable=False)
    type = db.Column(db.String(40), nullable=True)            # e.g., "HVAC", "IT", "Plumbing"
    location = db.Column(db.String(180), nullable=True)

    # Normalized location
    floor = db.Column(db.String(20), nullable=True, index=True)   # "2", "3", "Roof"
    area  = db.Column(db.String(120), nullable=True, index=True)  # "Lobby", "Kitchen"

    serial_no = db.Column(db.String(120), nullable=True)
    model_no = db.Column(db.String(120), nullable=True)
    manufacturer = db.Column(db.String(120), nullable=True)

    install_date = db.Column(db.Date, nullable=True)
    warranty_expiration = db.Column(db.Date, nullable=True)

    pm_frequency = db.Column(db.String(40), nullable=True)
    last_service_at = db.Column(db.Date, nullable=True)
    next_service_at = db.Column(db.Date, nullable=True)

    # Documents / media
    documents = db.Column(db.Text, default="", nullable=True)
    photos = db.Column(db.Text, default="", nullable=True)

    # NEW: general notes (all types)
    notes = db.Column(db.Text, nullable=True)

    # --------- IT base ---------
    equipment = db.Column(db.String(80), nullable=True)
    equipment_name = db.Column(db.String(180), nullable=True)

    ip_address = db.Column(db.String(64), nullable=True)
    mac_address = db.Column(db.String(32), nullable=True)

    # --------- IT extra ---------
    hostname = db.Column(db.String(253), nullable=True)
    vlan_id = db.Column(db.Integer, nullable=True)

    os_version = db.Column(db.String(120), nullable=True)
    firmware_version = db.Column(db.String(120), nullable=True)

    ports_total = db.Column(db.Integer, nullable=True)
    ports_used = db.Column(db.Integer, nullable=True)
    port_notes = db.Column(db.Text, nullable=True)

    # --------- Timestamps ---------
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

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<Asset id={self.id} name={self.name!r} type={self.type!r} "
            f"floor={self.floor!r} area={self.area!r}>"
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "location": self.location,
            "floor": self.floor,
            "area": self.area,
            "serial_no": self.serial_no,
            "model_no": self.model_no,
            "manufacturer": self.manufacturer,
            "install_date": self.install_date.isoformat() if isinstance(self.install_date, date) else None,
            "warranty_expiration": self.warranty_expiration.isoformat() if isinstance(self.warranty_expiration, date) else None,
            "pm_frequency": self.pm_frequency,
            "last_service_at": self.last_service_at.isoformat() if isinstance(self.last_service_at, date) else None,
            "next_service_at": self.next_service_at.isoformat() if isinstance(self.next_service_at, date) else None,
            "documents": self.documents or "",
            "photos": self.photos or "",
            "notes": self.notes or "",
            "equipment": self.equipment,
            "equipment_name": self.equipment_name,
            "ip_address": self.ip_address,
            "mac_address": self.mac_address,
            "hostname": self.hostname,
            "vlan_id": self.vlan_id,
            "os_version": self.os_version,
            "firmware_version": self.firmware_version,
            "ports_total": self.ports_total,
            "ports_used": self.ports_used,
            "port_notes": self.port_notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
