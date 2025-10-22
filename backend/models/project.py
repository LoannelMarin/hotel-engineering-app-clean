# -*- coding: utf-8 -*-
from sqlalchemy.sql import func
from backend.extensions import db


class Project(db.Model):
    __tablename__ = "project"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False, unique=True)
    color_legend = db.Column(db.JSON, default=dict)
    status = db.Column(db.String(40), default="In Progress", nullable=False)

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

    completed_at = db.Column(db.DateTime(timezone=True), nullable=True)
    completed_by = db.Column(db.String(120), nullable=True)

    room_statuses = db.relationship(
        "ProjectRoomStatus",
        backref="project",
        lazy=True,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    room_audits = db.relationship(
        "ProjectRoomAudit",
        backref="project",
        lazy=True,
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="desc(ProjectRoomAudit.id)"
    )

    def to_dict(self):
        """Serializa el proyecto con leyenda normalizada"""
        def normalize_legend(legend):
            if not isinstance(legend, dict):
                return {}
            out = {}
            for label, color in legend.items():
                # Si ya está en formato {"label": ..., "color": ...}
                if isinstance(color, dict):
                    lbl = color.get("label") or label
                    clr = color.get("color")
                    key = lbl.strip().lower().replace(" ", "_")
                    out[key] = {"label": lbl, "color": clr}
                else:
                    key = label.strip().lower().replace(" ", "_")
                    out[key] = {"label": label, "color": color}
            return out

        return {
            "id": self.id,
            "name": self.name,
            "color_legend": normalize_legend(self.color_legend or {}),
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "completed_by": self.completed_by,
        }


class ProjectRoomStatus(db.Model):
    __tablename__ = "project_room_status"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(
        db.Integer,
        db.ForeignKey("project.id", ondelete="CASCADE"),
        nullable=False,
    )
    room_number = db.Column(db.String(10), nullable=False, index=True)
    status = db.Column(db.String(40), default="N/A")
    notes = db.Column(db.Text, default="")
    updated_by = db.Column(db.String(120))

    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )

    __table_args__ = (
        db.UniqueConstraint("project_id", "room_number", name="uq_project_room"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "room_number": self.room_number,
            "status": self.status,
            "notes": self.notes or "",
            "updated_by": self.updated_by,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ProjectRoomAudit(db.Model):
    __tablename__ = "project_room_audit"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(
        db.Integer,
        db.ForeignKey("project.id", ondelete="CASCADE"),
        nullable=False,
    )
    room_number = db.Column(db.String(10), nullable=False, index=True)
    prev_status = db.Column(db.String(40))
    new_status = db.Column(db.String(40))
    notes = db.Column(db.Text, default="")
    updated_by = db.Column(db.String(120))

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "room_number": self.room_number,
            "prev_status": self.prev_status,
            "new_status": self.new_status,
            "notes": self.notes or "",
            "updated_by": self.updated_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
