# -*- coding: utf-8 -*-
from sqlalchemy.sql import func
from backend.extensions import db


class Quote(db.Model):
    __tablename__ = "quote"

    id = db.Column(db.Integer, primary_key=True)
    quote_number = db.Column(db.String(120), unique=True, nullable=False)

    vendor_id = db.Column(db.Integer, db.ForeignKey("vendor.id"), nullable=False)
    vendor = db.relationship("Vendor", backref="quotes", lazy=True)

    scope_title = db.Column(db.String(180))
    scope_detail = db.Column(db.Text, default="")

    requested_at = db.Column(db.DateTime(timezone=True), nullable=True)
    received_at = db.Column(db.DateTime(timezone=True), nullable=True)

    amount = db.Column(db.Float, default=0.0)
    currency = db.Column(db.String(10), default="USD")
    status = db.Column(db.String(40), default="Requested")

    linked_task_id = db.Column(db.Integer, db.ForeignKey("task.id"), nullable=True)
    linked_project_id = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=True)

    attachments = db.Column(db.Text, default="")  # simple CSV of URLs

    # ✅ PostgreSQL-compatible timestamp
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )
