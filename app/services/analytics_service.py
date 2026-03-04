from datetime import datetime, timedelta

from sqlalchemy import func as sa_func
from sqlalchemy.orm import Session

from app.models.factura import Factura, EstadoFactura
from app.models.gasto import Gasto, CategoriaGasto
from app.models.pago import Pago, EstadoPago
from app.models.producto import Producto
from app.models.cliente import Cliente


def _periodo(dias: int) -> datetime:
    return datetime.now() - timedelta(days=dias)


def obtener_resumen_general(db: Session, dias: int = 30) -> dict:
    """Genera el resumen general del negocio en un período."""
    desde = _periodo(dias)

    # Ingresos: facturas pagadas en el período
    ingresos = (
        db.query(sa_func.coalesce(sa_func.sum(Factura.total), 0))
        .filter(Factura.estado == EstadoFactura.PAGADA, Factura.fecha_emision >= desde)
        .scalar()
    )

    # Gastos totales en el período
    gastos_total = (
        db.query(sa_func.coalesce(sa_func.sum(Gasto.monto), 0))
        .filter(Gasto.fecha >= desde)
        .scalar()
    )

    # Facturas pendientes
    pendientes_total = (
        db.query(sa_func.coalesce(sa_func.sum(Factura.total), 0))
        .filter(Factura.estado == EstadoFactura.PENDIENTE)
        .scalar()
    )

    pendientes_count = (
        db.query(sa_func.count(Factura.id))
        .filter(Factura.estado == EstadoFactura.PENDIENTE)
        .scalar()
    )

    # Facturas vencidas
    vencidas_count = (
        db.query(sa_func.count(Factura.id))
        .filter(Factura.estado == EstadoFactura.VENCIDA)
        .scalar()
    )

    ganancia_neta = ingresos - gastos_total
    margen = (ganancia_neta / ingresos * 100) if ingresos > 0 else 0

    return {
        "periodo_dias": dias,
        "ingresos": round(ingresos, 2),
        "gastos": round(gastos_total, 2),
        "ganancia_neta": round(ganancia_neta, 2),
        "margen_porcentaje": round(margen, 1),
        "facturas_pendientes": pendientes_count,
        "monto_pendiente": round(pendientes_total, 2),
        "facturas_vencidas": vencidas_count,
    }


def obtener_gastos_por_categoria(db: Session, dias: int = 30) -> list[dict]:
    """Desglosa los gastos por categoría."""
    desde = _periodo(dias)

    resultados = (
        db.query(
            Gasto.categoria,
            sa_func.sum(Gasto.monto).label("total"),
            sa_func.count(Gasto.id).label("cantidad"),
        )
        .filter(Gasto.fecha >= desde)
        .group_by(Gasto.categoria)
        .order_by(sa_func.sum(Gasto.monto).desc())
        .all()
    )

    total_gastos = sum(r.total for r in resultados) if resultados else 1

    return [
        {
            "categoria": r.categoria.value,
            "total": round(r.total, 2),
            "cantidad": r.cantidad,
            "porcentaje": round(r.total / total_gastos * 100, 1),
        }
        for r in resultados
    ]


def obtener_top_clientes(db: Session, dias: int = 30, limite: int = 5) -> list[dict]:
    """Los clientes que más facturaron en el período."""
    desde = _periodo(dias)

    resultados = (
        db.query(
            Cliente.nombre,
            sa_func.sum(Factura.total).label("total"),
            sa_func.count(Factura.id).label("facturas"),
        )
        .join(Factura, Cliente.id == Factura.cliente_id)
        .filter(Factura.fecha_emision >= desde, Factura.estado == EstadoFactura.PAGADA)
        .group_by(Cliente.id)
        .order_by(sa_func.sum(Factura.total).desc())
        .limit(limite)
        .all()
    )

    return [
        {"cliente": r.nombre, "total_facturado": round(r.total, 2), "facturas": r.facturas}
        for r in resultados
    ]


def obtener_top_productos(db: Session, dias: int = 30, limite: int = 5) -> list[dict]:
    """Los productos más vendidos en el período."""
    from app.models.factura import ItemFactura

    desde = _periodo(dias)

    resultados = (
        db.query(
            ItemFactura.descripcion,
            sa_func.sum(ItemFactura.cantidad).label("vendidos"),
            sa_func.sum(ItemFactura.subtotal).label("total"),
        )
        .join(Factura, ItemFactura.factura_id == Factura.id)
        .filter(Factura.fecha_emision >= desde, Factura.estado == EstadoFactura.PAGADA)
        .group_by(ItemFactura.descripcion)
        .order_by(sa_func.sum(ItemFactura.subtotal).desc())
        .limit(limite)
        .all()
    )

    return [
        {"producto": r.descripcion, "unidades_vendidas": r.vendidos, "total": round(r.total, 2)}
        for r in resultados
    ]


