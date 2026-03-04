from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cliente import Cliente
from app.schemas import ClienteCrear, ClienteResp

router = APIRouter(prefix="/api/clientes", tags=["clientes"])


@router.get("/", response_model=list[ClienteResp])
def listar_clientes(db: Session = Depends(get_db)):
    return db.query(Cliente).order_by(Cliente.nombre).all()


@router.get("/{cliente_id}", response_model=ClienteResp)
def obtener_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.get(Cliente, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.post("/", response_model=ClienteResp, status_code=201)
def crear_cliente(data: ClienteCrear, db: Session = Depends(get_db)):
    cliente = Cliente(**data.model_dump())
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente


@router.put("/{cliente_id}", response_model=ClienteResp)
def actualizar_cliente(
    cliente_id: int, data: ClienteCrear, db: Session = Depends(get_db)
):
    cliente = db.get(Cliente, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    for key, value in data.model_dump().items():
        setattr(cliente, key, value)
    db.commit()
    db.refresh(cliente)
    return cliente


@router.delete("/{cliente_id}", status_code=204)
def eliminar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.get(Cliente, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    db.delete(cliente)
    db.commit()
