"""add updated_at to user

Revision ID: 716d69955fa7
Revises: 6760d419c6ff
Create Date: 2025-08-31 16:12:56.653640
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "716d69955fa7"
down_revision = "6760d419c6ff"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column("updated_at", sa.DateTime(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("user", "updated_at")
