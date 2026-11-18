from sqlalchemy import select, or_
from app.models import Comprador

class CompradorRepository:
    def __init__(self, db):
        self.db = db

    def por_id(self, id: int) -> Comprador | None:
        return self.db.get(Comprador, id)

    def listar_por_usuario(self, usuario: str, buscar: str | None = None) -> list[Comprador]:
        stmt = select(Comprador).where(Comprador.usuario == usuario)
        if buscar and buscar.strip():
            patron = f"%{buscar.strip()}%"
            stmt = stmt.where(
                or_(
                    Comprador.nombre.ilike(patron),
                    Comprador.documento.ilike(patron)
                )
            )
        stmt = stmt.order_by(Comprador.id.asc())
        return list(self.db.scalars(stmt).all())

