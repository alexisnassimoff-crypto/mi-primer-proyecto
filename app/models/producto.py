from datetime import datetime

from sqlalchemy import String, Float, DateTime, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Producto(Base):
    __tablename__ = "productos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200))
    descripcion: Mapped[str | None] = mapped_column(String(1000))
    precio_unitario: Mapped[float] = mapped_column(Float)
    costo: Mapped[float] = mapped_column(Float, default=0)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    categoria: Mapped[str | None] = mapped_column(String(100))
    activo: Mapped[bool] = mapped_column(default=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    @property
    def margen(self) -> float:
        if self.precio_unitario == 0:
            return 0
        return ((self.precio_unitario - self.costo) / self.precio_unitario) * 100

    def __repr__(self) -> str:
        return f"<Producto {self.nombre} ${self.precio_unitario}>"
