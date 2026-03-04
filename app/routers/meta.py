from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.lead import Lead, CampanaMeta, EstadoLead, OrigenLead
from app.services.meta_service import (
    sincronizar_campanas,
    sincronizar_leads,
    obtener_estrategia_meta,
)

router = APIRouter(tags=["meta"])
templates = Jinja2Templates(directory="app/templates")

# --- Pagina ---
@router.get("/meta")
def pagina_meta(request: Request, db: Session = Depends(get_db)):
    estrategia = obtener_estrategia_meta(db)
    return templates.TemplateResponse("meta.html", {
        "request": request,
        "estrategia": estrategia,
    })


# --- API Leads ---
@router.get("/api/leads/")
def listar_leads(
    estado: EstadoLead | None = None,
    origen: OrigenLead | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Lead)
    if estado:
        query = query.filter(Lead.estado == estado)
    if origen:
        query = query.filter(Lead.origen == origen)
    leads = query.order_by(Lead.creado_en.desc()).all()
    return [
        {
            "id": l.id,
            "nombre": l.nombre,
            "email": l.email,
            "telefono": l.telefono,
            "origen": l.origen.value,
            "estado": l.estado.value,
            "valor_estimado": l.valor_estimado,
            "notas": l.notas,
            "campana": l.campana.nombre if l.campana else None,
            "creado_en": l.creado_en.isoformat(),
        }
        for l in leads
    ]


@router.post("/api/leads/", status_code=201)
def crear_lead(
    nombre: str,
    estado: EstadoLead = EstadoLead.NUEVO,
    origen: OrigenLead = OrigenLead.MANUAL,
    email: str | None = None,
    telefono: str | None = None,
    valor_estimado: float = 0,
    notas: str | None = None,
    db: Session = Depends(get_db),
):
    lead = Lead(
        nombre=nombre,
        email=email,
        telefono=telefono,
        origen=origen,
        estado=estado,
        valor_estimado=valor_estimado,
        notas=notas,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return {"id": lead.id, "nombre": lead.nombre, "estado": lead.estado.value}


@router.patch("/api/leads/{lead_id}/estado")
def cambiar_estado_lead(lead_id: int, estado: EstadoLead, db: Session = Depends(get_db)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    lead.estado = estado
    db.commit()
    return {"mensaje": f"Lead actualizado a {estado.value}"}


@router.patch("/api/leads/{lead_id}/valor")
def actualizar_valor_lead(lead_id: int, valor: float, db: Session = Depends(get_db)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    lead.valor_estimado = valor
    db.commit()
    return {"mensaje": f"Valor actualizado a ${valor}"}


@router.post("/api/leads/{lead_id}/convertir")
def convertir_lead_a_cliente(lead_id: int, db: Session = Depends(get_db)):
    """Convierte un lead en cliente del sistema."""
    from app.models.cliente import Cliente

    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")

    if lead.cliente_id:
        raise HTTPException(status_code=400, detail="Este lead ya fue convertido a cliente")

    cliente = Cliente(
        nombre=lead.nombre,
        email=lead.email,
        telefono=lead.telefono,
        notas=f"Convertido desde lead #{lead.id} - Origen: {lead.origen.value}",
    )
    db.add(cliente)
    db.flush()

    lead.estado = EstadoLead.CONVERTIDO
    lead.cliente_id = cliente.id
    db.commit()

    return {
        "mensaje": f"{lead.nombre} ahora es cliente",
        "cliente_id": cliente.id,
        "lead_id": lead.id,
    }


@router.delete("/api/leads/{lead_id}", status_code=204)
def eliminar_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    db.delete(lead)
    db.commit()


# --- API Campanas ---
@router.get("/api/campanas/")
def listar_campanas(db: Session = Depends(get_db)):
    campanas = db.query(CampanaMeta).order_by(CampanaMeta.creado_en.desc()).all()
    return [
        {
            "id": c.id,
            "nombre": c.nombre,
            "estado": c.estado_meta,
            "plataforma": c.plataforma,
            "objetivo": c.objetivo,
            "presupuesto_diario": c.presupuesto_diario,
            "gastado": round(c.gastado, 2),
            "impresiones": c.impresiones,
            "clics": c.clics,
            "leads": c.leads_count,
            "conversiones": c.conversiones,
            "cpl": round(c.costo_por_lead, 2),
            "cpc": round(c.costo_por_clic, 2),
            "ctr": round(c.ctr, 2),
            "roi": round(c.roi, 1),
            "sincronizado": c.sincronizado_en.isoformat() if c.sincronizado_en else None,
        }
        for c in campanas
    ]


@router.post("/api/meta/sincronizar")
async def sincronizar_todo(db: Session = Depends(get_db)):
    """Sincroniza campanas y leads desde Meta."""
    try:
        resultado_campanas = await sincronizar_campanas(db)
        resultado_leads = await sincronizar_leads(db)
        return {
            "mensaje": "Sincronizacion completada",
            "campanas": resultado_campanas,
            "leads": resultado_leads,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al sincronizar: {str(e)}")


@router.get("/api/meta/estrategia")
def estrategia(db: Session = Depends(get_db)):
    """Estrategia completa con sugerencias basadas en datos de Meta."""
    return obtener_estrategia_meta(db)
