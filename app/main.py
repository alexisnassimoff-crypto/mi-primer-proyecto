from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.routers import clientes, productos, facturas, gastos, pagos
from app.routers import mercadopago, analytics, dashboard

# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Sistema de facturación para comercios con Mercado Pago y análisis inteligente",
    version="1.0.0",
)

# Static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# API routes
app.include_router(clientes.router)
app.include_router(productos.router)
app.include_router(facturas.router)
app.include_router(gastos.router)
app.include_router(pagos.router)
app.include_router(mercadopago.router)
app.include_router(analytics.router)

# Pages
app.include_router(dashboard.router)
