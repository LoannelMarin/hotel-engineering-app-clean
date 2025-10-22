# -*- coding: utf-8 -*-
from sqlalchemy.sql import func
from backend.extensions import db


class TaskComment(db.Model):
    __tablename__ = "task_comment"

    id = db.Column(db.Integer, primary_key=True)

    # Tarea a la que pertenece el comentario
    task_id = db.Column(
        db.Integer,
        db.ForeignKey("task.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Contenido del comentario
    body = db.Column(db.Text, nullable=False)

    # Metadatos opcionales del autor
    user_id = db.Column(db.Integer, nullable=True)
    author_name = db.Column(db.String(120), nullable=True)

    # ✅ PostgreSQL-compatible timestamp con zona horaria
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    def __repr__(self):
        return f"<TaskComment id={self.id} task_id={self.task_id}>"

    def to_dict(self):
        return {
            "id": self.id,
            "task_id": self.task_id,
            "body": self.body,
            "user_id": self.user_id,
            "author_name": self.author_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
