# backend/routes/tasks.py
from datetime import datetime, timezone
import json
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from backend.extensions import db
from backend.models.task import Task
from backend.models.task_activity import TaskActivity
from backend.models.user import User

bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")


# ------------------------- utils -------------------------
def _parse_dt(val):
    if not val:
        return None
    if isinstance(val, datetime):
        return val
    s = str(val).strip().replace("Z", "+00:00")
    for fmt in ("%Y-%m-%d", None):
        try:
            return datetime.fromisoformat(s) if fmt is None else datetime.strptime(s, fmt)
        except Exception:
            continue
    return None


def _iso(dt: datetime | None):
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def _ensure_sqlite_columns():
    try:
        with db.engine.begin() as conn:
            # task columns
            cols_task = {row[1] for row in conn.execute(text("PRAGMA table_info(task)"))}
            if "workstream" not in cols_task:
                conn.execute(text("ALTER TABLE task ADD COLUMN workstream VARCHAR(80)"))
            if "image_url" not in cols_task:
                conn.execute(text("ALTER TABLE task ADD COLUMN image_url TEXT"))

            # task_activity table + columns (idempotente)
            conn.execute(
                text(
                    """
                CREATE TABLE IF NOT EXISTS task_activity (
                    id INTEGER PRIMARY KEY,
                    task_id INTEGER NOT NULL,
                    action VARCHAR(40) NOT NULL,
                    changes TEXT,
                    user_id INTEGER,
                    user_email VARCHAR(120),
                    user_name VARCHAR(120),
                    actor VARCHAR(120),
                    created_at DATETIME,
                    FOREIGN KEY(task_id) REFERENCES task(id)
                )
                """
                )
            )

            cols_act = {row[1] for row in conn.execute(text("PRAGMA table_info(task_activity)"))}
            for col, ddl in [
                ("user_id", "ALTER TABLE task_activity ADD COLUMN user_id INTEGER"),
                ("user_email", "ALTER TABLE task_activity ADD COLUMN user_email VARCHAR(120)"),
                ("user_name", "ALTER TABLE task_activity ADD COLUMN user_name VARCHAR(120)"),
                ("actor", "ALTER TABLE task_activity ADD COLUMN actor VARCHAR(120)"),
            ]:
                if col not in cols_act:
                    conn.execute(text(ddl))
    except Exception:
        # silencioso para mantener compatibilidad
        pass


def _user_name_from_id(user_id):
    if user_id is None:
        return None
    try:
        uid = int(user_id)
    except Exception:
        return None
    u = User.query.get(uid)
    if not u:
        return None
    for key in ("name", "full_name", "display_name", "username", "email"):
        if getattr(u, key, None):
            return getattr(u, key)
    return f"User {uid}"


def _current_user_info():
    """
    Devuelve dict con {user_id, user_email, user_name, display} siguiendo
    la misma filosofía de los logs de inventario.
    Prioridad: Headers -> JSON body (actor_name) -> JWT -> fallback.
    """
    # 1) Headers explícitos (igual que InventoryLog)
    h = request.headers
    uid_h = h.get("X-User-Id") or h.get("X-Actor-Id")
    email_h = h.get("X-User-Email") or h.get("X-Actor-Email")
    name_h = h.get("X-User-Name") or h.get("X-Actor-Name") or h.get("X-Actor")

    # 2) Body opcional
    name_body = None
    try:
        if request.is_json:
            data = request.get_json(silent=True) or {}
            for k in ("actor_name", "actorName", "performed_by", "performedBy"):
                if data.get(k):
                    name_body = data.get(k)
                    break
    except Exception:
        name_body = None

    # 3) JWT
    jwt_id = jwt_email = jwt_name = None
    try:
        ident = get_jwt_identity()
        if isinstance(ident, dict):
            for k in ("id", "user_id", "uid", "sub"):
                if ident.get(k) is not None:
                    jwt_id = ident.get(k)
                    break
            for k in ("email", "user_email"):
                if ident.get(k):
                    jwt_email = ident.get(k)
                    break
            for k in ("name", "full_name", "display_name", "username", "preferred_username"):
                if ident.get(k):
                    jwt_name = ident.get(k)
                    break
        elif isinstance(ident, (int,)) or (isinstance(ident, str) and ident.isdigit()):
            jwt_id = ident
        elif isinstance(ident, str):
            # si parece un email o nombre, lo tomamos como tal
            if "@" in ident:
                jwt_email = ident
            else:
                jwt_name = ident
    except Exception:
        pass

    # Compose
    user_id = uid_h or jwt_id
    user_email = email_h or jwt_email
    user_name = (name_h or name_body or jwt_name) or _user_name_from_id(user_id)

    display = user_name or user_email or (f"User {user_id}" if user_id else "anonymous")
    return {
        "user_id": int(user_id) if (isinstance(user_id, str) and user_id.isdigit()) else user_id,
        "user_email": user_email,
        "user_name": user_name,
        "display": display,
    }


