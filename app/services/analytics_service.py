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


def obtener_facturacion_anual(db: Session) -> dict:
    """Facturacion mensual del año actual para el grafico."""
    anio_actual = datetime.now().year
    meses = []
    meses_labels = [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
    ]

    total_anual = 0
    total_gastos_anual = 0

    for mes in range(1, 13):
        desde = datetime(anio_actual, mes, 1)
        if mes == 12:
            hasta = datetime(anio_actual + 1, 1, 1)
        else:
            hasta = datetime(anio_actual, mes + 1, 1)

        facturado = float(
            db.query(sa_func.coalesce(sa_func.sum(Factura.total), 0))
            .filter(
                Factura.estado == EstadoFactura.PAGADA,
                Factura.fecha_emision >= desde,
                Factura.fecha_emision < hasta,
            )
            .scalar()
        )

        gastado = float(
            db.query(sa_func.coalesce(sa_func.sum(Gasto.monto), 0))
            .filter(Gasto.fecha >= desde, Gasto.fecha < hasta)
            .scalar()
        )

        total_anual += facturado
        total_gastos_anual += gastado

        meses.append({
            "mes": meses_labels[mes - 1],
            "facturado": round(facturado, 2),
            "gastos": round(gastado, 2),
            "ganancia": round(facturado - gastado, 2),
        })

    mes_actual_idx = datetime.now().month - 1
    facturacion_mes_actual = meses[mes_actual_idx]["facturado"]
    facturacion_mes_anterior = meses[mes_actual_idx - 1]["facturado"] if mes_actual_idx > 0 else 0
    variacion = 0
    if facturacion_mes_anterior > 0:
        variacion = round(((facturacion_mes_actual - facturacion_mes_anterior) / facturacion_mes_anterior) * 100, 1)

    return {
        "anio": anio_actual,
        "meses": meses,
        "total_anual": round(total_anual, 2),
        "gastos_anual": round(total_gastos_anual, 2),
        "ganancia_anual": round(total_anual - total_gastos_anual, 2),
        "promedio_mensual": round(total_anual / max(datetime.now().month, 1), 2),
        "variacion_mensual": variacion,
        "mejor_mes": max(meses, key=lambda m: m["facturado"]),
    }


def obtener_indicadores_financieros(db: Session, dias: int = 30) -> dict:
    """Indicadores financieros clave del negocio."""
    resumen = obtener_resumen_general(db, dias)
    anual = obtener_facturacion_anual(db)

    clientes_activos = (
        db.query(sa_func.count(sa_func.distinct(Factura.cliente_id)))
        .filter(Factura.estado == EstadoFactura.PAGADA)
        .scalar()
    )
    total_clientes = db.query(sa_func.count(Cliente.id)).scalar()
    total_facturas = (
        db.query(sa_func.count(Factura.id))
        .filter(Factura.fecha_emision >= _periodo(dias))
        .scalar()
    )
    ticket_promedio = float(
        db.query(sa_func.coalesce(sa_func.avg(Factura.total), 0))
        .filter(Factura.estado == EstadoFactura.PAGADA, Factura.fecha_emision >= _periodo(dias))
        .scalar()
    )
    total_emitido = float(
        db.query(sa_func.coalesce(sa_func.sum(Factura.total), 0))
        .filter(Factura.fecha_emision >= _periodo(dias))
        .scalar()
    )
    ratio_cobro = round((resumen["ingresos"] / total_emitido * 100), 1) if total_emitido > 0 else 0
    facturas_por_semana = round(total_facturas / max(dias / 7, 1), 1)
    productos_activos = (
        db.query(sa_func.count(Producto.id))
        .filter(Producto.activo.is_(True))
        .scalar()
    )

    return {
        "ticket_promedio": round(ticket_promedio, 2),
        "clientes_activos": clientes_activos,
        "total_clientes": total_clientes,
        "total_facturas": total_facturas,
        "ratio_cobro": ratio_cobro,
        "facturas_por_semana": facturas_por_semana,
        "productos_activos": productos_activos,
        "ingreso_por_cliente": round(resumen["ingresos"] / max(clientes_activos, 1), 2),
        "promedio_mensual": anual["promedio_mensual"],
        "variacion_mensual": anual["variacion_mensual"],
    }


