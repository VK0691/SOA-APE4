from datetime import datetime, timezone
from sqlalchemy import select, or_, func

from app.models import Venta

class VentaRepository:

    def __init__(self, db):
        self.db = db

    def por_clave(self, usuario, clave):
        return self.db.scalar(select(Venta).where(
            Venta.usuario == usuario, Venta.idempotency_key == clave))

    def bloquear(self, id):
        return self.db.scalar(select(Venta).where(Venta.id == id)
                              .with_for_update())

    def pendientes(self):
        ahora = datetime.now(timezone.utc).replace(tzinfo=None)
        condicion_reintento = or_(
            Venta.proximo_reintento.is_(None),
            Venta.proximo_reintento <= ahora
        )
        condicion_estados = or_(
            Venta.estado.in_(["PENDIENTE", "EN_REVISION"]),
            (Venta.estado == "COMPLETADA") & (Venta.notificacion != "ENVIADA")
        )
        return self.db.scalars(
            select(Venta.id)
            .where(condicion_estados, condicion_reintento)
            .order_by(Venta.id)
            .limit(100)
        ).all()

    def listar_propias(self, usuario: str, estado: str | None = None,
                       limit: int | None = None, offset: int | None = None):
        stmt = select(Venta).where(Venta.usuario == usuario)
        if estado:
            stmt = stmt.where(Venta.estado == estado)
        stmt = stmt.order_by(Venta.fecha.desc(), Venta.id.desc())
        if limit is not None:
            stmt = stmt.limit(limit)
        if offset is not None:
            stmt = stmt.offset(offset)
        return self.db.scalars(stmt).all()

    def contar_propias(self, usuario: str, estado: str | None = None) -> int:
        stmt = select(func.count(Venta.id)).where(Venta.usuario == usuario)
        if estado:
            stmt = stmt.where(Venta.estado == estado)
        return self.db.scalar(stmt) or 0
