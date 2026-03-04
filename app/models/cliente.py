from datetime import datetime

from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200))
    email: Mapped[str | None] = mapped_column(String(200))
    telefono: Mapped[str | None] = mapped_column(String(50))
    direccion: Mapped[str | None] = mapped_column(String(500))
    cuit_cuil: Mapped[str | None] = mapped_column(String(13))
    notas: Mapped[str | None] = mapped_column(String(1000))
    creado_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    facturas: Mapped[list["Factura"]] = relationship(back_populates="cliente")

    def __repr__(self) -> str:
        return f"<Cliente {self.nombre}>"
