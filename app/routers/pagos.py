from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.factura import Factura, EstadoFactura
from app.models.pago import Pago, EstadoPago
from app.schemas import PagoCrear, PagoResp

router = APIRouter(prefix="/api/pagos", tags=["pagos"])


@router.get("/", response_model=list[PagoResp])
def listar_pagos(factura_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Pago)
    if factura_id:
        query = query.filter(Pago.factura_id == factura_id)
    return query.order_by(Pago.fecha.desc()).all()


@router.post("/", response_model=PagoResp, status_code=201)
def registrar_pago(data: PagoCrear, db: Session = Depends(get_db)):
    factura = db.get(Factura, data.factura_id)
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    pago = Pago(
        factura_id=data.factura_id,
        monto=data.monto,
        metodo=data.metodo,
        estado=EstadoPago.APROBADO,
        referencia_externa=data.referencia_externa,
        notas=data.notas,
    )
    db.add(pago)

    total_pagado = sum(
        p.monto for p in factura.pagos if p.estado == EstadoPago.APROBADO
    ) + data.monto

    if total_pagado >= factura.total:
        factura.estado = EstadoFactura.PAGADA

    db.commit()
    db.refresh(pago)
    return pago
