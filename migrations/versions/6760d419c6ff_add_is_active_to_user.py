from alembic import op
import sqlalchemy as sa

revision = "6760d419c6ff"
down_revision = "d7e760a03843"   # <- encadenada detrás de la auditoría
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true"))
    )

def downgrade() -> None:
    op.drop_column("user", "is_active")