def _actor_display_from_activity(a: TaskActivity):
    return a.user_name or a.user_email or a.actor or "anonymous"


def _log(task_id, action, changes=None):
    try:
        who = _current_user_info()
        entry = TaskActivity(
            task_id=task_id,
            action=action,
            changes=json.dumps(changes or {}, ensure_ascii=False),
            user_id=who["user_id"],
            user_email=who["user_email"],
            user_name=who["user_name"],
            actor=who["display"],
            created_at=datetime.now(timezone.utc),
        )
        db.session.add(entry)
        db.session.commit()
    except Exception:
        db.session.rollback()


def _last_activity(task_id):
    a = (
        TaskActivity.query.filter_by(task_id=task_id)
        .order_by(TaskActivity.created_at.desc())
        .first()
    )
    if not a:
        return None, None
    return _actor_display_from_activity(a), a.created_at


def serialize(t: Task):
    actor, when = _last_activity(t.id)
    return {
        "id": t.id,
        "title": t.title,
        "description": t.description,
        "status": t.status,
        "priority": t.priority,
        "assignee": t.assignee,
        "workstream": getattr(t, "workstream", None),
        "image_url": getattr(t, "image_url", None),
        "room": t.room,
        "floor": t.floor,
        "due_date": _iso(t.due_date),
        "created_at": _iso(t.created_at),
        "updated_at": _iso(t.updated_at),
        "last_actor": actor,
        "last_activity_at": _iso(when),
    }


def serialize_activity(a: TaskActivity):
    return {
        "id": a.id,
        "task_id": a.task_id,
        "action": a.action,
        "actor": _actor_display_from_activity(a),
        "changes": json.loads(a.changes or "{}"),
        "created_at": _iso(a.created_at),
        "user_id": a.user_id,
        "user_email": a.user_email,
        "user_name": a.user_name,
    }


# ------------------------- routes -------------------------
@bp.route("/", methods=["GET"], strict_slashes=False)
@jwt_required(optional=True)
def list_tasks():
    _ensure_sqlite_columns()
    q = Task.query.order_by(Task.created_at.desc()).all()
    return {"items": [serialize(t) for t in q]}


@bp.route("/", methods=["POST"], strict_slashes=False)
@jwt_required(optional=True)
def create_task():
    _ensure_sqlite_columns()
    data = request.get_json() or {}
    t = Task(
        title=(data.get("title") or "").strip(),
        description=data.get("description", ""),
        status=data.get("status", "Not Started"),
        priority=data.get("priority", "Medium"),
        assignee=data.get("assignee"),
        workstream=data.get("workstream"),
        image_url=data.get("image_url"),
        room=data.get("room"),
        floor=data.get("floor"),
    )
    t.due_date = _parse_dt(data.get("due_date"))
    db.session.add(t)
    db.session.commit()
    _log(
        t.id,
        "create",
        {k: getattr(t, k) for k in ["title", "status", "priority", "assignee", "workstream", "room", "floor", "due_date"]},
    )
    return serialize(t), 201


@bp.route("/<int:id>", methods=["GET"], strict_slashes=False)
@jwt_required(optional=True)
def get_one(id: int):
    _ensure_sqlite_columns()
    t = Task.query.get_or_404(id)
    return serialize(t)


@bp.route("/<int:id>", methods=["PUT", "PATCH"], strict_slashes=False)
@jwt_required(optional=True)
def update(id: int):
    _ensure_sqlite_columns()
    t = Task.query.get_or_404(id)
    data = request.get_json() or {}

    changed = {}
    for k in [
        "title",
        "description",
        "status",
        "priority",
        "assignee",
        "room",
        "floor",
        "workstream",
        "image_url",
        "due_date",
    ]:
        if k in data:
            old = getattr(t, k)
            new = _parse_dt(data[k]) if k == "due_date" else data[k]
            if old != new:
                changed[k] = {
                    "old": _iso(old) if isinstance(old, datetime) else old,
                    "new": _iso(new) if isinstance(new, datetime) else new,
                }
                setattr(t, k, new)

    db.session.commit()
    if changed:
        action = "move" if "status" in changed and len(changed) == 1 else "update"
        _log(t.id, action, changed)
    return serialize(t)


@bp.route("/<int:id>", methods=["DELETE"], strict_slashes=False)
@jwt_required(optional=True)
def delete(id: int):
    _ensure_sqlite_columns()
    t = Task.query.get_or_404(id)
    snapshot = serialize(t)
    db.session.delete(t)
    db.session.commit()
    _log(id, "delete", snapshot)
    return {"ok": True}


@bp.route("/<int:id>/activity", methods=["GET"], strict_slashes=False)
@jwt_required(optional=True)
def activity(id: int):
    _ensure_sqlite_columns()
    q = (
        TaskActivity.query.filter_by(task_id=id)
        .order_by(TaskActivity.created_at.desc())
        .all()
    )
    return {"items": [serialize_activity(a) for a in q]}