def generar_inteligencia_negocio(db: Session, dias: int = 30) -> list[dict]:
    """Genera analisis profundo y reflexiones estrategicas para el negocio."""
    resumen = obtener_resumen_general(db, dias)
    indicadores = obtener_indicadores_financieros(db, dias)
    anual = obtener_facturacion_anual(db)
    top_cli = obtener_top_clientes(db, dias)

    insights = []

    if top_cli and resumen["ingresos"] > 0:
        porcentaje_top = round(top_cli[0]["total_facturado"] / resumen["ingresos"] * 100, 1)
        if porcentaje_top > 40:
            insights.append({
                "categoria": "Riesgo",
                "icono": "riesgo",
                "titulo": "Dependencia de un solo cliente",
                "analisis": (
                    f'El {porcentaje_top}% de tus ingresos viene de "{top_cli[0]["cliente"]}". '
                    f"Si este cliente se va, perdes casi la mitad de tu facturacion."
                ),
                "accion": "Dedica tiempo a captar 2-3 clientes nuevos este mes. Usa Meta Ads con formularios de contacto.",
            })
        else:
            insights.append({
                "categoria": "Fortaleza",
                "icono": "positivo",
                "titulo": "Cartera diversificada",
                "analisis": (
                    f"Ningun cliente representa mas del {porcentaje_top}% de tus ingresos. "
                    f"Eso te da estabilidad."
                ),
                "accion": "Mantene esta diversificacion. Segui captando nuevos clientes sin descuidar a los actuales.",
            })

    if anual["variacion_mensual"] > 0:
        insights.append({
            "categoria": "Crecimiento",
            "icono": "positivo",
            "titulo": f"Facturacion creciendo {anual['variacion_mensual']}%",
            "analisis": (
                f"Este mes facturaste {anual['variacion_mensual']}% mas que el anterior. "
                f"Promedio mensual: ${anual['promedio_mensual']:,.0f}."
            ),
            "accion": "Identifica que hiciste diferente este mes y replicalo.",
        })
    elif anual["variacion_mensual"] < 0:
        insights.append({
            "categoria": "Alerta",
            "icono": "alerta",
            "titulo": f"Facturacion cayendo {abs(anual['variacion_mensual'])}%",
            "analisis": (
                f"Este mes facturaste {abs(anual['variacion_mensual'])}% menos que el anterior."
            ),
            "accion": "Lanza una promocion, contacta clientes inactivos o aumenta inversion en Meta Ads.",
        })

    if indicadores["ratio_cobro"] < 70 and indicadores["total_facturas"] > 3:
        insights.append({
            "categoria": "Flujo de caja",
            "icono": "precaucion",
            "titulo": f"Solo cobras el {indicadores['ratio_cobro']}%",
            "analisis": (
                f"De cada $100 que facturas, solo cobras ${indicadores['ratio_cobro']:.0f}."
            ),
            "accion": "Implementa cobro anticipado (50% al inicio) u ofrece descuento por pago inmediato.",
        })

    if indicadores["ticket_promedio"] > 0:
        insights.append({
            "categoria": "Ventas",
            "icono": "info",
            "titulo": f"Ticket promedio: ${indicadores['ticket_promedio']:,.0f}",
            "analisis": (
                f"Cada factura promedia ${indicadores['ticket_promedio']:,.0f}. "
                f"Facturas {indicadores['facturas_por_semana']} veces por semana."
            ),
            "accion": "Proba vender productos complementarios, armar combos o paquetes.",
        })

    if anual["mejor_mes"]["facturado"] > 0:
        insights.append({
            "categoria": "Estacionalidad",
            "icono": "info",
            "titulo": f"Mejor mes: {anual['mejor_mes']['mes']} (${anual['mejor_mes']['facturado']:,.0f})",
            "analisis": f"Fue tu record del anio. Analiza que paso y replícalo.",
            "accion": "Prepara una estrategia similar para el proximo ciclo.",
        })

    if resumen["ingresos"] > 0:
        eficiencia = round((resumen["ganancia_neta"] / resumen["ingresos"]) * 100, 1)
        insights.append({
            "categoria": "Productividad",
            "icono": "info",
            "titulo": f"Eficiencia operativa: {eficiencia}%",
            "analisis": (
                f"De cada $100 que entra, te quedan ${eficiencia:.0f} despues de gastos. "
                f"{'Buen nivel.' if eficiencia > 25 else 'Hay margen para mejorar.'}"
            ),
            "accion": "Revisa los gastos mas grandes: generan ingresos? Si no, reducílos.",
        })

    return insights


def obtener_analisis_completo(db: Session, dias: int = 30) -> dict:
    """Devuelve el análisis completo con todos los KPIs y sugerencias."""
    resumen = obtener_resumen_general(db, dias)
    indicadores = obtener_indicadores_financieros(db, dias)
    resumen["total_facturas"] = indicadores["total_facturas"]
    resumen["total_clientes"] = indicadores["total_clientes"]

    return {
        "resumen": resumen,
        "facturacion_anual": obtener_facturacion_anual(db),
        "indicadores": indicadores,
        "gastos_por_categoria": obtener_gastos_por_categoria(db, dias),
        "top_clientes": obtener_top_clientes(db, dias),
        "top_productos": obtener_top_productos(db, dias),
        "sugerencias": generar_sugerencias(db, dias),
        "inteligencia": generar_inteligencia_negocio(db, dias),
    }
