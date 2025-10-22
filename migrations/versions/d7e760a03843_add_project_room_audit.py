from alembic import op
import sqlalchemy as sa

revision = "d7e760a03843"
down_revision = "3bb4d4d1eb5c"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        "project_room_audit",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("project_id", sa.Integer(), sa.ForeignKey("project.id", ondelete="CASCADE"), nullable=False),
        sa.Column("room_number", sa.String(length=10), nullable=False),
        sa.Column("prev_status", sa.String(length=40)),
        sa.Column("new_status", sa.String(length=40)),
        sa.Column("notes", sa.Text()),
        sa.Column("updated_by", sa.String(length=120)),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_project_room_audit_project_id", "project_room_audit", ["project_id"])
    op.create_index("ix_project_room_audit_room_number", "project_room_audit", ["room_number"])

def downgrade() -> None:
    op.drop_index("ix_project_room_audit_room_number", table_name="project_room_audit")
    op.drop_index("ix_project_room_audit_project_id", table_name="project_room_audit")
    op.drop_table("project_room_audit")
