# backend/seed_inspections.py
from datetime import datetime, timedelta
import random

from app import create_app
from backend.extensions import db
from backend.models.asset import Asset
from backend.models.inspection import Inspection

FLOORS = ["basement", "1", "2", "3", "4", "5", "6", "7", "8", "penthouse", "roof"]
AREAS = ["Lobby", "Gym", "Pool", "Boiler Room", "Electrical Room"]
STATUSES = ["good", "needs_attention", "needs_repair", "critical"]

app = create_app()

with app.app_context():
    # si no hay assets, crea algunos
    if not Asset.query.first():
        for n in range(1, 21):
            a = Asset(name=f"Asset {n}", type=None, location=None)
            db.session.add(a)
        db.session.commit()

    assets = Asset.query.all()
    now = datetime.utcnow()

    for _ in range(60):
        a = random.choice(assets)
        ins = Inspection(
            asset_id=a.id,
            status=random.choice(STATUSES),
            floor=random.choice(FLOORS),
            room_area=random.choice(AREAS),
            inspection_date=now - timedelta(days=random.randint(0, 45)),
            notes="Seeded",
        )
        db.session.add(ins)

    db.session.commit()
    print("Seeded inspections")
