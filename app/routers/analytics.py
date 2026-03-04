from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.analytics_service import (
    obtener_resumen_general,
    obtener_gastos_por_categoria,
    obtener_top_clientes,
    obtener_top_productos,
    generar_sugerencias,
    obtener_analisis_completo,
)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/resumen")
def resumen(dias: int = Query(30, ge=1, le=365), db: Session = Depends(get_db)):
    """Resumen general: ingresos, gastos, ganancia, facturas pendientes."""
    return obtener_resumen_general(db, dias)


@router.get("/gastos-por-categoria")
def gastos_categoria(dias: int = Query(30, ge=1, le=365), db: Session = Depends(get_db)):
    """Desglose de gastos por categoría."""
    return obtener_gastos_por_categoria(db, dias)


@router.get("/top-clientes")
def top_clientes(
    dias: int = Query(30, ge=1, le=365),
    limite: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """Ranking de clientes por facturación."""
    return obtener_top_clientes(db, dias, limite)


@router.get("/top-productos")
def top_productos(
    dias: int = Query(30, ge=1, le=365),
    limite: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """Ranking de productos más vendidos."""
    return obtener_top_productos(db, dias, limite)


@router.get("/sugerencias")
def sugerencias(dias: int = Query(30, ge=1, le=365), db: Session = Depends(get_db)):
    """Sugerencias inteligentes en lenguaje simple."""
    return generar_sugerencias(db, dias)


@router.get("/completo")
def analisis_completo(dias: int = Query(30, ge=1, le=365), db: Session = Depends(get_db)):
    """Análisis completo: resumen + gastos + rankings + sugerencias."""
    return obtener_analisis_completo(db, dias)
