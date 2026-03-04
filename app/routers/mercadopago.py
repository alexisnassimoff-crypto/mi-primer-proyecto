from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.factura import Factura, EstadoFactura
from app.models.pago import Pago, MetodoPago, EstadoPago
from app.services.mercadopago_service import crear_preferencia_pago, consultar_pago

router = APIRouter(prefix="/api/mercadopago", tags=["mercadopago"])


@router.post("/crear-pago/{factura_id}")
def crear_link_pago(factura_id: int, db: Session = Depends(get_db)):
    """Genera un link de pago de Mercado Pago para una factura."""
    factura = db.get(Factura, factura_id)
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    if factura.estado == EstadoFactura.PAGADA:
        raise HTTPException(status_code=400, detail="La factura ya está pagada")

    resultado = crear_preferencia_pago(factura)
    factura.mercadopago_preference_id = resultado["preference_id"]
    db.commit()

    return {
        "mensaje": "Link de pago creado",
        "link_pago": resultado["init_point"],
        "link_sandbox": resultado["sandbox_init_point"],
        "preference_id": resultado["preference_id"],
    }


@router.post("/webhook")
async def webhook_mercadopago(request: Request, db: Session = Depends(get_db)):
    """Recibe notificaciones de pago de Mercado Pago."""
    body = await request.json()

    if body.get("type") != "payment":
        return {"status": "ignored"}

    payment_id = str(body["data"]["id"])
    payment_info = consultar_pago(payment_id)

    external_ref = payment_info.get("external_reference")
    if not external_ref:
        return {"status": "no_reference"}

    factura = db.get(Factura, int(external_ref))
    if not factura:
        return {"status": "factura_not_found"}

    estado_mp = payment_info.get("status")
    estado_map = {
        "approved": EstadoPago.APROBADO,
        "pending": EstadoPago.PENDIENTE,
        "rejected": EstadoPago.RECHAZADO,
        "refunded": EstadoPago.DEVUELTO,
    }

    pago = Pago(
        factura_id=factura.id,
        monto=payment_info.get("transaction_amount", 0),
        metodo=MetodoPago.MERCADOPAGO,
        estado=estado_map.get(estado_mp, EstadoPago.PENDIENTE),
        mercadopago_payment_id=payment_id,
        referencia_externa=payment_id,
    )
    db.add(pago)

    if estado_mp == "approved":
        factura.estado = EstadoFactura.PAGADA
        factura.mercadopago_payment_id = payment_id

    db.commit()
    return {"status": "ok"}
