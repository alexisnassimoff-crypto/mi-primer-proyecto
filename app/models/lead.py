from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import String, Float, DateTime, Integer, ForeignKey, Enum, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OrigenLead(str, PyEnum):
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    WHATSAPP = "whatsapp"
    MANUAL = "manual"


class EstadoLead(str, PyEnum):
    NUEVO = "nuevo"
    CONTACTADO = "contactado"
    INTERESADO = "interesado"
    NEGOCIANDO = "negociando"
    CONVERTIDO = "convertido"
    PERDIDO = "perdido"


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200))
    email: Mapped[str | None] = mapped_column(String(200))
    telefono: Mapped[str | None] = mapped_column(String(50))
    origen: Mapped[OrigenLead] = mapped_column(Enum(OrigenLead), default=OrigenLead.MANUAL)
    estado: Mapped[EstadoLead] = mapped_column(Enum(EstadoLead), default=EstadoLead.NUEVO)
    campana_id: Mapped[int | None] = mapped_column(ForeignKey("campanas_meta.id"))
    meta_lead_id: Mapped[str | None] = mapped_column(String(100))
    meta_ad_id: Mapped[str | None] = mapped_column(String(100))
    meta_form_id: Mapped[str | None] = mapped_column(String(100))
    datos_formulario: Mapped[str | None] = mapped_column(Text)
    valor_estimado: Mapped[float] = mapped_column(Float, default=0)
    notas: Mapped[str | None] = mapped_column(String(1000))
    cliente_id: Mapped[int | None] = mapped_column(ForeignKey("clientes.id"))
    creado_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    campana: Mapped["CampanaMeta | None"] = relationship(back_populates="leads")
    cliente: Mapped["Cliente | None"] = relationship()

    def __repr__(self) -> str:
        return f"<Lead {self.nombre} - {self.estado.value}>"


class CampanaMeta(Base):
    __tablename__ = "campanas_meta"

    id: Mapped[int] = mapped_column(primary_key=True)
    meta_campaign_id: Mapped[str | None] = mapped_column(String(100))
    nombre: Mapped[str] = mapped_column(String(300))
    plataforma: Mapped[str] = mapped_column(String(50), default="facebook")
    estado_meta: Mapped[str | None] = mapped_column(String(50))
    objetivo: Mapped[str | None] = mapped_column(String(100))
    presupuesto_diario: Mapped[float] = mapped_column(Float, default=0)
    gastado: Mapped[float] = mapped_column(Float, default=0)
    impresiones: Mapped[int] = mapped_column(Integer, default=0)
    clics: Mapped[int] = mapped_column(Integer, default=0)
    leads_count: Mapped[int] = mapped_column(Integer, default=0)
    conversiones: Mapped[int] = mapped_column(Integer, default=0)
    costo_por_lead: Mapped[float] = mapped_column(Float, default=0)
    costo_por_clic: Mapped[float] = mapped_column(Float, default=0)
    ctr: Mapped[float] = mapped_column(Float, default=0)
    fecha_inicio: Mapped[datetime | None] = mapped_column(DateTime)
    fecha_fin: Mapped[datetime | None] = mapped_column(DateTime)
    notas: Mapped[str | None] = mapped_column(String(1000))
    creado_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    sincronizado_en: Mapped[datetime | None] = mapped_column(DateTime)

    leads: Mapped[list["Lead"]] = relationship(back_populates="campana")

    @property
    def roi(self) -> float:
        if self.gastado == 0:
            return 0
        ingresos_leads = sum(l.valor_estimado for l in self.leads if l.estado == EstadoLead.CONVERTIDO)
        return ((ingresos_leads - self.gastado) / self.gastado) * 100

    @property
    def tasa_conversion(self) -> float:
        if self.leads_count == 0:
            return 0
        convertidos = sum(1 for l in self.leads if l.estado == EstadoLead.CONVERTIDO)
        return (convertidos / self.leads_count) * 100

    def __repr__(self) -> str:
        return f"<Campana {self.nombre}>"
