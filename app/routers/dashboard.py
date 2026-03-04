from fastapi import APIRouter, Depends, Request
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.analytics_service import obtener_analisis_completo

router = APIRouter(tags=["dashboard"])
templates = Jinja2Templates(directory="app/templates")


@router.get("/")
def dashboard(request: Request, db: Session = Depends(get_db)):
    analisis = obtener_analisis_completo(db, dias=30)
    return templates.TemplateResponse(
        "dashboard.html",
        {"request": request, "analisis": analisis},
    )


@router.get("/facturas")
def pagina_facturas(request: Request):
    return templates.TemplateResponse("facturas.html", {"request": request})


@router.get("/clientes")
def pagina_clientes(request: Request):
    return templates.TemplateResponse("clientes.html", {"request": request})


@router.get("/productos")
def pagina_productos(request: Request):
    return templates.TemplateResponse("productos.html", {"request": request})


@router.get("/gastos")
def pagina_gastos(request: Request):
    return templates.TemplateResponse("gastos.html", {"request": request})


@router.get("/pagos/exito")
def pago_exito(request: Request):
    return templates.TemplateResponse("pago_resultado.html", {
        "request": request, "resultado": "exito"
    })


@router.get("/pagos/error")
def pago_error(request: Request):
    return templates.TemplateResponse("pago_resultado.html", {
        "request": request, "resultado": "error"
    })


@router.get("/pagos/pendiente")
def pago_pendiente(request: Request):
    return templates.TemplateResponse("pago_resultado.html", {
        "request": request, "resultado": "pendiente"
    })
