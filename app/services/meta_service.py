"""
Servicio de integracion con Meta Business API.

Conecta con Facebook Ads, Instagram y Lead Ads para:
- Sincronizar campanas y sus metricas
- Capturar leads automaticamente desde formularios de FB/IG
- Obtener insights de rendimiento
- Generar estrategias basadas en datos reales

Requiere un Meta Access Token con permisos:
- ads_read (leer campanas)
- leads_retrieval (obtener leads)
- pages_read_engagement (datos de pagina)
"""

import os
from datetime import datetime

import httpx
from sqlalchemy.orm import Session

from app.models.lead import Lead, CampanaMeta, OrigenLead, EstadoLead

META_GRAPH_URL = "https://graph.facebook.com/v21.0"


def _get_token() -> str:
    token = os.getenv("META_ACCESS_TOKEN", "")
    if not token:
        raise ValueError(
            "META_ACCESS_TOKEN no configurado. "
            "Generalo en https://developers.facebook.com/tools/explorer/"
        )
    return token


def _get_ad_account_id() -> str:
    ad_account = os.getenv("META_AD_ACCOUNT_ID", "")
    if not ad_account:
        raise ValueError("META_AD_ACCOUNT_ID no configurado (formato: act_XXXXXXXXX)")
    return ad_account


async def sincronizar_campanas(db: Session) -> dict:
    """
    Trae todas las campanas de Meta Ads y sincroniza metricas.
    """
    token = _get_token()
    ad_account = _get_ad_account_id()

    async with httpx.AsyncClient() as client:
        # Obtener campanas
        response = await client.get(
            f"{META_GRAPH_URL}/{ad_account}/campaigns",
            params={
                "access_token": token,
                "fields": "id,name,status,objective,daily_budget,start_time,stop_time",
                "limit": 50,
            },
        )
        response.raise_for_status()
        campanas_data = response.json().get("data", [])

        nuevas = 0
        actualizadas = 0

        for c_data in campanas_data:
            campaign_id = c_data["id"]

            # Obtener insights (metricas)
            insights_resp = await client.get(
                f"{META_GRAPH_URL}/{campaign_id}/insights",
                params={
                    "access_token": token,
                    "fields": "spend,impressions,clicks,ctr,cpc,actions",
                    "date_preset": "last_30d",
                },
            )
            insights = {}
            if insights_resp.status_code == 200:
                insights_data = insights_resp.json().get("data", [])
                if insights_data:
                    insights = insights_data[0]

            # Buscar o crear campana local
            campana = (
                db.query(CampanaMeta)
                .filter(CampanaMeta.meta_campaign_id == campaign_id)
                .first()
            )

            leads_action = 0
            conversiones = 0
            actions = insights.get("actions", [])
            for action in actions:
                if action.get("action_type") == "lead":
                    leads_action = int(action.get("value", 0))
                if action.get("action_type") in ("purchase", "complete_registration"):
                    conversiones += int(action.get("value", 0))

            gastado = float(insights.get("spend", 0))
            clics = int(insights.get("clicks", 0))
            impresiones = int(insights.get("impressions", 0))

            datos = {
                "meta_campaign_id": campaign_id,
                "nombre": c_data.get("name", ""),
                "estado_meta": c_data.get("status", ""),
                "objetivo": c_data.get("objective", ""),
                "presupuesto_diario": float(c_data.get("daily_budget", 0)) / 100,
                "gastado": gastado,
                "impresiones": impresiones,
                "clics": clics,
                "leads_count": leads_action,
                "conversiones": conversiones,
                "costo_por_lead": round(gastado / leads_action, 2) if leads_action > 0 else 0,
                "costo_por_clic": float(insights.get("cpc", 0)),
                "ctr": float(insights.get("ctr", 0)),
                "sincronizado_en": datetime.now(),
            }

            if c_data.get("start_time"):
                datos["fecha_inicio"] = datetime.fromisoformat(
                    c_data["start_time"].replace("+0000", "+00:00")
                )

            if campana:
                for key, value in datos.items():
                    setattr(campana, key, value)
                actualizadas += 1
            else:
                campana = CampanaMeta(**datos)
                db.add(campana)
                nuevas += 1

        db.commit()

    return {"nuevas": nuevas, "actualizadas": actualizadas, "total": len(campanas_data)}


