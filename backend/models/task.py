# -*- coding: utf-8 -*-
from sqlalchemy.sql import func
from backend.extensions import db


class Task(db.Model):
    __tablename__ = "task"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(180), nullable=False)
    description = db.Column(db.Text, default="")
    status = db.Column(db.String(40), default="Not Started")  # Not Started, In Progress, Waiting for Approval, Complete
    priority = db.Column(db.String(20), default="Medium")     # Low/Medium/High
    assignee = db.Column(db.String(120))
    workstream = db.Column(db.String(80))                     # e.g., "Fire Inspection"
    image_url = db.Column(db.Text)                            # optional photo
    room = db.Column(db.String(10))
    floor = db.Column(db.String(10))

    due_date = db.Column(db.DateTime(timezone=True), nullable=True)

    # ✅ PostgreSQL-compatible timestamps con zona horaria
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

    # ✅ Relación con TaskActivity (borrado en cascada)
    activities = db.relationship(
        "TaskActivity",
        backref="task",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    def __repr__(self):
        return f"<Task id={self.id} title={self.title!r} status={self.status}>"

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "assignee": self.assignee,
            "workstream": self.workstream,
            "image_url": self.image_url,
            "room": self.room,
            "floor": self.floor,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
