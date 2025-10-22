"""add updated_at to project

Revision ID: 1cd076d8eff9
Revises: 716d69955fa7
Create Date: 2025-08-31 16:55:00
"""
from alembic import op
import sqlalchemy as sa

revision = "1cd076d8eff9"
down_revision = "716d69955fa7"   # <- ahora depende de la de 'user'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column(
        "project",
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    # quitamos el default en DB; desde ahora lo gestiona el modelo / app
    op.alter_column("project", "updated_at", server_default=None)

def downgrade():
    op.drop_column("project", "updated_at")
