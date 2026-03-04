from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.producto import Producto
from app.schemas import ProductoCrear, ProductoResp

router = APIRouter(prefix="/api/productos", tags=["productos"])


@router.get("/", response_model=list[ProductoResp])
def listar_productos(activo: bool | None = None, db: Session = Depends(get_db)):
    query = db.query(Producto)
    if activo is not None:
        query = query.filter(Producto.activo == activo)
    return query.order_by(Producto.nombre).all()


@router.get("/{producto_id}", response_model=ProductoResp)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.get(Producto, producto_id)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


@router.post("/", response_model=ProductoResp, status_code=201)
def crear_producto(data: ProductoCrear, db: Session = Depends(get_db)):
    producto = Producto(**data.model_dump())
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return producto


@router.put("/{producto_id}", response_model=ProductoResp)
def actualizar_producto(
    producto_id: int, data: ProductoCrear, db: Session = Depends(get_db)
):
    producto = db.get(Producto, producto_id)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    for key, value in data.model_dump().items():
        setattr(producto, key, value)
    db.commit()
    db.refresh(producto)
    return producto


@router.delete("/{producto_id}", status_code=204)
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.get(Producto, producto_id)
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(producto)
    db.commit()
