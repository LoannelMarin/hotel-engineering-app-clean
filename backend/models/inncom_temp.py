# backend/models/inncom_temp.py
from backend.extensions import db
from sqlalchemy.sql import func


class InncomTemp(db.Model):
    __tablename__ = "inncom_temp"

    id = db.Column(db.Integer, primary_key=True)
    room_number = db.Column(db.String(10), index=True, nullable=False)
    display_name = db.Column(db.String(64))  # ✅ nombre visible y editable (ej: “Tactic 7”)
    room_temp = db.Column(db.Float)
    set_temp = db.Column(db.Float)
    delta = db.Column(db.Float)
    hvac = db.Column(db.String(64))
    mode = db.Column(db.String(32))
    status = db.Column(db.String(32))
    guest_name = db.Column(db.String(64))

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

    def to_dict(self):
        """Convierte el registro a un diccionario JSON seguro para API."""
        return {
            "id": self.id,
            "room_number": self.room_number,
            "display_name": self.display_name or self.room_number,  # ✅ usa display_name si existe
            "room_temp": self.room_temp,
            "set_temp": self.set_temp,
            "delta": self.delta,
            "hvac": self.hvac,
            "mode": self.mode,
            "status": self.status,
            "guest_name": self.guest_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<InncomTemp room={self.room_number} name={self.display_name} temp={self.room_temp} set={self.set_temp}>"
