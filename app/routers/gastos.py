from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.gasto import Gasto, CategoriaGasto
from app.schemas import GastoCrear, GastoResp

router = APIRouter(prefix="/api/gastos", tags=["gastos"])


@router.get("/", response_model=list[GastoResp])
def listar_gastos(
    categoria: CategoriaGasto | None = None,
    desde: datetime | None = None,
    hasta: datetime | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Gasto)
    if categoria:
        query = query.filter(Gasto.categoria == categoria)
    if desde:
        query = query.filter(Gasto.fecha >= desde)
    if hasta:
        query = query.filter(Gasto.fecha <= hasta)
    return query.order_by(Gasto.fecha.desc()).all()


@router.get("/{gasto_id}", response_model=GastoResp)
def obtener_gasto(gasto_id: int, db: Session = Depends(get_db)):
    gasto = db.get(Gasto, gasto_id)
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return gasto


@router.post("/", response_model=GastoResp, status_code=201)
def crear_gasto(data: GastoCrear, db: Session = Depends(get_db)):
    gasto = Gasto(**data.model_dump())
    db.add(gasto)
    db.commit()
    db.refresh(gasto)
    return gasto


@router.put("/{gasto_id}", response_model=GastoResp)
def actualizar_gasto(
    gasto_id: int, data: GastoCrear, db: Session = Depends(get_db)
):
    gasto = db.get(Gasto, gasto_id)
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    for key, value in data.model_dump().items():
        setattr(gasto, key, value)
    db.commit()
    db.refresh(gasto)
    return gasto


@router.delete("/{gasto_id}", status_code=204)
def eliminar_gasto(gasto_id: int, db: Session = Depends(get_db)):
    gasto = db.get(Gasto, gasto_id)
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    db.delete(gasto)
    db.commit()
