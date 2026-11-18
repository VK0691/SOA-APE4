from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("ventas", sa.Column("intentos", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("ventas", sa.Column("proximo_reintento", sa.DateTime(), nullable=True))

def downgrade():
    op.drop_column("ventas", "proximo_reintento")
    op.drop_column("ventas", "intentos")

