from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import String, Float, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MetodoPago(str, PyEnum):
    MERCADOPAGO = "mercadopago"
    EFECTIVO = "efectivo"
    TRANSFERENCIA = "transferencia"
    TARJETA_DEBITO = "tarjeta_debito"
    TARJETA_CREDITO = "tarjeta_credito"


class EstadoPago(str, PyEnum):
    PENDIENTE = "pendiente"
    APROBADO = "aprobado"
    RECHAZADO = "rechazado"
    DEVUELTO = "devuelto"


class Pago(Base):
    __tablename__ = "pagos"

    id: Mapped[int] = mapped_column(primary_key=True)
    factura_id: Mapped[int] = mapped_column(ForeignKey("facturas.id"))
    monto: Mapped[float] = mapped_column(Float)
    metodo: Mapped[MetodoPago] = mapped_column(Enum(MetodoPago))
    estado: Mapped[EstadoPago] = mapped_column(
        Enum(EstadoPago), default=EstadoPago.PENDIENTE
    )
    referencia_externa: Mapped[str | None] = mapped_column(String(200))
    mercadopago_payment_id: Mapped[str | None] = mapped_column(String(200))
    fecha: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    notas: Mapped[str | None] = mapped_column(String(500))

    factura: Mapped["Factura"] = relationship(back_populates="pagos")

    def __repr__(self) -> str:
        return f"<Pago ${self.monto} - {self.metodo.value}>"