def generar_sugerencias(db: Session, dias: int = 30) -> list[dict]:
    """
    Genera sugerencias inteligentes basadas en los datos del negocio.
    Cada sugerencia tiene un tipo, prioridad y mensaje en lenguaje simple.
    """
    sugerencias = []
    resumen = obtener_resumen_general(db, dias)
    gastos_cat = obtener_gastos_por_categoria(db, dias)

    # 1. Margen de ganancia bajo
    if resumen["ingresos"] > 0 and resumen["margen_porcentaje"] < 20:
        sugerencias.append({
            "tipo": "alerta",
            "prioridad": "alta",
            "titulo": "Margen de ganancia bajo",
            "mensaje": (
                f"Tu margen de ganancia es del {resumen['margen_porcentaje']}%. "
                f"Esto significa que de cada $100 que facturás, te quedan solo "
                f"${resumen['margen_porcentaje']:.0f}. "
                f"Revisá tus costos o ajustá los precios para mejorar la rentabilidad."
            ),
            "kpi": f"{resumen['margen_porcentaje']}%",
        })

    # 2. Facturas vencidas
    if resumen["facturas_vencidas"] > 0:
        sugerencias.append({
            "tipo": "alerta",
            "prioridad": "alta",
            "titulo": "Tenés facturas vencidas",
            "mensaje": (
                f"Hay {resumen['facturas_vencidas']} factura(s) vencida(s). "
                f"Es plata que ya deberías haber cobrado. "
                f"Contactá a esos clientes para gestionar el cobro."
            ),
            "kpi": f"{resumen['facturas_vencidas']} vencidas",
        })

    # 3. Facturas pendientes acumuladas
    if resumen["monto_pendiente"] > resumen["ingresos"] * 0.5 and resumen["ingresos"] > 0:
        sugerencias.append({
            "tipo": "precaucion",
            "prioridad": "media",
            "titulo": "Mucha plata por cobrar",
            "mensaje": (
                f"Tenés ${resumen['monto_pendiente']:,.0f} en facturas pendientes, "
                f"que es más de la mitad de lo que facturaste este mes. "
                f"Ojo con el flujo de caja: necesitás que te paguen para cubrir tus gastos."
            ),
            "kpi": f"${resumen['monto_pendiente']:,.0f}",
        })

    # 4. Categoría de gasto dominante
    if gastos_cat and gastos_cat[0]["porcentaje"] > 50:
        cat = gastos_cat[0]
        sugerencias.append({
            "tipo": "info",
            "prioridad": "media",
            "titulo": f"Gastás mucho en {cat['categoria']}",
            "mensaje": (
                f"El {cat['porcentaje']}% de tus gastos van a {cat['categoria']} "
                f"(${cat['total']:,.0f}). Fijate si podés negociar mejores condiciones "
                f"o buscar alternativas más económicas."
            ),
            "kpi": f"{cat['porcentaje']}%",
        })

    # 5. Ganancia positiva
    if resumen["ganancia_neta"] > 0 and resumen["margen_porcentaje"] >= 20:
        sugerencias.append({
            "tipo": "positivo",
            "prioridad": "baja",
            "titulo": "Tu negocio está generando ganancia",
            "mensaje": (
                f"En los últimos {dias} días ganaste ${resumen['ganancia_neta']:,.0f} netos. "
                f"Tu margen es del {resumen['margen_porcentaje']}%, lo cual es saludable. "
                f"Seguí así y considerá reinvertir parte de la ganancia."
            ),
            "kpi": f"${resumen['ganancia_neta']:,.0f}",
        })

    # 6. Negocio en pérdida
    if resumen["ganancia_neta"] < 0:
        sugerencias.append({
            "tipo": "alerta",
            "prioridad": "alta",
            "titulo": "Estás operando a pérdida",
            "mensaje": (
                f"En los últimos {dias} días perdiste ${abs(resumen['ganancia_neta']):,.0f}. "
                f"Gastaste más de lo que facturaste. "
                f"Necesitás urgente revisar tus gastos o aumentar las ventas."
            ),
            "kpi": f"-${abs(resumen['ganancia_neta']):,.0f}",
        })

    # 7. Productos con bajo margen
    productos_bajo_margen = (
        db.query(Producto)
        .filter(Producto.activo.is_(True), Producto.costo > 0, Producto.precio_unitario > 0)
        .all()
    )
    productos_alerta = [p for p in productos_bajo_margen if p.margen < 15]
    if productos_alerta:
        nombres = ", ".join(p.nombre for p in productos_alerta[:3])
        sugerencias.append({
            "tipo": "precaucion",
            "prioridad": "media",
            "titulo": "Productos con margen muy bajo",
            "mensaje": (
                f"Los productos {nombres} tienen menos del 15% de margen. "
                f"Vendés mucho pero ganás poco. Evaluá subir el precio o buscar proveedores más baratos."
            ),
            "kpi": f"{len(productos_alerta)} productos",
        })

    # 8. Stock bajo
    productos_sin_stock = (
        db.query(Producto)
        .filter(Producto.activo.is_(True), Producto.stock <= 3, Producto.stock >= 0)
        .all()
    )
    if productos_sin_stock:
        nombres = ", ".join(p.nombre for p in productos_sin_stock[:3])
        sugerencias.append({
            "tipo": "precaucion",
            "prioridad": "media",
            "titulo": "Productos con poco stock",
            "mensaje": (
                f"Los productos {nombres} tienen 3 o menos unidades. "
                f"Si se venden seguido, pedí reposición para no perder ventas."
            ),
            "kpi": f"{len(productos_sin_stock)} productos",
        })

    # Ordenar por prioridad
    orden = {"alta": 0, "media": 1, "baja": 2}
    sugerencias.sort(key=lambda s: orden.get(s["prioridad"], 3))

    return sugerencias


def obtener_analisis_completo(db: Session, dias: int = 30) -> dict:
    """Devuelve el análisis completo con todos los KPIs y sugerencias."""
    return {
        "resumen": obtener_resumen_general(db, dias),
        "gastos_por_categoria": obtener_gastos_por_categoria(db, dias),
        "top_clientes": obtener_top_clientes(db, dias),
        "top_productos": obtener_top_productos(db, dias),
        "sugerencias": generar_sugerencias(db, dias),
    }
