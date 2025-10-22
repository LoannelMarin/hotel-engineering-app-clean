# backend/routes/inncom.py
from __future__ import annotations
from flask import Blueprint, request, jsonify, Response, stream_with_context
from backend.extensions import db
from backend.models.inncom_temp import InncomTemp
from sqlalchemy import desc
from datetime import datetime
import json, time

inncom_bp = Blueprint("inncom", __name__, url_prefix="/api/inncom")

# ============================================================
# 🩺 Health check
# ============================================================
@inncom_bp.get("/_health")
def inncom_health():
    return jsonify({"ok": True, "service": "inncom"}), 200


# ============================================================
# 🌡️ Ingesta de temperatura / HVAC desde proxy
# ============================================================
@inncom_bp.post("/temp")
def receive_inncom_temp():
    """
    Recibe datos de temperatura, setpoint, delta y HVAC:
    {
      "room": "204",
      "room_temp": 71.5,
      "set_temp": 68,
      "delta": 3.5,
      "hvac": "LEM OFF + HVAC ON",
      "mode": "Cool"
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "empty body"}), 400

    try:
        # ✅ Prioriza 'room', pero acepta 'room_number'
        room_raw = data.get("room") or data.get("room_number")

        # 🔒 Validar campo de habitación
        if not room_raw or str(room_raw).strip().lower() in ("none", "null", ""):
            return jsonify({"error": "invalid or missing room_number"}), 400

        room_number = str(room_raw).strip()
        now = datetime.utcnow()

        # Buscar o crear registro existente
        row = InncomTemp.query.filter_by(room_number=room_number).first()
        if not row:
            row = InncomTemp(room_number=room_number, created_at=now)
            db.session.add(row)

        # Actualizar valores
        row.room_temp = data.get("room_temp")
        row.set_temp = data.get("set_temp")
        row.delta = data.get("delta")
        row.hvac = data.get("hvac")
        row.mode = data.get("mode")
        row.updated_at = now

        db.session.commit()

        # 🔁 Notificar actualización en vivo
        global last_refresh
        last_refresh = now
        print(f"✅ Room {room_number} updated at {now}")

        return jsonify({"success": True, "room": room_number}), 200

    except Exception as e:
        db.session.rollback()
        print("⚠️ Error en /temp:", e)
        return jsonify({"error": str(e)}), 400


# ============================================================
# 🔁 Stream SSE con soporte CORS completo (actualización en vivo)
# ============================================================
last_refresh = None

@inncom_bp.get("/stream")
def inncom_stream():
    @stream_with_context
    def event_stream():
        global last_refresh
        last_sent = None
        heartbeat = 0
        yield f"data: {json.dumps({'type': 'hello', 'time': datetime.utcnow().isoformat()})}\n\n"
        while True:
            try:
                if last_refresh and last_refresh != last_sent:
                    last_sent = last_refresh
                    payload = {"type": "refresh", "ts": last_refresh.isoformat()}
                    yield f"data: {json.dumps(payload)}\n\n"

                heartbeat += 1
                if heartbeat >= 25:
                    yield f"data: {json.dumps({'type': 'ping'})}\n\n"
                    heartbeat = 0

                time.sleep(1)
            except GeneratorExit:
                print("🔌 SSE client disconnected")
                break
            except Exception as e:
                print("⚠️ SSE error:", e)
                time.sleep(2)

    headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "Transfer-Encoding": "chunked",
        "X-Accel-Buffering": "no",
        "Access-Control-Allow-Origin": "*",  # ✅ Libre para React
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }

    return Response(event_stream(), headers=headers)


# ============================================================
# 🌡️ Estado actual completo (todas las habitaciones)
# ============================================================
@inncom_bp.get("/current_full")
def inncom_current_full():
    """Devuelve todos los registros actuales de InncomTemp"""
    rows = InncomTemp.query.order_by(InncomTemp.room_number.asc()).all()
    items = {
        r.room_number: r.to_dict()
        for r in rows
        if r.room_number and str(r.room_number).lower() != "none"
    }
    return jsonify({"count": len(items), "items": items}), 200


# ============================================================
# 📝 Actualiza el nombre visible (display_name)
# ============================================================
@inncom_bp.post("/update_name")
def update_display_name():
    """
    Actualiza el nombre visible (display_name) de una habitación o área común.
    Body JSON:
    {
      "room_number": "13",
      "display_name": "Tactic 7"
    }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "missing body"}), 400

    room_number = str(data.get("room_number", "")).strip()
    new_name = str(data.get("display_name", "")).strip()

    if not room_number:
        return jsonify({"error": "missing room_number"}), 400

    try:
        row = InncomTemp.query.filter_by(room_number=room_number).first()
        if not row:
            return jsonify({"error": f"room {room_number} not found"}), 404

        row.display_name = new_name or None
        row.updated_at = datetime.utcnow()
        db.session.commit()

        print(f"✏️ Room {room_number} renamed to '{new_name}'")

        # 🔁 Emite refresh para frontend
        global last_refresh
        last_refresh = datetime.utcnow()

        return jsonify({"success": True, "room": room_number, "display_name": new_name}), 200

    except Exception as e:
        db.session.rollback()
        print("⚠️ Error en /update_name:", e)
        return jsonify({"error": str(e)}), 500


# ============================================================
# 📈 Histórico de temperatura por habitación
# ============================================================
@inncom_bp.get("/history/<string:room_number>")
def inncom_room_history(room_number: str):
    """Devuelve los últimos 20 registros históricos de temperatura y setpoint"""
    try:
        rows = (
            db.session.query(InncomTemp)
            .filter_by(room_number=room_number)
            .order_by(desc(InncomTemp.updated_at))
            .limit(20)
            .all()
        )

        if not rows:
            return jsonify([]), 200

        result = [
            {
                "time": r.updated_at.strftime("%H:%M:%S"),
                "room_temp": r.room_temp,
                "set_temp": r.set_temp,
            }
            for r in reversed(rows)
        ]
        return jsonify(result), 200

    except Exception as e:
        print("⚠️ Error en /history:", e)
        return jsonify({"error": str(e)}), 500


# ============================================================
# 📊 Resumen por piso (basado en número de habitación)
# ============================================================
@inncom_bp.get("/overview")
def inncom_overview():
    rows = InncomTemp.query.all()
    summary = {}

    for row in rows:
        if not row.room_number:
            continue
        floor = row.room_number[0] if row.room_number[0].isdigit() else "X"
        summary.setdefault(floor, {"count": 0, "avg_temp": 0.0})
        summary[floor]["count"] += 1
        summary[floor]["avg_temp"] += row.room_temp or 0

    for f in summary:
        if summary[f]["count"] > 0:
            summary[f]["avg_temp"] = round(summary[f]["avg_temp"] / summary[f]["count"], 1)

    return jsonify(summary), 200
