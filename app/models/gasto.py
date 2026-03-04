from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import String, Float, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CategoriaGasto(str, PyEnum):
    ALQUILER = "alquiler"
    SERVICIOS = "servicios"
    SUELDOS = "sueldos"
    MERCADERIA = "mercaderia"
    IMPUESTOS = "impuestos"
    MARKETING = "marketing"
    MANTENIMIENTO = "mantenimiento"
    TRANSPORTE = "transporte"
    OTROS = "otros"


class Gasto(Base):
    __tablename__ = "gastos"

    id: Mapped[int] = mapped_column(primary_key=True)
    descripcion: Mapped[str] = mapped_column(String(500))
    monto: Mapped[float] = mapped_column(Float)
    categoria: Mapped[CategoriaGasto] = mapped_column(Enum(CategoriaGasto))
    fecha: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    recurrente: Mapped[bool] = mapped_column(default=False)
    frecuencia_dias: Mapped[int | None] = mapped_column()
    proveedor: Mapped[str | None] = mapped_column(String(200))
    comprobante_nro: Mapped[str | None] = mapped_column(String(100))
    notas: Mapped[str | None] = mapped_column(String(1000))
    factura_vinculada_id: Mapped[int | None] = mapped_column(ForeignKey("facturas.id"))

    factura_vinculada: Mapped["Factura | None"] = relationship()

    def __repr__(self) -> str:
        return f"<Gasto {self.descripcion} ${self.monto}>"
