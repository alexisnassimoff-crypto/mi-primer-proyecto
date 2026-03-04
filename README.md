# FactuApp - Sistema de Facturacion para Comercios

Sistema de facturacion integral para comercios con integracion de Mercado Pago, gestion de gastos y analisis inteligente con sugerencias en lenguaje simple.

## Funcionalidades

- **Facturacion**: Crear, gestionar y cobrar facturas con numeracion automatica
- **Mercado Pago**: Generar links de pago y recibir notificaciones automaticas via webhooks
- **Clientes**: ABM completo de clientes con datos fiscales (CUIT/CUIL)
- **Productos**: Gestion de catalogo con precios, costos, margenes y stock
- **Gastos**: Carga de gastos por categoria (alquiler, sueldos, servicios, etc.) con vinculacion a facturas
- **Pagos**: Registro de cobros por multiples medios (efectivo, transferencia, tarjeta, MP)
- **Analytics / KPIs**:
  - Ingresos vs gastos vs ganancia neta
  - Margen de rentabilidad
  - Gastos por categoria
  - Top clientes y productos
  - Facturas pendientes y vencidas
- **Sugerencias inteligentes**: El sistema analiza tus datos y te da recomendaciones en lenguaje simple
  - Alertas de margen bajo, facturas vencidas, operacion a perdida
  - Sugerencias de optimizacion de gastos
  - Avisos de stock bajo y productos con poco margen

## Stack Tecnologico

- **Backend**: Python + FastAPI
- **Base de datos**: SQLite (SQLAlchemy ORM)
- **Pagos**: SDK de Mercado Pago
- **Frontend**: HTML/CSS/JS con Jinja2 templates

## Instalacion

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Mercado Pago

# Iniciar la aplicacion
uvicorn app.main:app --reload
```

La app estara disponible en http://localhost:8000

## Estructura del Proyecto

```
app/
  main.py              # App FastAPI principal
  config.py            # Configuracion desde .env
  database.py          # SQLAlchemy engine y session
  schemas.py           # Schemas Pydantic (validacion)
  models/              # Modelos de base de datos
    cliente.py
    producto.py
    factura.py
    gasto.py
    pago.py
  routers/             # Endpoints API + paginas
    clientes.py
    productos.py
    facturas.py
    gastos.py
    pagos.py
    mercadopago.py
    analytics.py
    dashboard.py
  services/            # Logica de negocio
    mercadopago_service.py
    analytics_service.py
  templates/           # HTML (Jinja2)
  static/              # CSS y JS
```

## API Endpoints

| Recurso | Endpoints |
|---------|-----------|
| Clientes | `GET/POST /api/clientes/`, `GET/PUT/DELETE /api/clientes/{id}` |
| Productos | `GET/POST /api/productos/`, `GET/PUT/DELETE /api/productos/{id}` |
| Facturas | `GET/POST /api/facturas/`, `GET/DELETE /api/facturas/{id}`, `PATCH /api/facturas/{id}/estado` |
| Gastos | `GET/POST /api/gastos/`, `GET/PUT/DELETE /api/gastos/{id}` |
| Pagos | `GET/POST /api/pagos/` |
| Mercado Pago | `POST /api/mercadopago/crear-pago/{id}`, `POST /api/mercadopago/webhook` |
| Analytics | `GET /api/analytics/resumen`, `/gastos-por-categoria`, `/top-clientes`, `/top-productos`, `/sugerencias`, `/completo` |

Documentacion interactiva de la API: http://localhost:8000/docs
