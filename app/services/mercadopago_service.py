import mercadopago
from fastapi import HTTPException

from app.config import settings


def _get_sdk():
    if not settings.MERCADOPAGO_ACCESS_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="Mercado Pago no está configurado. Agregá MERCADOPAGO_ACCESS_TOKEN en .env",
        )
    return mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)


def crear_preferencia_pago(factura) -> dict:
    """Crea una preferencia de pago en Mercado Pago para una factura."""
    sdk = _get_sdk()

    items = []
    for item in factura.items:
        items.append({
            "title": item.descripcion,
            "quantity": item.cantidad,
            "unit_price": item.precio_unitario,
            "currency_id": "ARS",
        })

    # Agregar IVA como item separado si hay impuesto
    if factura.impuesto_monto > 0:
        items.append({
            "title": f"IVA ({factura.impuesto_porcentaje}%)",
            "quantity": 1,
            "unit_price": round(factura.impuesto_monto, 2),
            "currency_id": "ARS",
        })

    preference_data = {
        "items": items,
        "external_reference": str(factura.id),
        "back_urls": {
            "success": f"{settings.APP_URL}/pagos/exito",
            "failure": f"{settings.APP_URL}/pagos/error",
            "pending": f"{settings.APP_URL}/pagos/pendiente",
        },
        "notification_url": f"{settings.APP_URL}/api/mercadopago/webhook",
        "auto_return": "approved",
    }

    result = sdk.preference().create(preference_data)
    response = result["response"]

    return {
        "preference_id": response["id"],
        "init_point": response["init_point"],
        "sandbox_init_point": response["sandbox_init_point"],
    }


def consultar_pago(payment_id: str) -> dict:
    """Consulta el estado de un pago en Mercado Pago."""
    sdk = _get_sdk()
    result = sdk.payment().get(payment_id)
    return result["response"]
