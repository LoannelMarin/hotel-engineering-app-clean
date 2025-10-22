# -*- coding: utf-8 -*-
from sqlalchemy.sql import func
from backend.extensions import db


class TaskActivity(db.Model):
    __tablename__ = "task_activity"

    id = db.Column(db.Integer, primary_key=True)

    # ✅ Foreign key con borrado en cascada (PostgreSQL)
    task_id = db.Column(
        db.Integer,
        db.ForeignKey("task.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )

    # Qué pasó
    action = db.Column(db.String(40), nullable=False)  # create, update, move, delete
    changes = db.Column(db.Text, default="")  # JSON string: {"field":{"old":...,"new":...}}

    # Quién lo hizo (estilo InventoryLog)
    user_id = db.Column(db.Integer, nullable=True)
    user_email = db.Column(db.String(120), nullable=True)
    user_name = db.Column(db.String(120), nullable=True)

    # Compatibilidad hacia atrás (mostrar directamente)
    actor = db.Column(db.String(120), default="")  # display fallback

    # ✅ PostgreSQL-compatible timestamp
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    def __repr__(self):
        return f"<TaskActivity id={self.id} task_id={self.task_id} action={self.action}>"

    def to_dict(self):
        return {
            "id": self.id,
            "task_id": self.task_id,
            "action": self.action,
            "changes": self.changes,
            "user_id": self.user_id,
            "user_email": self.user_email,
            "user_name": self.user_name,
            "actor": self.actor,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
