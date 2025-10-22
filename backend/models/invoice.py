# -*- coding: utf-8 -*-
from __future__ import annotations
from sqlalchemy.sql import func
from backend.extensions import db


class Invoice(db.Model):
    __tablename__ = "invoice"

    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(120), unique=True, nullable=False)

    vendor_id = db.Column(db.Integer, db.ForeignKey("vendor.id"), nullable=False)
    vendor = db.relationship("Vendor", backref="invoices", lazy=True)

    amount = db.Column(db.Float, default=0.0)
    currency = db.Column(db.String(10), default="USD")

    # Fechas principales
    due_date = db.Column(db.DateTime(timezone=True), nullable=True)
    order_date = db.Column(db.DateTime(timezone=True), nullable=True)
    post_date = db.Column(db.DateTime(timezone=True), nullable=True)

    status = db.Column(db.String(40), default="Draft")
    linked_quote_id = db.Column(db.Integer, db.ForeignKey("quote.id"), nullable=True)
    po_number = db.Column(db.String(120))

    attachments = db.Column(db.Text, default="")
    notes = db.Column(db.Text, default="")

    # ✅ PostgreSQL-compatible timestamps
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    # ⬇️ NUEVO: guarda condiciones de pago (“30 Days Net” o “Due on receipt”)
    payment_terms = db.Column(db.String(64), nullable=True)
