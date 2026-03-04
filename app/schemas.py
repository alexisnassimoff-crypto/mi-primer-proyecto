from datetime import datetime
from pydantic import BaseModel

from app.models.factura import EstadoFactura
from app.models.gasto import CategoriaGasto
from app.models.pago import MetodoPago, EstadoPago


# --- Clientes ---
class ClienteBase(BaseModel):
    nombre: str
    email: str | None = None
    telefono: str | None = None
    direccion: str | None = None
    cuit_cuil: str | None = None
    notas: str | None = None


class ClienteCrear(ClienteBase):
    pass


class ClienteResp(ClienteBase):
    id: int
    creado_en: datetime

    model_config = {"from_attributes": True}


# --- Productos ---
class ProductoBase(BaseModel):
    nombre: str
    descripcion: str | None = None
    precio_unitario: float
    costo: float = 0
    stock: int = 0
    categoria: str | None = None
    activo: bool = True


class ProductoCrear(ProductoBase):
    pass


class ProductoResp(ProductoBase):
    id: int
    margen: float
    creado_en: datetime

    model_config = {"from_attributes": True}


# --- Items de Factura ---
class ItemFacturaBase(BaseModel):
    producto_id: int | None = None
    descripcion: str
    cantidad: int = 1
    precio_unitario: float


class ItemFacturaResp(ItemFacturaBase):
    id: int
    subtotal: float

    model_config = {"from_attributes": True}


# --- Facturas ---
class FacturaCrear(BaseModel):
    cliente_id: int
    impuesto_porcentaje: float = 21.0
    notas: str | None = None
    fecha_vencimiento: datetime | None = None
    items: list[ItemFacturaBase]


class FacturaResp(BaseModel):
    id: int
    numero: str
    cliente_id: int
    estado: EstadoFactura
    subtotal: float
    impuesto_porcentaje: float
    impuesto_monto: float
    total: float
    notas: str | None
    fecha_emision: datetime
    fecha_vencimiento: datetime | None
    mercadopago_preference_id: str | None
    items: list[ItemFacturaResp]

    model_config = {"from_attributes": True}


# --- Gastos ---
class GastoBase(BaseModel):
    descripcion: str
    monto: float
    categoria: CategoriaGasto
    fecha: datetime | None = None
    recurrente: bool = False
    frecuencia_dias: int | None = None
    proveedor: str | None = None
    comprobante_nro: str | None = None
    notas: str | None = None
    factura_vinculada_id: int | None = None


class GastoCrear(GastoBase):
    pass


class GastoResp(GastoBase):
    id: int
    fecha: datetime

    model_config = {"from_attributes": True}


# --- Pagos ---
class PagoCrear(BaseModel):
    factura_id: int
    monto: float
    metodo: MetodoPago
    referencia_externa: str | None = None
    notas: str | None = None


class PagoResp(BaseModel):
    id: int
    factura_id: int
    monto: float
    metodo: MetodoPago
    estado: EstadoPago
    referencia_externa: str | None
    mercadopago_payment_id: str | None
    fecha: datetime
    notas: str | None

    model_config = {"from_attributes": True}