async def sincronizar_leads(db: Session, form_id: str | None = None) -> dict:
    """
    Trae leads de formularios de Facebook Lead Ads.
    """
    token = _get_token()
    ad_account = _get_ad_account_id()

    async with httpx.AsyncClient() as client:
        # Si no se pasa form_id, buscar todos los formularios del ad account
        if not form_id:
            # Obtener paginas asociadas
            page_id = os.getenv("META_PAGE_ID", "")
            if not page_id:
                raise ValueError("META_PAGE_ID no configurado")

            response = await client.get(
                f"{META_GRAPH_URL}/{page_id}/leadgen_forms",
                params={"access_token": token, "limit": 20},
            )
            response.raise_for_status()
            forms = response.json().get("data", [])
            form_ids = [f["id"] for f in forms]
        else:
            form_ids = [form_id]

        nuevos = 0
        for fid in form_ids:
            response = await client.get(
                f"{META_GRAPH_URL}/{fid}/leads",
                params={
                    "access_token": token,
                    "fields": "id,ad_id,form_id,field_data,created_time",
                    "limit": 100,
                },
            )
            if response.status_code != 200:
                continue

            leads_data = response.json().get("data", [])

            for lead_data in leads_data:
                meta_lead_id = lead_data["id"]

                existe = (
                    db.query(Lead)
                    .filter(Lead.meta_lead_id == meta_lead_id)
                    .first()
                )
                if existe:
                    continue

                # Parsear datos del formulario
                campos = {}
                for field in lead_data.get("field_data", []):
                    campos[field["name"]] = field["values"][0] if field.get("values") else ""

                # Buscar campana asociada
                campana = None
                ad_id = lead_data.get("ad_id")
                if ad_id:
                    campana = (
                        db.query(CampanaMeta)
                        .filter(CampanaMeta.meta_campaign_id.isnot(None))
                        .first()
                    )

                lead = Lead(
                    nombre=campos.get("full_name", campos.get("first_name", "Sin nombre")),
                    email=campos.get("email"),
                    telefono=campos.get("phone_number", campos.get("phone")),
                    origen=OrigenLead.FACEBOOK,
                    estado=EstadoLead.NUEVO,
                    meta_lead_id=meta_lead_id,
                    meta_ad_id=ad_id,
                    meta_form_id=fid,
                    datos_formulario=str(campos),
                    campana_id=campana.id if campana else None,
                )
                db.add(lead)
                nuevos += 1

        db.commit()

    return {"nuevos_leads": nuevos}


