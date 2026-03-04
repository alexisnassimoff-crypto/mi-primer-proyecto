from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func

from app.database import get_db
from app.models.cliente import Cliente
from app.models.factura import Factura, ItemFactura, EstadoFactura
from app.schemas import FacturaCrear, FacturaResp

router = APIRouter(prefix="/api/facturas", tags=["facturas"])


def _generar_numero(db: Session) -> str:
    hoy = datetime.now()
    prefijo = hoy.strftime("F-%Y%m-")
    ultima = (
        db.query(Factura)
        .filter(Factura.numero.like(f"{prefijo}%"))
        .order_by(Factura.id.desc())
        .first()
    )
    if ultima:
        ultimo_num = int(ultima.numero.split("-")[-1])
        nuevo_num = ultimo_num + 1
    else:
        nuevo_num = 1
    return f"{prefijo}{nuevo_num:04d}"


@router.get("/", response_model=list[FacturaResp])
def listar_facturas(
    estado: EstadoFactura | None = None, db: Session = Depends(get_db)
):
    query = db.query(Factura)
    if estado:
        query = query.filter(Factura.estado == estado)
    return query.order_by(Factura.fecha_emision.desc()).all()


@router.get("/{factura_id}", response_model=FacturaResp)
def obtener_factura(factura_id: int, db: Session = Depends(get_db)):
    factura = db.get(Factura, factura_id)
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return factura


@router.post("/", response_model=FacturaResp, status_code=201)
def crear_factura(data: FacturaCrear, db: Session = Depends(get_db)):
    cliente = db.get(Cliente, data.cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    factura = Factura(
        numero=_generar_numero(db),
        cliente_id=data.cliente_id,
        impuesto_porcentaje=data.impuesto_porcentaje,
        notas=data.notas,
        fecha_vencimiento=data.fecha_vencimiento,
    )

    for item_data in data.items:
        item = ItemFactura(
            producto_id=item_data.producto_id,
            descripcion=item_data.descripcion,
            cantidad=item_data.cantidad,
            precio_unitario=item_data.precio_unitario,
            subtotal=item_data.cantidad * item_data.precio_unitario,
        )
        factura.items.append(item)

    factura.recalcular_totales()
    db.add(factura)
    db.commit()
    db.refresh(factura)
    return factura


@router.patch("/{factura_id}/estado")
def cambiar_estado(
    factura_id: int, estado: EstadoFactura, db: Session = Depends(get_db)
):
    factura = db.get(Factura, factura_id)
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    factura.estado = estado
    db.commit()
    return {"mensaje": f"Factura actualizada a {estado.value}"}


@router.delete("/{factura_id}", status_code=204)
def eliminar_factura(factura_id: int, db: Session = Depends(get_db)):
    factura = db.get(Factura, factura_id)
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    if factura.estado == EstadoFactura.PAGADA:
        raise HTTPException(
            status_code=400, detail="No se puede eliminar una factura pagada"
        )
    db.delete(factura)
    db.commit()
