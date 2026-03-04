from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import String, Float, DateTime, Integer, ForeignKey, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EstadoFactura(str, PyEnum):
    PENDIENTE = "pendiente"
    PAGADA = "pagada"
    VENCIDA = "vencida"
    CANCELADA = "cancelada"


class Factura(Base):
    __tablename__ = "facturas"

    id: Mapped[int] = mapped_column(primary_key=True)
    numero: Mapped[str] = mapped_column(String(50), unique=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id"))
    estado: Mapped[EstadoFactura] = mapped_column(
        Enum(EstadoFactura), default=EstadoFactura.PENDIENTE
    )
    subtotal: Mapped[float] = mapped_column(Float, default=0)
    impuesto_porcentaje: Mapped[float] = mapped_column(Float, default=21.0)
    impuesto_monto: Mapped[float] = mapped_column(Float, default=0)
    total: Mapped[float] = mapped_column(Float, default=0)
    notas: Mapped[str | None] = mapped_column(String(1000))
    fecha_emision: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    fecha_vencimiento: Mapped[datetime | None] = mapped_column(DateTime)
    mercadopago_preference_id: Mapped[str | None] = mapped_column(String(200))
    mercadopago_payment_id: Mapped[str | None] = mapped_column(String(200))

    cliente: Mapped["Cliente"] = relationship(back_populates="facturas")
    items: Mapped[list["ItemFactura"]] = relationship(
        back_populates="factura", cascade="all, delete-orphan"
    )
    pagos: Mapped[list["Pago"]] = relationship(back_populates="factura")

    def recalcular_totales(self):
        self.subtotal = sum(item.subtotal for item in self.items)
        self.impuesto_monto = self.subtotal * (self.impuesto_porcentaje / 100)
        self.total = self.subtotal + self.impuesto_monto

    def __repr__(self) -> str:
        return f"<Factura {self.numero} - ${self.total}>"


class ItemFactura(Base):
    __tablename__ = "items_factura"

    id: Mapped[int] = mapped_column(primary_key=True)
    factura_id: Mapped[int] = mapped_column(ForeignKey("facturas.id"))
    producto_id: Mapped[int | None] = mapped_column(ForeignKey("productos.id"))
    descripcion: Mapped[str] = mapped_column(String(500))
    cantidad: Mapped[int] = mapped_column(Integer, default=1)
    precio_unitario: Mapped[float] = mapped_column(Float)
    subtotal: Mapped[float] = mapped_column(Float)

    factura: Mapped["Factura"] = relationship(back_populates="items")

    def calcular_subtotal(self):
        self.subtotal = self.cantidad * self.precio_unitario