def obtener_estrategia_meta(db: Session) -> dict:
    """
    Analiza los datos de campanas y leads para generar una estrategia
    con sugerencias accionables en lenguaje simple.
    """
    campanas = db.query(CampanaMeta).all()
    leads = db.query(Lead).all()

    total_gastado = sum(c.gastado for c in campanas)
    total_leads = len(leads)
    total_convertidos = sum(1 for l in leads if l.estado == EstadoLead.CONVERTIDO)
    total_ingresos_leads = sum(l.valor_estimado for l in leads if l.estado == EstadoLead.CONVERTIDO)

    leads_nuevos = sum(1 for l in leads if l.estado == EstadoLead.NUEVO)
    leads_contactados = sum(1 for l in leads if l.estado == EstadoLead.CONTACTADO)
    leads_negociando = sum(1 for l in leads if l.estado == EstadoLead.NEGOCIANDO)
    leads_perdidos = sum(1 for l in leads if l.estado == EstadoLead.PERDIDO)

    cpl_promedio = round(total_gastado / total_leads, 2) if total_leads > 0 else 0
    tasa_conversion = round((total_convertidos / total_leads) * 100, 1) if total_leads > 0 else 0
    roi_total = round(((total_ingresos_leads - total_gastado) / total_gastado) * 100, 1) if total_gastado > 0 else 0

    # Mejor y peor campana
    mejor_campana = None
    peor_campana = None
    if campanas:
        campanas_con_leads = [c for c in campanas if c.leads_count > 0]
        if campanas_con_leads:
            mejor_campana = min(campanas_con_leads, key=lambda c: c.costo_por_lead)
            peor_campana = max(campanas_con_leads, key=lambda c: c.costo_por_lead)

    # Generar sugerencias
    sugerencias = []

    if leads_nuevos > 5:
        sugerencias.append({
            "tipo": "accion",
            "prioridad": "alta",
            "titulo": f"Tenes {leads_nuevos} leads sin contactar",
            "mensaje": (
                f"Hay {leads_nuevos} personas que mostraron interes y nadie las contacto todavia. "
                f"Cada hora que pasa baja la chance de convertirlos. "
                f"Contactalos hoy, aunque sea con un mensaje de WhatsApp."
            ),
            "kpi": f"{leads_nuevos} nuevos",
        })

    if cpl_promedio > 0 and total_leads > 5:
        sugerencias.append({
            "tipo": "info",
            "prioridad": "media",
            "titulo": f"Te cuesta ${cpl_promedio:,.0f} conseguir cada lead",
            "mensaje": (
                f"En promedio, por cada lead que te llega invertis ${cpl_promedio:,.0f} en Meta. "
                f"Si cada cliente te deja una ganancia mayor a eso, vas bien. "
                f"Si no, necesitas mejorar el formulario o la segmentacion."
            ),
            "kpi": f"${cpl_promedio:,.0f}/lead",
        })

    if mejor_campana and peor_campana and mejor_campana.id != peor_campana.id:
        sugerencias.append({
            "tipo": "estrategia",
            "prioridad": "alta",
            "titulo": "Mete mas plata en lo que funciona",
            "mensaje": (
                f'Tu mejor campana es "{mejor_campana.nombre}" '
                f"(${mejor_campana.costo_por_lead:,.0f} por lead). "
                f'La peor es "{peor_campana.nombre}" '
                f"(${peor_campana.costo_por_lead:,.0f} por lead). "
                f"Pasa presupuesto de la peor a la mejor."
            ),
            "kpi": f"${mejor_campana.costo_por_lead:,.0f} vs ${peor_campana.costo_por_lead:,.0f}",
        })

    if tasa_conversion < 10 and total_leads > 10:
        sugerencias.append({
            "tipo": "precaucion",
            "prioridad": "alta",
            "titulo": f"Solo convertis el {tasa_conversion}% de los leads",
            "mensaje": (
                f"De {total_leads} leads, solo {total_convertidos} se convirtieron en clientes. "
                f"Revisa tu proceso de contacto: estas respondiendo rapido? "
                f"El mensaje de primer contacto es claro? Probá mandar un audio de WhatsApp."
            ),
            "kpi": f"{tasa_conversion}%",
        })
    elif tasa_conversion >= 10 and total_leads > 10:
        sugerencias.append({
            "tipo": "positivo",
            "prioridad": "baja",
            "titulo": f"Tu tasa de conversion esta en {tasa_conversion}%",
            "mensaje": (
                f"Convertis {total_convertidos} de cada {total_leads} leads. Eso esta bien. "
                f"Para subir mas, trabaja la relacion con los que estan en 'negociando' "
                f"y fijate si podes ofrecer algo especial para cerrar."
            ),
            "kpi": f"{tasa_conversion}%",
        })

    if leads_perdidos > total_leads * 0.4 and total_leads > 5:
        sugerencias.append({
            "tipo": "alerta",
            "prioridad": "alta",
            "titulo": "Estas perdiendo muchos leads",
            "mensaje": (
                f"El {round(leads_perdidos/total_leads*100)}% de tus leads se pierde. "
                f"Puede ser que la publicidad atraiga gente que no es tu cliente ideal. "
                f"Revisa la segmentacion: edad, zona, intereses. "
                f"Mejor menos leads pero mas calificados."
            ),
            "kpi": f"{leads_perdidos}/{total_leads} perdidos",
        })

    if roi_total < 0 and total_gastado > 0:
        sugerencias.append({
            "tipo": "alerta",
            "prioridad": "alta",
            "titulo": "La publicidad en Meta no esta siendo rentable",
            "mensaje": (
                f"Invertiste ${total_gastado:,.0f} y recuperaste ${total_ingresos_leads:,.0f}. "
                f"Estas perdiendo plata. Antes de pausar todo, proba: "
                f"1) Cambiar el publico, 2) Mejorar las imagenes/videos, "
                f"3) Ofrecer algo irresistible en el formulario."
            ),
            "kpi": f"ROI {roi_total}%",
        })
    elif roi_total > 0:
        sugerencias.append({
            "tipo": "positivo",
            "prioridad": "baja",
            "titulo": f"Meta te da un retorno del {roi_total}%",
            "mensaje": (
                f"Por cada $100 que invertis en Meta, recuperas ${100 + roi_total:,.0f}. "
                f"Considera aumentar el presupuesto gradualmente (20-30% por semana) "
                f"para escalar sin perder eficiencia."
            ),
            "kpi": f"ROI {roi_total}%",
        })

    # Pipeline de leads por plataforma
    leads_fb = sum(1 for l in leads if l.origen == OrigenLead.FACEBOOK)
    leads_ig = sum(1 for l in leads if l.origen == OrigenLead.INSTAGRAM)

    return {
        "resumen": {
            "total_gastado": round(total_gastado, 2),
            "total_leads": total_leads,
            "total_convertidos": total_convertidos,
            "ingresos_por_leads": round(total_ingresos_leads, 2),
            "costo_por_lead": cpl_promedio,
            "tasa_conversion": tasa_conversion,
            "roi": roi_total,
        },
        "pipeline": {
            "nuevos": leads_nuevos,
            "contactados": leads_contactados,
            "negociando": leads_negociando,
            "convertidos": total_convertidos,
            "perdidos": leads_perdidos,
        },
        "por_plataforma": {
            "facebook": leads_fb,
            "instagram": leads_ig,
        },
        "campanas": [
            {
                "nombre": c.nombre,
                "estado": c.estado_meta,
                "gastado": round(c.gastado, 2),
                "leads": c.leads_count,
                "cpl": round(c.costo_por_lead, 2),
                "ctr": round(c.ctr, 2),
                "conversiones": c.conversiones,
            }
            for c in campanas
        ],
        "sugerencias": sorted(
            sugerencias,
            key=lambda s: {"alta": 0, "media": 1, "baja": 2}.get(s["prioridad"], 3),
        ),
    }
