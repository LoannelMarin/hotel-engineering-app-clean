# backend/routes/task_comments.py
from flask import Blueprint, jsonify, request
from backend.extensions import db
from backend.models.task import Task
from backend.models.task_comment import TaskComment

bp = Blueprint("task_comments", __name__, url_prefix="/api/tasks")


def serialize(c: TaskComment) -> dict:
    return {
        "id": c.id,
        "task_id": c.task_id,
        "body": c.body,
        "user_id": c.user_id,
        "author_name": c.author_name,
        "created_at": (c.created_at.isoformat() + "Z") if c.created_at else None,
    }


@bp.get("/<int:task_id>/comments")
def list_comments(task_id: int):
    # 404 si la tarea no existe
    Task.query.get_or_404(task_id)

    items = (
        TaskComment.query.filter_by(task_id=task_id)
        .order_by(TaskComment.id.asc())
        .all()
    )
    return {"items": [serialize(i) for i in items]}


@bp.post("/<int:task_id>/comments")
def create_comment(task_id: int):
    # 404 si la tarea no existe
    Task.query.get_or_404(task_id)

    data = request.get_json(silent=True) or {}
    body = (data.get("body") or "").strip()
    if not body:
        return jsonify({"error": "Body required"}), 400

    # Datos opcionales del autor (headers que ya envía el FE)
    raw_uid = request.headers.get("X-User-Id")
    try:
        user_id = int(raw_uid) if raw_uid and str(raw_uid).isdigit() else None
    except Exception:  # noqa: BLE001
        user_id = None

    author_name = request.headers.get("X-Actor-Name") or data.get("author_name")

    c = TaskComment(
        task_id=task_id,
        body=body,
        user_id=user_id,
        author_name=author_name,
    )
    db.session.add(c)
    db.session.commit()
    return serialize(c), 201


@bp.delete("/<int:task_id>/comments/<int:comment_id>")
def delete_comment(task_id: int, comment_id: int):
    # 404 si la tarea no existe
    Task.query.get_or_404(task_id)

    c = TaskComment.query.filter_by(id=comment_id, task_id=task_id).first_or_404()
    db.session.delete(c)
    db.session.commit()
    return {"ok": True}
