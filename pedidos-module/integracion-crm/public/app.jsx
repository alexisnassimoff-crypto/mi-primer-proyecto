// ─── CENTRAL EYEWEAR CRM v7 — Conectado a Airtable ──────────────────────────
const { useState, useEffect, useCallback, useRef, useMemo } = React;

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// Usuarios gestionados desde Airtable via /api/auth


const VENDEDOR_MAP = { MATTOS:"matias", DOMINGUEZ:"nicolas", TOLEDO:"miguel", CHARRAS:"mauro", EMPRESA:"central", CENTRAL:"central" };
const ESTADOS = ["nueva","prospecto","seguimiento","cliente","alerta","inactivo"];
const ECLR = { cliente:"#6b8f5e", seguimiento:"#c17f4a", prospecto:"#7ba7bc", nueva:"#4ab3cc", alerta:"#c25b4e", inactivo:"#8a8880" };
const PROVINCIAS = ["Buenos Aires","CABA","Catamarca","Chaco","Chubut","Corrientes","Córdoba","Entre Rios","Formosa","Jujuy","La Pampa","La Rioja","Mendoza","Misiones","Neuquen","Río Negro","Salta","San Juan","San Luis","Santa Cruz","Santa Fe","Santiago Del Estero","Tierra del Fuego","Tucuman"];
const CONDICIONES_IVA = ["Resp. Inscripto","Resp. Monotributo","Exento","No Responsable"];

const MSGS = {
  nueva:      [["Primer contacto","Hola! Te contacto de Central Eyewear. Somos una marca de marcos y lentes con excelente relación precio-calidad. Me gustaría mostrarte nuestro catálogo. ¿Tenés 5 minutos esta semana?"]],
  prospecto:  [["Seguimiento","Hola! Te escribo para seguir en contacto. ¿Tuviste oportunidad de ver el catálogo? Quedé con ganas de mostrarte los modelos en persona."],["Enviar catálogo","Hola! Te mando el catálogo actualizado de Central Eyewear con los últimos modelos. Cualquier consulta estoy a disposición!"]],
  seguimiento:[["Seguimiento activo","Hola! ¿Cómo va todo? Quería saber si pudiste analizar la propuesta. Estoy disponible para cualquier consulta o para coordinar una nueva visita."],["Nueva propuesta","Hola! Te contacto porque tenemos modelos nuevos que creo que se van a adaptar muy bien a tu local. ¿Puedo pasar a mostrarte?"]],
  cliente:    [["Post visita","Hola! Gracias por recibirme hoy. Quedé muy contento con la charla. Cualquier consulta sobre los modelos que vimos, escribime. Un abrazo!"],["Novedades","Hola! ¿Cómo va la temporada? Te cuento que acabamos de sumar modelos nuevos que creo que te van a interesar. ¿Cuándo paso a mostrarte?"],["Confirmar pedido","Hola! Te escribo para confirmar que el pedido está en proceso. Cualquier duda estoy a disposición. Gracias!"]],
  alerta:     [["Reactivación urgente","Hola! Hace un tiempo que no nos vemos y me gustaría retomar contacto. Tenemos novedades importantes en el catálogo. ¿Cuándo podría pasar?"],["Oferta especial","Hola! Espero que estés muy bien. Te escribo porque tenemos una propuesta especial para vos. ¿Podemos hablar esta semana?"]],
};

// Mensajes por categoría para la pestaña de comunicación
const MSGS_CATS = [
  {
    id: "postventa",
    label: "Post visita",
    color: "#6b8f5e",
    msgs: [
      ["Post visita","Hola! Gracias por recibirme hoy. Quedé muy contento con la charla. Cualquier consulta sobre los modelos que vimos, escribime. Un abrazo!"],
      ["Confirmación de entrega","Hola! Te quería confirmar que el pedido ya fue enviado. En breve lo recibís. Cualquier duda estoy disponible. Saludos!"],
      ["Seguimiento post entrega","Hola! ¿Cómo llegó el pedido? ¿Todo en orden con los productos? Quedame cerca para cualquier consulta."],
    ]
  },
  {
    id: "cobro",
    label: "Cobro y pagos",
    color: "#c25b4e",
    msgs: [
      ["Solicitar pago","Hola! Te escribo para recordarte que tenés una factura pendiente de vencimiento próximo. ¿Podemos coordinar el pago? Muchas gracias!"],
      ["Recordatorio de deuda","Hola! Quería consultarte sobre el saldo pendiente que tenemos registrado. ¿Cuándo podrías regularizarlo? Cualquier duda me avisás."],
      ["Confirmación de pago","Hola! Te confirmo que recibimos el pago. Muchas gracias! Quedo a tu disposición para lo que necesites."],
    ]
  },
  {
    id: "pedido",
    label: "Pedidos",
    color: "#c17f4a",
    msgs: [
      ["Confirmar pedido","Hola! Te escribo para confirmar que el pedido está en proceso. En breve te llega. Cualquier duda estoy a disposición. Gracias!"],
      ["Consultar próximo pedido","Hola! ¿Cómo va la temporada? ¿Ya pensaste en el próximo pedido? Tenemos novedades que creo que te van a interesar."],
      ["Recordar hacer pedido","Hola! Te escribo porque hace un tiempo que no renovás el stock. ¿Querés que paso a mostrarte los modelos nuevos?"],
    ]
  },
  {
    id: "marketing",
    label: "Marketing",
    color: "#7ba7bc",
    msgs: [
      ["Novedad de colección","Hola! Tenemos modelos nuevos en Central Eyewear que creo que van a funcionar muy bien en tu local. ¿Cuándo puedo pasar a mostrarte?"],
      ["Promoción especial","Hola! Te escribo porque tenemos una propuesta especial por tiempo limitado. ¿Tenés unos minutos para que te cuente?"],
      ["Temporada alta","Hola! Arrancamos la temporada fuerte y quería que seas de los primeros en ver el catálogo actualizado. ¿Cuándo nos juntamos?"],
    ]
  },
  {
    id: "reactivacion",
    label: "Reactivación",
    color: "#c25b4e",
    msgs: [
      ["Retomar contacto","Hola! Hace un tiempo que no nos vemos. ¿Cómo va el local? Me gustaría pasar a mostrarles las novedades. ¿Cuándo te viene bien?"],
      ["Oferta de reactivación","Hola! Te escribo con una propuesta especial para que retomemos. Creo que tenemos algo que te va a interesar. ¿Hablamos?"],
      ["Check-in general","Hola! Espero que estés muy bien. Quería saber cómo va la temporada y si necesitás algo de nuestra parte. Estamos a disposición!"],
    ]
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
// Calcula salud de cartera para cualquier set de ventas/clientes
const calcSalud = (ventas, clientes) => {
  const ventasReales = ventas.filter(esVentaReal);
  const hoy3m = new Date(); hoy3m.setMonth(hoy3m.getMonth()-3); const str3m = hoy3m.toISOString().slice(0,10);
  const hoy6m = new Date(); hoy6m.setMonth(hoy6m.getMonth()-6); const str6m = hoy6m.toISOString().slice(0,10);
  const act3m = new Set(ventasReales.filter(v=>v.fecha>=str3m).map(v=>v.cliente));
  const act6m = new Set(ventasReales.filter(v=>v.fecha>=str6m).map(v=>v.cliente));
  const conH  = new Set(ventasReales.map(v=>v.cliente));
  const aRec  = new Set([...conH].filter(n=>!act6m.has(n)));
  const sinH  = clientes.filter(c=>!conH.has(c.nombre.toUpperCase().trim())).length;
  return { act3m, act6m, conH, aRec, sinH, str3m, str6m };
};
const HOY = new Date();
const diasDesde  = f => f ? Math.floor((new Date() - new Date(f)) / 86400000) : null;
const diasHasta  = f => f ? Math.floor((new Date(f) - new Date()) / 86400000) : null;
const fmtFecha   = f => f ? new Date(f+"T12:00:00").toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"}) : null;
const fmtM = n => !n ? "—" : n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : `$${(n/1000).toFixed(0)}K`;
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
const esAlerta  = o => { const d = diasDesde(o.ultimaCompra)??0; return o.estado==="alerta" || (o.estado==="cliente" && d>90 && d<=150); };
const esInactivo = o => { const d = diasDesde(o.ultimaCompra)??0; return o.estado==="inactivo" || (o.estado==="cliente" && d>150); };

const parseImporte = str => {
  if (!str) return 0;
  if (typeof str === "number") return str;
  return parseFloat(str.replace(/\$/g,"").replace(/\./g,"").replace(",",".")) || 0;
};

// Neto sin IVA: Factura A tiene IVA 21% incluido, el resto (B, X, D, remito) ya es neto
const netoSinIVA = v => {
  const tipo = (v.tipo || "").toUpperCase().trim();
  return tipo === "A" ? v.importe / 1.21 : v.importe;
};
// Comisión: 15% sobre neto sin IVA
const comision15 = v => netoSinIVA(v) * 0.15;

const badgeVisita = f => {
  const d = diasHasta(f);
  if (d === null) return null;
  if (d < 0)  return { txt:`Vencida ${Math.abs(d)}d`, color:"#c25b4e", bg:"#c25b4e20" };
  if (d === 0) return { txt:"Visita HOY", color:"#fff", bg:"#7ba7bc" };
  if (d <= 3)  return { txt:`En ${d}d`, color:"#c17f4a", bg:"#c17f4a20" };
  return { txt:`${fmtFecha(f)}`, color:"#8a8880", bg:"#8a888020" };
};

// ─── API CALLS ────────────────────────────────────────────────────────────────
const fetchWithTimeout = (url, ms=9000) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal })
    .then(r => { clearTimeout(timer); return r; })
    .catch(e => { clearTimeout(timer); throw new Error(e.name==="AbortError" ? "Tiempo de espera agotado" : e.message); });
};

const api = {
  getClientes: () => fetchWithTimeout('/api/clientes').then(r=>r.json()),
  getVentas:   () => fetchWithTimeout('/api/ventas', 9000).then(r=>r.json()),
  crearCliente: (fields) => fetch('/api/clientes', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(fields) }).then(r=>r.json()),
  updateCRM: (recordId, data) => fetch('/api/crm', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({recordId,...data}) }).then(r=>r.json()),
};

// ─── PARSE AIRTABLE RECORDS ───────────────────────────────────────────────────
function parseCliente(rec) {
  const f = rec.fields || {};

  // Datos CRM guardados como JSON en campo CRM_Data
  let crm = {};
  try { const r = f["CRM_Data"] || f["fldvDUVkNvBnFhhrr"] || ""; if (r.startsWith("{")) crm = JSON.parse(r); } catch {}

  // Vendedor: "TOLEDO, MIGUEL" → apellido → map
  const vendedorRaw = (f["Vendedor"] || "").toUpperCase().trim();
  const vendedor = VENDEDOR_MAP[vendedorRaw.split(",")[0].trim()] || VENDEDOR_MAP[vendedorRaw] || "central";

  // Localidad puede venir como singleSelect {name} o string
  const localidadRaw = f["Localidad"] || "";
  const ciudad = typeof localidadRaw === "object" ? (localidadRaw.name || "") : localidadRaw;

  const nombre   = f["RazonSocial"] || "";
  const telefono = f["Celular"] || f["Telefono"] || "";
  const domicilio = [f["Calle"] || "", f["Numero"] || ""].filter(Boolean).join(" ");

  return {
    id:           rec.id,
    airtableId:   rec.id,
    nombre,
    vendedor,
    provincia:    f["Provincia"]     || "",
    ciudad,
    domicilio,
    telefono,
    whatsapp:     telefono,
    mail:         f["Mail"]          || "",
    email:        f["Mail"]          || "",   // alias para EmailBlast / ComunicacionAdm
    cuit:         f["CUIT"]          || "",
    condicionIva: f["CONDICION IVA"] || "",
    estado:       crm.estado         || "cliente",
    ultimaCompra: crm.ultimaCompra   || null,
    montoUltima:  crm.montoUltima    || 0,
    proximaVisita:crm.proximaVisita  || null,
    visitas:      crm.visitas        || 0,
    notas:        crm.notas          || [],
    pedidos:      crm.pedidos        || [],
    alertas:      crm.alertas        || [],
  };
}

function parseVenta(rec) {
  const f = rec.fields || {};
  const g = (byName, byId) => f[byName] || f[byId] || "";

  // Fecha viene como " 29/01/2025" → convertir a "2025-01-29"
  const fechaRaw = g("FECHA", "fldzlLIUutZ4Dz8D0").trim();
  let fecha = fechaRaw;
  if (fechaRaw.includes("/")) {
    const parts = fechaRaw.split("/");
    if (parts.length === 3) {
      // DD/MM/YYYY → YYYY-MM-DD
      fecha = `${parts[2].trim()}-${parts[1].trim().padStart(2,"0")}-${parts[0].trim().padStart(2,"0")}`;
    }
  }

  // Comprobante: puede venir en campo Status (singleSelect) con nombre del comprobante
  const comprobanteRaw = f["COMPROBANTE"] || f["fld1bncy6xo9QB4bX"] || "";
  const statusRaw = f["Status"] || f["fldmUvJLGgUHcfOdH"] || "";
  const comprobante = comprobanteRaw || (typeof statusRaw === "object" ? statusRaw.name : statusRaw) || "";

  // Vendedor de Sinergia — para comparación correcta
  const vendedorRaw = (g("VENDEDOR", "fldVENDEDOR") || "").toUpperCase().trim();
  const vendedorSinergia = VENDEDOR_MAP[vendedorRaw.split(",")[0].trim()] || VENDEDOR_MAP[vendedorRaw] || null;

  return {
    id: rec.id,
    fecha,
    comprobante,
    tipo: g("TIPO", "fldsJajeb6P1yenws"),
    cliente: g("CLIENTE", "fldLqglZE4q8lzHlJ").toUpperCase().trim(),
    importe: parseImporte(f["IMPORTE C/IVA"] || f["fldUXG3RGTV2vgTMP"]),
    vendedor: vendedorSinergia,
  };
}

// Excluye notas de crédito — solo ventas con importe positivo y tipo que no sea NC
const esVentaReal = v => {
  if (!v) return false;
  if (v.importe <= 0) return false; // NC con importe negativo o cero
  const tipo = (v.tipo || "").toUpperCase().trim();
  const comp = (v.comprobante || "").toUpperCase().trim();
  const combined = `${tipo} ${comp}`;
  // Excluir cualquier variante de nota de crédito
  if (combined.includes("NC ") || combined.startsWith("NC") || combined.endsWith(" NC")) return false;
  if (combined.includes("N.C") || combined.includes("N/C")) return false;
  if (combined.includes("NOTA DE CR") || combined.includes("NOTA CR")) return false;
  if (combined.includes("CRED") && combined.includes("NOTA")) return false;
  // Excluir devoluciones
  if (combined.includes("DEVOL")) return false;
  return true;
};
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

/* ── Reset ─────────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
:root {
  --bg:        #06090d;
  --surface:   #0c1118;
  --card:      #111820;
  --card2:     #141d27;
  --brd:       #1e2c3a;
  --brd2:      #263548;
  --txt:       #f2ede6;
  --txt2:      #c2bcb4;
  --txt3:      #7a7670;
  --mut:       #5a6472;
  --gold:      #c8844e;
  --gold2:     #dba06a;
  --gold3:     #eba878;
  --ac:        #7eaec4;
  --gr:        #62955c;
  --rd:        #c05850;
  --rdl:       #e06860;
  --warn:      #c8844e;
  --r14:       14px;
  --r10:       10px;
  --r8:        8px;
}
html, body {
  background: var(--bg) !important;
  color: var(--txt) !important;
  font-family: 'Outfit', system-ui, sans-serif;
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
}

/* ── Typography ────────────────────────────────────────────────────────── */
.serif { font-family: 'Playfair Display', Georgia, serif; }

/* ── Inputs ────────────────────────────────────────────────────────────── */
input, select, textarea {
  background: var(--card) !important;
  color: var(--txt) !important;
  border: 1.5px solid var(--brd) !important;
  border-radius: var(--r10) !important;
  padding: 13px 15px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  width: 100% !important;
  outline: none !important;
  -webkit-appearance: none !important;
  -webkit-text-fill-color: var(--txt) !important;
  font-family: 'Outfit', sans-serif !important;
  transition: border-color .2s;
}
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px var(--card) inset !important;
  -webkit-text-fill-color: var(--txt) !important;
}
input::placeholder, textarea::placeholder { color: var(--mut) !important; opacity: 1 !important; }
input:focus, select:focus, textarea:focus {
  border-color: var(--gold) !important;
  box-shadow: 0 0 0 3px rgba(200,132,78,.1) !important;
}
select option { background: var(--card) !important; color: var(--txt) !important; }

/* ── Buttons ────────────────────────────────────────────────────────────── */
button {
  cursor: pointer;
  border: none;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  -webkit-tap-highlight-color: transparent;
  transition: opacity .15s, transform .12s;
  user-select: none;
}
button:active { opacity: .82; transform: scale(.97); }

/* ── Scrollbar ─────────────────────────────────────────────────────────── */
::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--brd2); border-radius: 99px; }

/* ── Animations ────────────────────────────────────────────────────────── */
@keyframes spin    { to { transform: rotate(360deg); } }
@keyframes fadeIn  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
@keyframes slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
@keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:.4; } }
.anim-fade  { animation: fadeIn .28s ease both; }
.anim-slide { animation: slideUp .32s cubic-bezier(.16,1,.3,1) both; }
.spin       { animation: spin .8s linear infinite; }

/* ── Utility ────────────────────────────────────────────────────────────── */
.truncate { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.no-scroll { overflow:hidden; }
`;

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer({ onHome }) {
  return (
    <div onClick={onHome}
      style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6,
        padding:"28px 20px 40px", borderTop:"1px solid #1a2a36",
        background:"#040810", cursor:"pointer" }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:600,
        color:"#f2ede6", letterSpacing:10, opacity:.9 }}>CENTRAL</div>
      <div style={{ fontSize:8, color:"#3a4858", letterSpacing:4, textTransform:"uppercase" }}>eyewear</div>
    </div>
  );
}

// ─── PRIMITIVOS ───────────────────────────────────────────────────────────────
function Root({ children, session, onNav, vistaVendedor, vista, onBuscar }) {
  React.useEffect(() => {
    document.documentElement.style.background = "#06090d";
    document.body.style.background = "#06090d";
  }, []);
  return (
    <div style={{ background:"#06090d", color:"#f2ede6", maxWidth:480, margin:"0 auto",
      fontFamily:"'Outfit',system-ui,sans-serif", minHeight:"100dvh", display:"flex", flexDirection:"column" }}>
      <style>{CSS}</style>
      {session && onNav && <TopNav session={session} onNav={onNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={onBuscar} />}
      <div style={{ flex:1, paddingBottom:24 }}>{children}</div>
      {session && onNav && <Footer onHome={()=>onNav("home")} />}
    </div>
  );
}

function TopNav({ session, onNav, vistaVendedor, vista, onBuscar }) {
  const isAdmin = session.role==="admin";
  const isAdm   = session.role==="administracion";
  const tabs = isAdm
    ? [{ id:"seguimientos", label:"Seguim.", ico:"📅" }, { id:"cc", label:"C.Ctes.", ico:"💰" }, { id:"comunicacion", label:"Comunicar", ico:"📢" }, { id:"gestiones_adm", label:"Gestiones", ico:"📋" }, { id:"lista", label:"Clientes", ico:"👥" }]
    : isAdmin
    ? [{ id:"consultoria", label:"Coach IA", ico:"🧠" }, { id:"cartera", label:"Cartera", ico:"📈" }, { id:"vendedores", label:"Vendedores", ico:"🏆" }, { id:"admin", label:"Panel", ico:"⚡" }, { id:"emails", label:"Emails", ico:"✉️" }]
    : [{ id:"home", label:"Inicio", ico:"🏠" }, { id:"lista", label:"Clientes", ico:"👥" }, { id:"pedido", label:"Pedido", ico:"🕶" }, { id:"cc", label:"C.Ctes.", ico:"💰" }, { id:"calc", label:"Calc", ico:<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/><rect x="6.5" y="6.5" width="4" height="2.5" rx=".8" fill="currentColor"/><rect x="13.5" y="6.5" width="4" height="2.5" rx=".8" fill="currentColor"/><rect x="6.5" y="11" width="2.5" height="2.5" rx=".8" fill="currentColor"/><rect x="10.75" y="11" width="2.5" height="2.5" rx=".8" fill="currentColor"/><rect x="15" y="11" width="2.5" height="2.5" rx=".8" fill="currentColor"/><rect x="6.5" y="15.5" width="2.5" height="2.5" rx=".8" fill="currentColor"/><rect x="10.75" y="15.5" width="2.5" height="2.5" rx=".8" fill="currentColor"/><rect x="15" y="15.5" width="2.5" height="2.5" rx=".8" fill="currentColor"/></svg> }];
  const activeTab = isAdm
    ? (vista==="seguimientos" ? "seguimientos" : vista==="cc" ? "cc" : vista==="comunicacion" ? "comunicacion" : vista==="gestiones_adm" ? "gestiones_adm" : "lista")
    : isAdmin
    ? (vista==="nueva" ? "nueva" : vista==="admin" ? "admin" : vista==="consultoria" ? "consultoria" : vista==="cartera" ? "cartera" : vista==="vendedores" ? "vendedores" : vista==="emails" ? "emails" : "consultoria")
    : (vista==="pedido"||vista==="pedidos" ? "pedido" : vista==="cc" ? "cc" : vista==="calc" ? "calc" : vista==="nueva" ? "nueva" : vistaVendedor==="progreso" ? "progreso" : vistaVendedor==="lista" ? "lista" : "home");
  const navBg = "#06090d";
  return (
    <div style={{ display:"grid", gridTemplateColumns:`repeat(${tabs.length},1fr) 42px 42px`,
      background:navBg, borderBottom:"1px solid #18222e",
      position:"sticky", top:0, zIndex:200, backdropFilter:"blur(20px)",
      WebkitBackdropFilter:"blur(20px)" }}>
      {tabs.map(t => {
        const active = activeTab===t.id;
        return (
          <button key={t.id} onClick={() => onNav(t.id)}
            style={{ background:"none", border:"none",
              borderBottom: active ? "2px solid #c8844e" : "2px solid transparent",
              padding:"11px 4px 8px", display:"flex", flexDirection:"column",
              alignItems:"center", gap:3, position:"relative" }}>
            {active && <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:24, height:2, background:"#c8844e", borderRadius:"0 0 2px 2px", opacity:.6 }}/>}
            <span style={{ fontSize:17, color: active?"#c8844e":"#4a5868",
              display:"flex", alignItems:"center", justifyContent:"center",
              filter: active?"drop-shadow(0 0 6px rgba(200,132,78,.5))":"none",
              transition:"color .2s, filter .2s" }}>{t.ico}</span>
            <span style={{ fontSize:8, fontWeight:800, letterSpacing:.8,
              textTransform:"uppercase", color: active?"#c8844e":"#3a4858",
              transition:"color .2s" }}>{t.label}</span>
          </button>
        );
      })}
      <button onClick={() => onBuscar && onBuscar()}
        style={{ background:"none", border:"none", borderBottom:"2px solid transparent",
          padding:"11px 4px 8px", display:"flex", flexDirection:"column",
          alignItems:"center", gap:3, borderLeft:"1px solid #18222e" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3a4858" strokeWidth="2.3" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>
        <span style={{ fontSize:8, fontWeight:800, letterSpacing:.8, textTransform:"uppercase", color:"#3a4858" }}>Buscar</span>
      </button>
      <button onClick={() => onNav("logout")}
        style={{ background:"none", border:"none", borderBottom:"2px solid transparent",
          padding:"11px 4px 8px", display:"flex", flexDirection:"column",
          alignItems:"center", gap:3, borderLeft:"1px solid #18222e" }}>
        <span style={{ fontSize:16 }}>🚪</span>
        <span style={{ fontSize:8, fontWeight:800, letterSpacing:.8, textTransform:"uppercase", color:"#b0504a" }}>Salir</span>
      </button>
    </div>
  );
}

// ── Hdr — cabecera de sección ─────────────────────────────────────────────
const Hdr = ({ children }) => (
  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px",
    background:"#08101a", borderBottom:"1px solid #18222e" }}>
    {children}
  </div>
);

// ── Card ────────────────────────────────────────────────────────────────
const Crd = ({ t, children, accent, noPad }) => (
  <div style={{ background:"#111820", borderRadius:16, padding:noPad?0:16,
    border:`1px solid ${accent||"#1c2a38"}`, marginBottom:12,
    overflow:noPad?"hidden":"visible" }}>
    {t && <div style={{ fontWeight:800, fontSize:9, marginBottom:14,
      color:"#6a7880", textTransform:"uppercase", letterSpacing:2 }}>{t}</div>}
    {children}
  </div>
);

// ── KPI chip ────────────────────────────────────────────────────────────
const KPI = ({ l, v, c, sub }) => (
  <div style={{ background:"#0c1118", borderRadius:13, padding:"13px 10px",
    border:"1px solid #1c2a38", textAlign:"center" }}>
    <div style={{ fontSize:8, color:"#5a6878", marginBottom:5,
      textTransform:"uppercase", letterSpacing:1.5, fontWeight:700 }}>{l}</div>
    <div style={{ fontSize:22, fontWeight:900, color:c||"#f2ede6",
      letterSpacing:-.5, lineHeight:1 }}>{v}</div>
    {sub && <div style={{ fontSize:9, color:"#4a5868", marginTop:4 }}>{sub}</div>}
  </div>
);

// ── Row ─────────────────────────────────────────────────────────────────
const Row = ({ l, v, accent }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
    padding:"9px 0", borderBottom:"1px solid #131d28", fontSize:13 }}>
    <span style={{ color:"#7a7670" }}>{l}</span>
    <span style={{ color:accent||"#c2bcb4", fontWeight:600 }}>{v||"—"}</span>
  </div>
);

// ── Buttons ─────────────────────────────────────────────────────────────
const BtnPrimary = ({ children, onClick, disabled, full, icon }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ background: disabled?"#1e2a34":"linear-gradient(135deg,#c8844e,#d49662)",
      color: disabled?"#4a5868":"#06090d", padding:"14px 22px", borderRadius:13,
      fontSize:14, fontWeight:800, width:full?"100%":undefined,
      opacity:disabled?.6:1, display:"flex", alignItems:"center",
      justifyContent:"center", gap:8, boxShadow: disabled?"none":"0 4px 16px rgba(200,132,78,.25)",
      letterSpacing:.3 }}>
    {icon && <span style={{fontSize:16}}>{icon}</span>}{children}
  </button>
);

const BtnSecondary = ({ children, onClick, full, sm, icon }) => (
  <button onClick={onClick}
    style={{ background:"#111820", color:"#c2bcb4", border:"1.5px solid #1e2c3a",
      padding:sm?"7px 14px":"12px 18px", borderRadius:11,
      fontSize:sm?11:13, fontWeight:700, width:full?"100%":undefined,
      display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
    {icon && <span style={{fontSize:14}}>{icon}</span>}{children}
  </button>
);

const BtnDanger = ({ children, onClick, sm }) => (
  <button onClick={onClick}
    style={{ background:"#180e0e", color:"#e06860", border:"1px solid rgba(192,88,80,.3)",
      padding:sm?"5px 12px":"8px 16px", borderRadius:9, fontSize:sm?10:12, fontWeight:700 }}>
    {children}
  </button>
);

// ── Tag / Badge ──────────────────────────────────────────────────────────
const Tag = ({ label, color="#c2bcb4", bg }) => (
  <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 10px",
    borderRadius:999, fontSize:10, fontWeight:700,
    background:bg||(color+"18"), color, border:`1px solid ${color}33` }}>
    {label}
  </span>
);

// ── Spinner ──────────────────────────────────────────────────────────────
const Spinner = ({ size=22, color="#c8844e" }) => (
  <div style={{ width:size, height:size, border:`2px solid #1e2c3a`,
    borderTopColor:color, borderRadius:"50%", animation:"spin .7s linear infinite" }}/>
);

// ── Empty state ──────────────────────────────────────────────────────────
const Empty = ({ icon="○", msg, sub }) => (
  <div style={{ textAlign:"center", padding:"48px 24px", color:"#3a4858" }}>
    <div style={{ fontSize:32, marginBottom:12, opacity:.5 }}>{icon}</div>
    {msg && <div style={{ fontSize:14, fontWeight:600, color:"#4a5868", marginBottom:4 }}>{msg}</div>}
    {sub && <div style={{ fontSize:12 }}>{sub}</div>}
  </div>
);

const VSelect = ({ value, onChange }) => (
  <select value={value||""} onChange={e=>onChange(e.target.value)}>
    <option value="">— Vendedor —</option>
    {["matias","miguel","nicolas","mauro","central","ale"].map(v=><option key={v} value={v}>{cap(v)}</option>)}
  </select>
);
const PSelect = ({ value, onChange }) => (
  <select value={value||""} onChange={e=>onChange(e.target.value)}>
    <option value="">— Provincia —</option>
    {PROVINCIAS.map(p=><option key={p}>{p}</option>)}
  </select>
);
const IVASelect = ({ value, onChange }) => (
  <select value={value||""} onChange={e=>onChange(e.target.value)}>
    <option value="">— Condición IVA —</option>
    {CONDICIONES_IVA.map(c=><option key={c}>{c}</option>)}
  </select>
);

const Label = ({ children }) => <div style={{ fontSize:9, color:"#8a8880", marginBottom:6, textTransform:"uppercase", letterSpacing:1.2, fontWeight:700 }}>{children}</div>;


// ─── BÚSQUEDA GLOBAL ─────────────────────────────────────────────────────────
function BuscadorGlobal({ clientes, onCliente, onClose }) {
  const [q, setQ] = React.useState("");
  const inputRef = React.useRef(null);
  React.useEffect(()=>{ setTimeout(()=>inputRef.current?.focus(),80); },[]);

  const resultados = React.useMemo(()=>{
    if (!q.trim() || q.length < 2) return [];
    const qn = q.toLowerCase();
    return clientes.filter(c =>
      c.nombre?.toLowerCase().includes(qn) ||
      (typeof c.ciudad === "string" ? c.ciudad : c.ciudad?.name || "").toLowerCase().includes(qn) ||
      c.provincia?.toLowerCase().includes(qn) ||
      c.razonSocial?.toLowerCase().includes(qn)
    ).slice(0, 18);
  }, [q, clientes]);

  const VCOL = {matias:"#e8924a",miguel:"#4ab8e8",nicolas:"#5ab86e",mauro:"#b06ae8",central:"#c17f4a"};

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(2,5,8,.92)",zIndex:500,display:"flex",flexDirection:"column",padding:"16px 16px 0"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{display:"flex",gap:10,marginBottom:12,alignItems:"center"}}>
        <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)}
          placeholder="Buscar cliente, ciudad, provincia..."
          style={{flex:1,background:"#0d1420",border:"1px solid #c17f4a44",borderRadius:12,padding:"13px 16px",color:"#f0ede8",fontSize:15,fontFamily:"inherit",outline:"none"}}/>
        <button onClick={onClose} style={{background:"#131a22",border:"1px solid #1e2a34",borderRadius:10,padding:"12px 14px",color:"#4a5060",fontSize:16,cursor:"pointer"}}>✕</button>
      </div>
      {q.length >= 2 && resultados.length === 0 && (
        <div style={{textAlign:"center",padding:40,color:"#2a3a48",fontSize:13}}>Sin resultados para "{q}"</div>
      )}
      <div style={{overflowY:"auto",flex:1,paddingBottom:32}}>
        {resultados.map((c,i) => {
          const vc = VCOL[c.vendedor] || "#c17f4a";
          const ciudad = typeof c.ciudad === "string" ? c.ciudad : c.ciudad?.name || "";
          return (
            <div key={i} onClick={()=>{onCliente(c);onClose();}}
              style={{background:"#0d1420",border:"1px solid #1a2430",borderRadius:13,padding:"13px 15px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:vc+"18",border:`1.5px solid ${vc}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:11,fontWeight:800,color:vc}}>{c.nombre?.charAt(0)||"?"}</span>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:"#f0ede8",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.nombre}</div>
                <div style={{fontSize:11,color:"#3a4a58",marginTop:2}}>{[ciudad,c.provincia].filter(Boolean).join(", ")||"Sin ubicación"} <span style={{color:vc+"88"}}>· {c.vendedor}</span></div>
              </div>
              <span style={{color:"#2a3a48",fontSize:16,flexShrink:0}}>›</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CUENTAS CORRIENTES ───────────────────────────────────────────────────────
function CuentasCorrientes({ session }) {
  const [datos, setDatos] = React.useState(null);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [abierto, setAbierto] = React.useState(null);
  const [busq, setBusq]       = React.useState("");
  const [miniGest, setMiniGest] = React.useState(null); // cliente para gestión rápida
  const [ordenM, setOrdenM]   = React.useState(null);   // "mayor" | "menor"
  const [ordenA, setOrdenA]   = React.useState(null);   // "az" | "za"
  const [filtroProv, setFiltroProv] = React.useState("");

  const esAdmin = session.role === "admin" || session.role === "administracion";

  React.useEffect(() => {
    setCargando(true);
    const url = esAdmin
      ? "/api/cuentas-corrientes"
      : `/api/cuentas-corrientes?vendedor=${session.username}`;

    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (d.ok) setDatos(d.clientes);
        else setError(d.error);
        setCargando(false);
      })
      .catch(e => { setError(e.message); setCargando(false); });
  }, [session.username]);

  const fmtM = n => {
    const abs = Math.abs(n);
    if (abs >= 1000000) return `$${(abs/1000000).toFixed(1)}M`;
    if (abs >= 1000)    return `$${Math.round(abs/1000)}K`;
    return `$${Math.round(abs).toLocaleString("es-AR")}`;
  };
  const fmtARS = n => Math.abs(n).toLocaleString("es-AR", {style:"currency",currency:"ARS",maximumFractionDigits:0});
  const fmtFecha = f => f ? f.split("-").reverse().join("/") : "—";

  if (cargando) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:200 }}>
      <div style={{ width:28, height:28, border:"2px solid #1e2a34", borderTopColor:"#c17f4a", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
    </div>
  );

  if (error) return <div style={{ padding:24, color:"#c25b4e", textAlign:"center" }}>Error: {error}</div>;

  // Extraer provincias únicas de los datos
  const provinciasDisponibles = React.useMemo(() => {
    const set = new Set();
    (datos||[]).forEach(c => { if(c.provincia) set.add(c.provincia); });
    return [...set].sort();
  }, [datos]);

  const conDeudaBase = (datos || []).filter(c => c.saldoTotal > 0);

  const conDeuda = React.useMemo(() => {
    let arr = conDeudaBase.filter(c => {
      if (busq && !c.cliente.toLowerCase().includes(busq.toLowerCase())) return false;
      if (filtroProv && c.provincia !== filtroProv) return false;
      return true;
    });
    if (ordenM === "mayor") arr = [...arr].sort((a,b) => b.saldoTotal - a.saldoTotal);
    else if (ordenM === "menor") arr = [...arr].sort((a,b) => a.saldoTotal - b.saldoTotal);
    else if (ordenA === "az") arr = [...arr].sort((a,b) => a.cliente.localeCompare(b.cliente,"es"));
    else if (ordenA === "za") arr = [...arr].sort((a,b) => b.cliente.localeCompare(a.cliente,"es"));
    return arr;
  }, [conDeudaBase, busq, filtroProv, ordenM, ordenA]);

  const sinDeuda = (datos||[]).filter(c => c.saldoTotal <= 0);
  const totalDeuda = conDeuda.reduce((a,c) => a + c.saldoTotal, 0);

  return (
    <div style={{ padding:"16px 16px 100px", background:"#0a0e14", minHeight:"100vh" }}>

      {/* Header */}
      <div style={{ marginBottom:16, marginTop:8 }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:600, color:"#f0ede8", marginBottom:4 }}>
          Cuentas Corrientes
        </div>
        <div style={{ fontSize:11, color:"#4a5060" }}>
          {esAdmin ? "Todos los vendedores" : `Cartera de ${session.nombre}`} · {new Date().toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"})}
        </div>
      </div>

      {/* KPI total */}
      <div style={{ background:"linear-gradient(135deg,#1a0f0a,#200d08)", border:"1px solid #c25b4e30", borderRadius:14, padding:"16px 18px", marginBottom:16 }}>
        <div style={{ fontSize:10, color:"#c25b4e", fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>
          Total a cobrar
        </div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:700, color:"#c25b4e" }}>
          {fmtARS(totalDeuda)}
        </div>
        <div style={{ fontSize:11, color:"#4a5060", marginTop:4 }}>
          {conDeuda.length} cliente{conDeuda.length !== 1 ? "s" : ""} con saldo pendiente
        </div>
      </div>

      {/* ── Barra de filtros ── */}
      <div style={{marginBottom:14}}>
        {/* Buscador */}
        <input placeholder="Buscar cliente..." value={busq} onChange={e=>{setBusq(e.target.value);}}
          style={{marginBottom:8,display:"block",width:"100%",boxSizing:"border-box"}}/>
        {/* Filtros rápidos */}
        <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
          {/* Monto */}
          <button onClick={()=>{setOrdenM(ordenM==="mayor"?"menor":ordenM==="menor"?null:"mayor");setOrdenA(null);}}
            style={{padding:"5px 12px",borderRadius:999,border:"1px solid "+(ordenM?"#c17f4a":"#1e2a34"),background:ordenM?"#c17f4a22":"transparent",color:ordenM?"#c17f4a":"#4a5060",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>
            {ordenM==="mayor"?"↓ Mayor monto":ordenM==="menor"?"↑ Menor monto":"$ Monto"}
          </button>
          {/* Alfabético */}
          <button onClick={()=>{setOrdenA(ordenA==="az"?"za":ordenA==="za"?null:"az");setOrdenM(null);}}
            style={{padding:"5px 12px",borderRadius:999,border:"1px solid "+(ordenA?"#7ba7bc":"#1e2a34"),background:ordenA?"#7ba7bc22":"transparent",color:ordenA?"#7ba7bc":"#4a5060",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>
            {ordenA==="az"?"A→Z":ordenA==="za"?"Z→A":"A-Z"}
          </button>
          {/* Provincias */}
          <select value={filtroProv} onChange={e=>setFiltroProv(e.target.value)}
            style={{padding:"5px 10px",borderRadius:999,border:"1px solid "+(filtroProv?"#5ab86e":"#1e2a34"),background:filtroProv?"#5ab86e18":"#080c10",color:filtroProv?"#5ab86e":"#4a5060",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0,appearance:"none",WebkitAppearance:"none"}}>
            <option value="">Zona</option>
            {provinciasDisponibles.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
          {/* Limpiar */}
          {(ordenM||ordenA||filtroProv||busq) && (
            <button onClick={()=>{setOrdenM(null);setOrdenA(null);setFiltroProv("");setBusq("");}}
              style={{padding:"5px 12px",borderRadius:999,border:"1px solid #1e2a34",background:"transparent",color:"#c25b4e",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Lista clientes con deuda */}
      {conDeuda.length === 0 ? (
        <div style={{ textAlign:"center", padding:40, color:"#4a5060" }}>Sin cuentas pendientes</div>
      ) : (
        conDeuda.map((c, i) => {
          const isOpen = abierto === c.cliente;
          const hoyStr = new Date().toISOString().slice(0,10);
          const vencidos = (c.comprobantes||[]).filter(cp => cp.vencimiento && cp.vencimiento < hoyStr && cp.saldo > 0);

          return (
            <div key={i} style={{ background:"#131a22", border:`1px solid ${vencidos.length > 0 ? "#c25b4e40" : "#1e2a34"}`, borderRadius:14, marginBottom:10, overflow:"hidden" }}>
              {/* Fila cliente */}
              <div onClick={() => setAbierto(isOpen ? null : c.cliente)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", cursor:"pointer" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#f0ede8", marginBottom:3 }}>
                    {c.cliente.split(" ").slice(0,4).join(" ")}
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    {vencidos.length > 0 && (
                      <span style={{ fontSize:9, fontWeight:700, color:"#c25b4e", background:"#c25b4e20", borderRadius:999, padding:"2px 7px", textTransform:"uppercase" }}>
                        {vencidos.length} vencido{vencidos.length > 1 ? "s" : ""}
                      </span>
                    )}
                    <span style={{ fontSize:10, color:"#4a5060" }}>
                      {(c.comprobantes||[]).filter(cp => cp.saldo > 0).length} comp.
                    </span>
                    {esAdmin && <span style={{ fontSize:10, color:"#4a5060" }}>· {c.vendedor}</span>}
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color: vencidos.length > 0 ? "#c25b4e" : "#c17f4a" }}>
                    {fmtM(c.saldoTotal)}
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <button onClick={e=>{e.stopPropagation();setMiniGest(c);}}
                      style={{background:"#1e2a34",border:"1px solid #2a3a48",borderRadius:8,padding:"4px 9px",color:"#c17f4a",fontSize:10,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
                      📝
                    </button>
                    <div style={{ fontSize:10, color:"#4a5060" }}>{isOpen ? "▲" : "▼"}</div>
                  </div>
                </div>
              </div>

              {/* Detalle comprobantes */}
              {isOpen && (
                <div style={{ borderTop:"1px solid #1e2a34" }}>
                  {/* Solo los que tienen saldo > 0 */}
                  {(c.comprobantes||[]).filter(cp => cp.saldo > 0).map((cp, j) => {
                    const vencido = cp.vencimiento && cp.vencimiento < hoyStr;
                    return (
                      <div key={j} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", borderBottom:"1px solid #0d1420", background: vencido ? "#120808" : "#0a0e14" }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:600, color:"#f0ede8" }}>{cp.comprobante}</div>
                          <div style={{ fontSize:10, color:"#4a5060", marginTop:2 }}>
                            {fmtFecha(cp.fecha)}
                            {cp.vencimiento && ` · vence ${fmtFecha(cp.vencimiento)}`}
                          </div>
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, color: vencido ? "#c25b4e" : "#c17f4a" }}>
                            {fmtARS(cp.saldo)}
                          </div>
                          {vencido && <div style={{ fontSize:9, color:"#c25b4e", marginTop:1 }}>VENCIDA</div>}
                        </div>
                      </div>
                    );
                  })}

                  {/* Botón WhatsApp */}
                  <div style={{ padding:"10px 16px" }}>
                    <button onClick={() => {
                      const nombre = c.cliente.split(" ").slice(0,2).map(w=>w.charAt(0)+w.slice(1).toLowerCase()).join(" ");
                      const detalle = (c.comprobantes||[]).filter(cp=>cp.saldo>0)
                        .map(cp=>`• ${cp.comprobante} — ${fmtFecha(cp.fecha)} — ${fmtARS(cp.saldo)}`).join("\n");
                      const txt = `Hola ${nombre}! 👋 Le recordamos que cuenta con los siguientes comprobantes pendientes de pago:\n\n${detalle}\n\n*Total: ${fmtARS(c.saldoTotal)}*\n\nQuedamos a disposición para coordinar la cancelación. Saludos, Central Eyewear 👓`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank");
                    }}
                      style={{ width:"100%", background:"#0f4a2a", color:"#25d366", border:"1px solid #25d36630", borderRadius:10, padding:"10px", fontSize:13, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                      <span style={{ fontSize:16 }}>💬</span> Enviar recordatorio WA
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Clientes en cero o a favor */}
      {sinDeuda.length > 0 && !busq && (
        <div style={{ marginTop:20, fontSize:10, color:"#2a3545", textAlign:"center" }}>
          {sinDeuda.length} cliente{sinDeuda.length > 1 ? "s" : ""} sin saldo pendiente
        </div>
      )}
      {/* Mini gestión rápida */}
      {miniGest && (
        <MiniGestion
          cliente={miniGest}
          session={session}
          onClose={() => setMiniGest(null)}
          onGuardado={() => setMiniGest(null)}
        />
      )}
    </div>
  );
}

// ─── CALCULADORA ──────────────────────────────────────────────────────────────
function Calculadora() {
  const [display, setDisplay] = useState("0");
  const [expr, setExpr] = useState("");
  const [historial, setHistorial] = useState([]);
  const [nuevoNum, setNuevoNum] = useState(true);

  const fmtDisplay = n => {
    if (n === "Error") return "Error";
    const num = parseFloat(n.replace(",","."));
    if (isNaN(num)) return n;
    // Si tiene decimales, mostrar hasta 8 decimales sin trailing zeros
    if (n.includes(",") || n.includes(".")) return n;
    return num.toLocaleString("es-AR");
  };

  const fmtARS = n => {
    const num = parseFloat(String(n).replace(",","."));
    if (isNaN(num)) return "";
    return num.toLocaleString("es-AR", { style:"currency", currency:"ARS", maximumFractionDigits:2 });
  };

  const presionar = val => {
    if (val === "AC") {
      setDisplay("0"); setExpr(""); setNuevoNum(true); return;
    }
    if (val === "⌫") {
      if (nuevoNum) { setDisplay("0"); return; }
      const nd = display.length > 1 ? display.slice(0,-1) : "0";
      setDisplay(nd);
      if (nd === "0") setNuevoNum(true);
      return;
    }
    if (val === "=") {
      try {
        const exprCompleta = expr + display.replace(",",".");
        const resultado = Function('"use strict"; return (' + exprCompleta + ')')();
        const resStr = Number.isInteger(resultado) ? String(resultado) : String(Math.round(resultado * 100000000) / 100000000);
        setHistorial(prev => [{ expr: exprCompleta, res: resStr }, ...prev].slice(0,5));
        setDisplay(resStr);
        setExpr("");
        setNuevoNum(true);
      } catch { setDisplay("Error"); setExpr(""); setNuevoNum(true); }
      return;
    }
    if (["+","-","×","÷"].includes(val)) {
      const op = val === "×" ? "*" : val === "÷" ? "/" : val;
      setExpr(prev => prev + display.replace(",",".") + op);
      setNuevoNum(true);
      return;
    }
    if (val === "%") {
      const n = parseFloat(display.replace(",",".")) / 100;
      setDisplay(String(n));
      setNuevoNum(true);
      return;
    }
    if (val === "+/-") {
      setDisplay(d => d.startsWith("-") ? d.slice(1) : d === "0" ? "0" : "-"+d);
      return;
    }
    if (val === ",") {
      if (nuevoNum) { setDisplay("0,"); setNuevoNum(false); return; }
      if (!display.includes(",")) setDisplay(d => d+",");
      return;
    }
    // Dígito
    if (nuevoNum) { setDisplay(val); setNuevoNum(false); }
    else setDisplay(d => d === "0" ? val : d.length < 12 ? d+val : d);
  };

  const exprFmt = expr.replace(/\*/g,"×").replace(/\//g,"÷");
  const numActual = parseFloat(display.replace(",","."));
  const hayResultado = !isNaN(numActual) && display !== "0";

  // Layout: fila, [btn, btn, ...], tipo por botón
  const FILAS = [
    [ {v:"AC",  t:"fn"}, {v:"+/-", t:"fn"}, {v:"%",  t:"fn"}, {v:"÷",  t:"op"} ],
    [ {v:"7",   t:"num"},{v:"8",  t:"num"},{v:"9",  t:"num"},{v:"×",  t:"op"} ],
    [ {v:"4",   t:"num"},{v:"5",  t:"num"},{v:"6",  t:"num"},{v:"-",  t:"op"} ],
    [ {v:"1",   t:"num"},{v:"2",  t:"num"},{v:"3",  t:"num"},{v:"+",  t:"op"} ],
    [ {v:"0",   t:"num0"},{v:",", t:"num"},{v:"⌫",  t:"fn"}, {v:"=",  t:"eq"} ],
  ];

  const BG  = { num:"#ffffff", op:"#c17f4a", fn:"#2a2a2a", eq:"#c17f4a" };
  const CLR = { num:"#000000", op:"#ffffff", fn:"#ffffff", eq:"#ffffff" };

  const btn = (v, t, opts={}) => ({ v, t, ...opts });

  // Gap entre botones
  const G = 10;
  // Altura base de un botón
  const H = 72;

  const btnStyle = (t, opts={}) => ({
    background: BG[t],
    color: CLR[t],
    border: "none",
    borderRadius: opts.wide ? H/2 : H/2,
    display: "flex",
    alignItems: opts.tall ? "flex-start" : "center",
    justifyContent: opts.wide ? "flex-start" : "center",
    paddingLeft: opts.wide ? 28 : 0,
    paddingTop: opts.tall ? 18 : 0,
    WebkitTapHighlightColor: "transparent",
    cursor: "pointer",
    fontFamily: "'LeagueSpartan',sans-serif",
    letterSpacing: -0.5,
    transition: "opacity .06s, transform .06s",
    touchAction: "manipulation",
    userSelect: "none",
    fontSize: ["AC","+/-","%","⌫","🗑"].includes(opts.label||"") ? 18 : 28,
    fontWeight: t === "num" ? 400 : 600,
  });

  return (
    <div style={{ background:"#000", minHeight:"calc(100vh - 60px)", display:"flex", flexDirection:"column", padding:"0 10px 16px" }}>

      {/* Display */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"16px 8px 12px", minHeight:150 }}>
        {historial.slice(0,2).map((h,i)=>(
          <div key={i} onClick={()=>{ setDisplay(h.res); setNuevoNum(true); }}
            style={{ fontSize:11, color:"#333", textAlign:"right", marginBottom:1, cursor:"pointer" }}>
            {h.expr.replace(/\*/g,"×").replace(/\//g,"÷")} = {h.res}
          </div>
        ))}
        {exprFmt ? <div style={{ fontSize:18, color:"#888", textAlign:"right", marginBottom:4 }}>{exprFmt}{display}</div> : null}
        <div style={{ fontSize: display.length > 9 ? 44 : display.length > 6 ? 58 : 80, fontWeight:200, color:"#fff", textAlign:"right", lineHeight:1, letterSpacing:-2, fontFamily:"'LeagueSpartan',sans-serif" }}>
          {fmtDisplay(display)}
        </div>
      </div>

      {/* Teclado — layout exacto 5 columnas */}
      {/* Usamos CSS grid absoluto para poder hacer = doble altura */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gridTemplateRows:`repeat(5, ${H}px)`, gap:G }}>

        {/* Fila 1: AC +/- % ← ⠿ */}
        {[
          {v:"AC", t:"fn", area:"1/1/2/2"},
          {v:"+/-",t:"fn", area:"1/2/2/3"},
          {v:"%",  t:"fn", area:"1/3/2/4"},
          {v:"⌫",  t:"fn", area:"1/4/2/5"},
          {v:"⠿",  t:"fn", area:"1/5/2/6", disabled:true},
        ].map(({v,t,area,disabled})=>(
          <button key={v} onClick={()=>!disabled&&presionar(v)}
            onPointerDown={e=>{ if(!disabled){e.currentTarget.style.opacity=".55";e.currentTarget.style.transform="scale(.92)";} }}
            onPointerUp={e=>{ e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)"; }}
            onPointerLeave={e=>{ e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)"; }}
            style={{ ...btnStyle(t,{label:v}), gridArea:area, opacity:disabled?.4:1, fontSize:v==="⠿"?20:18 }}>
            {v}
          </button>
        ))}

        {/* Fila 2: 7 8 9 ÷ 🗑 */}
        {[
          {v:"7",  t:"num", area:"2/1/3/2"},
          {v:"8",  t:"num", area:"2/2/3/3"},
          {v:"9",  t:"num", area:"2/3/3/4"},
          {v:"÷",  t:"op",  area:"2/4/3/5"},
          {v:"🗑", t:"fn",  area:"2/5/3/6"},
        ].map(({v,t,area})=>(
          <button key={v} onClick={()=>presionar(v==="🗑"?"AC":v)}
            onPointerDown={e=>{ e.currentTarget.style.opacity=".55";e.currentTarget.style.transform="scale(.92)"; }}
            onPointerUp={e=>{ e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)"; }}
            onPointerLeave={e=>{ e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)"; }}
            style={{ ...btnStyle(t,{label:v}), gridArea:area, fontSize:v==="🗑"?20:28 }}>
            {v}
          </button>
        ))}

        {/* Fila 3: 4 5 6 × ≡ */}
        {[
          {v:"4",  t:"num", area:"3/1/4/2"},
          {v:"5",  t:"num", area:"3/2/4/3"},
          {v:"6",  t:"num", area:"3/3/4/4"},
          {v:"×",  t:"op",  area:"3/4/4/5"},
          {v:"≡",  t:"fn",  area:"3/5/4/6", disabled:true},
        ].map(({v,t,area,disabled})=>(
          <button key={v} onClick={()=>!disabled&&presionar(v)}
            onPointerDown={e=>{ if(!disabled){e.currentTarget.style.opacity=".55";e.currentTarget.style.transform="scale(.92)";} }}
            onPointerUp={e=>{ e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)"; }}
            onPointerLeave={e=>{ e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)"; }}
            style={{ ...btnStyle(t,{label:v}), gridArea:area, opacity:disabled?.4:1, fontSize:v==="≡"?18:28 }}>
            {v}
          </button>
        ))}

        {/* Fila 4: 1 2 3 — (tall) = (tall) */}
        {[
          {v:"1", t:"num", area:"4/1/5/2"},
          {v:"2", t:"num", area:"4/2/5/3"},
          {v:"3", t:"num", area:"4/3/5/4"},
        ].map(({v,t,area})=>(
          <button key={v} onClick={()=>presionar(v)}
            onPointerDown={e=>{ e.currentTarget.style.opacity=".55";e.currentTarget.style.transform="scale(.92)"; }}
            onPointerUp={e=>{ e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)"; }}
            onPointerLeave={e=>{ e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)"; }}
            style={{ ...btnStyle(t), gridArea:area }}>
            {v}
          </button>
        ))}

        {/* — fila 4 col 4 — simple altura */}
        <button onClick={()=>presionar("-")}
          onPointerDown={e=>{ e.currentTarget.style.opacity=".55";e.currentTarget.style.transform="scale(.92)"; }}
          onPointerUp={e=>{ e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)"; }}
          onPointerLeave={e=>{ e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)"; }}
          style={{ ...btnStyle("op"), gridArea:"4/4/5/5" }}>
          −
        </button>

        {/* = doble altura filas 4-5 col 5 */}
        <button onClick={()=>presionar("=")}
          onPointerDown={e=>{ e.currentTarget.style.opacity=".55";e.currentTarget.style.transform="scale(.92)"; }}
          onPointerUp={e=>{ e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)"; }}
          onPointerLeave={e=>{ e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)"; }}
          style={{ ...btnStyle("eq",{tall:true}), gridArea:"4/5/6/6", boxShadow:"0 4px 24px #c17f4a40" }}>
          =
        </button>

        {/* Fila 5: 0 (wide) , + */}
        <button onClick={()=>presionar("0")}
          onPointerDown={e=>{ e.currentTarget.style.opacity=".55";e.currentTarget.style.transform="scale(.92)"; }}
          onPointerUp={e=>{ e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)"; }}
          onPointerLeave={e=>{ e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)"; }}
          style={{ ...btnStyle("num",{wide:true}), gridArea:"5/1/6/3" }}>
          0
        </button>

        <button onClick={()=>presionar(",")}
          onPointerDown={e=>{ e.currentTarget.style.opacity=".55";e.currentTarget.style.transform="scale(.92)"; }}
          onPointerUp={e=>{ e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)"; }}
          onPointerLeave={e=>{ e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)"; }}
          style={{ ...btnStyle("num"), gridArea:"5/3/6/4" }}>
          ,
        </button>

        <button onClick={()=>presionar("+")}
          onPointerDown={e=>{ e.currentTarget.style.opacity=".55";e.currentTarget.style.transform="scale(.92)"; }}
          onPointerUp={e=>{ e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)"; }}
          onPointerLeave={e=>{ e.currentTarget.style.opacity="1";e.currentTarget.style.transform="scale(1)"; }}
          style={{ ...btnStyle("op"), gridArea:"5/4/6/5" }}>
          +
        </button>

      </div>
    </div>
  );
}

// ─── VENTAS TAB ───────────────────────────────────────────────────────────────
function VentasTab({ ventasCliente, o }) {
  const [sel, setSel] = useState(new Set());
  const [ccItems, setCcItems]       = useState(null);
  const [ccCargando, setCcCargando] = useState(true);

  // Cargar facturas pendientes de Cuentas Corrientes para este cliente
  React.useEffect(() => {
    setCcCargando(true);
    fetch(`/api/cuentas-corrientes?vendedor=${o.vendedor}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          const nNorm = o.nombre.toUpperCase().trim();
          const match = (d.clientes || []).find(c => {
            const cNorm = c.cliente.toUpperCase().trim();
            return cNorm === nNorm || cNorm.startsWith(nNorm.split(" ")[0]) || nNorm.startsWith(cNorm.split(" ")[0]);
          });
          setCcItems(match ? (match?.comprobantes||[]).filter(cp => cp.saldo > 0) : []);
        } else { setCcItems([]); }
        setCcCargando(false);
      })
      .catch(() => { setCcItems([]); setCcCargando(false); });
  }, [o.airtableId]);

  const pendientes = ccItems || [];
  const totalPendiente = pendientes.reduce((a, cp) => a + cp.saldo, 0);

  // Historial Sinergia (referencia)
  const todos = (ventasCliente||[]).filter(v => v && v.importe !== 0);
  const totalHistorial = todos.filter(esVentaReal).reduce((a,v)=>a+v.importe,0);

  const selItems = todos.filter((_,i)=>sel.has(i));
  const totalSel = selItems.reduce((a,v)=>a+v.importe,0);

  const toggle = i => setSel(prev => { const n=new Set(prev); n.has(i)?n.delete(i):n.add(i); return n; });
  const selAll = () => setSel(new Set(todos.map((_,i)=>i)));
  const clear  = () => setSel(new Set());

  const esNC = v => {
    if (v.importe < 0) return true;
    const t = (v.tipo||v.comprobante||"").toUpperCase();
    return t.includes("NC") || t.includes("NOTA DE CR") || t.includes("CRED");
  };

  const fmtARS = n => {
    const abs = Math.abs(n).toLocaleString("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0});
    return n < 0 ? `-${abs}` : abs;
  };
  const fmtF = f => f ? new Date(f+"T12:00:00").toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"2-digit"}) : "—";

  // Tel del cliente para WhatsApp
  const tel = (o.whatsapp||o.telefono||"").replace(/\D/g,"");

  const abrirWA = () => {
    const nombre = o.nombre.split(" ").slice(0,2).map(w=>w.charAt(0)+w.slice(1).toLowerCase()).join(" ");
    const lineas = selItems.map(v=>`• ${v.comprobante||v.tipo||"—"} — ${fmtF(v.fecha)} — ${fmtARS(v.importe)}`).join("\n");
    const txt = `Hola ${nombre}! 👋 Te compartimos el detalle de comprobantes pendientes:\n\n${lineas}\n\n*Total: ${fmtARS(totalSel)}*\n\nQuedamos a disposición para coordinar el pago. Saludos, Central Eyewear 👓`;
    const url = tel
      ? `https://wa.me/54${tel}?text=${encodeURIComponent(txt)}`
      : `https://wa.me/?text=${encodeURIComponent(txt)}`;
    window.open(url, "_blank");
  };

  const verPdf = () => {
    const fecha = new Date().toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"})
      .replace(/^(\d+) de (\w)/, (_,d,m) => `${d} de ${m.toUpperCase()}`);
    const ciudad = [o.ciudad, o.provincia].filter(Boolean).join(", ");
    const rows = selItems.map(v=>`
      <tr>
        <td>${v.comprobante||v.tipo||"—"}</td>
        <td style="text-align:center">${fmtF(v.fecha)}</td>
        <td style="text-align:right">${fmtARS(v.importe)}.-</td>
      </tr>`).join("");

    // Isologo SVG — dos círculos superpuestos como en el branding
    const isologo = `<svg width="72" height="48" viewBox="0 0 100 66" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="36" cy="33" r="28" stroke="#111" stroke-width="3.5" fill="none"/>
      <circle cx="36" cy="33" r="11" stroke="#111" stroke-width="3" fill="none"/>
      <circle cx="64" cy="33" r="28" fill="#111" fill-opacity="0.92"/>
      <circle cx="36" cy="33" r="5" fill="#111"/>
      <circle cx="36" cy="33" r="5" fill="white" style="mix-blend-mode:difference"/>
    </svg>`;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;padding:52px 60px;max-width:800px;margin:0 auto;font-size:13px}
      .header{text-align:center;margin-bottom:40px}
      .header-logo{font-size:72px;font-weight:900;letter-spacing:12px;color:#111;font-family:Arial,Helvetica,sans-serif;line-height:1}
      .header-slogan{font-size:11px;letter-spacing:5px;color:#111;text-transform:uppercase;margin-top:6px;font-weight:700}
      .info-bar{background:#f0f0f0;padding:14px 20px;display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px}
      .info-bar .cliente-nombre{font-size:14px;font-weight:700;text-transform:uppercase;color:#111}
      .info-bar .cliente-ciudad{font-size:12px;color:#555;margin-top:3px}
      .info-bar .doc-tipo{font-size:14px;font-weight:700;text-transform:uppercase;color:#111;text-align:right}
      .info-bar .doc-fecha{font-size:12px;color:#555;margin-top:3px;text-align:right}
      .body-text{font-size:12.5px;line-height:1.8;color:#333;margin-bottom:14px}
      .gracias{font-size:12.5px;color:#333;margin-bottom:32px}
      table{width:100%;border-collapse:collapse;margin-bottom:0}
      thead tr{background:#111;color:#fff}
      thead th{padding:11px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;text-align:left}
      thead th:last-child{text-align:right}
      thead th:nth-child(2){text-align:center}
      tbody tr{border-bottom:1px solid #e0e0e0}
      tbody td{padding:10px 16px;font-size:13px;color:#111}
      tbody td:nth-child(2){text-align:center}
      tbody td:last-child{text-align:right}
      .total-row{background:#f0f0f0}
      .total-row td{padding:12px 16px;font-size:14px;font-weight:700;color:#111;border-bottom:none}
      .total-row td:last-child{text-align:right}
      .footer{margin-top:60px;text-align:center}
    </style>
    </head><body>

    <div class="header">
      <div class="header-logo">CENTRAL</div>
      <div class="header-slogan">Your Style, Our Passion</div>
    </div>

    <div class="info-bar">
      <div>
        <div class="cliente-nombre">${o.nombre}</div>
        ${ciudad?`<div class="cliente-ciudad">${ciudad}</div>`:""}
      </div>
      <div>
        <div class="doc-tipo">Solicitud de Pago</div>
        <div class="doc-fecha">${fecha}</div>
      </div>
    </div>

    <p class="body-text">Estimado cliente:<br>
    Nos ponemos en contacto con usted para recordarle que cuenta con comprobantes pendientes de pago. Quedamos a su disposición para coordinar la modalidad de cancelación que le resulte más conveniente.</p>

    <p class="gracias">Muchas gracias</p>

    <table>
      <thead>
        <tr><th>Comprobante</th><th>Fecha</th><th>Importe</th></tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="total-row">
          <td colspan="2"><strong>TOTAL A ABONAR</strong></td>
          <td><strong>${fmtARS(totalSel)}.-</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <svg width="90" height="62" viewBox="0 0 148 102" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="clipLeft">
            <circle cx="52" cy="51" r="44"/>
          </clipPath>
        </defs>
        <!-- Círculo izquierdo: solo outline, sin relleno -->
        <circle cx="52" cy="51" r="44" stroke="#111" stroke-width="4" fill="white"/>
        <!-- Anillo interior izquierdo -->
        <circle cx="52" cy="51" r="17" stroke="#111" stroke-width="4" fill="white"/>
        <!-- Círculo derecho: sólido negro -->
        <circle cx="96" cy="51" r="44" fill="#111"/>
        <!-- Restaurar el anillo interior sobre el círculo derecho -->
        <circle cx="52" cy="51" r="17" stroke="#111" stroke-width="4" fill="none" clip-path="url(#clipLeft)"/>
        <!-- Pupila: blanca sobre zona negra del círculo derecho -->
        <circle cx="52" cy="51" r="7" fill="white"/>
        <!-- Reborde del círculo izquierdo encima de todo -->
        <circle cx="52" cy="51" r="44" stroke="#111" stroke-width="4" fill="none"/>
      </svg>
    </div>

    </body></html>`;
    const w = window.open("","_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(()=>w.print(), 600);
  };

  const hoyStr = new Date().toISOString().slice(0,10);
  const fmtFecha = f => f ? f.split("-").reverse().join("/") : "—";

  if (ccCargando) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:120}}>
      <div style={{width:22,height:22,border:"2px solid #1e2a34",borderTopColor:"#c17f4a",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
    </div>
  );

  return (
    <div>
      {/* ── FACTURAS PENDIENTES ── */}
      <div style={{background:"#131a22",borderRadius:14,border:"1px solid #1e2a34",marginBottom:14,overflow:"hidden"}}>
        <div style={{padding:"14px 16px",borderBottom:"1px solid #1e2a34",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:9,color:"#c25b4e",textTransform:"uppercase",letterSpacing:1.5,fontWeight:700,marginBottom:4}}>Facturas pendientes</div>
            <div style={{fontSize:11,color:"#4a5060"}}>{pendientes.length} comprobante{pendientes.length!==1?"s":""}</div>
          </div>
          {totalPendiente > 0 && (
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"#c25b4e"}}>
              {totalPendiente.toLocaleString("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0})}
            </div>
          )}
        </div>
        {pendientes.length === 0 ? (
          <div style={{padding:"28px 16px",textAlign:"center",color:"#4a5060",fontSize:12}}>Sin facturas pendientes ✓</div>
        ) : (
          <>
            {pendientes.map((cp, i) => {
              const vencido = cp.vencimiento && cp.vencimiento < hoyStr;
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",borderBottom:"1px solid #0d1420",background:vencido?"#120808":"#0a0e14"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#f0ede8"}}>{cp.comprobante}</div>
                    <div style={{fontSize:10,color:"#4a5060",marginTop:2}}>
                      {fmtFecha(cp.fecha)}{cp.vencimiento && ` · vence ${fmtFecha(cp.vencimiento)}`}
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:13,fontWeight:800,color:vencido?"#c25b4e":"#c17f4a"}}>
                      {cp.saldo.toLocaleString("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0})}
                    </div>
                    {vencido && <div style={{fontSize:9,color:"#c25b4e",marginTop:1}}>VENCIDA</div>}
                  </div>
                </div>
              );
            })}
            <div style={{padding:"10px 16px"}}>
              <button onClick={() => {
                const tel = (o.whatsapp||o.telefono||"").replace(/\D/g,"");
                const nombre = o.nombre.split(" ").slice(0,2).map(w=>w.charAt(0)+w.slice(1).toLowerCase()).join(" ");
                const det = pendientes.map(cp=>`• ${cp.comprobante} — ${fmtFecha(cp.fecha)} — ${cp.saldo.toLocaleString("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0})}`).join("\n");
                const txt = `Hola ${nombre}! 👋 Facturas pendientes:\n\n${det}\n\n*Total: ${totalPendiente.toLocaleString("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0})}*\n\nSaludos, Central Eyewear 👓`;
                const url = tel?`https://wa.me/54${tel}?text=${encodeURIComponent(txt)}`:`https://wa.me/?text=${encodeURIComponent(txt)}`;
                window.open(url,"_blank");
              }} style={{width:"100%",background:"#25D366",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
                💬 Enviar por WhatsApp
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── HISTORIAL SINERGIA (referencia) ── */}
      {todos.length > 0 && (
        <div style={{background:"#0d1420",borderRadius:14,border:"1px solid #1a2430",overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid #1a2430",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:9,color:"#3a4a58",textTransform:"uppercase",letterSpacing:1.5,fontWeight:700,marginBottom:3}}>Historial · Sinergia</div>
              <div style={{fontSize:11,color:"#2a3a48"}}>{todos.length} comprobantes · referencia</div>
            </div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#3a4a58"}}>
              {totalHistorial.toLocaleString("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0})}
            </div>
          </div>
          {todos.slice(0,5).map((v,i) => {
            const nc = esNC(v);
            const comp = v.comprobante || v.tipo || "—";
            return (
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 16px",borderBottom:"1px solid #0a1018",opacity:.55}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#6a7880"}}>{comp}</div>
                  <div style={{fontSize:10,color:"#2a3848",marginTop:1}}>{v.fecha?new Date(v.fecha+"T12:00:00").toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"2-digit"}):"—"}</div>
                </div>
                <div style={{fontSize:12,fontWeight:700,color:nc?"#5a3a3a":"#4a5a68"}}>{fmtARS(v.importe)}</div>
              </div>
            );
          })}
          {todos.length > 5 && <div style={{padding:"8px 16px",textAlign:"center",fontSize:10,color:"#2a3848"}}>+{todos.length-5} más</div>}
        </div>
      )}
    </div>
  );
}



// ─── GESTIONES TAB ─────────────────────────────────────────────────────────
const TIPO_ICO  = { Llamada:"📞", WhatsApp:"💬", Visita:"🤝", Email:"✉️", Otro:"📝" };
const ESTADO_COL = { Contactado:"#5ab86e", "No contestó":"#e8924a", "Prometió pago":"#7ba7bc",
  "Pagó":"#5ab86e", "Sin respuesta":"#4a5060", Incobrable:"#c25b4e" };

function GestionesTab({ cliente, session }) {
  const [gestiones, setGestiones]     = React.useState(null);
  const [cargando,  setCargando]      = React.useState(true);
  const [form, setForm]               = React.useState({ tipo:"WhatsApp", estado:"Contactado", nota:"", fechaSeguimiento:"" });
  const fechaSug = new Date(Date.now() + 3*864e5).toISOString().slice(0,10);
  const [guardando, setGuardando]     = React.useState(false);
  const [abierto,   setAbierto]       = React.useState(false);
  const hoy = new Date().toISOString().slice(0,10);

  const cargar = () => {
    setCargando(true);
    fetch(`/api/gestiones?clienteId=${cliente.airtableId}`)
      .then(r=>r.json())
      .then(d=>{ setGestiones(d.ok ? d.gestiones : []); setCargando(false); })
      .catch(()=>{ setGestiones([]); setCargando(false); });
  };
  React.useEffect(cargar, [cliente.airtableId]);

  const guardar = async () => {
    if (!form.nota.trim()) return;
    setGuardando(true);
    try {
      const r = await fetch("/api/gestiones", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          clienteNombre: cliente.nombre,
          clienteId:     cliente.airtableId,
          vendedor:      cliente.vendedor || session.username,
          usuario:       session.username,
          fecha:         hoy,
          tipo:          form.tipo,
          estado:        form.estado,
          nota:          form.nota.trim(),
          fechaSeguimiento: form.fechaSeguimiento || "",
        })
      });
      const d = await r.json();
      if (d.ok) {
        setGestiones(prev => [d.gestion, ...(prev||[])]);
        setForm({ tipo:"WhatsApp", estado:"Contactado", nota:"" });
        setAbierto(false);
      }
    } finally { setGuardando(false); }
  };

  if (cargando) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:100}}>
      <div style={{width:22,height:22,border:"2px solid #1e2a34",borderTopColor:"#c17f4a",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
    </div>
  );

  return (
    <div>
      {/* Botón nueva gestión */}
      <button onClick={()=>setAbierto(v=>!v)}
        style={{width:"100%",background:abierto?"#0d1420":"#c17f4a",border:abierto?"1px solid #1e2a34":"none",borderRadius:12,padding:"13px",color:abierto?"#4a5060":"#020508",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginBottom:12}}>
        {abierto ? "✕ Cancelar" : "+ Registrar gestión"}
      </button>

      {/* Formulario */}
      {abierto && (
        <div style={{background:"#131a22",border:"1px solid #1e2a34",borderRadius:14,padding:"14px 16px",marginBottom:14}}>
          <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
            {["Llamada","WhatsApp","Visita","Email","Otro"].map(t=>(
              <button key={t} onClick={()=>setForm(p=>({...p,tipo:t}))}
                style={{padding:"6px 12px",borderRadius:999,border:`1px solid ${form.tipo===t?"#c17f4a":"#1e2a34"}`,background:form.tipo===t?"#c17f4a18":"transparent",color:form.tipo===t?"#c17f4a":"#4a5060",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                {TIPO_ICO[t]} {t}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
            {["Contactado","No contestó","Prometió pago","Pagó","Sin respuesta","Incobrable"].map(e=>{
              const c = ESTADO_COL[e]||"#4a5060";
              return (
                <button key={e} onClick={()=>setForm(p=>({...p,estado:e}))}
                  style={{padding:"5px 10px",borderRadius:999,border:`1px solid ${form.estado===e?c:"#1e2a34"}`,background:form.estado===e?c+"22":"transparent",color:form.estado===e?c:"#4a5060",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  {e}
                </button>
              );
            })}
          </div>
          <textarea value={form.nota} onChange={e=>setForm(p=>({...p,nota:e.target.value}))}
            placeholder="Anotá lo que pasó en el contacto..."
            rows={3}
            style={{width:"100%",boxSizing:"border-box",background:"#0d1420",border:"1px solid #1e2a34",borderRadius:10,padding:"10px 12px",color:"#f0ede8",fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none",marginBottom:10}}/>
          {/* Fecha seguimiento */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{fontSize:11,color:"#4a5060",flexShrink:0}}>📅 Seguimiento:</span>
            <input type="date" value={form.fechaSeguimiento} onChange={e=>setForm(p=>({...p,fechaSeguimiento:e.target.value}))}
              style={{flex:1,background:"#0d1420",border:"1px solid #1e2a34",borderRadius:8,padding:"7px 10px",color:"#f0ede8",fontSize:12,fontFamily:"inherit",outline:"none"}}/>
            <button onClick={()=>setForm(p=>({...p,fechaSeguimiento:fechaSug}))}
              style={{background:"#1e2a34",border:"none",borderRadius:8,padding:"7px 10px",color:"#4a5060",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
              +3d
            </button>
          </div>
          <button onClick={guardar} disabled={guardando||!form.nota.trim()}
            style={{width:"100%",background:form.nota.trim()?"#5ab86e":"#1e2a34",border:"none",borderRadius:10,padding:"12px",color:form.nota.trim()?"#020508":"#2a3a48",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",opacity:guardando?.6:1}}>
            {guardando ? "Guardando..." : "✓ Guardar gestión"}
          </button>
        </div>
      )}

      {/* Historial */}
      {(!gestiones || gestiones.length === 0) ? (
        <div style={{textAlign:"center",padding:"32px 16px",color:"#2a3a48",fontSize:12}}>Sin gestiones registradas aún</div>
      ) : (
        <div>
          <div style={{fontSize:9,color:"#3a4a58",textTransform:"uppercase",letterSpacing:1.5,fontWeight:700,marginBottom:10}}>Historial · {gestiones.length} gestión{gestiones.length!==1?"es":""}</div>
          {gestiones.map((g,i) => {
            const ec = ESTADO_COL[g.estado]||"#4a5060";
            return (
              <div key={i} style={{background:"#0d1420",border:"1px solid #1a2430",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:16}}>{TIPO_ICO[g.tipo]||"📝"}</span>
                    <span style={{fontSize:11,fontWeight:700,color:"#c8c4be"}}>{g.tipo||"Gestión"}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:999,background:ec+"22",color:ec,border:`1px solid ${ec}44`}}>{g.estado}</span>
                    <span style={{fontSize:10,color:"#2a3a48"}}>{g.fecha?.split("-").reverse().join("/")}</span>
                  </div>
                </div>
                {g.nota && <div style={{fontSize:12,color:"#6a7880",lineHeight:1.5}}>{g.nota}</div>}
                {g.fechaSeguimiento && (
                  <div style={{fontSize:10,color:"#7ba7bc",marginTop:4,display:"flex",alignItems:"center",gap:4}}>
                    📅 Seguimiento: <strong>{g.fechaSeguimiento.split("-").reverse().join("/")}</strong>
                    {g.fechaSeguimiento <= new Date().toISOString().slice(0,10) && <span style={{color:"#c25b4e",fontWeight:800,fontSize:9}}>· HOY/VENCIDO</span>}
                  </div>
                )}
                {g.usuario && <div style={{fontSize:9,color:"#1e2a34",marginTop:4}}>por {g.usuario}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ─── MINI GESTIÓN RÁPIDA ────────────────────────────────────────────────────
function MiniGestion({ cliente, session, onClose, onGuardado }) {
  const [form, setForm] = React.useState({ tipo:"WhatsApp", estado:"Contactado", nota:"", fechaSeguimiento:"" });
  const [guardando, setGuardando] = React.useState(false);
  const hoy = new Date().toISOString().slice(0,10);
  // Fecha sugerida para seguimiento: en 3 días
  const fechaSug = new Date(Date.now() + 3*864e5).toISOString().slice(0,10);

  const guardar = async () => {
    if (!form.nota.trim()) return;
    setGuardando(true);
    try {
      const r = await fetch("/api/gestiones", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          clienteNombre:    cliente.cliente || cliente.nombre,
          clienteId:        cliente.airtableId || "",
          vendedor:         cliente.vendedor || session.username,
          usuario:          session.username,
          fecha:            hoy,
          tipo:             form.tipo,
          estado:           form.estado,
          nota:             form.nota.trim(),
          fechaSeguimiento: form.fechaSeguimiento || "",
        })
      });
      const d = await r.json();
      if (d.ok) { onGuardado && onGuardado(d.gestion); onClose(); }
    } finally { setGuardando(false); }
  };

  const TIPO_ICO = { Llamada:"📞", WhatsApp:"💬", Visita:"🤝", Email:"✉️", Otro:"📝" };
  const ECOL = { Contactado:"#5ab86e","No contestó":"#e8924a","Prometió pago":"#7ba7bc",
    "Pagó":"#5ab86e","Sin respuesta":"#4a5060",Incobrable:"#c25b4e" };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(2,5,8,.88)",zIndex:600,display:"flex",alignItems:"flex-end"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:"100%",background:"#0d1420",borderRadius:"20px 20px 0 0",padding:"20px 16px 36px",boxShadow:"0 -8px 40px rgba(0,0,0,.7)"}}>
        <div style={{width:36,height:4,background:"#1a2a38",borderRadius:99,margin:"0 auto 16px"}}/>
        <div style={{fontSize:13,fontWeight:700,color:"#f0ede8",marginBottom:4}}>{cliente.cliente||cliente.nombre}</div>
        {cliente.saldoTotal > 0 && (
          <div style={{fontSize:11,color:"#c25b4e",marginBottom:14}}>
            Deuda: {cliente.saldoTotal.toLocaleString("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0})}
          </div>
        )}

        {/* Tipo */}
        <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
          {["Llamada","WhatsApp","Visita","Email","Otro"].map(t=>(
            <button key={t} onClick={()=>setForm(p=>({...p,tipo:t}))}
              style={{padding:"6px 11px",borderRadius:999,border:`1px solid ${form.tipo===t?"#c17f4a":"#1e2a34"}`,background:form.tipo===t?"#c17f4a18":"transparent",color:form.tipo===t?"#c17f4a":"#4a5060",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              {TIPO_ICO[t]} {t}
            </button>
          ))}
        </div>

        {/* Estado */}
        <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
          {Object.entries(ECOL).map(([e,c])=>(
            <button key={e} onClick={()=>setForm(p=>({...p,estado:e}))}
              style={{padding:"5px 10px",borderRadius:999,border:`1px solid ${form.estado===e?c:"#1e2a34"}`,background:form.estado===e?c+"22":"transparent",color:form.estado===e?c:"#4a5060",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              {e}
            </button>
          ))}
        </div>

        {/* Nota */}
        <textarea value={form.nota} onChange={e=>setForm(p=>({...p,nota:e.target.value}))}
          placeholder="¿Qué pasó? Anotá brevemente..."
          rows={2}
          style={{width:"100%",boxSizing:"border-box",background:"#060c14",border:"1px solid #1e2a34",borderRadius:10,padding:"10px 12px",color:"#f0ede8",fontSize:13,fontFamily:"inherit",resize:"none",outline:"none",marginBottom:10}}/>

        {/* Fecha seguimiento */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <span style={{fontSize:11,color:"#4a5060",flexShrink:0}}>📅 Seguimiento:</span>
          <input type="date" value={form.fechaSeguimiento} onChange={e=>setForm(p=>({...p,fechaSeguimiento:e.target.value}))}
            style={{flex:1,background:"#060c14",border:"1px solid #1e2a34",borderRadius:8,padding:"7px 10px",color:"#f0ede8",fontSize:12,fontFamily:"inherit",outline:"none"}}/>
          <button onClick={()=>setForm(p=>({...p,fechaSeguimiento:fechaSug}))}
            style={{background:"#1e2a34",border:"none",borderRadius:8,padding:"7px 10px",color:"#4a5060",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
            +3 días
          </button>
        </div>

        <button onClick={guardar} disabled={guardando||!form.nota.trim()}
          style={{width:"100%",background:form.nota.trim()?"#c17f4a":"#1e2a34",border:"none",borderRadius:12,padding:"14px",color:form.nota.trim()?"#020508":"#2a3a48",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit",opacity:guardando?.6:1}}>
          {guardando ? "Guardando..." : "✓ Guardar gestión"}
        </button>
      </div>
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr,  setLoginErr]  = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);

  const doLogin = async () => {
    const u = loginUser.trim();
    const p = loginPass.trim();
    if (!u || !p) { setLoginErr("Completá usuario y contraseña"); return; }

    setLoading(true);
    setLoginErr("");

    // Credenciales locales de emergencia (fallback si Airtable no responde)
    const LOCAL = {
      ale:     { pass:"Hashem",      role:"admin",           nombre:"Ale" },
      matias:  { pass:"1crack",      role:"vendedor",        nombre:"Matías" },
      miguel:  { pass:"1bueno",      role:"vendedor",        nombre:"Miguel" },
      nicolas: { pass:"1fenomeno",   role:"vendedor",        nombre:"Nicolás" },
      mauro:   { pass:"1grande",     role:"vendedor",        nombre:"Mauro" },
      central: { pass:"central2026", role:"vendedor",        nombre:"Alexis" },
      daniela: { pass:"1admin",      role:"administracion",  nombre:"Daniela" },
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      let resp, data;
      try {
        resp = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: u, password: p }),
          signal: controller.signal
        });
        clearTimeout(timeout);
        data = await resp.json();
      } catch (networkErr) {
        // Solo llega acá si hay error de RED (timeout, sin conexión)
        // En ese caso usar fallback local
        clearTimeout(timeout);
        const key = u.toLowerCase();
        const found = LOCAL[key];
        if (found && found.pass === p) {
          onLogin({ username: key, role: found.role, nombre: found.nombre, email: "" });
        } else {
          setLoginErr("Sin conexión y usuario no reconocido localmente.");
        }
        setLoading(false);
        return;
      }

      // Airtable respondió — respetar su decisión siempre
      if (!resp.ok || !data.ok) {
        setLoginErr(data.error || "Usuario o contraseña incorrectos");
        setLoading(false);
        return;
      }

      onLogin(data.session);
      setLoading(false);

    } catch (e) {
      setLoginErr("Error inesperado. Intentá de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div style={{ background:"#06090d", minHeight:"100dvh", display:"flex",
      flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:"40px 24px", position:"relative", overflow:"hidden" }}>
      <style>{CSS}</style>

      {/* Glow de fondo */}
      <div style={{ position:"absolute", top:"25%", left:"50%", transform:"translate(-50%,-50%)",
        width:360, height:360, borderRadius:"50%",
        background:"radial-gradient(circle, rgba(200,132,78,.07) 0%, transparent 70%)",
        pointerEvents:"none" }}/>

      <div style={{ width:"100%", maxWidth:340, position:"relative", zIndex:1,
        display:"flex", flexDirection:"column", alignItems:"center", animation:"fadeIn .5s ease both" }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:56 }}>
          <div style={{ fontFamily:"'Playfair Display',serif",
            fontSize:"clamp(42px,11vw,62px)", fontWeight:700, letterSpacing:6,
            color:"#f2ede6", lineHeight:1, marginBottom:8 }}>CENTRAL</div>
          <div style={{ fontSize:10, letterSpacing:5, color:"#5a6878",
            textTransform:"uppercase", fontWeight:500 }}>Eyewear · CRM</div>
        </div>

        <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <div style={{ fontSize:9, color:"#5a6878", textTransform:"uppercase",
              letterSpacing:2, fontWeight:700, marginBottom:6 }}>Usuario</div>
            <input value={loginUser} onChange={e=>setLoginUser(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&doLogin()}
              placeholder="Tu usuario" autoCapitalize="none" autoCorrect="off" />
          </div>
          <div>
            <div style={{ fontSize:9, color:"#5a6878", textTransform:"uppercase",
              letterSpacing:2, fontWeight:700, marginBottom:6 }}>Contraseña</div>
            <div style={{ position:"relative" }}>
              <input value={loginPass} onChange={e=>setLoginPass(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&doLogin()}
                type={showPass?"text":"password"} placeholder="Tu contraseña"
                style={{ paddingRight:"48px!important" }} />
              <button onClick={()=>setShowPass(p=>!p)}
                style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", color:"#5a6878", fontSize:15, padding:4 }}>
                {showPass?"🙈":"👁"}
              </button>
            </div>
          </div>

          {loginErr && (
            <div style={{ fontSize:12, color:"#e06860", textAlign:"center",
              fontWeight:700, padding:"8px 12px", background:"rgba(192,88,80,.1)",
              borderRadius:8, border:"1px solid rgba(192,88,80,.2)" }}>
              {loginErr}
            </div>
          )}

          <button onClick={doLogin} disabled={loading}
            style={{ width:"100%", background: loading?"#1e2c3a":"linear-gradient(135deg,#c8844e,#d49662)",
              border:"none", borderRadius:13, padding:"15px",
              color: loading?"#5a6878":"#06090d",
              fontSize:15, fontWeight:900, marginTop:4, letterSpacing:.5,
              boxShadow: loading?"none":"0 8px 24px rgba(200,132,78,.3)",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {loading ? <><div className="spin" style={{width:18,height:18,border:"2px solid #3a4858",borderTopColor:"#c8844e",borderRadius:"50%"}}/> Ingresando...</> : "Ingresar →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
/* ══════════════════════════════════════════════════════════════════════════
   NOTA DE PEDIDO DIGITAL — PedidoWizard + MisPedidos
   Carga rápida: buscar modelo → tocar cada color suma 1 unidad → precio
   automático (lista sin/con IVA + recargo por provincia desde CONFIG),
   editable por el vendedor (manual, descuento % o sin cargo).
   ══════════════════════════════════════════════════════════════════════════ */

const PW_CACHE_KEY = "ce_catalogo_cache";
const PW_CACHE_MIN = 10;
const pwWipKey = (u) => `pedido_wip_${u}`;
const pwPeso = (n) => "$ " + Math.round(n || 0).toLocaleString("es-AR");
const pwCant = (it) => (it.colores || []).reduce((a, c) => a + (c.cantidad || 0), 0);
const pwSubtotal = (it) => (it.sinCargo ? 0 : pwCant(it) * (it.precioUnitario || 0));
const PW_COND_VENTA = ["Contado", "30", "30-60", "30-60-90", "60-90-120"];
const PW_DESCUENTOS = [5, 10, 15, 20];

function usePwCatalogo() {
  const [cat, setCat] = useState(null);
  const [err, setErr] = useState(null);
  const cargar = useCallback((force) => {
    try {
      if (!force) {
        const raw = localStorage.getItem(PW_CACHE_KEY);
        if (raw) {
          const c = JSON.parse(raw);
          if (Date.now() - c.ts < PW_CACHE_MIN * 60000) { setCat(c.data); return; }
        }
      }
    } catch (e) {}
    fetch("/api/pedidos?seccion=catalogo")
      .then((r) => { if (!r.ok) throw new Error("Error " + r.status); return r.json(); })
      .then((data) => {
        setCat(data);
        try { localStorage.setItem(PW_CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch (e) {}
      })
      .catch((e) => setErr(String(e.message || e)));
  }, []);
  useEffect(() => { cargar(false); }, [cargar]);
  return { cat, err, recargar: () => cargar(true) };
}

function pwPrecioAuto(colorObj, tipoLista, cliente, config) {
  let p = tipoLista === "coniva" ? colorObj.coniva : colorObj.siniva;
  if (cliente && config && config.recargoProvincia) {
    const prov = String(cliente.provincia || "").toUpperCase().trim();
    if (config.recargoProvincia[prov]) p += config.recargoProvincia[prov];
  }
  return p;
}

function PedidoWizard({ session, clientes, pedidoCtx, onClose, onNuevaOptica }) {
  const { cat, err, recargar } = usePwCatalogo();
  const draft = pedidoCtx && pedidoCtx.draft;
  const wip = useMemo(() => {
    if (draft) return null;
    try {
      const raw = localStorage.getItem(pwWipKey(session.username));
      if (!raw) return null;
      const w = JSON.parse(raw);
      return (w.items || []).length ? w : null;
    } catch (e) { return null; }
  }, []);
  const [paso, setPaso] = useState(1); // 1 artículos · 2 cliente · 3 revisión
  const [items, setItems] = useState(draft ? draft.items || [] : (wip ? wip.items : []));
  const [cliente, setCliente] = useState(
    (pedidoCtx && pedidoCtx.cliente) ||
    (draft && clientes.find((c) => c.airtableId === draft.clienteRecordId)) ||
    (wip && clientes.find((c) => c.airtableId === wip.clienteId)) || null
  );
  const [tipoLista, setTipoLista] = useState(draft ? draft.tipoLista || "siniva" : (wip && wip.tipoLista) || "siniva");
  const [condVenta, setCondVenta] = useState(draft ? draft.condVenta : (wip && wip.condVenta) || "");
  const [obs, setObs] = useState(draft ? draft.observaciones : (wip && wip.obs) || "");
  const [recordId, setRecordId] = useState(draft ? draft.recordId : (wip && wip.recordId) || null);
  const [busca, setBusca] = useState("");
  const [abierto, setAbierto] = useState(null);
  const [selColores, setSelColores] = useState({});
  const [buscaCli, setBuscaCli] = useState("");
  const [editPrecio, setEditPrecio] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errEnvio, setErrEnvio] = useState(null);
  const [exito, setExito] = useState(null);
  const [pregCopia, setPregCopia] = useState(false);
  const [copiaCli, setCopiaCli] = useState(null);
  const [emailCli, setEmailCli] = useState("");

  const config = cat && cat.config;
  useEffect(() => { if (config && !draft && !wip) setTipoLista(config.ivaDefault || "siniva"); }, [config]);

  const unidades = items.reduce((a, i) => a + pwCant(i), 0);
  const total = items.reduce((a, i) => a + pwSubtotal(i), 0);

  useEffect(() => {
    if (!items.length && !cliente) return;
    try {
      localStorage.setItem(pwWipKey(session.username), JSON.stringify({
        items, clienteId: cliente && cliente.airtableId, tipoLista, condVenta, obs, recordId, ts: Date.now(),
      }));
    } catch (e) {}
  }, [items, cliente, tipoLista, condVenta, obs, recordId]);
  const limpiarWip = () => { try { localStorage.removeItem(pwWipKey(session.username)); } catch (e) {} };

  const repricear = (nuevoTipo, nuevoCliente) => {
    if (!cat) return;
    const porKey = {};
    (cat.modelos || []).forEach((m) => { porKey[m.marca + "|" + m.modelo] = m; });
    setItems((prev) => prev.map((it) => {
      if (it.precioManual || it.sinCargo || it.descuentoPct) return it;
      const m = porKey[(it.marca || "") + "|" + it.modelo];
      if (!m) return it;
      const c0 = m.colores.find((c) => (it.colores || []).some((ic) => ic.color === c.color)) || m.colores[0];
      if (!c0) return it;
      const p = pwPrecioAuto(c0, nuevoTipo, nuevoCliente, config);
      return { ...it, precioUnitario: p, precioLista: p };
    }));
  };
  const elegirCliente = (c) => { repricear(tipoLista, c); setCliente(c); setPaso(3); };
  const cambiarIva = (t) => { setTipoLista(t); repricear(t, cliente); };

  const agregarSeleccion = (m) => {
    const porPrecio = {};
    for (const c of m.colores) {
      const cant = selColores[c.color || "_"];
      if (!cant) continue;
      const p = pwPrecioAuto(c, tipoLista, cliente, config);
      (porPrecio[p] = porPrecio[p] || []).push({ color: c.color, cantidad: cant, codigo: c.codigo });
    }
    if (!Object.keys(porPrecio).length) return;
    setItems((prev) => {
      const copia = prev.slice();
      for (const precio of Object.keys(porPrecio)) {
        const p = Number(precio);
        const colores = porPrecio[precio];
        const idx = copia.findIndex((it) =>
          it.modelo === m.modelo && it.marca === m.marca && !it.precioManual && !it.sinCargo &&
          !it.descuentoPct && it.precioUnitario === p);
        if (idx >= 0) {
          const it = { ...copia[idx], colores: copia[idx].colores.slice() };
          for (const nc of colores) {
            const ci = it.colores.findIndex((x) => x.color === nc.color);
            if (ci >= 0) it.colores[ci] = { ...it.colores[ci], cantidad: it.colores[ci].cantidad + nc.cantidad };
            else it.colores.push(nc);
          }
          copia[idx] = it;
        } else {
          copia.push({ marca: m.marca, modelo: m.modelo, colores, precioUnitario: p, precioLista: p });
        }
      }
      return copia;
    });
    setAbierto(null); setSelColores({}); setBusca("");
  };

  const guardarBorrador = async (silencioso) => {
    const body = {
      vendedor: session.username, cliente: cliente ? cliente.nombre : "",
      clienteRecordId: cliente ? cliente.airtableId : "",
      items, tipoLista, condVenta, observaciones: obs,
    };
    try {
      if (recordId) {
        await fetch("/api/pedidos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recordId, ...body }) });
      } else {
        const r = await fetch("/api/pedidos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const j = await r.json();
        if (j.recordId) setRecordId(j.recordId);
      }
      if (!silencioso) { limpiarWip(); onClose("borrador"); }
      return true;
    } catch (e) { if (!silencioso) alert("No se pudo guardar el borrador: " + e); return false; }
  };

  const enviar = async (confirmarPrecios) => {
    setEnviando(true); setErrEnvio(null);
    try {
      let rid = recordId;
      const base = {
        vendedor: session.username, cliente: cliente.nombre, clienteRecordId: cliente.airtableId,
        items, tipoLista, condVenta, observaciones: obs,
      };
      if (!rid) {
        const r = await fetch("/api/pedidos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(base) });
        rid = (await r.json()).recordId; setRecordId(rid);
      } else {
        await fetch("/api/pedidos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recordId: rid, ...base }) });
      }
      const r = await fetch("/api/pedidos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        action: "enviar", recordId: rid,
        copiaCliente: !!copiaCli, emailCliente: emailCli, guardarEmailCliente: copiaCli && !cliente.mail,
        vendedorNombre: session.nombre, confirmarPrecios: !!confirmarPrecios,
        clienteInfo: {
          domicilio: cliente.domicilio || "", localidad: cliente.ciudad || "", provincia: cliente.provincia || "",
          cuit: cliente.cuit || "", condicionIva: cliente.condicionIva || "", telefono: cliente.telefono || "",
        },
      }) });
      const j = await r.json();
      if (r.status === 409 && j.priceChanges) {
        const det = j.priceChanges.map((c) => `${c.modelo}: ${pwPeso(c.anterior)} → ${pwPeso(c.vigente)}`).join("\n");
        if (confirm("Algunos precios de lista cambiaron desde que armaste el pedido:\n\n" + det + "\n\n¿Enviar con los precios vigentes?")) return enviar(true);
        setEnviando(false); return;
      }
      if (!r.ok) throw new Error(j.error || "Error " + r.status);
      limpiarWip(); setExito(j);
    } catch (e) { setErrEnvio(String(e.message || e)); }
    setEnviando(false);
  };

  const W = {
    wrap: { padding: "16px 16px 130px", overflowY: "auto" },
    card: { background: "#111820", border: "1px solid #1e2c3a", borderRadius: 14, padding: "13px 14px", marginBottom: 8 },
    chip: (on) => ({ display: "inline-block", padding: "9px 14px", margin: "3px 6px 3px 0", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer", border: on ? "1.5px solid #c8844e" : "1.5px solid #1e2c3a", background: on ? "#c8844e" : "#111820", color: on ? "#080c10" : "#c8c4be" }),
    colorBtn: (n) => ({ position: "relative", minWidth: 62, padding: "13px 8px", margin: "3px 6px 3px 0", borderRadius: 12, fontSize: 14.5, fontWeight: 800, textAlign: "center", cursor: "pointer", border: n ? "1.5px solid #c8844e" : "1.5px solid #2a3a4a", background: n ? "#c8844e" : "#0d141c", color: n ? "#080c10" : "#f2ede6" }),
    badge: { position: "absolute", top: -7, right: -7, background: "#c05850", color: "#fff", borderRadius: 999, minWidth: 20, height: 20, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" },
    barra: { position: "fixed", left: 0, right: 0, bottom: 62, maxWidth: 480, margin: "0 auto", background: "#c8844e", color: "#080c10", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 60, borderRadius: "14px 14px 0 0" },
    label: { fontSize: 9, fontWeight: 700, color: "#8a8880", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 },
  };

  if (exito) return (
    <div style={{ ...W.wrap, textAlign: "center", paddingTop: 60 }}>
      <div style={{ fontSize: 54 }}>✅</div>
      <h2 style={{ fontSize: 22, margin: "12px 0 6px", color: "#f2ede6", fontFamily: "'Playfair Display',serif" }}>Pedido {exito.pedidoId} enviado</h2>
      <p style={{ color: "#c8c4be", fontSize: 15 }}>{exito.unidades} unidades · {pwPeso(exito.total)}</p>
      <p style={{ color: "#8a8880", fontSize: 13 }}>Enviado a {exito.emailedTo.join(" y ")}</p>
      {(exito.warnings || []).map((w, i) => <p key={i} style={{ color: "#c8844e", fontSize: 12.5 }}>⚠️ {w}</p>)}
      <div style={{ marginTop: 24 }}><BtnPrimary full onClick={() => onClose("enviado")}>Listo</BtnPrimary></div>
    </div>
  );

  const cabecera = (titulo, atras) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {atras && <BtnSecondary sm onClick={atras}>←</BtnSecondary>}
        <span style={{ fontSize: 17, fontWeight: 800, color: "#f2ede6", fontFamily: "'Playfair Display',serif" }}>{titulo}</span>
      </div>
      <BtnSecondary sm onClick={async () => {
        if (items.length) await guardarBorrador(true);
        limpiarWip();
        onClose(items.length ? "borrador" : null);
      }}>✕</BtnSecondary>
    </div>
  );

  /* paso 1 — artículos */
  if (paso === 1) {
    if (err) return <div style={W.wrap}>{cabecera("Nuevo pedido")}<div style={W.card}><span style={{ color: "#c05850", fontSize: 13 }}>Error cargando catálogo: {err}</span><div style={{ marginTop: 10 }}><BtnSecondary onClick={recargar}>Reintentar</BtnSecondary></div></div></div>;
    if (!cat) return <div style={W.wrap}>{cabecera("Nuevo pedido")}<div style={{ textAlign: "center", padding: 50 }}><Spinner /></div></div>;
    const q = busca.toUpperCase().trim();
    const mods = (cat.modelos || []).filter((m) => !q || m.modelo.includes(q) || m.marca.includes(q));
    const selTotal = Object.keys(selColores).reduce((a, k) => a + selColores[k], 0);
    return (
      <div style={W.wrap}>
        {cabecera("Nuevo pedido")}
        <div style={{ position: "sticky", top: -16, background: "#06090d", padding: "4px 0 8px", zIndex: 40 }}>
          <input placeholder="Buscar modelo o marca…" value={busca} autoFocus
            onChange={(e) => { setBusca(e.target.value); setAbierto(null); setSelColores({}); }} />
          {cliente && <div style={{ fontSize: 12, color: "#8a8880", marginTop: 6 }}>Cliente: <b style={{ color: "#c8c4be" }}>{cliente.nombre}</b></div>}
        </div>
        {mods.slice(0, 30).map((m) => {
          const key = m.marca + "|" + m.modelo;
          const precios = m.colores.map((c) => pwPrecioAuto(c, tipoLista, cliente, config));
          const pMin = Math.min.apply(null, precios), pMax = Math.max.apply(null, precios);
          return (
            <div key={key} style={{ ...W.card, cursor: "pointer" }} onClick={() => { if (abierto !== key) { setAbierto(key); setSelColores({}); } }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#f2ede6" }}>{m.modelo}</span>
                  {m.marca !== "CENTRAL" && <span style={{ fontSize: 11, color: "#8a8880", marginLeft: 8 }}>{m.marca}</span>}
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#c8844e" }}>{pMin === pMax ? pwPeso(pMin) : "desde " + pwPeso(pMin)}</span>
              </div>
              {abierto === key && (
                <div style={{ marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ fontSize: 11, color: "#8a8880", marginBottom: 4 }}>Tocá cada color para sumar unidades{m.colores.length > 1 ? " (podés elegir varios)" : ""}:</div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {m.colores.map((c) => {
                      const k = c.color || "_";
                      const n = selColores[k] || 0;
                      return (
                        <button key={k} style={W.colorBtn(n)} onClick={() => setSelColores({ ...selColores, [k]: n + 1 })}>
                          {c.color || "ÚNICO"}
                          {n > 0 && <span style={W.badge}>{n}</span>}
                        </button>
                      );
                    })}
                  </div>
                  {selTotal > 0 && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                      <BtnSecondary sm onClick={() => {
                        const copia = { ...selColores };
                        const ks = Object.keys(copia).filter((k) => copia[k] > 0);
                        const last = ks[ks.length - 1];
                        if (last) { copia[last]--; if (!copia[last]) delete copia[last]; setSelColores(copia); }
                      }}>− quitar</BtnSecondary>
                      <div style={{ flex: 1 }}>
                        <BtnPrimary full onClick={() => agregarSeleccion(m)}>Agregar {selTotal} {selTotal === 1 ? "unidad" : "unidades"}</BtnPrimary>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {mods.length === 0 && <Empty icon="🔍" msg={"Sin resultados para “" + busca + "”"} />}
        <div style={W.barra}>
          <span style={{ fontSize: 14, fontWeight: 800 }}>{unidades} unid. · {pwPeso(total)}</span>
          <button disabled={!items.length} onClick={() => setPaso(cliente ? 3 : 2)}
            style={{ background: "#080c10", color: "#f2ede6", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer", opacity: items.length ? 1 : 0.4 }}>
            {cliente ? "Revisar →" : "Elegir cliente →"}
          </button>
        </div>
      </div>
    );
  }

  /* paso 2 — cliente */
  if (paso === 2) {
    const qc = buscaCli.toUpperCase().trim();
    const propios = (clientes || []).filter((c) => !qc || String(c.nombre || "").toUpperCase().includes(qc));
    return (
      <div style={W.wrap}>
        {cabecera("¿Para qué cliente?", () => setPaso(1))}
        <div style={{ marginBottom: 10 }}>
          <input placeholder="Buscar en tu cartera…" value={buscaCli} autoFocus onChange={(e) => setBuscaCli(e.target.value)} />
        </div>
        <div style={{ marginBottom: 10 }}><BtnSecondary full onClick={() => onNuevaOptica && onNuevaOptica()}>+ Nueva óptica</BtnSecondary></div>
        {propios.slice(0, 30).map((c) => (
          <div key={c.airtableId} style={{ ...W.card, cursor: "pointer" }} onClick={() => elegirCliente(c)}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f2ede6" }}>{c.nombre}</div>
            <div style={{ fontSize: 12, color: "#8a8880" }}>{[c.ciudad, c.provincia].filter(Boolean).join(" · ")}</div>
          </div>
        ))}
      </div>
    );
  }

  /* paso 3 — revisión */
  const actualizarItem = (i, cambios) => {
    const copia = items.slice();
    copia[i] = { ...copia[i], ...cambios };
    setItems(copia);
  };
  return (
    <div style={W.wrap}>
      {cabecera("Revisar pedido", () => setPaso(1))}
      <div style={{ ...W.card, background: "#0d141c" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#f2ede6" }}>{cliente ? cliente.nombre : "Sin cliente"}</div>
        <div style={{ fontSize: 12, color: "#7eaec4", cursor: "pointer", marginTop: 2 }} onClick={() => setPaso(2)}>cambiar cliente</div>
        <div style={{ marginTop: 8 }}>
          <button style={W.chip(tipoLista === "siniva")} onClick={() => cambiarIva("siniva")}>Sin IVA</button>
          <button style={W.chip(tipoLista === "coniva")} onClick={() => cambiarIva("coniva")}>Con IVA</button>
        </div>
      </div>
      {items.map((it, i) => (
        <div key={i} style={W.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: "#f2ede6" }}>{it.modelo}</span>
              {it.marca !== "CENTRAL" && <span style={{ color: "#8a8880", fontSize: 11, marginLeft: 6 }}>{it.marca}</span>}
              <div style={{ fontSize: 12.5, color: "#c8c4be", marginTop: 2 }}>
                {(it.colores || []).filter((c) => c.color).map((c) => c.color + (c.cantidad > 1 ? ` (${c.cantidad})` : "")).join(";  ") || "único"}
                {" · "}<b>{pwCant(it)} u</b>
              </div>
              <div style={{ fontSize: 12.5, marginTop: 3, cursor: "pointer", color: "#c8c4be" }} onClick={() => setEditPrecio(editPrecio === i ? null : i)}>
                {it.sinCargo
                  ? <b style={{ color: "#62955c" }}>SIN CARGO (bonificación)</b>
                  : <span>{pwCant(it)} × <b>{pwPeso(it.precioUnitario)}</b>
                      {it.descuentoPct ? <span style={{ color: "#c05850" }}> (-{it.descuentoPct}%)</span> : null}
                      {it.precioManual ? <span style={{ color: "#8a8880" }}> (manual)</span> : null}
                      {" = "}<b style={{ color: "#c8844e" }}>{pwPeso(pwSubtotal(it))}</b></span>}
                <span style={{ color: "#8a8880" }}> ✎</span>
              </div>
            </div>
            <button style={{ border: "none", background: "none", fontSize: 16, color: "#c05850", cursor: "pointer" }} onClick={() => setItems(items.filter((_, j) => j !== i))}>🗑</button>
          </div>
          {editPrecio === i && (
            <div style={{ marginTop: 8, borderTop: "1px solid #1e2c3a", paddingTop: 8 }}>
              <div style={{ fontSize: 11, color: "#8a8880", marginBottom: 4 }}>Precio lista: {pwPeso(it.precioLista)} — ajustar:</div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center" }}>
                {PW_DESCUENTOS.map((d) => (
                  <button key={d} style={W.chip(it.descuentoPct === d)} onClick={() =>
                    actualizarItem(i, it.descuentoPct === d
                      ? { descuentoPct: null, sinCargo: false, precioManual: false, precioUnitario: it.precioLista }
                      : { descuentoPct: d, sinCargo: false, precioManual: false, precioUnitario: Math.round(it.precioLista * (1 - d / 100)) })
                  }>-{d}%</button>
                ))}
                <button style={W.chip(!!it.sinCargo)} onClick={() =>
                  actualizarItem(i, it.sinCargo
                    ? { sinCargo: false, descuentoPct: null, precioManual: false, precioUnitario: it.precioLista }
                    : { sinCargo: true, descuentoPct: null, precioManual: false, precioUnitario: 0 })
                }>Sin cargo</button>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                <span style={{ fontSize: 12.5, color: "#8a8880", whiteSpace: "nowrap" }}>Precio manual $</span>
                <input type="number" min="0" style={{ maxWidth: 130 }}
                  value={it.precioManual ? it.precioUnitario : ""}
                  placeholder={String(it.precioLista)}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!e.target.value) actualizarItem(i, { precioManual: false, descuentoPct: null, sinCargo: false, precioUnitario: it.precioLista });
                    else if (v >= 0) actualizarItem(i, { precioManual: true, descuentoPct: null, sinCargo: false, precioUnitario: v });
                  }} />
                <BtnSecondary sm onClick={() => setEditPrecio(null)}>OK</BtnSecondary>
              </div>
            </div>
          )}
        </div>
      ))}
      <div style={{ marginBottom: 12 }}><BtnSecondary full onClick={() => setPaso(1)}>+ Agregar más artículos</BtnSecondary></div>
      <div style={W.card}>
        <div style={W.label}>Condiciones de venta</div>
        <div>{PW_COND_VENTA.map((o) => <button key={o} style={W.chip(condVenta === o)} onClick={() => setCondVenta(condVenta === o ? "" : o)}>{o}</button>)}</div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <textarea placeholder="Observaciones (opcional)" value={obs} onChange={(e) => setObs(e.target.value)} style={{ minHeight: 64 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "6px 2px 14px" }}>
        <span style={{ fontSize: 14, color: "#c8c4be" }}>{unidades} unidades</span>
        <b style={{ fontSize: 20, color: "#f2ede6" }}>{pwPeso(total)}</b>
      </div>
      {errEnvio && <div style={{ ...W.card, border: "1px solid #c05850" }}><span style={{ fontSize: 13, color: "#c05850" }}>No se pudo enviar: {errEnvio}. El pedido quedó como borrador — probá de nuevo.</span></div>}
      {!pregCopia ? (
        <div style={{ display: "grid", gap: 8 }}>
          <BtnPrimary full disabled={!items.length || !cliente} onClick={() => { setPregCopia(true); setCopiaCli(null); setEmailCli((cliente && cliente.mail) || ""); }}>
            Enviar pedido
          </BtnPrimary>
          <BtnSecondary full onClick={() => guardarBorrador(false)}>Guardar borrador</BtnSecondary>
        </div>
      ) : (
        <div style={W.card}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "#f2ede6", marginBottom: 8 }}>¿Enviarle una copia al cliente?</div>
          {copiaCli == null && <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}><BtnSecondary full onClick={() => setCopiaCli(false)}>No</BtnSecondary></div>
            <div style={{ flex: 1 }}><BtnPrimary full onClick={() => setCopiaCli(true)}>Sí</BtnPrimary></div>
          </div>}
          {copiaCli === true && (
            <div style={{ marginTop: 8 }}>
              <input type="email" placeholder="Mail del cliente" value={emailCli} onChange={(e) => setEmailCli(e.target.value)} />
              {!((cliente && cliente.mail)) && emailCli && <div style={{ fontSize: 11, color: "#8a8880", marginTop: 4 }}>Se guardará en la ficha del cliente</div>}
            </div>
          )}
          {copiaCli != null && (
            <div style={{ marginTop: 10 }}>
              <BtnPrimary full disabled={enviando || (copiaCli && !/\S+@\S+\.\S+/.test(emailCli))} onClick={() => enviar(false)}>
                {enviando ? "Generando PDF y enviando…" : "Confirmar y enviar"}
              </BtnPrimary>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MisPedidos({ session, onAbrirBorrador, onClose }) {
  const [pedidos, setPedidos] = useState(null);
  useEffect(() => {
    const q = session.role === "admin" ? "" : "?vendedor=" + encodeURIComponent(session.username);
    fetch("/api/pedidos" + q).then((r) => r.json()).then((j) => setPedidos(j.pedidos || [])).catch(() => setPedidos([]));
  }, []);
  const card = { background: "#111820", border: "1px solid #1e2c3a", borderRadius: 14, padding: "13px 14px", marginBottom: 8 };
  const grupo = (titulo, arr, esBorrador) => arr.length > 0 && (
    <div key={titulo}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#8a8880", textTransform: "uppercase", letterSpacing: 1.5, margin: "16px 2px 8px" }}>{titulo}</div>
      {arr.map((p) => (
        <div key={p.recordId} style={{ ...card, cursor: esBorrador ? "pointer" : "default" }} onClick={() => esBorrador && onAbrirBorrador(p)}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b style={{ fontSize: 14.5, color: "#f2ede6" }}>{p.cliente || "(sin cliente)"}</b>
            <b style={{ color: "#c8844e" }}>{pwPeso(p.total)}</b>
          </div>
          <div style={{ fontSize: 12, color: "#8a8880", marginTop: 2 }}>
            {p.pedidoId ? p.pedidoId + " · " : ""}{p.fecha} · {p.unidades} unid.
            {session.role === "admin" ? " · " + p.vendedor : ""}
            {esBorrador ? " · tocá para continuar" : ""}
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div style={{ padding: "16px 16px 90px", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 17, fontWeight: 800, color: "#f2ede6", fontFamily: "'Playfair Display',serif" }}>Mis pedidos</span>
        <BtnSecondary sm onClick={onClose}>✕</BtnSecondary>
      </div>
      {!pedidos ? <div style={{ textAlign: "center", padding: 40 }}><Spinner /></div> : (
        <React.Fragment>
          {pedidos.length === 0 && <Empty icon="🕶" msg="Todavía no hay pedidos" sub="Armá el primero desde Nuevo pedido" />}
          {grupo("Borradores", pedidos.filter((p) => p.estado === "borrador"), true)}
          {grupo("Enviados", pedidos.filter((p) => p.estado === "enviado"), false)}
        </React.Fragment>
      )}
    </div>
  );
}


function App() {
  const [session,       setSession]       = useState(null);
  const [clientes,      setClientes]      = useState([]);
  const [ventas,        setVentas]        = useState([]);
  const [loaded,        setLoaded]        = useState(false);
  const [loadError,     setLoadError]     = useState(null);
  const [vista,         setVista]         = useState("lista");
  const [sel,           setSel]           = useState(null);
  const [busq,          setBusq]          = useState("");
  const [filtro,        setFiltro]        = useState("todos");
  const [adminTab,      setAdminTab]      = useState("resumen");
  const [tabDetalle,    setTabDetalle]    = useState("info");
  const [buscGlobal,    setBuscGlobal]    = useState(false);
  const [miniGestCC,    setMiniGestCC]    = useState(null); // gestión rápida desde seguimientos
  const [vistaVendedor, setVistaVendedor] = useState("home");
  const [filtroCartera, setFiltroCartera] = useState(null);
  const [vendedorSel,   setVendedorSel]   = useState(null);
  const [editVista,     setEditVista]     = useState(false);
  const [formEdit,      setFormEdit]      = useState({});
  const [formNueva,     setFormNueva]     = useState({ nombre:"", telefono:"", ciudad:"", provincia:"", vendedor:"matias" });
  const [histInput,     setHistInput]     = useState("");
  const [saving,        setSaving]        = useState(false);
  const [ventasLoaded,  setVentasLoaded]  = useState(false);
  const [adminCartera,  setAdminCartera]  = useState(null); // null | "activos3m" | "medios" | "recuperar" | "sinHistorial"
  const [adminOrden,    setAdminOrden]    = useState("monto"); // "monto" | "fecha" | "vendedor" | "nombre"
  const [adminKpiDrill, setAdminKpiDrill] = useState(null);   // null | "facMes" | "acum" | "activos" | "nuevos" | "react"
  const [adminUnlocked, setAdminUnlocked] = useState(false); // candado en detalle

  // ── Cargar datos de Airtable — clientes primero, ventas en segundo plano ──
  useEffect(() => {
    if (!session) return;
    setLoadError(null);

    const cargarClientes = () =>
      api.getClientes()
        .then(rawClientes => {
          if (!Array.isArray(rawClientes)) throw new Error("Error al cargar clientes");
          const parsed = rawClientes.map(parseCliente);
          setClientes(parsed);
          setLoaded(true);
          // Si hay un cliente abierto en detalle, actualizarlo también
          setSel(prev => {
            if (!prev) return prev;
            const actualizado = parsed.find(c => c.airtableId === prev.airtableId);
            return actualizado || prev;
          });
        })
        .catch(e => { setLoadError(e.message); setLoaded(true); });

    const cargarVentas = () =>
      api.getVentas().then(rawVentas => {
        if (!Array.isArray(rawVentas)) return;
        const ventasParsed = rawVentas.map(parseVenta);
        setVentas(ventasParsed);
        setVentasLoaded(true);
        // Enriquecer clientes con última compra desde Sinergia
        const ultimaCompraMap = {}, montoUltimaMap = {};
        ventasParsed.forEach(v => {
          const n = v.cliente.trim();
          if (!ultimaCompraMap[n] || v.fecha > ultimaCompraMap[n]) {
            ultimaCompraMap[n] = v.fecha;
            montoUltimaMap[n]  = v.importe;
          }
        });
        setClientes(prev => prev.map(c => {
          const nNorm = c.nombre.toUpperCase().trim();
          const fechaSinergia = ultimaCompraMap[nNorm];
          if (!fechaSinergia) return c;
          if (!c.ultimaCompra || fechaSinergia > c.ultimaCompra)
            return { ...c, ultimaCompra: fechaSinergia, montoUltima: montoUltimaMap[nNorm] || 0 };
          return c;
        }));
      }).catch(e => console.warn("Ventas no cargaron:", e.message));

    // Carga inicial
    cargarClientes().then(() => cargarVentas());

    // Polling: clientes cada 30s, ventas cada 3 minutos
    const pollingClientes = setInterval(cargarClientes, 30_000);
    const pollingVentas   = setInterval(cargarVentas,   180_000);

    return () => {
      clearInterval(pollingClientes);
      clearInterval(pollingVentas);
    };
  }, [session]);

  // ── Actualizar cliente (CRM data) ────────────────────────────────────────
  const updateCliente = useCallback(async (airtableId, changes) => {
    // Update local state immediately
    setClientes(prev => prev.map(c => c.airtableId===airtableId ? {...c,...changes} : c));
    // Persist to Airtable
    try {
      await api.updateCRM(airtableId, changes);
    } catch(e) {
      console.error("Error guardando en Airtable:", e);
    }
  }, []);

  // ── Agregar cliente nuevo ────────────────────────────────────────────────
  const addCliente = useCallback(async (form) => {
    setSaving(true);
    try {
      const body = {
        Vendedor:     form.vendedor?.toUpperCase() || "",
        RazonSocial:  form.nombre   || "",
        Provincia:    form.provincia || "",
        Localidad:    form.ciudad   || "",
        Celular:      form.telefono  || "",
        Mail:         form.mail      || "",
      };
      const result = await api.crearCliente(body);
      if (result.records) {
        const nuevo = parseCliente(result.records[0]);
        setClientes(prev => [...prev, nuevo]);
        return nuevo;
      }
    } catch(e) {
      alert("Error al crear cliente: " + e.message);
    } finally {
      setSaving(false);
    }
  }, []);

  // ── Nota de pedido digital ───────────────────────────────────────────────
  const [pedidoCtx, setPedidoCtx] = useState(null);
  const [volverAPedido, setVolverAPedido] = useState(false);

  // ── Nav ──────────────────────────────────────────────────────────────────
  const handleNav = dest => {
    setEditVista(false);
    setAdminUnlocked(false);
    if (dest==="logout")   { setSession(null); setClientes([]); setVentas([]); setLoaded(false); setVistaVendedor("home"); return; }
    if (dest==="home")     { setSel(null); setFiltroCartera(null); setAdminCartera(null); setVistaVendedor("home"); setVista(session?.role==="admin" ? "consultoria" : session?.role==="administracion" ? "seguimientos" : "lista"); return; }
    if (dest==="graficos") { setVista("graficos"); setSel(null); return; }
    if (dest==="lista")    { setSel(null); setFiltroCartera(null); setAdminCartera(null); setVistaVendedor("lista"); setVista("lista"); return; }
    if (dest==="progreso") { setSel(null); setVistaVendedor("progreso"); setVista("lista"); return; }
    if (dest==="nueva")    { setVista("nueva"); return; }
    if (dest==="pedido")   { setPedidoCtx(null); setVista("pedido"); return; }
    if (dest==="pedidos")  { setVista("pedidos"); return; }
    if (dest==="calc")     { setVista("calc"); return; }
    if (dest==="cc")       { setVista("cc"); return; }
    if (dest==="gestiones_adm") { setVista("gestiones_adm"); return; }
    if (dest==="seguimientos")  { setVista("seguimientos"); return; }
    if (dest==="comunicacion")  { setVista("comunicacion"); return; }
    if (dest==="admin")      { setVista("admin"); setAdminCartera(null); setSel(null); return; }
    if (dest==="consultoria") { setVista("consultoria"); return; }
    if (dest==="cartera")     { setVista("cartera"); return; }
    if (dest==="vendedores")  { setVista("vendedores"); return; }
    if (dest==="emails")      { setVista("emails"); return; }
  };

  // ── Lista filtrada (admin) ───────────────────────────────────────────────
  // Admin ve TODOS los clientes, vendedor solo los suyos
  const mis = clientes
    .filter(o => session?.role==="admin" || session?.role==="administracion" || o.vendedor===session?.username)
    .filter(o => filtro==="todos" || o.estado===filtro)
    .filter(o => !busq || o.nombre?.toLowerCase().includes(busq.toLowerCase()) || o.ciudad?.toLowerCase().includes(busq.toLowerCase()))
    .sort((a,b) => {
      const eA=esAlerta(a)||esInactivo(a), eB=esAlerta(b)||esInactivo(b);
      if (eA&&!eB) return -1; if (!eA&&eB) return 1;
      return (a.nombre||"").localeCompare(b.nombre||"","es");
    });

  // ── LOGIN ────────────────────────────────────────────────────────────────
  if (buscGlobal) return (
    <BuscadorGlobal
      clientes={clientes}
      onCliente={c => { setSel(c); setVista("detalle"); setTabDetalle("info"); setBuscGlobal(false); }}
      onClose={() => setBuscGlobal(false)}
    />
  );

  // Modal gestión rápida global (desde seguimientos)
  const MiniGestOverlay = miniGestCC ? (
    <MiniGestion
      cliente={miniGestCC}
      session={session}
      onClose={() => setMiniGestCC(null)}
      onGuardado={() => setMiniGestCC(null)}
    />
  ) : null;

  if (!session) return <LoginScreen onLogin={(sess)=>{ setSession(sess); if(sess.role==="admin") setVista("consultoria"); else if(sess.role==="administracion") setVista("seguimientos"); }} />;

  // ── CARGANDO ─────────────────────────────────────────────────────────────
  if (!loaded) return (
    <div style={{ background:"#04080c", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, letterSpacing:6, color:"#f0ede8" }}>CENTRAL</div>
      <div style={{ fontSize:10, letterSpacing:4, color:"#c17f4a", textTransform:"uppercase" }}>EYEWEAR</div>
      {!loadError && <div style={{ width:28, height:28, border:"2px solid #1e2a34", borderTopColor:"#c17f4a", borderRadius:"50%", animation:"spin 0.8s linear infinite", marginTop:8 }} />}
      {loadError && (
        <div style={{ textAlign:"center", marginTop:8 }}>
          <div style={{ color:"#c25b4e", fontSize:12, marginBottom:12, padding:"0 32px" }}>Error: {loadError}</div>
          <button onClick={()=>{ setLoaded(false); setLoadError(null); }}
            style={{ background:"#c17f4a", border:"none", borderRadius:10, padding:"10px 24px", color:"#080c10", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            Reintentar
          </button>
        </div>
      )}
    </div>
  );

  // ── EDITAR ───────────────────────────────────────────────────────────────
  if (editVista && sel) {
    const o = clientes.find(x=>x.airtableId===sel.airtableId)||sel;
    const val = key => formEdit[key] !== undefined ? formEdit[key] : o[key] || "";
    return (
      <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
        <Hdr>
          <BtnSecondary sm onClick={()=>setEditVista(false)}>← Volver</BtnSecondary>
          <span style={{ fontWeight:700, fontSize:14, flex:1, textAlign:"center", color:"#c8c4be" }}>Editar ficha</span>
          <span style={{ width:60 }} />
        </Hdr>
        <div style={{ padding:"16px 16px 40px", overflowY:"auto" }}>
          <Crd t="Datos principales">
            {[["Razón Social","nombre"],["Teléfono","telefono"],["Mail","mail"],["CUIT","cuit"]].map(([l,k])=>(
              <div key={k} style={{ marginBottom:14 }}>
                <Label>{l}</Label>
                <input value={val(k)} onChange={e=>setFormEdit(p=>({...p,[k]:e.target.value}))} placeholder={l} />
              </div>
            ))}
            <div style={{ marginBottom:14 }}><Label>Condición IVA</Label><IVASelect value={val("condicionIva")} onChange={v=>setFormEdit(p=>({...p,condicionIva:v}))} /></div>
          </Crd>
          <Crd t="Ubicación">
            <div style={{ marginBottom:14 }}><Label>Provincia</Label><PSelect value={val("provincia")} onChange={v=>setFormEdit(p=>({...p,provincia:v}))} /></div>
            <div style={{ marginBottom:14 }}><Label>Ciudad</Label><input value={val("ciudad")} onChange={e=>setFormEdit(p=>({...p,ciudad:e.target.value}))} placeholder="Ciudad..." /></div>
          </Crd>
          {session.role==="admin" && <Crd t="Asignación"><Label>Vendedor</Label><VSelect value={val("vendedor")} onChange={v=>setFormEdit(p=>({...p,vendedor:v}))} /></Crd>}
          <BtnPrimary full disabled={saving} onClick={async ()=>{
            setSaving(true);
            await updateCliente(o.airtableId, formEdit);
            setSaving(false); setEditVista(false); setFormEdit({});
          }}>{saving ? "Guardando..." : "Guardar cambios"}</BtnPrimary>
        </div>
      </Root>
    );
  }

  // ── DETALLE ──────────────────────────────────────────────────────────────
  if (vista==="detalle" && sel) {
    const o = clientes.find(x=>x.airtableId===sel.airtableId)||sel;
    const dias = diasDesde(o.ultimaCompra);
    const esA = esAlerta(o), esI = esInactivo(o);
    const tel = (o.whatsapp||o.telefono||"").replace(/\D/g,"");
    const badge = badgeVisita(o.proximaVisita);
    const TABS_DET = session.role==="admin"
      ? [["info","Info"],["ventas","Ventas"],["gestiones","Gestiones"],["notas","Notas"],["pedidos","Pedidos"],["alertas","Alertas"]]
      : [["info","Info"],["ventas","Ventas"],["gestiones","Gestiones"],["visita","Visita"],["notas","Notas"],["pedidos","Pedidos"],["alertas","Alertas"]];

    // Ventas de este cliente
    const ventasCliente = ventas
      .filter(v => v.cliente === o.nombre.toUpperCase().trim())
      .sort((a,b) => b.fecha.localeCompare(a.fecha));
    const totalCliente = ventasCliente.reduce((a,v)=>a+v.importe,0);

    return (
      <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
        {/* Header */}
        <div style={{ background:"#0d1117", borderBottom:"1px solid #1c2530", padding:"14px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <button onClick={()=>setVista("lista")} style={{ background:"#131a22", color:"#8a8880", border:"1px solid #1e2a34", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:700 }}>←</button>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:600, color:"#f0ede8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o.nombre.split(" ").slice(0,5).join(" ")}</div>
              <div style={{ fontSize:11, marginTop:2, display:"flex", gap:6, alignItems:"center" }}>
                <span style={{ background:(ECLR[o.estado]||"#8a8880")+"20", color:ECLR[o.estado]||"#8a8880", borderRadius:4, padding:"1px 8px", fontSize:9, fontWeight:700, textTransform:"uppercase" }}>{o.estado}</span>
                {badge && <span style={{ background:badge.bg, color:badge.color, borderRadius:4, padding:"1px 8px", fontSize:9, fontWeight:700 }}>{badge.txt}</span>}
              </div>
            </div>
            {session.role==="admin"
              ? <button onClick={()=>setAdminUnlocked(u=>!u)} style={{ background:adminUnlocked?"#c17f4a20":"#131a22", color:adminUnlocked?"#c17f4a":"#8a8880", border:`1px solid ${adminUnlocked?"#c17f4a60":"#1e2a34"}`, borderRadius:8, padding:"6px 10px", fontSize:14 }}>{adminUnlocked?"🔓":"🔒"}</button>
              : <button onClick={()=>{setFormEdit({});setEditVista(true);}} style={{ background:"#131a22", color:"#8a8880", border:"1px solid #1e2a34", borderRadius:8, padding:"6px 10px", fontSize:14 }}>✏</button>
            }
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {[
              { l:"Visitas", v:o.visitas||0, c:"#c8c4be" },
              { l:"Último pedido", v:dias!==null?`${dias}d`:"—", c:esA?"#c25b4e":esI?"#4a5060":"#c8c4be" },
              { l:"Total acum.", v:fmtM(totalCliente||o.montoUltima), c:"#c17f4a" },
            ].map(({l,v,c})=>(
              <div key={l} style={{ background:"#131a22", borderRadius:10, padding:"9px 6px", textAlign:"center", border:"1px solid #1e2a34" }}>
                <div style={{ fontSize:8, color:"#8a8880", textTransform:"uppercase", letterSpacing:.8, marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:17, fontWeight:800, color:c }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${TABS_DET.length},1fr)`, background:"#0a0e14", borderBottom:"1px solid #1c2530" }}>
          {TABS_DET.map(([id,label])=>(
            <button key={id} onClick={()=>setTabDetalle(id)}
              style={{ background:"none", border:"none", borderBottom:tabDetalle===id?"2px solid #c17f4a":"2px solid transparent", padding:"11px 2px 9px", fontSize:10, fontWeight:700, letterSpacing:.8, textTransform:"uppercase", color:tabDetalle===id?"#c17f4a":"#4a5060" }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ overflowY:"auto", padding:"16px 16px 80px" }}>

          {tabDetalle==="info" && <>
            <Crd t="Contacto">
              <Row l="Razón Social" v={o.nombre} />
              <Row l="Localidad" v={[o.ciudad,o.provincia].filter(Boolean).join(", ")} />
              <Row l="Teléfono" v={o.telefono||<span style={{color:"#c17f4a"}}>Sin teléfono</span>} />
              <Row l="Mail" v={o.mail||<span style={{color:"#c17f4a"}}>Sin mail</span>} />
              {o.cuit && <Row l="CUIT" v={o.cuit} />}
              {o.condicionIva && <Row l="IVA" v={o.condicionIva} />}
              <div style={{ display:"flex", gap:8, marginTop:14 }}>
                {tel && <a href={`https://wa.me/54${tel}`} target="_blank" style={{ flex:1, background:"#0f1e14", color:"#6b8f5e", padding:"11px", borderRadius:10, textAlign:"center", fontWeight:700, textDecoration:"none", fontSize:13, border:"1px solid #6b8f5e40" }}>WhatsApp</a>}
                {o.mail && <a href={`mailto:${o.mail}`} style={{ flex:1, background:"#0f1d2a", color:"#7ba7bc", padding:"11px", borderRadius:10, textAlign:"center", fontWeight:700, textDecoration:"none", fontSize:13, border:"1px solid #7ba7bc30" }}>Mail</a>}
              </div>
            </Crd>
            <Crd t="Estado">
              {session.role==="admin" && !adminUnlocked
                ? <div style={{ display:"flex", alignItems:"center", gap:8, color:"#4a5060", fontSize:12 }}><span>🔒</span> Tocá el candado para editar el estado</div>
                : <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {ESTADOS.map(e=>(
                      <button key={e} onClick={()=>updateCliente(o.airtableId,{estado:e})}
                        style={{ padding:"7px 16px", borderRadius:999, background:o.estado===e?(ECLR[e]||"#8a8880")+"20":"transparent", color:o.estado===e?ECLR[e]||"#8a8880":(ECLR[e]||"#8a8880")+"80", border:`1.5px solid ${o.estado===e?ECLR[e]||"#8a8880":(ECLR[e]||"#8a8880")+"40"}`, fontSize:12, fontWeight:700 }}>
                        {e}
                      </button>
                    ))}
                  </div>
              }
            </Crd>
          </>}

          {tabDetalle==="ventas" && <VentasTab ventasCliente={ventasCliente} o={o} session={session} />}

          {tabDetalle==="gestiones" && <GestionesTab cliente={o} session={session} />}

          {tabDetalle==="visita" && <>
            {session.role==="admin" && !adminUnlocked
              ? <Crd><div style={{ display:"flex", alignItems:"center", gap:10, color:"#4a5060", fontSize:13 }}><span style={{ fontSize:20 }}>🔒</span><span>Tocá el candado para agendar visitas y enviar mensajes</span></div></Crd>
              : <>
                  <Crd t="Agendar en Google Calendar">
                    <AgendarVisita optica={o} vendedor={session.nombre} />
                  </Crd>
                  <Crd t="Mensajes WhatsApp">
                    {(MSGS[o.estado]||MSGS.prospecto).map(([k,txt])=>(
                      <div key={k} style={{ marginBottom:12, background:"#0d1117", borderRadius:10, padding:12, border:"1px solid #1c2530" }}>
                        <div style={{ fontSize:9, color:"#c17f4a", marginBottom:6, textTransform:"uppercase", letterSpacing:1.2, fontWeight:700 }}>{k}</div>
                        <div style={{ fontSize:12, color:"#8a8880", marginBottom:10, lineHeight:1.6 }}>{txt}</div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={()=>navigator.clipboard.writeText(txt)} style={{ flex:1, background:"#131a22", color:"#c8c4be", padding:"8px", border:"1px solid #1e2a34", borderRadius:8, fontSize:11, fontWeight:600 }}>Copiar</button>
                          {tel && <a href={`https://wa.me/54${tel}?text=${encodeURIComponent(txt)}`} target="_blank" style={{ flex:1, background:"#0f1e14", color:"#6b8f5e", padding:"8px", borderRadius:8, fontSize:11, fontWeight:700, textDecoration:"none", textAlign:"center", border:"1px solid #6b8f5e40" }}>Enviar</a>}
                        </div>
                      </div>
                    ))}
                  </Crd>
                </>
            }
          </>}

          {tabDetalle==="notas" && (
            session.role==="admin" && !adminUnlocked
              ? <Crd><div style={{ display:"flex", alignItems:"center", gap:10, color:"#4a5060", fontSize:13 }}><span style={{ fontSize:20 }}>🔒</span><span>Tocá el candado para agregar notas</span></div>
                  {(o.notas||[]).map((e,i)=>(
                    <div key={i} style={{ borderTop:"1px solid #1c2530", paddingTop:12, marginTop:12 }}>
                      <div style={{ display:"flex", gap:6, marginBottom:4 }}>
                        <span style={{ fontSize:10, fontWeight:700, color:"#7ba7bc" }}>{e.vendedor}</span>
                        <span style={{ fontSize:9, color:"#4a5060" }}>{e.fecha} · {e.hora}</span>
                      </div>
                      <div style={{ fontSize:13, color:"#c8c4be", lineHeight:1.6 }}>{e.texto}</div>
                    </div>
                  ))}
                  {(o.notas||[]).length===0 && <div style={{ textAlign:"center", color:"#4a5060", fontSize:12, marginTop:8 }}>Sin notas</div>}
                </Crd>
              : <HistorialCliente
                  clienteId={o.airtableId}
                  notasIniciales={o.notas||[]}
                  vendedor={session.nombre}
                  input={histInput}
                  setInput={setHistInput}
                  onGuardar={(notas) => updateCliente(o.airtableId, { notas, visitas:(o.visitas||0)+1 })}
                />
          )}
          {tabDetalle==="pedidos" && (session.role!=="admin" || adminUnlocked) && (
            <div style={{ padding:"14px 16px 0" }}>
              <BtnPrimary full onClick={()=>{ setPedidoCtx({ cliente: o }); setVista("pedido"); }}>🕶 Nuevo pedido con catálogo</BtnPrimary>
            </div>
          )}
          {tabDetalle==="pedidos" && (
            <NuevoPedido
              cliente={o}
              vendedor={session.nombre}
              isAdmin={session.role==="admin"}
              adminUnlocked={adminUnlocked}
              onGuardar={(pedidos) => updateCliente(o.airtableId, { pedidos })}
            />
          )}
          {tabDetalle==="alertas" && (
            <AlertasCliente
              cliente={o}
              vendedor={session.nombre}
              tel={tel}
              onGuardar={(alertas) => updateCliente(o.airtableId, { alertas })}
            />
          )}
        </div>
      </Root>
    );
  }
  if (vista==="cc") return (
    <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
      <CuentasCorrientes session={session} />
    </Root>
  );

  if (vista==="calc") return (
    <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
      <Calculadora />
    </Root>
  );

  if (vista==="nueva") return (
    <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
      <Hdr>
        <BtnSecondary sm onClick={()=>setVista("lista")}>← Volver</BtnSecondary>
        <span style={{ fontWeight:700, fontSize:14, color:"#c8c4be" }}>Nueva óptica</span>
        <span />
      </Hdr>
      <div style={{ padding:16 }}>
        <Crd t="">
          {[["Nombre / Razón Social *","nombre"],["Teléfono","telefono"],["Mail","mail"]].map(([l,k])=>(
            <div key={k} style={{ marginBottom:14 }}>
              <Label>{l}</Label>
              <input value={formNueva[k]||""} onChange={e=>setFormNueva({...formNueva,[k]:e.target.value})} />
            </div>
          ))}
          <div style={{ marginBottom:14 }}><Label>Provincia</Label><PSelect value={formNueva.provincia} onChange={v=>setFormNueva({...formNueva,provincia:v})} /></div>
          <div style={{ marginBottom:14 }}><Label>Ciudad</Label><input value={formNueva.ciudad||""} onChange={e=>setFormNueva({...formNueva,ciudad:e.target.value})} /></div>
          <div style={{ marginBottom:18 }}><Label>Vendedor</Label><VSelect value={formNueva.vendedor} onChange={v=>setFormNueva({...formNueva,vendedor:v})} /></div>
          <BtnPrimary full disabled={saving} onClick={async ()=>{
            if (!formNueva.nombre) return alert("Nombre obligatorio");
            const nuevoCli = await addCliente(formNueva);
            setFormNueva({ nombre:"", telefono:"", ciudad:"", provincia:"", vendedor:"matias" });
            if (volverAPedido && nuevoCli) { setVolverAPedido(false); setPedidoCtx({ cliente: nuevoCli }); setVista("pedido"); }
            else setVista("lista");
          }}>{saving ? "Guardando..." : "Agregar óptica"}</BtnPrimary>
        </Crd>
      </div>
    </Root>
  );

  if (vista==="pedido") return (
    <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
      <PedidoWizard
        session={session}
        clientes={session.role==="admin" ? clientes : clientes.filter(c => c.vendedor===session.username)}
        pedidoCtx={pedidoCtx}
        onClose={(motivo) => {
          setPedidoCtx(null);
          if (motivo==="enviado" && sel) { setVista("detalle"); setTabDetalle("pedidos"); }
          else setVista(session.role==="admin" ? "admin" : "lista");
        }}
        onNuevaOptica={() => { setVolverAPedido(true); setVista("nueva"); }}
      />
    </Root>
  );

  if (vista==="pedidos") return (
    <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
      <MisPedidos
        session={session}
        onAbrirBorrador={(pd) => { setPedidoCtx({ draft: pd }); setVista("pedido"); }}
        onClose={() => setVista(session.role==="admin" ? "admin" : "lista")}
      />
    </Root>
  );

  // ── GRÁFICOS ADMIN ───────────────────────────────────────────────────────
  // ── ADMIN: nuevas vistas ────────────────────────────────────────────────
  if (vista==="consultoria" && session.role==="admin") return (
    <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
      <ConsultoriaIA ventas={ventas} clientes={clientes} session={session} />
    </Root>
  );

  if (vista==="cartera" && session.role==="admin") return (
    <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
      <CarteraClientes ventas={ventas} clientes={clientes} />
    </Root>
  );

  if (vista==="vendedores" && session.role==="admin") return (
    <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
      <PanelVendedores ventas={ventas} clientes={clientes} />
    </Root>
  );

  if (vista==="emails" && session.role==="admin") return (
    <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
      <EmailBlast clientes={clientes} session={session} />
    </Root>
  );

  if (vista==="graficos" && session.role==="admin") {
    return (
      <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
        <div style={{ overflowY:"auto", padding:"16px 16px 80px" }}>
          <GraficosAdmin ventas={ventas} clientes={clientes} ventasCargando={!ventasLoaded} />
        </div>
      </Root>
    );
  }

  // ── ADMIN CARTERA FILTRADA ────────────────────────────────────────────────
  if (vista==="admin" && session.role==="admin" && adminCartera) {
    const { act3m, act6m, conH, aRec } = calcSalud(ventas, clientes);

    const facTotalMap = {};
    ventas.filter(esVentaReal).forEach(v=>{ facTotalMap[v.cliente]=(facTotalMap[v.cliente]||0)+v.importe; });

    const filtrados = clientes.filter(c=>{
      const n = c.nombre.toUpperCase().trim();
      if (adminCartera==="activos3m")    return act3m.has(n);
      if (adminCartera==="medios")       return act6m.has(n) && !act3m.has(n);
      if (adminCartera==="recuperar")    return aRec.has(n);
      if (adminCartera==="sinHistorial") return !conH.has(n);
      return true;
    }).sort((a,b)=>{
      const nA = a.nombre.toUpperCase().trim(), nB = b.nombre.toUpperCase().trim();
      if (adminOrden==="monto")    return (facTotalMap[nB]||0)-(facTotalMap[nA]||0);
      if (adminOrden==="fecha")    return (b.ultimaCompra||"").localeCompare(a.ultimaCompra||"");
      if (adminOrden==="vendedor") return (a.vendedor||"").localeCompare(b.vendedor||"");
      return (a.nombre||"").localeCompare(b.nombre||"","es");
    });

    const LABELS = {
      activos3m:    { label:"Activos · últimos 3 meses",      c:"#6b8f5e" },
      medios:       { label:"Tibiando · entre 3 y 6 meses",   c:"#c17f4a" },
      recuperar:    { label:"Recuperar · +6 meses sin compra", c:"#c25b4e" },
      sinHistorial: { label:"Sin historial de compras",        c:"#8a8880" },
    };
    const meta = LABELS[adminCartera];

    return (
      <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
        <div style={{ background:"#0d1117", borderBottom:"1px solid #1c2530", padding:"13px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <button onClick={()=>setAdminCartera(null)} style={{ background:"#131a22", color:"#8a8880", border:"1px solid #1e2a34", borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:700 }}>←</button>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:meta.c }}>{meta.label}</div>
              <div style={{ fontSize:11, color:"#4a5060" }}>{filtrados.length} clientes</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none" }}>
            {[["monto","$ Monto"],["fecha","Última compra"],["vendedor","Vendedor"],["nombre","Nombre"]].map(([k,l])=>(
              <button key={k} onClick={()=>setAdminOrden(k)}
                style={{ padding:"5px 12px", whiteSpace:"nowrap", background:adminOrden===k?"#c17f4a20":"transparent", color:adminOrden===k?"#c17f4a":"#4a5060", border:`1px solid ${adminOrden===k?"#c17f4a60":"#1e2a34"}`, fontSize:11, fontWeight:700, borderRadius:999 }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowY:"auto", paddingBottom:80 }}>
          {filtrados.length===0
            ? <div style={{ textAlign:"center", padding:40, color:"#8a8880" }}>Sin clientes en esta categoría</div>
            : filtrados.map(c=>{
              const facTotal = facTotalMap[c.nombre.toUpperCase().trim()] || 0;
              const dias = diasDesde(c.ultimaCompra);
              const tel = (c.telefono||"").replace(/\D/g,"");
              return (
                <div key={c.airtableId} onClick={()=>{setSel(c);setVista("detalle");setTabDetalle("info");setAdminUnlocked(false);}}
                  style={{ display:"flex", alignItems:"center", padding:"12px 16px", borderBottom:"1px solid #1c2530", cursor:"pointer" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", color:esAlerta(c)?"#c25b4e":esInactivo(c)?"#4a5060":"#c8c4be" }}>{c.nombre.split(" ").slice(0,4).join(" ")}</div>
                    <div style={{ fontSize:11, color:"#4a5060", marginTop:2, display:"flex", gap:6 }}>
                      <span style={{ color:"#c17f4a80", fontWeight:700 }}>{cap(c.vendedor)}</span>
                      <span>{c.ciudad||"—"}</span>
                      {dias!==null && <span>· {dias}d</span>}
                    </div>
                  </div>
                  <div style={{ textAlign:"right", marginLeft:10, flexShrink:0 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:"#c17f4a" }}>{fmtM(facTotal||c.montoUltima)}</div>
                    <div style={{ fontSize:9, color:"#4a5060", textTransform:"uppercase" }}>acum.</div>
                  </div>
                  {tel && <a href={`https://wa.me/54${tel}`} target="_blank" onClick={e=>e.stopPropagation()} style={{ marginLeft:10, background:"#142218", borderRadius:"50%", width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", fontSize:15, border:"1px solid #6b8f5e40" }}>💬</a>}
                </div>
              );
            })
          }
        </div>
      </Root>
    );
  }

  // ── PANEL ADMIN ───────────────────────────────────────────────────────────
  if (vista==="admin" && session.role==="admin") {
    const hoy = new Date();
    const mesStr     = hoy.toISOString().slice(0,7);
    const mesPrevStr = new Date(hoy.getFullYear(), hoy.getMonth()-1, 1).toISOString().slice(0,7);
    const mesNombre  = hoy.toLocaleDateString("es-AR",{month:"long", year:"numeric"});
    const ventasCargando = !ventasLoaded;

    // ── Totales globales ──
    const totalAcum    = ventas.filter(esVentaReal).reduce((a,v)=>a+v.importe,0);
    const ventasMes    = ventas.filter(v=>v.fecha?.startsWith(mesStr) && esVentaReal(v));
    const ventasPrev   = ventas.filter(v=>v.fecha?.startsWith(mesPrevStr) && esVentaReal(v));
    const facMes       = ventasMes.reduce((a,v)=>a+v.importe,0);
    const facPrev      = ventasPrev.reduce((a,v)=>a+v.importe,0);
    const deltaMes     = facPrev>0 ? Math.round(((facMes-facPrev)/facPrev)*100) : null;
    // Ticket promedio sobre últimos 6 meses (más representativo)
    const { str6m } = calcSalud(ventas, clientes);
    const ventasRecientes = ventas.filter(v=>v.fecha>=str6m);
    const ticketProm = ventasRecientes.length>0 ? Math.round(ventasRecientes.reduce((a,v)=>a+v.importe,0)/ventasRecientes.length) : 0;

    // ── Clientes nuevos vs reactivados este mes ──
    // "nuevo" = compró este mes pero NUNCA había comprado antes
    // "reactivado" = compró este mes y tenía historial previo
    const clientesConHistPrev = new Set(ventas.filter(v=>v.fecha<mesStr && esVentaReal(v)).map(v=>v.cliente.trim()));
    const clientesMesSet      = new Set(ventasMes.map(v=>v.cliente.trim()));
    const nuevosEste  = [...clientesMesSet].filter(n=>!clientesConHistPrev.has(n)).length;
    const reactivados = [...clientesMesSet].filter(n=> clientesConHistPrev.has(n)).length;

    // ── Por vendedor — con comparativo año anterior y clientes a reactivar ──
    const mesAnteriorAnioStr = `${hoy.getFullYear()-1}-${String(hoy.getMonth()+1).padStart(2,"0")}`; // mismo mes año anterior
    const trimestreAnioStr   = new Date(hoy.getFullYear()-1, hoy.getMonth()-2, 1).toISOString().slice(0,7); // mismo trimestre año anterior

    const vends = ["matias","miguel","nicolas","mauro"].map(v=>{
      const sus      = clientes.filter(c=>c.vendedor===v);
      const nombresV = new Set(sus.map(c=>c.nombre.toUpperCase().trim()));
      const ventasV  = ventas.filter(vt=>nombresV.has(vt.cliente.trim()) && esVentaReal(vt));
      const mesV     = ventasV.filter(vt=>vt.fecha?.startsWith(mesStr));
      const prevV    = ventasV.filter(vt=>vt.fecha?.startsWith(mesPrevStr));
      const mismoMesAnioAnt = ventasV.filter(vt=>vt.fecha?.startsWith(mesAnteriorAnioStr));
      const factMes  = mesV.reduce((a,vt)=>a+vt.importe,0);
      const factPrev = prevV.reduce((a,vt)=>a+vt.importe,0);
      const factMismoMesAnt = mismoMesAnioAnt.reduce((a,vt)=>a+vt.importe,0);
      const deltaAnio = factMismoMesAnt>0 ? Math.round(((factMes-factMismoMesAnt)/factMismoMesAnt)*100) : null;
      const delta    = factPrev>0 ? Math.round(((factMes-factPrev)/factPrev)*100) : null;
      const ventasV6m = ventasV.filter(vt=>vt.fecha>=str6m);
      const ticket   = ventasV6m.length>0 ? Math.round(ventasV6m.reduce((a,vt)=>a+vt.importe,0)/ventasV6m.length) : 0;

      // Clientes activos mismo trimestre año anterior
      const clientesActivosAnioAnt = new Set(
        ventasV.filter(vt=>vt.fecha>=trimestreAnioStr && vt.fecha<mesAnteriorAnioStr).map(vt=>vt.cliente.trim())
      );
      // Clientes activos este trimestre
      const clientesActivosEste = new Set(ventasV6m.map(vt=>vt.cliente.trim()));
      // Clientes perdidos: estaban activos año anterior pero no compraron en los últimos 6 meses
      const clientesPerdidos = sus.filter(c=>{
        const n = c.nombre.toUpperCase().trim();
        return clientesActivosAnioAnt.has(n) && !clientesActivosEste.has(n);
      }).slice(0,5).map(c=>c.nombre.split(" ").slice(0,3).join(" "));

      return {
        n:cap(v), v, count:sus.length,
        factTotal: ventasV.reduce((a,vt)=>a+vt.importe,0),
        factMes, factPrev, delta, ticket,
        factMismoMesAnt, deltaAnio,
        clientesPerdidos,
        alertas: sus.filter(c=>esAlerta(c)||esInactivo(c)).length,
      };
    }).sort((a,b)=>b.factMes-a.factMes);

    // ── Promedio mensual histórico ──
    // Agrupar ventas por mes y calcular promedio de meses completos (no el actual)
    const facPorMes = {};
    ventas.forEach(v => {
      const m = v.fecha?.slice(0,7);
      if (m && m < mesStr) facPorMes[m] = (facPorMes[m]||0) + v.importe;
    });
    const mesesCompletos = Object.values(facPorMes);
    const facPromHistorico = mesesCompletos.length > 0
      ? Math.round(mesesCompletos.reduce((a,v)=>a+v,0) / mesesCompletos.length)
      : 0;
    const facPorCliente = {};
    ventas.forEach(v=>{ facPorCliente[v.cliente]=(facPorCliente[v.cliente]||0)+v.importe; });
    const top = Object.entries(facPorCliente).sort((a,b)=>b[1]-a[1]);
    const top5pct  = totalAcum>0 ? Math.round(top.slice(0,5).reduce((a,[,v])=>a+v,0)/totalAcum*100) : 0;
    const top10pct = totalAcum>0 ? Math.round(top.slice(0,10).reduce((a,[,v])=>a+v,0)/totalAcum*100) : 0;

    // ── Salud de cartera ──
    const { act3m, act6m, aRec, sinH } = calcSalud(ventas, clientes);
    const tot = clientes.length || 1;

    // ── Clientes en riesgo (90-150d) ──
    const enRiesgo = clientes.filter(esAlerta).sort((a,b)=>(diasDesde(b.ultimaCompra)||0)-(diasDesde(a.ultimaCompra)||0));

    const Secc = ({title, children}) => (
      <div style={{ marginBottom:6 }}>
        <div style={{ fontSize:9, fontWeight:700, color:"#4a5060", textTransform:"uppercase", letterSpacing:1.5, marginBottom:10, paddingTop:4 }}>{title}</div>
        {children}
      </div>
    );

    return (
      <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
        {/* Hero */}
        <div style={{ background:"linear-gradient(160deg,#080c10 0%,#0d1a24 100%)", padding:"20px 16px 16px", borderBottom:"1px solid #1e2a34" }}>
          <div style={{ fontSize:9, color:"#c17f4a60", textTransform:"uppercase", letterSpacing:2, fontWeight:700, marginBottom:2 }}>Tablero de control</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:600, color:"#f0ede8" }}>Central Eyewear</div>
          <div style={{ fontSize:11, color:"#4a5060", marginTop:2 }}>{mesNombre} {ventasCargando && <span style={{color:"#c17f4a"}}>· cargando ventas...</span>}</div>
        </div>

        <div style={{ overflowY:"auto", padding:"16px 16px 80px" }}>

          {/* ── KPIs globales ── */}
          <Secc title="Facturación global">
            {/* Este mes + Acumulado */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              <div onClick={()=>setAdminKpiDrill(adKpi=>"facMes"===adKpi?null:"facMes")}
                style={{ background:"#131a22", borderRadius:12, padding:"12px 14px", border:`1px solid ${adminKpiDrill==="facMes"?"#c17f4a60":"#1e2a34"}`, cursor:"pointer" }}>
                <div style={{ fontSize:8, color:"#8a8880", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Este mes</div>
                <div style={{ fontSize:24, fontWeight:900, color:"#c17f4a" }}>{fmtM(facMes)}</div>
                {deltaMes!==null && <div style={{ fontSize:11, color:deltaMes>=0?"#6b8f5e":"#c25b4e", marginTop:2, fontWeight:700 }}>{deltaMes>=0?"+":""}{deltaMes}% vs mes ant.</div>}
                {(() => {
                  const ant = ventas.filter(v=>v.fecha?.startsWith(`${hoy.getFullYear()-1}-${String(hoy.getMonth()+1).padStart(2,"0")}`)).reduce((a,v)=>a+v.importe,0);
                  const pct = hoy.getDate()/new Date(hoy.getFullYear(),hoy.getMonth()+1,0).getDate();
                  const proy = pct>0 ? Math.round(facMes/pct) : 0;
                  const dyoy = ant>0 ? Math.round(((proy-ant)/ant)*100) : null;
                  return dyoy!==null ? <div style={{ fontSize:10, color:dyoy>=0?"#6b8f5e":"#c25b4e", marginTop:1 }}>{dyoy>=0?"+":""}{dyoy}% vs {hoy.getFullYear()-1} (proy.)</div> : null;
                })()}
              </div>
              <div onClick={()=>setAdminKpiDrill(adKpi=>"acum"===adKpi?null:"acum")}
                style={{ background:"#131a22", borderRadius:12, padding:"12px 14px", border:`1px solid ${adminKpiDrill==="acum"?"#f0ede860":"#1e2a34"}`, cursor:"pointer" }}>
                <div style={{ fontSize:8, color:"#8a8880", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Acumulado total</div>
                <div style={{ fontSize:24, fontWeight:900, color:"#f0ede8" }}>{fmtM(totalAcum)}</div>
                <div style={{ fontSize:11, color:"#4a5060", marginTop:4 }}>Ticket prom. {fmtM(ticketProm)}</div>
              </div>
            </div>

            {/* Drill: facturas del mes */}
            {adminKpiDrill==="facMes" && (()=>{
              const filas = ventasMes.sort((a,b)=>b.importe-a.importe).slice(0,20);
              return (
                <div style={{ background:"#0d1117", borderRadius:10, border:"1px solid #c17f4a30", marginBottom:10, overflow:"hidden" }}>
                  <div style={{ padding:"10px 14px", borderBottom:"1px solid #1c2530", fontSize:9, color:"#c17f4a", fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>
                    Facturas este mes · top 20
                  </div>
                  {filas.map((v,i)=>(
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 14px", borderBottom:"1px solid #111820" }}>
                      <div>
                        <div style={{ fontSize:12, color:"#c8c4be" }}>{v.cliente.split(" ").slice(0,4).join(" ")}</div>
                        <div style={{ fontSize:10, color:"#4a5060" }}>{v.fecha}</div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:800, color:"#6b8f5e" }}>{fmtM(v.importe)}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Drill: acumulado por mes */}
            {adminKpiDrill==="acum" && (()=>{
              const porMes = {};
              ventas.forEach(v=>{ const m=v.fecha?.slice(0,7); if(m) porMes[m]=(porMes[m]||0)+v.importe; });
              const meses = Object.entries(porMes).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,12);
              return (
                <div style={{ background:"#0d1117", borderRadius:10, border:"1px solid #f0ede820", marginBottom:10, overflow:"hidden" }}>
                  <div style={{ padding:"10px 14px", borderBottom:"1px solid #1c2530", fontSize:9, color:"#f0ede8", fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>Facturación por mes</div>
                  {meses.map(([m,v])=>(
                    <div key={m} style={{ display:"flex", justifyContent:"space-between", padding:"8px 14px", borderBottom:"1px solid #111820" }}>
                      <div style={{ fontSize:12, color:"#c8c4be" }}>{m}</div>
                      <div style={{ fontSize:13, fontWeight:800, color:"#c17f4a" }}>{fmtM(v)}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Clientes activos / nuevos / reactivados */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:4 }}>
              {[
                { k:"activos", label:"Clientes activos", v:act3m.size, c:"#6b8f5e", clientes: clientes.filter(c=>act3m.has(c.nombre.toUpperCase().trim())) },
                { k:"nuevos",  label:"Nuevos este mes",  v:nuevosEste,  c:"#7ba7bc", clientes: (() => { const ns=new Set(ventasMes.map(v=>v.cliente.trim()).filter(n=>!clientesConHistPrev.has(n))); return clientes.filter(c=>ns.has(c.nombre.toUpperCase().trim())); })() },
                { k:"react",   label:"Reactivados",      v:reactivados, c:"#c17f4a", clientes: (() => { const rs=new Set(ventasMes.map(v=>v.cliente.trim()).filter(n=>clientesConHistPrev.has(n))); return clientes.filter(c=>rs.has(c.nombre.toUpperCase().trim())); })() },
              ].map(({k,label,v,c,clientes:lista})=>(
                <div key={k}>
                  <div onClick={()=>setAdminKpiDrill(adKpi=>k===adKpi?null:k)}
                    style={{ background:"#131a22", borderRadius:10, padding:"10px 8px", textAlign:"center", border:`1px solid ${adminKpiDrill===k?c+"60":"#1e2a34"}`, cursor:"pointer" }}>
                    <div style={{ fontSize:8, color:"#8a8880", textTransform:"uppercase", letterSpacing:.8, marginBottom:3 }}>{label}</div>
                    <div style={{ fontSize:20, fontWeight:800, color:c }}>{v}</div>
                  </div>
                  {adminKpiDrill===k && lista.length>0 && (
                    <div style={{ background:"#0d1117", borderRadius:10, border:`1px solid ${c}30`, marginTop:6, overflow:"hidden", maxHeight:280, overflowY:"auto" }}>
                      {lista.slice(0,30).map(cl=>(
                        <div key={cl.airtableId} onClick={()=>{setSel(cl);setVista("detalle");setTabDetalle("info");setAdminKpiDrill(null);}}
                          style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", borderBottom:"1px solid #111820", cursor:"pointer" }}>
                          <div>
                            <div style={{ fontSize:12, color:"#c8c4be" }}>{cl.nombre.split(" ").slice(0,4).join(" ")}</div>
                            <div style={{ fontSize:10, color:"#4a5060" }}>{cap(cl.vendedor)} · {cl.ciudad||"—"}</div>
                          </div>
                          <div style={{ fontSize:12, fontWeight:700, color:c }}>{fmtM(cl.montoUltima)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Secc>

          {/* ── Coach IA — Configuración ── */}
          <CoachConfig />

          {/* ── Análisis IA ── */}
          <AnalisisIA datos={{
            facMes, facPrev, deltaMes, totalAcum, ticketProm,
            facPromHistorico,
            facMismoMesAnt: ventas.filter(v=>v.fecha?.startsWith(`${hoy.getFullYear()-1}-${String(hoy.getMonth()+1).padStart(2,"0")}`) && esVentaReal(v)).reduce((a,v)=>a+v.importe,0),
            deltaAnioTotal: (() => {
              const ant = ventas.filter(v=>v.fecha?.startsWith(`${hoy.getFullYear()-1}-${String(hoy.getMonth()+1).padStart(2,"0")}`) && esVentaReal(v)).reduce((a,v)=>a+v.importe,0);
              const pct = hoy.getDate()/new Date(hoy.getFullYear(),hoy.getMonth()+1,0).getDate();
              const proy = pct>0 ? facMes/pct : 0;
              return ant>0 ? Math.round(((proy-ant)/ant)*100) : null;
            })(),
            totalClientes: clientes.length,
            act3m: act3m.size,
            medios: act6m.size - act3m.size,
            recuperar: aRec.size,
            sinH,
            top5pct, top10pct,
            vends,
            nuevosEste, reactivados,
            top3: top.slice(0,3),
          }} />

          {/* ── Por vendedor ── */}
          <Secc title="Rendimiento por vendedor · mes actual">
            {vends.map(v=>(
              <div key={v.v} onClick={()=>{setSel(null);setAdminTab("vendedores");setVendedorSel(v.v);}}
                style={{ background:"#131a22", borderRadius:12, padding:"12px 14px", marginBottom:8, border:"1px solid #1e2a34", cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:600, color:"#f0ede8" }}>{v.n}</div>
                    <div style={{ fontSize:10, color:"#4a5060", marginTop:1 }}>{v.count} ópticas · ticket {fmtM(v.ticket)}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:18, fontWeight:900, color:"#c17f4a" }}>{fmtM(v.factMes)}</div>
                    {v.delta!==null && <div style={{ fontSize:10, fontWeight:700, color:v.delta>=0?"#6b8f5e":"#c25b4e" }}>{v.delta>=0?"+":""}{v.delta}% vs ant.</div>}
                  </div>
                </div>
                {/* Barra de participación */}
                <div style={{ background:"#0d1117", borderRadius:4, height:3 }}>
                  <div style={{ background:v.alertas>3?"#c25b4e":"#c17f4a", height:"100%", borderRadius:4, width:`${facMes>0?Math.round(v.factMes/facMes*100):0}%` }} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                  <span style={{ fontSize:9, color:"#4a5060" }}>{facMes>0?Math.round(v.factMes/facMes*100):0}% del mes</span>
                  {v.alertas>0 && <span style={{ fontSize:9, color:"#c25b4e", fontWeight:700 }}>⚠ {v.alertas} en riesgo</span>}
                </div>
              </div>
            ))}
          </Secc>

          {/* ── Concentración de riesgo ── */}
          <Secc title="Concentración de riesgo">
            <div style={{ background:"#131a22", borderRadius:12, border:`1px solid ${top5pct>60?"#c25b4e40":"#1e2a34"}`, padding:14, marginBottom:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontSize:12, color:"#c8c4be" }}>Top 5 clientes concentran</div>
                <div style={{ fontSize:20, fontWeight:900, color:top5pct>60?"#c25b4e":"#c17f4a" }}>{top5pct}%</div>
              </div>
              <div style={{ background:"#0d1117", borderRadius:4, height:4, marginBottom:6 }}>
                <div style={{ background:top5pct>60?"#c25b4e":"#c17f4a", height:"100%", borderRadius:4, width:`${top5pct}%` }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:9, color:"#4a5060" }}>Top 10 concentran {top10pct}%</span>
                {top5pct>60 && <span style={{ fontSize:9, color:"#c25b4e", fontWeight:700 }}>⚠ Riesgo de concentración</span>}
              </div>
            </div>
            {top.slice(0,5).map(([nombre, total], i)=>{
              const cliente = clientes.find(c=>c.nombre.toUpperCase().trim()===nombre);
              const pct = totalAcum>0?Math.round(total/totalAcum*100):0;
              return (
                <div key={i} onClick={()=>{ if(cliente){setSel(cliente);setVista("detalle");setTabDetalle("info");} }}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px solid #111820", cursor:cliente?"pointer":"default" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, color:"#c8c4be", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      <span style={{ color:"#4a5060", fontSize:10, marginRight:6 }}>#{i+1}</span>{nombre.split(" ").slice(0,4).join(" ")}
                    </div>
                    <div style={{ fontSize:10, color:"#4a5060", marginTop:1 }}>{cliente?cap(cliente.vendedor):"—"} · {pct}% del total</div>
                  </div>
                  <span style={{ color:"#c17f4a", fontWeight:800, fontSize:13, marginLeft:10 }}>{fmtM(total)}</span>
                </div>
              );
            })}
          </Secc>

          {/* ── Salud de cartera ── */}
          <Secc title="Salud de cartera global">
            <div style={{ background:"#131a22", borderRadius:12, border:"1px solid #1e2a34", padding:14 }}>
              {[
                { id:"activos3m",    v:act3m.size,            c:"#6b8f5e", label:"Activos · últimos 3 meses"      },
                { id:"medios",       v:act6m.size-act3m.size, c:"#c17f4a", label:"Tibiando · entre 3 y 6 meses"   },
                { id:"recuperar",    v:aRec.size,             c:"#c25b4e", label:"Recuperar · +6 meses sin compra" },
                { id:"sinHistorial", v:sinH,                  c:"#8a8880", label:"Sin historial de compras"        },
              ].map(({id,v,c,label})=>{
                const pct = Math.round(v/tot*100)||0;
                return (
                  <div key={id} onClick={()=>setAdminCartera(id)} style={{ marginBottom:12, cursor:"pointer" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                      <span style={{ fontSize:12, color:"#c8c4be" }}>{label}</span>
                      <span style={{ fontSize:13, fontWeight:800, color:c }}>{v} <span style={{ fontSize:9, color:"#4a5060", fontWeight:400 }}>({pct}%) →</span></span>
                    </div>
                    <div style={{ background:"#0d1117", borderRadius:4, height:3 }}>
                      <div style={{ background:c, height:"100%", width:`${pct}%`, borderRadius:4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Secc>

          {/* ── Clientes en riesgo ── */}
          {enRiesgo.length>0 && (
            <Secc title={`En riesgo de irse · ${enRiesgo.length} clientes`}>
              <div style={{ background:"#1a1010", borderRadius:12, border:"1px solid #c25b4e30", overflow:"hidden" }}>
                {enRiesgo.slice(0,8).map((c,i)=>(
                  <div key={c.airtableId} onClick={()=>{setSel(c);setVista("detalle");setTabDetalle("info");}}
                    style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderBottom:"1px solid #c25b4e15", cursor:"pointer" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, color:"#c8c4be", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.nombre.split(" ").slice(0,4).join(" ")}</div>
                      <div style={{ fontSize:10, color:"#4a5060", marginTop:1 }}>{cap(c.vendedor)} · {c.ciudad||"—"}</div>
                    </div>
                    <div style={{ textAlign:"right", marginLeft:10, flexShrink:0 }}>
                      <div style={{ fontSize:12, fontWeight:800, color:"#c25b4e" }}>{diasDesde(c.ultimaCompra)}d</div>
                      <div style={{ fontSize:9, color:"#4a5060" }}>{fmtM(c.montoUltima)}</div>
                    </div>
                  </div>
                ))}
                {enRiesgo.length>8 && (
                  <div onClick={()=>setAdminCartera("recuperar")} style={{ padding:"10px 14px", textAlign:"center", fontSize:11, color:"#c25b4e", fontWeight:700, cursor:"pointer" }}>
                    Ver los {enRiesgo.length} clientes en riesgo →
                  </div>
                )}
              </div>
            </Secc>
          )}

          {/* ── Top 10 clientes ── */}
          <Secc title="Ranking top 10 · facturación acumulada">
            <div style={{ background:"#131a22", borderRadius:12, border:"1px solid #1e2a34", overflow:"hidden" }}>
              {top.slice(0,10).map(([nombre,total],i)=>{
                const cliente = clientes.find(c=>c.nombre.toUpperCase().trim()===nombre);
                return (
                  <div key={i} onClick={()=>{ if(cliente){setSel(cliente);setVista("detalle");setTabDetalle("info");} }}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderBottom:"1px solid #111820", cursor:cliente?"pointer":"default" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, color:"#c8c4be", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        <span style={{ color:"#4a5060", fontSize:10, marginRight:8, fontWeight:700 }}>#{i+1}</span>{nombre.split(" ").slice(0,4).join(" ")}
                      </div>
                      <div style={{ fontSize:10, color:"#4a5060", marginTop:1 }}>{cliente?cap(cliente.vendedor):"—"}</div>
                    </div>
                    <span style={{ color:"#c17f4a", fontWeight:800, fontSize:13, marginLeft:10, flexShrink:0 }}>{fmtM(total)}</span>
                  </div>
                );
              })}
            </div>
          </Secc>

        </div>
      </Root>
    );
  }


  // ── PANTALLA ADMINISTRACIÓN (Daniela) ────────────────────────────────────
  if (session.role === "administracion") {
    // Solo puede ver CC y búsqueda de clientes (solo datos de contacto)
    if (vista === "cc") return (
      <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
        <CuentasCorrientes session={session} />
      </Root>
    );

    if (vista === "comunicacion") return (
      <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
        <ComunicacionAdm clientes={clientes} session={session} />
      </Root>
    );

    if (vista === "seguimientos") return (
      <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
        <SeguimientosPendientes
          session={session}
          clientes={clientes}
          onGestion={g => setMiniGestCC({ cliente:g.clienteNombre, saldoTotal:0, vendedor:g.vendedor, airtableId:g.clienteId })}
        />
        {MiniGestOverlay}
      </Root>
    );

    if (vista === "gestiones_adm") return (
      <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
        <PanelGestiones session={session} clientes={clientes} />
      </Root>
    );

    // Vista clientes — solo contacto, sin editar
    return (
      <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
        <div style={{ padding:"16px 16px 100px", background:"#0a0e14", minHeight:"100vh" }}>
          <div style={{ marginBottom:16, marginTop:8 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:600, color:"#f0ede8", marginBottom:4 }}>Clientes</div>
            <div style={{ fontSize:11, color:"#4a5060" }}>Datos de contacto · {clientes.length} ópticas</div>
          </div>
          <input placeholder="Buscar cliente, ciudad..." value={busq} onChange={e=>setBusq(e.target.value)}
            style={{ marginBottom:12, display:"block", width:"100%", boxSizing:"border-box" }} />
          {clientes
            .filter(o => !busq || o.nombre?.toLowerCase().includes(busq.toLowerCase()) || (o.ciudad||"").toLowerCase().includes(busq.toLowerCase()))
            .slice(0, 80)
            .map((o,i) => {
              const tel = (o.whatsapp||o.telefono||"").replace(/\D/g,"");
              return (
                <div key={i} style={{ background:"#131a22", border:"1px solid #1e2a34", borderRadius:14, marginBottom:8, padding:"14px 16px" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#f0ede8", marginBottom:6 }}>
                    {o.nombre?.split(" ").slice(0,5).join(" ")}
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {o.ciudad && <span style={{ fontSize:11, color:"#4a5060" }}>📍 {[o.ciudad, o.provincia].filter(Boolean).join(", ")}</span>}
                    {o.vendedor && <span style={{ fontSize:11, color:"#c17f4a50" }}>· {o.vendedor}</span>}
                  </div>
                  {(o.whatsapp||o.telefono) && (
                    <div style={{ marginTop:8, display:"flex", gap:8 }}>
                      {tel && (
                        <a href={`https://wa.me/54${tel}`} target="_blank"
                          style={{ flex:1, background:"#25D366", color:"#fff", border:"none", borderRadius:10, padding:"10px", fontSize:11, fontWeight:800, textAlign:"center", textDecoration:"none", display:"block" }}>
                          💬 WhatsApp
                        </a>
                      )}
                      {tel && (
                        <a href={`tel:+54${tel}`}
                          style={{ background:"#1e2a34", color:"#c8c4be", border:"none", borderRadius:10, padding:"10px 16px", fontSize:11, fontWeight:700, textDecoration:"none", display:"block" }}>
                          📞
                        </a>
                      )}
                    </div>
                  )}
                  {o.email && (
                    <a href={`mailto:${o.email}`} style={{ display:"block", marginTop:6, fontSize:11, color:"#7ba7bc", textDecoration:"none" }}>
                      ✉ {o.email}
                    </a>
                  )}
                </div>
              );
            })}
        </div>
      </Root>
    );
  }

  // ── VISTAS VENDEDOR ───────────────────────────────────────────────────────
  if (session.role !== "admin") {
    if (vistaVendedor==="progreso") {
      return <ProgresoVendedor session={session} clientes={clientes} ventas={ventas} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista}
        onIrACartera={(filtro)=>{setFiltroCartera(filtro);setVistaVendedor("lista");}} />;
    }
    if (vistaVendedor==="home") {
      return <HomeVendedor session={session} clientes={clientes} ventas={ventas} ventasLoaded={ventasLoaded} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista}
        onCliente={(c,tab)=>{setSel(c);setVista("detalle");setTabDetalle(tab||"info");}}
        onIrACartera={(filtro)=>{setFiltroCartera(filtro);setVistaVendedor("lista");}}
        onVerTodos={()=>setVistaVendedor("lista")}
        onNueva={()=>setVista("nueva")}
        onNuevoPedido={()=>{setPedidoCtx(null);setVista("pedido");}}
        onMisPedidos={()=>setVista("pedidos")}
        updateCliente={updateCliente}
        onLogout={()=>handleNav("logout")} />;
    }
  }

  // ── LISTA ADMIN ──────────────────────────────────────────────────────────
  if (session.role==="admin") {
    const { act3m, act6m, conH, aRec } = calcSalud(ventas, clientes);
    const facTotalMap = {};
    ventas.filter(esVentaReal).forEach(v=>{ facTotalMap[v.cliente]=(facTotalMap[v.cliente]||0)+v.importe; });

    const FILTROS_SALUD = [
      { id:"todos",        label:"Todos",      c:"#c17f4a" },
      { id:"activos3m",    label:"Activos",    c:"#6b8f5e" },
      { id:"medios",       label:"Entibiando",   c:"#c17f4a" },
      { id:"recuperar",    label:"Recuperar",  c:"#c25b4e" },
      { id:"sinHistorial", label:"Sin hist.",  c:"#8a8880" },
    ];

    const listaAdmin = clientes
      .filter(o => {
        if (busq) return o.nombre?.toLowerCase().includes(busq.toLowerCase()) || o.ciudad?.toLowerCase().includes(busq.toLowerCase());
        const n = o.nombre.toUpperCase().trim();
        if (filtro==="activos3m")    return act3m.has(n);
        if (filtro==="medios")       return act6m.has(n) && !act3m.has(n);
        if (filtro==="recuperar")    return aRec.has(n);
        if (filtro==="sinHistorial") return !conH.has(n);
        return true;
      })
      .sort((a,b) => {
        const nA = a.nombre.toUpperCase().trim(), nB = b.nombre.toUpperCase().trim();
        if (adminOrden==="monto")    return (facTotalMap[nB]||b.montoUltima||0)-(facTotalMap[nA]||a.montoUltima||0);
        if (adminOrden==="fecha")    return (b.ultimaCompra||"").localeCompare(a.ultimaCompra||"");
        if (adminOrden==="vendedor") return (a.vendedor||"").localeCompare(b.vendedor||"");
        return (a.nombre||"").localeCompare(b.nombre||"","es");
      });

    return (
      <Root session={session} onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista} onBuscar={()=>setBuscGlobal(true)}>
        {/* Header */}
        <div style={{ padding:"14px 16px 0", background:"#0d1117", borderBottom:"1px solid #1c2530" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:600, color:"#f0ede8" }}>Clientes</div>
              <div style={{ fontSize:11, color:"#4a5060" }}>{listaAdmin.length} de {clientes.length} ópticas</div>
            </div>
            <BtnDanger onClick={()=>handleNav("logout")}>⏻</BtnDanger>
          </div>

          {/* Búsqueda */}
          <input placeholder="Buscar óptica o ciudad..." value={busq} onChange={e=>{setBusq(e.target.value); if(e.target.value) setFiltro("todos");}} style={{ marginBottom:10 }} />

          {/* Filtros salud de cartera */}
          <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:8, scrollbarWidth:"none" }}>
            {FILTROS_SALUD.map(f=>(
              <button key={f.id} onClick={()=>{setFiltro(f.id); setBusq("");}}
                style={{ padding:"5px 12px", whiteSpace:"nowrap", background:filtro===f.id?f.c+"20":"transparent", color:filtro===f.id?f.c:"#4a5060", border:`1px solid ${filtro===f.id?f.c+"60":"#1e2a34"}`, fontSize:11, fontWeight:700, borderRadius:999 }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Orden */}
          <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:12, scrollbarWidth:"none", borderTop:"1px solid #111820", paddingTop:8, marginTop:4 }}>
            <span style={{ fontSize:9, color:"#4a5060", fontWeight:700, textTransform:"uppercase", letterSpacing:1, alignSelf:"center", flexShrink:0 }}>Orden:</span>
            {[["monto","$ Monto"],["fecha","Última compra"],["vendedor","Vendedor"],["nombre","Nombre"]].map(([k,l])=>(
              <button key={k} onClick={()=>setAdminOrden(k)}
                style={{ padding:"4px 12px", whiteSpace:"nowrap", background:adminOrden===k?"#7ba7bc20":"transparent", color:adminOrden===k?"#7ba7bc":"#4a5060", border:`1px solid ${adminOrden===k?"#7ba7bc60":"#1e2a34"}`, fontSize:11, fontWeight:700, borderRadius:999 }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div style={{ overflowY:"auto", paddingBottom:80 }}>
          {listaAdmin.length===0
            ? <div style={{ textAlign:"center", padding:40, color:"#8a8880" }}>Sin resultados</div>
            : listaAdmin.map(c=>{
                const tel = (c.telefono||"").replace(/\D/g,"");
                const dias = diasDesde(c.ultimaCompra);
                const facTotal = facTotalMap[c.nombre.toUpperCase().trim()] || c.montoUltima || 0;
                const badge = badgeVisita(c.proximaVisita);
                return (
                  <div key={c.airtableId} style={{ display:"flex", alignItems:"center", padding:"12px 16px", borderBottom:"1px solid #1c2530" }}>
                    <div onClick={()=>{setSel(c);setVista("detalle");setTabDetalle("info");}} style={{ flex:1, minWidth:0, cursor:"pointer" }}>
                      <div style={{ fontWeight:600, fontSize:14, marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", color:esAlerta(c)?"#c25b4e":esInactivo(c)?"#4a5060":"#c8c4be" }}>{c.nombre.split(" ").slice(0,4).join(" ")}</div>
                      <div style={{ fontSize:11, color:"#4a5060", display:"flex", gap:5, flexWrap:"wrap" }}>
                        <span style={{ color:"#c17f4a80", fontWeight:700 }}>{cap(c.vendedor)}</span>
                        {c.ciudad && <span>· {c.ciudad}</span>}
                        {dias!==null && <span>· {dias}d</span>}
                        {badge && <span style={{ background:badge.bg, color:badge.color, borderRadius:4, padding:"0 5px", fontSize:10, fontWeight:700 }}>{badge.txt}</span>}
                      </div>
                    </div>
                    <div onClick={()=>{setSel(c);setVista("detalle");setTabDetalle("info");}} style={{ textAlign:"right", marginLeft:12, cursor:"pointer", flexShrink:0 }}>
                      <div style={{ fontSize:14, fontWeight:800, color:"#c17f4a" }}>{fmtM(facTotal)}</div>
                      <div style={{ fontSize:9, color:"#4a5060", textTransform:"uppercase" }}>{c.estado}</div>
                    </div>
                    {tel && <a href={`https://wa.me/54${tel}`} target="_blank" onClick={e=>e.stopPropagation()} style={{ marginLeft:10, background:"#142218", borderRadius:"50%", width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", fontSize:16, border:"1px solid #6b8f5e40", flexShrink:0 }}>💬</a>}
                  </div>
                );
              })
          }
        </div>
      </Root>
    );
  }

  return <ListaVendedor session={session} clientes={clientes} ventas={ventas} busq={busq} setBusq={setBusq}
    onNav={handleNav} vistaVendedor={vistaVendedor} vista={vista}
    onCliente={(c)=>{setSel(c);setVista("detalle");setTabDetalle("info");}}
    onNueva={()=>setVista("nueva")} onLogout={()=>handleNav("logout")}
    filtroCartera={filtroCartera} setFiltroCartera={setFiltroCartera} />;
}

// ─── COACH IA ────────────────────────────────────────────────────────────────
// ─── COACH CONFIG (admin) ────────────────────────────────────────────────────
const COACH_CONFIG_KEY = "coach_config_v1";
const VENDEDORES_COACH = [
  { id:"matias",  nombre:"Matías"  },
  { id:"miguel",  nombre:"Miguel"  },
  { id:"nicolas", nombre:"Nicolás" },
  { id:"mauro",   nombre:"Mauro"   },
];

function getCoachConfig() {
  try {
    const raw = localStorage.getItem(COACH_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Default: apagado para todos
  return { activo: false, vendedores: {} };
}

function setCoachConfig(cfg) {
  localStorage.setItem(COACH_CONFIG_KEY, JSON.stringify(cfg));
}

function CoachConfig() {
  const [cfg, setCfg] = useState(getCoachConfig);

  const toggleGlobal = () => {
    const next = { ...cfg, activo: !cfg.activo };
    setCfg(next); setCoachConfig(next);
  };

  const toggleVendedor = id => {
    const vends = { ...cfg.vendedores, [id]: !(cfg.vendedores[id] ?? false) };
    const next = { ...cfg, vendedores: vends };
    setCfg(next); setCoachConfig(next);
  };

  return (
    <div style={{ background:"#0d1117", border:"1px solid #1e2a34", borderRadius:14, padding:"16px", marginBottom:16 }}>
      {/* Header con toggle global */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: cfg.activo ? 14 : 0 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:800, color:"#f0ede8", letterSpacing:.3 }}>✦ Coach IA</div>
          <div style={{ fontSize:10, color:"#4a5060", marginTop:2 }}>
            {cfg.activo ? "Activo — los vendedores habilitados reciben su mensaje" : "Apagado — ningún vendedor recibe el coach"}
          </div>
        </div>
        {/* Toggle switch */}
        <div onClick={toggleGlobal}
          style={{ width:48, height:28, borderRadius:14, background:cfg.activo?"#6b8f5e":"#2a3040", cursor:"pointer", position:"relative", transition:"background .2s", flexShrink:0 }}>
          <div style={{ position:"absolute", top:3, left: cfg.activo ? 23 : 3, width:22, height:22, borderRadius:"50%", background:"#fff", transition:"left .2s", boxShadow:"0 1px 4px #00000040" }}/>
        </div>
      </div>

      {/* Vendedores — solo si está activo */}
      {cfg.activo && (
        <div style={{ borderTop:"1px solid #1e2a34", paddingTop:12 }}>
          <div style={{ fontSize:9, color:"#4a5060", textTransform:"uppercase", letterSpacing:1.5, fontWeight:700, marginBottom:10 }}>Habilitados</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {VENDEDORES_COACH.map(v => {
              const on = cfg.vendedores[v.id] ?? false;
              return (
                <button key={v.id} onClick={()=>toggleVendedor(v.id)}
                  style={{ padding:"6px 14px", borderRadius:999, border:`1px solid ${on?"#6b8f5e60":"#1e2a34"}`, background:on?"#6b8f5e20":"transparent", color:on?"#6b8f5e":"#4a5060", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                  {on ? "✓ " : ""}{v.nombre}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize:9, color:"#2a3545", marginTop:10 }}>
            Los cambios aplican al próximo login del vendedor.
          </div>
        </div>
      )}
    </div>
  );
}

function CoachIA({ vendedor, username, facMes, facMismoMesAnt, deltaYoY, clientesMes, activos, aRec, misClientes, ventasLoaded }) {
  const [msg, setMsg] = React.useState(null);
  const [cargando, setCargando] = React.useState(false);

  React.useEffect(() => {
    if (!ventasLoaded) return;

    // Verificar si el coach está habilitado para este vendedor
    const cfg = getCoachConfig();
    if (!cfg.activo || !(cfg.vendedores[username] ?? false)) return;

    const hoy = new Date();
    const fecha = hoy.toISOString().slice(0,10);
    const hora = hoy.getHours();
    // Tres turnos: mañana (0-12), tarde (12-19), noche (19-24)
    const turno = hora < 12 ? "manana" : hora < 19 ? "tarde" : "noche";
    const turnoLabel = hora < 12 ? "mañana" : hora < 19 ? "tarde" : "noche";
    // Cache por fecha + turno + datos — regenera si cambian los datos o el turno
    const facSlot = facMes > 0 ? String(Math.round(facMes/1000)) : "0";
    const cacheKey = `coach_${username}_${fecha}_${turno}_${facSlot}`;

    // Limpiar caches viejos
    Object.keys(localStorage)
      .filter(k => k.startsWith(`coach_${username}_`) && k !== cacheKey)
      .forEach(k => localStorage.removeItem(k));

    const cached = localStorage.getItem(cacheKey);
    if (cached) { setMsg(cached); return; }

    setCargando(true);
    const diaDelMes = hoy.getDate();
    const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth()+1, 0).getDate();
    const MESES_ES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    const mesActualNombre = MESES_ES[hoy.getMonth()];
    const anioActual = hoy.getFullYear();
    const anioAnterior = anioActual - 1;
    const proyeccion = diaDelMes > 0 ? Math.round(facMes / diaDelMes * diasEnMes) : 0;

    fetch("/api/coach", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        vendedor, username, facMes, facMismoMesAnt, deltaYoY,
        clientesMes, activos, aRec,
        totalClientes: misClientes.length,
        diaDelMes, diasEnMes, proyeccion,
        mesActualNombre, anioActual, anioAnterior,
        tieneDatoYoY: facMismoMesAnt > 0,
        turno, turnoLabel  // mañana / tarde / noche
      })
    })
    .then(r=>r.json())
    .then(d=>{
      if (d.texto) { setMsg(d.texto); localStorage.setItem(cacheKey, d.texto); }
    })
    .catch(()=>{})
    .finally(()=>setCargando(false));
  }, [username, ventasLoaded, facMes]);

  if (!msg && !cargando) return null;

  return (
    <div style={{ background:"linear-gradient(135deg,#0f1a12,#0d1117)", border:"1px solid #6b8f5e40", borderRadius:14, padding:"14px 16px", marginBottom:16, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, width:3, height:"100%", background:"linear-gradient(#6b8f5e,#c17f4a)", borderRadius:"14px 0 0 14px" }} />
      <div style={{ paddingLeft:10 }}>
        <div style={{ fontSize:8, fontWeight:700, color:"#6b8f5e", textTransform:"uppercase", letterSpacing:2, marginBottom:6 }}>✦ Tu coach hoy</div>
        {cargando
          ? <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:14, height:14, border:"2px solid #1e2a34", borderTopColor:"#6b8f5e", borderRadius:"50%", animation:"spin 0.8s linear infinite", flexShrink:0 }} />
              <span style={{ fontSize:12, color:"#4a5060" }}>Analizando tu mes...</span>
            </div>
          : <div style={{ fontSize:13, color:"#c8c4be", lineHeight:1.65 }}>{msg}</div>
        }
      </div>
    </div>
  );
}

// ─── HOME VENDEDOR ────────────────────────────────────────────────────────────
function HomeVendedor({ session, clientes, ventas, ventasLoaded, onNav, vistaVendedor, vista, onCliente, onVerTodos, onNueva, onLogout, onNuevoPedido, onMisPedidos, onIrACartera, updateCliente }) {
  const [subVista, setSubVista] = React.useState(null); // null | "facturas" | "clientesMes" | "clientesPrev"
  const misClientes = clientes.filter(c => c.vendedor===session.username);
  const hoy = new Date(), mesStr = hoy.toISOString().slice(0,7);
  const mesPrevStr = new Date(hoy.getFullYear(),hoy.getMonth()-1,1).toISOString().slice(0,7);
  const mesNombre = hoy.toLocaleDateString("es-AR",{month:"long"});
  const mesPrevNombre = new Date(hoy.getFullYear(),hoy.getMonth()-1,1).toLocaleDateString("es-AR",{month:"long"});
  const hora = hoy.getHours();
  const saludo = hora<12 ? "Buenos días" : hora<19 ? "Buenas tardes" : "Buenas noches";

  const misNombres = new Set(misClientes.map(c=>c.nombre.toUpperCase().trim()));
  // Filtrar ventas del vendedor usando campo vendedor mapeado de Sinergia
  // Solo usa clientes como fallback si no hay campo vendedor en ninguna venta
  const hayVendedorField = ventas.some(v => v.vendedor);
  const misVentas = hayVendedorField
    ? ventas.filter(v => v.vendedor === session.username)
    : ventas.filter(v => misNombres.has(v.cliente));

  const ventasMes = misVentas.filter(v=>v.fecha?.startsWith(mesStr) && esVentaReal(v));
  const ventasPrev = misVentas.filter(v=>v.fecha?.startsWith(mesPrevStr) && esVentaReal(v));
  const facMes = ventasMes.reduce((a,v)=>a+v.importe,0);
  const facPrev = ventasPrev.reduce((a,v)=>a+v.importe,0);
  const deltaFac = facPrev > 0 ? Math.round(((facMes-facPrev)/facPrev)*100) : null;

  // YoY — mismo mes año anterior completo vs proyección al cierre de este mes
  const mesAntAnioStr = `${hoy.getFullYear()-1}-${String(hoy.getMonth()+1).padStart(2,"0")}`;
  const ventasMismoMesAnt = misVentas.filter(v=>v.fecha?.startsWith(mesAntAnioStr) && esVentaReal(v));
  const facMismoMesAnt = ventasMismoMesAnt.reduce((a,v)=>a+v.importe,0);
  const diaHoy = hoy.getDate();
  const diasTotalesMes = new Date(hoy.getFullYear(), hoy.getMonth()+1, 0).getDate();
  const facMesProyectado = diaHoy > 0 ? Math.round(facMes / diaHoy * diasTotalesMes) : facMes;
  const deltaYoY = facMismoMesAnt > 0 ? Math.round(((facMesProyectado - facMismoMesAnt) / facMismoMesAnt) * 100) : null;

  // Cuentas Corrientes — total a cobrar
  const [ccTotal, setCcTotal] = React.useState(null);
  React.useEffect(() => {
    fetch(`/api/cuentas-corrientes?vendedor=${session.username}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          const total = d.clientes.filter(c => c.saldoTotal > 0).reduce((a, c) => a + c.saldoTotal, 0);
          setCcTotal(total);
        }
      })
      .catch(() => {});
  }, [session.username]);

  // Clientes que compraron este mes
  const clientesMes = new Set(ventasMes.map(v=>v.cliente));
  const hoyVisitas  = misClientes.filter(c=>diasHasta(c.proximaVisita)===0);
  const proximas    = misClientes.filter(c=>{ const d=diasHasta(c.proximaVisita); return d!==null && d>0 && d<=7; }).sort((a,b)=>new Date(a.proximaVisita)-new Date(b.proximaVisita));
  const reactivar  = misClientes.filter(esAlerta).sort((a,b)=>(diasDesde(b.ultimaCompra)??0)-(diasDesde(a.ultimaCompra)??0)).slice(0,3);
  // Alertas automáticas — clientes que se están "durmiendo"
  const hoy6m = new Date(); hoy6m.setMonth(hoy6m.getMonth()-6);
  const hoy3m = new Date(); hoy3m.setMonth(hoy3m.getMonth()-3);
  const str3m = hoy3m.toISOString().slice(0,10);
  const str6mAl = hoy6m.toISOString().slice(0,10);
  const alertasAuto = misClientes.filter(c => {
    const uc = c.ultimaCompra;
    if (!uc) return false;
    return uc < str3m && uc >= str6mAl; // compraron hace 3-6m → en riesgo
  }).sort((a,b)=>(diasDesde(b.ultimaCompra)??0)-(diasDesde(a.ultimaCompra)??0)).slice(0,5);

  // Alertas urgentes: vencidas o que vencen hoy
  const hoyStr = hoy.toISOString().slice(0,10);
  const [alertasPospuestas, setAlertasPospuestas] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(`alertas_pospuestas_${session.username}_${hoyStr}`) || "[]"); } catch { return []; }
  });

  const alertasUrgentes = misClientes.flatMap(c =>
    (c.alertas||[])
      .filter(a => a.activa && a.fecha && a.fecha <= hoyStr && !alertasPospuestas.includes(a.id))
      .map(a => ({ ...a, clienteNombre: c.nombre, clienteId: c.airtableId }))
  ).sort((a,b) => a.fecha.localeCompare(b.fecha));

  const marcarHecha = async (alerta) => {
    // Actualizar en Airtable — marcar activa:false en la alerta del cliente
    const cliente = misClientes.find(c => c.airtableId === alerta.clienteId);
    if (!cliente) return;
    const nuevasAlertas = (cliente.alertas||[]).map(a =>
      a.id === alerta.id ? { ...a, activa: false } : a
    );
    await updateCliente(alerta.clienteId, { alertas: nuevasAlertas });
  };

  const posponer = (alerta) => {
    const nuevas = [...alertasPospuestas, alerta.id];
    setAlertasPospuestas(nuevas);
    localStorage.setItem(`alertas_pospuestas_${session.username}_${hoyStr}`, JSON.stringify(nuevas));
  };

  // Sonido al entrar si hay alertas urgentes
  React.useEffect(() => {
    if (alertasUrgentes.length > 0) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        // Dos beeps cortos
        [0, 0.3].forEach(offset => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = 880;
          osc.type = "sine";
          gain.gain.setValueAtTime(0.3, ctx.currentTime + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.25);
          osc.start(ctx.currentTime + offset);
          osc.stop(ctx.currentTime + offset + 0.25);
        });
      } catch(e) {}

      // Mail — una sola vez por sesión (evita spam si recarga)
      const mailKey = `alertas_mail_${session.username}_${hoyStr}`;
      if (!localStorage.getItem(mailKey)) {
        localStorage.setItem(mailKey, "1");
        fetch("/api/alertas-mail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: session.username,
            nombre: session.nombre,
            alertas: alertasUrgentes.map(a => ({
              texto: a.texto,
              fecha: a.fecha,
              clienteNombre: a.clienteNombre,
            }))
          })
        }).catch(() => {});
      }
    }
  }, [session.username]); // solo al entrar

  // Salud cartera
  const { act3m, act6m, conH, aRec, sinH } = calcSalud(misVentas, misClientes);

  const cats = [
    { id:"activos3m",    v:act3m.size,             c:"#6b8f5e", label:"Activos"   },
    { id:"medios",       v:act6m.size-act3m.size,  c:"#c17f4a", label:"Entibiando"  },
    { id:"recuperar",    v:aRec.size,               c:"#c25b4e", label:"Recuperar" },
    { id:"sinHistorial", v:sinH,                    c:"#8a8880", label:"Sin hist." },
  ];

  // Sub-vista: detalle de facturas o clientes del mes
  if (subVista) {
    const misNombresLocal = new Set(misClientes.map(c=>c.nombre.toUpperCase().trim()));
    const misVentasLocal = ventas.filter(v=>misNombresLocal.has(v.cliente));
    let titulo, subtitulo, filas = [];

    if (subVista === "facturas") {
      const facturasMes = misVentasLocal.filter(v=>v.fecha?.startsWith(mesStr)).sort((a,b)=>b.importe-a.importe);
      titulo = `Facturación ${mesNombre}`;
      subtitulo = `${facturasMes.length} facturas · Total ${fmtM(facturasMes.reduce((a,v)=>a+v.importe,0))}`;
      filas = facturasMes.map((v,i)=>(
        <div key={i} onClick={()=>{ const c=misClientes.find(x=>x.nombre.toUpperCase().trim()===v.cliente); if(c){setSubVista(null);onCliente(c,"ventas");} }}
          style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 16px", borderBottom:"1px solid #111820", cursor:"pointer" }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#c8c4be", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{v.cliente.split(" ").slice(0,4).join(" ")}</div>
            <div style={{ fontSize:11, color:"#4a5060", marginTop:1 }}>{v.fecha} {v.comprobante && `· ${v.comprobante}`}</div>
          </div>
          <span style={{ fontSize:15, fontWeight:800, color:"#6b8f5e", marginLeft:12 }}>{fmtM(v.importe)}</span>
        </div>
      ));
    } else {
      const mes    = subVista==="clientesMes" ? mesStr : mesPrevStr;
      const nomMes = subVista==="clientesMes" ? mesNombre : mesPrevNombre;
      const facPorCliente = {};
      misVentasLocal.filter(v=>v.fecha?.startsWith(mes)).forEach(v=>{ facPorCliente[v.cliente]=(facPorCliente[v.cliente]||0)+v.importe; });

      // Todos los nombres únicos de Sinergia que compraron ese mes
      const nombresEnSinergia = Object.keys(facPorCliente).sort((a,b)=>(facPorCliente[b]||0)-(facPorCliente[a]||0));
      titulo = `Clientes de ${nomMes}`;
      subtitulo = `${nombresEnSinergia.length} clientes · ${fmtM(Object.values(facPorCliente).reduce((a,v)=>a+v,0))}`;
      filas = nombresEnSinergia.map((nombre, i)=>{
        const facT = facPorCliente[nombre] || 0;
        // Intentar encontrar el cliente en el CRM para poder navegar al detalle
        const clienteCRM = misClientes.find(x=>x.nombre.toUpperCase().trim()===nombre.trim());
        return (
          <div key={i} onClick={()=>{ if(clienteCRM){setSubVista(null);onCliente(clienteCRM,"ventas");} }}
            style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 16px", borderBottom:"1px solid #111820", cursor:clienteCRM?"pointer":"default" }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:clienteCRM?"#c8c4be":"#8a8880", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{nombre.split(" ").slice(0,4).join(" ")}</div>
              <div style={{ fontSize:11, color:"#4a5060" }}>{clienteCRM ? clienteCRM.ciudad||"—" : "Sin ficha en CRM"}</div>
            </div>
            <div style={{ fontSize:15, fontWeight:800, color:"#7ba7bc", marginLeft:12 }}>{fmtM(facT)}</div>
          </div>
        );
      });
    }

    return (
      <Root session={session} onNav={onNav} vistaVendedor={vistaVendedor} vista={vista}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 16px", background:"#0d1117", borderBottom:"1px solid #1c2530" }}>
          <button onClick={()=>setSubVista(null)} style={{ background:"#131a22", color:"#8a8880", border:"1px solid #1e2a34", borderRadius:8, padding:"5px 12px", fontSize:12, fontWeight:700 }}>← Volver</button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#f0ede8" }}>{titulo}</div>
            <div style={{ fontSize:11, color:"#4a5060", marginTop:1 }}>{subtitulo}</div>
          </div>
        </div>
        <div style={{ overflowY:"auto", paddingBottom:80 }}>
          {filas.length===0 ? <div style={{ textAlign:"center", padding:40, color:"#8a8880" }}>Sin datos para este período</div> : filas}
        </div>
      </Root>
    );
  }

  const cerrarDia = async () => {
    const fechaHoy = new Date().toISOString().slice(0,10);
    let resumenGest = "";
    try {
      const r = await fetch(`/api/gestiones?vendedor=${session.username}&fecha=${fechaHoy}`);
      const d = await r.json();
      if (d.ok && d.gestiones.length > 0) {
        resumenGest = "\n\nGestiones de hoy:\n" + d.gestiones.map(g =>
          `• ${g.clienteNombre} — ${g.tipo} — ${g.estado}${g.nota?" ("+g.nota+")":""}`
        ).join("\n");
      }
    } catch {}
    const hoyFmt = new Date().toLocaleDateString("es-AR", {weekday:"long",day:"numeric",month:"long"});
    const mesN = new Date().toLocaleDateString("es-AR",{month:"long"});
    const body = `Resumen de jornada — ${hoyFmt}\n\nVendedor: ${session.nombre}\n\nFacturación del mes (${mesN}): $${facMes.toLocaleString("es-AR")}\nClientes activos: ${misClientes.filter(c=>c.ultimaCompra >= new Date(Date.now()-90*864e5).toISOString().slice(0,10)).length} de ${misClientes.length}${resumenGest}\n\n---\nCentral Eyewear CRM`;
    window.location.href = `mailto:alexisnassimoff@gmail.com?subject=Resumen ${session.nombre} — ${hoyFmt}&body=${encodeURIComponent(body)}`;
  };

  return (
    <Root session={session} onNav={onNav} vistaVendedor={vistaVendedor} vista={vista}>
      <div style={{ overflowY:"auto", paddingBottom:80 }}>

        {/* ── Banner alertas urgentes ── */}
        {alertasUrgentes.length > 0 && (
          <div style={{ background:"linear-gradient(135deg,#1a0808,#200d0d)", borderBottom:"2px solid #c25b4e40", padding:"14px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:18 }}>🔔</span>
              <span style={{ fontSize:12, fontWeight:800, color:"#c25b4e", textTransform:"uppercase", letterSpacing:1 }}>
                {alertasUrgentes.length === 1 ? "1 alerta urgente" : `${alertasUrgentes.length} alertas urgentes`}
              </span>
            </div>
            {alertasUrgentes.slice(0,5).map((a,i) => {
              const vencida = a.fecha < hoyStr;
              return (
                <div key={i} style={{ background:"#2a1010", borderRadius:12, padding:"12px 14px", marginBottom:8, border:"1px solid #c25b4e30" }}>
                  {/* Header */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#c25b4e", marginBottom:3, textTransform:"uppercase", letterSpacing:.5 }}>
                        {a.clienteNombre.split(" ").slice(0,3).join(" ")}
                      </div>
                      <div style={{ fontSize:13, color:"#f0ede8", lineHeight:1.4 }}>{a.texto}</div>
                    </div>
                    <div style={{ fontSize:10, fontWeight:700, color: vencida?"#c25b4e":"#c17f4a", background: vencida?"#c25b4e20":"#c17f4a20", borderRadius:6, padding:"2px 8px", flexShrink:0 }}>
                      {vencida ? `Vencida ${diasDesde(a.fecha)}d` : "Hoy"}
                    </div>
                  </div>
                  {/* Botones */}
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>marcarHecha(a)}
                      style={{ flex:1, background:"#6b8f5e20", color:"#6b8f5e", border:"1px solid #6b8f5e40", borderRadius:8, padding:"8px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      ✓ Realizada
                    </button>
                    <button onClick={()=>posponer(a)}
                      style={{ flex:1, background:"#1e2a34", color:"#8a8880", border:"1px solid #2a3a4a", borderRadius:8, padding:"8px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      → Posponer
                    </button>
                  </div>
                </div>
              );
            })}
            {alertasUrgentes.length > 5 && (
              <div style={{ fontSize:11, color:"#c25b4e80", textAlign:"center", marginTop:4 }}>
                +{alertasUrgentes.length - 5} más abajo en cada cliente
              </div>
            )}
          </div>
        )}

        {/* Hero */}
        <div style={{ background:"linear-gradient(160deg,#080c10 0%,#0d1a24 100%)", padding:"28px 20px 24px", borderBottom:"1px solid #1e2a34", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160, background:"#c17f4a", borderRadius:"50%", opacity:.06, pointerEvents:"none" }} />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:12, color:"#c17f4a60", marginBottom:4 }}>{saludo},</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:600, color:"#f0ede8" }}>{session.nombre}</div>
              <div style={{ fontSize:12, color:"#4a5060", marginTop:6 }}>{hoy.toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})}</div>
            </div>
            <button onClick={onLogout} style={{ background:"#131a22", border:"1px solid #1e2a34", borderRadius:8, padding:"7px 12px", color:"#8a8880", fontSize:11, fontWeight:700 }}>⏻</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:20 }}>
            {[
              { l:"Cuentas\nCorrientes", v: ccTotal !== null ? fmtM(ccTotal) : "...", c:"#c25b4e", dest:"cc" },
              { l:"Facturación\nSinergia", v:fmtM(facMes),     c:"#c17f4a", dest:"facturas"    },
              { l:"vs año\nanterior (proy.)", v:deltaYoY!==null?(deltaYoY>=0?`+${deltaYoY}%`:`${deltaYoY}%`):"—", sub: facMismoMesAnt>0?`base ${fmtM(facMismoMesAnt)}`:"sin dato", c:deltaYoY!==null?(deltaYoY>=0?"#6b8f5e":"#c25b4e"):"#4a5060", dest:"clientesPrev" },
            ].map(({l,v,c,dest,sub})=>(
              <div key={l} onClick={()=> dest==="cc" ? onNav("cc") : setSubVista(dest)}
                style={{ background:"#131a22", borderRadius:12, padding:"12px 8px", textAlign:"center", border:"1px solid #1e2a34", cursor:"pointer" }}>
                <div style={{ fontSize:8, color:"#8a8880", lineHeight:1.4, marginBottom:4, whiteSpace:"pre-line", textTransform:"uppercase", letterSpacing:.8, fontWeight:700 }}>{l}</div>
                <div style={{ fontSize:19, fontWeight:900, color:c }}>{v}</div>
                {sub && <div style={{ fontSize:8, color:"#4a5060", marginTop:2 }}>{sub}</div>}
                <div style={{ fontSize:8, color:"#c17f4a40", marginTop:3, fontWeight:700 }}>VER →</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:"16px 16px 0" }}>
          {/* Coach IA */}
          <CoachIA
            vendedor={session.nombre}
            username={session.username}
            facMes={facMes}
            facMismoMesAnt={facMismoMesAnt}
            deltaYoY={deltaYoY}
            clientesMes={clientesMes.size}
            activos={act3m.size}
            aRec={aRec.size}
            misClientes={misClientes}
            ventasLoaded={ventasLoaded}
          />

          {/* Salud cartera */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:9, fontWeight:700, color:"#8a8880", textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>Salud de tu cartera</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
              {cats.map(cat=>(
                <div key={cat.id} onClick={()=>onIrACartera(cat.id)}
                  style={{ background:"#131a22", borderRadius:12, padding:"11px 6px", textAlign:"center", cursor:"pointer", border:`1px solid ${cat.c}25` }}>
                  <div style={{ fontSize:20, fontWeight:900, color:cat.c }}>{cat.v}</div>
                  <div style={{ fontSize:8, color:"#8a8880", marginTop:3, textTransform:"uppercase", letterSpacing:.5, fontWeight:700 }}>{cat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {hoyVisitas.length>0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:9, fontWeight:700, color:"#7ba7bc", textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>Hoy visitás</div>
              {hoyVisitas.map(c=>(
                <div key={c.airtableId} onClick={()=>onCliente(c,"info")} style={{ background:"#0f1d2a", borderRadius:12, padding:"14px 16px", marginBottom:8, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", border:"1px solid #7ba7bc30" }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:"#f0ede8" }}>{c.nombre.split(" ").slice(0,3).join(" ")}</div>
                    <div style={{ fontSize:12, color:"#7ba7bc", marginTop:2 }}>{c.ciudad||"—"}</div>
                  </div>
                  <span style={{ fontSize:18, color:"#7ba7bc" }}>→</span>
                </div>
              ))}
            </div>
          )}

          {proximas.length>0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:9, fontWeight:700, color:"#8a8880", textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>Próximas visitas</div>
              {proximas.slice(0,3).map(c=>{
                const d=diasHasta(c.proximaVisita);
                return (
                  <div key={c.airtableId} onClick={()=>onCliente(c,"info")} style={{ background:"#131a22", borderRadius:12, padding:"12px 14px", marginBottom:6, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", border:"1px solid #1e2a34" }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:"#c8c4be" }}>{c.nombre.split(" ").slice(0,3).join(" ")}</div>
                      <div style={{ fontSize:11, color:"#4a5060" }}>{c.ciudad||"—"}</div>
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:d<=2?"#c17f4a":"#8a8880", background:d<=2?"#c17f4a15":"transparent", padding:"4px 10px", borderRadius:6, border:d<=2?"1px solid #c17f4a30":"none" }}>{d===1?"mañana":`en ${d}d`}</span>
                  </div>
                );
              })}
            </div>
          )}

          {reactivar.length>0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:9, fontWeight:700, color:"#c25b4e", textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>Para reactivar</div>
              {reactivar.map(c=>(
                <div key={c.airtableId} onClick={()=>onCliente(c,"visita")} style={{ background:"#131a22", borderRadius:12, padding:"12px 14px", marginBottom:6, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", border:"1px solid #c25b4e25" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#c8c4be" }}>{c.nombre.split(" ").slice(0,3).join(" ")}</div>
                    <div style={{ fontSize:11, color:"#4a5060" }}>{c.ciudad||"—"}</div>
                  </div>
                  <span style={{ fontSize:13, color:"#c25b4e", fontWeight:800 }}>{diasDesde(c.ultimaCompra)}d</span>
                </div>
              ))}
            </div>
          )}

          {hoyVisitas.length===0 && proximas.length===0 && reactivar.length===0 && (
            <div style={{ background:"#131a22", borderRadius:14, padding:24, textAlign:"center", marginBottom:16, border:"1px solid #1e2a34" }}>
              <div style={{ fontSize:9, color:"#8a8880", textTransform:"uppercase", letterSpacing:2, marginBottom:8, fontWeight:700 }}>Todo tranquilo</div>
              <div style={{ fontSize:13, color:"#c8c4be" }}>Sin visitas programadas ni alertas urgentes.</div>
            </div>
          )}

          <button onClick={onNuevoPedido} style={{ width:"100%", background:"#c17f4a", color:"#080c10", border:"none", borderRadius:12, padding:"16px", fontSize:14, fontWeight:800, marginBottom:8, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>🕶 Nuevo pedido</button>
          <button onClick={onMisPedidos} style={{ width:"100%", background:"#131a22", color:"#c8c4be", border:"1px solid #1e2a34", borderRadius:12, padding:"12px", fontSize:12, fontWeight:700, marginBottom:8 }}>Mis pedidos y borradores</button>
          <div style={{ display:"flex", gap:8, marginBottom:20 }}>
            <button onClick={onVerTodos} style={{ flex:1, background:"#131a22", color:"#8a8880", border:"1px solid #1e2a34", borderRadius:12, padding:"14px", fontSize:12, fontWeight:700 }}>Todos ({misClientes.length}) →</button>
            <button onClick={onNueva} style={{ flex:1, background:"#c17f4a", color:"#080c10", border:"none", borderRadius:12, padding:"14px", fontSize:12, fontWeight:800 }}>+ Nueva</button>
          </div>

          {/* 🐍 Snake game */}
          <div onClick={()=>window.open("/snake.html","_blank")}
            style={{ background:"#0a1018", border:"1px solid #1e2a34", borderRadius:14, padding:"14px 18px", marginBottom:20, display:"flex", alignItems:"center", gap:14, cursor:"pointer", WebkitTapHighlightColor:"transparent" }}>
            <span style={{ fontSize:28 }}>🐍</span>
            <div>
              <div style={{ fontSize:12, fontWeight:800, color:"#c8c4be" }}>Central Snake</div>
              <div style={{ fontSize:10, color:"#4a5060", marginTop:2 }}>¿Esperando que te atiendan? Jugá.</div>
            </div>
            <div style={{ marginLeft:"auto", fontSize:10, color:"#2a3545" }}>▶</div>
          </div>
        </div>
      </div>
    {/* Botón cerrar día */}
    <div style={{padding:"0 16px 8px"}}>
      <button onClick={cerrarDia}
        style={{width:"100%",background:"transparent",border:"1px solid #1e2a34",borderRadius:12,padding:"13px",color:"#3a4a58",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <span style={{fontSize:16}}>🌙</span> Cerrar día · enviar resumen a Ale
      </button>
    </div>
    </Root>
  );
}
function ListaVendedor({ session, clientes, ventas, busq, setBusq, onNav, vistaVendedor, vista, onCliente, onNueva, onLogout, filtroCartera, setFiltroCartera }) {
  const [orden, setOrden] = useState("nombre");
  const [filtroZona, setFiltroZona] = useState(null);
  const misClientes = clientes.filter(c => c.vendedor===session.username);
  const misNombres  = new Set(misClientes.map(c=>c.nombre.toUpperCase().trim()));
  const misVentas   = ventas.filter(v=>misNombres.has(v.cliente));

  const { act3m, act6m, conH, aRec } = calcSalud(misVentas, misClientes);

  const facTotalMap = {};
  misVentas.filter(esVentaReal).forEach(v=>{ facTotalMap[v.cliente]=(facTotalMap[v.cliente]||0)+v.importe; });

  // Zonas del vendedor — solo provincias con 2+ clientes para evitar ruido
  const zonasCount = {};
  misClientes.forEach(c=>{ if(c.provincia) zonasCount[c.provincia]=(zonasCount[c.provincia]||0)+1; });
  const zonas = Object.keys(zonasCount).filter(z=>zonasCount[z]>1).sort((a,b)=>a.localeCompare(b,"es"));

  const FILTROS = [
    { id:null,           label:"Todos",     c:"#c17f4a" },
    { id:"activos3m",    label:"Activos",   c:"#6b8f5e" },
    { id:"medios",       label:"Entibiando",  c:"#c17f4a" },
    { id:"recuperar",    label:"Recuperar", c:"#c25b4e" },
    { id:"sinHistorial", label:"Sin hist.", c:"#8a8880" },
  ];

  const busqLower = busq.toLowerCase();

  const clientesFiltrados = misClientes.filter(c=>{
    if (busq) return c.nombre?.toLowerCase().includes(busqLower)||c.ciudad?.toLowerCase().includes(busqLower)||c.provincia?.toLowerCase().includes(busqLower);
    // Filtro zona
    if (filtroZona && c.provincia !== filtroZona) return false;
    const n = c.nombre.toUpperCase().trim();
    if (filtroCartera==="activos3m")    return act3m.has(n);
    if (filtroCartera==="medios")       return act6m.has(n) && !act3m.has(n);
    if (filtroCartera==="recuperar")    return aRec.has(n);
    if (filtroCartera==="sinHistorial") return !conH.has(n);
    return true;
  }).sort((a,b)=>{
    const nA = a.nombre.toUpperCase().trim(), nB = b.nombre.toUpperCase().trim();
    if (orden==="monto")  return (facTotalMap[nB]||b.montoUltima||0)-(facTotalMap[nA]||a.montoUltima||0);
    if (orden==="fecha")  return (b.ultimaCompra||"").localeCompare(a.ultimaCompra||"");
    return (a.nombre||"").localeCompare(b.nombre||"","es");
  });

  // Sección A recuperar — top 6 por días sin comprar (los más urgentes)
  const aRecuperar = misClientes
    .filter(c => aRec.has(c.nombre.toUpperCase().trim()) && (!filtroZona || c.provincia===filtroZona))
    .sort((a,b) => (diasDesde(b.ultimaCompra)??0) - (diasDesde(a.ultimaCompra)??0))
    .slice(0, 6);

  // Color del punto según estado
  const dotColor = c => {
    const n = c.nombre.toUpperCase().trim();
    if (aRec.has(n)) return "#c25b4e";
    if (act6m.has(n) && !act3m.has(n)) return "#c17f4a";
    if (act3m.has(n)) return "#6b8f5e";
    return "#4a5060";
  };

  const RowC = ({ c, urgente }) => {
    const dias = diasDesde(c.ultimaCompra);
    const tel  = (c.telefono||"").replace(/\D/g,"");
    const nNorm = c.nombre.toUpperCase().trim();
    const facTotal = facTotalMap[nNorm] || c.montoUltima;
    const dc = dotColor(c);
    return (
      <div style={{ display:"flex", alignItems:"center", padding:"11px 16px", borderBottom:"1px solid #0f1520", gap:10 }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:dc, flexShrink:0, boxShadow:`0 0 6px ${dc}80` }}/>
        <div onClick={()=>onCliente(c)} style={{ flex:1, minWidth:0, cursor:"pointer" }}>
          <div style={{ fontSize:13, fontWeight:700, color: urgente?"#e87a6a":"#c8c4be", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginBottom:2 }}>
            {c.nombre.split(" ").slice(0,4).join(" ")}
          </div>
          <div style={{ fontSize:10, color:"#4a5060" }}>{c.ciudad||"—"}</div>
        </div>
        <div onClick={()=>onCliente(c)} style={{ textAlign:"right", flexShrink:0, cursor:"pointer" }}>
          <div style={{ fontSize:13, fontWeight:800, color:"#c17f4a" }}>{fmtM(facTotal)}</div>
          {dias!==null && <div style={{ fontSize:10, fontWeight:700, color: urgente?"#c25b4e":"#4a5060", marginTop:1 }}>{dias}d {urgente?"⚠":""}</div>}
        </div>
        {tel && <a href={`https://wa.me/54${tel}`} target="_blank" onClick={e=>e.stopPropagation()}
          style={{ flexShrink:0, background:"#142218", borderRadius:"50%", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", fontSize:14, border:"1px solid #6b8f5e40" }}>💬</a>}
      </div>
    );
  };

  const SecHeader = ({ label, count, color, bg }) => (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px 6px", background:bg||"transparent" }}>
      <span style={{ fontSize:9, fontWeight:800, color, textTransform:"uppercase", letterSpacing:1.5 }}>{label}</span>
      <span style={{ fontSize:9, fontWeight:700, background:color+"20", color, padding:"2px 8px", borderRadius:999 }}>{count}</span>
    </div>
  );

  return (
    <Root session={session} onNav={onNav} vistaVendedor={vistaVendedor} vista={vista}>
      {/* Header */}
      <div style={{ padding:"14px 16px 0", background:"#0a0e14", borderBottom:"1px solid #1c2530", position:"sticky", top:52, zIndex:9 }}>
        <div style={{ display:"flex", gap:8, marginBottom:10, alignItems:"center" }}>
          <input placeholder="Buscar óptica o ciudad..." value={busq} onChange={e=>{setBusq(e.target.value); if(e.target.value) setFiltroCartera(null);}} style={{ flex:1, margin:0 }} />
          <button onClick={onNueva} style={{ flexShrink:0, width:38, height:38, background:"linear-gradient(135deg,#c17f4a,#e8924a)", border:"none", borderRadius:10, fontSize:20, fontWeight:900, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 12px #c17f4a40" }}>+</button>
        </div>
        {/* Fila 1: filtros de cartera */}
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:8, scrollbarWidth:"none" }}>
          {FILTROS.map(f=>(
            <button key={String(f.id)} onClick={()=>{ setFiltroCartera(f.id); setBusq(""); }}
              style={{ padding:"5px 12px", whiteSpace:"nowrap", background:filtroCartera===f.id?f.c+"20":"transparent", color:filtroCartera===f.id?f.c:"#4a5060", border:`1px solid ${filtroCartera===f.id?f.c+"60":"#1e2a34"}`, fontSize:11, fontWeight:700, borderRadius:999 }}>
              {f.label}
            </button>
          ))}
        </div>
        {/* Fila 2: orden + zona */}
        <div style={{ display:"flex", gap:6, alignItems:"center", paddingBottom:10 }}>
          {[["nombre","A-Z"],["monto","$"],["fecha","Fecha"]].map(([k,l])=>(
            <button key={k} onClick={()=>setOrden(k)}
              style={{ padding:"4px 10px", background:orden===k?"#7ba7bc20":"transparent", color:orden===k?"#7ba7bc":"#4a5060", border:`1px solid ${orden===k?"#7ba7bc60":"#1e2a34"}`, fontSize:10, fontWeight:700, borderRadius:999, whiteSpace:"nowrap" }}>
              {l}
            </button>
          ))}
          {zonas.length > 1 && <>
            <div style={{ width:1, background:"#1e2a34", height:14, flexShrink:0 }}/>
            <select value={filtroZona||""} onChange={e=>setFiltroZona(e.target.value||null)}
              style={{ padding:"3px 6px", background:filtroZona?"#9b7fc420":"transparent", color:filtroZona?"#9b7fc4":"#4a5060", border:`1px solid ${filtroZona?"#9b7fc460":"#1e2a34"}`, fontSize:10, fontWeight:700, borderRadius:999, cursor:"pointer", maxWidth:110 }}>
              <option value="">📍 Zona</option>
              {zonas.map(z=><option key={z} value={z}>{z}</option>)}
            </select>
          </>}
        </div>
      </div>

      <div style={{ overflowY:"auto", paddingBottom:120 }}>
        {busq ? (
          /* Búsqueda — lista plana */
          clientesFiltrados.length===0
            ? <div style={{ textAlign:"center", padding:40, color:"#8a8880" }}>Sin resultados</div>
            : clientesFiltrados.map(c=><RowC key={c.airtableId} c={c} urgente={esAlerta(c)||esInactivo(c)}/>)
        ) : filtroCartera ? (
          /* Filtro activo — lista plana */
          <>
            <div style={{ padding:"10px 16px", fontSize:11, color:"#4a5060" }}>
              {clientesFiltrados.length} cliente{clientesFiltrados.length!==1?"s":""}
            </div>
            {clientesFiltrados.length===0
              ? <div style={{ textAlign:"center", padding:40, color:"#8a8880" }}>Sin clientes en esta categoría</div>
              : clientesFiltrados.map(c=><RowC key={c.airtableId} c={c} urgente={filtroCartera==="recuperar"}/>)
            }
          </>
        ) : (
          /* Vista default — por prioridad */
          <>
            {/* Sección urgente */}
            {aRecuperar.length > 0 && (
              <div style={{ background:"#120808" }}>
                <SecHeader label="⚡ Reactivar ahora" count={`${aRecuperar.length} de ${aRec.size}`} color="#c25b4e"/>
                {aRecuperar.map(c=><RowC key={c.airtableId} c={c} urgente={true}/>)}
                {aRec.size > 6 && (
                  <button onClick={()=>setFiltroCartera("recuperar")}
                    style={{ width:"100%", background:"none", border:"none", color:"#c25b4e", fontSize:11, fontWeight:700, padding:"10px", borderTop:"1px solid #1a1010" }}>
                    Ver los {aRec.size - 6} restantes →
                  </button>
                )}
              </div>
            )}

            {/* Sección activos */}
            {misClientes.filter(c=>act3m.has(c.nombre.toUpperCase().trim())&&(!filtroZona||c.provincia===filtroZona)).length > 0 && (
              <div>
                <SecHeader label="✓ Activos" count={`${misClientes.filter(c=>act3m.has(c.nombre.toUpperCase().trim())&&(!filtroZona||c.provincia===filtroZona)).length}`} color="#6b8f5e"/>
                {misClientes
                  .filter(c=>act3m.has(c.nombre.toUpperCase().trim())&&(!filtroZona||c.provincia===filtroZona))
                  .sort((a,b)=>orden==="monto"?(facTotalMap[b.nombre.toUpperCase().trim()]||0)-(facTotalMap[a.nombre.toUpperCase().trim()]||0):(b.ultimaCompra||"").localeCompare(a.ultimaCompra||""))
                  .map(c=><RowC key={c.airtableId} c={c} urgente={false}/>)
                }
              </div>
            )}

            {/* Entibiando */}
            {misClientes.filter(c=>{const n=c.nombre.toUpperCase().trim();return act6m.has(n)&&!act3m.has(n)&&(!filtroZona||c.provincia===filtroZona);}).length > 0 && (
              <div>
                <SecHeader label="~ Entibiando" count={`${misClientes.filter(c=>{const n=c.nombre.toUpperCase().trim();return act6m.has(n)&&!act3m.has(n)&&(!filtroZona||c.provincia===filtroZona);}).length}`} color="#c17f4a"/>
                {misClientes
                  .filter(c=>{ const n=c.nombre.toUpperCase().trim(); return act6m.has(n)&&!act3m.has(n)&&(!filtroZona||c.provincia===filtroZona); })
                  .sort((a,b)=>(b.ultimaCompra||"").localeCompare(a.ultimaCompra||""))
                  .map(c=><RowC key={c.airtableId} c={c} urgente={false}/>)
                }
              </div>
            )}

            {/* Sin historial */}
            {misClientes.filter(c=>!conH.has(c.nombre.toUpperCase().trim())&&(!filtroZona||c.provincia===filtroZona)).length > 0 && (
              <div>
                <SecHeader label="○ Sin historial" count={`${misClientes.filter(c=>!conH.has(c.nombre.toUpperCase().trim())&&(!filtroZona||c.provincia===filtroZona)).length}`} color="#4a5060"/>
                {misClientes
                  .filter(c=>!conH.has(c.nombre.toUpperCase().trim())&&(!filtroZona||c.provincia===filtroZona))
                  .sort((a,b)=>(a.nombre||"").localeCompare(b.nombre||"","es"))
                  .map(c=><RowC key={c.airtableId} c={c} urgente={false}/>)
                }
              </div>
            )}
          </>
        )}
      </div>
    </Root>
  );
}

// ─── PROGRESO VENDEDOR ────────────────────────────────────────────────────────
function ProgresoVendedor({ session, clientes, ventas, onNav, vistaVendedor, vista, onIrACartera }) {
  const [chartReady, setChartReady] = useState(!!window.Chart);
  const [tabGraf, setTabGraf] = useState("facturacion");
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  const misClientes = clientes.filter(c=>c.vendedor===session.username);
  const misNombres  = new Set(misClientes.map(c=>c.nombre.toUpperCase().trim()));
  const misVentas   = ventas.filter(v=>misNombres.has(v.cliente));
  const hoy = new Date(), mesStr = hoy.toISOString().slice(0,7);

  const { act3m, act6m, conH, aRec, sinH, str6m } = calcSalud(misVentas, misClientes);

  const facMes   = misVentas.filter(v=>v.fecha?.startsWith(mesStr) && esVentaReal(v)).reduce((a,v)=>a+v.importe,0);
  const facTotal = misVentas.filter(esVentaReal).reduce((a,v)=>a+v.importe,0);

  // Comisión: 15% sobre neto sin IVA — calculado por tipo de comprobante
  const pctComision  = 15;
  const facMesNeto   = misVentas.filter(v=>v.fecha?.startsWith(mesStr)).reduce((a,v)=>a+netoSinIVA(v),0);
  const comisionMes  = Math.round(facMesNeto * 0.15);

  // Comisión en riesgo — cargada de CC
  const [ccRiesgo,    setCcRiesgo]    = useState(null);
  const [ccCargando,  setCcCargando]  = useState(true);
  React.useEffect(()=>{
    fetch(`/api/cuentas-corrientes?vendedor=${session.username}`)
      .then(r=>r.json())
      .then(d=>{
        if(d.ok){
          // Saldo pendiente: estimamos neto ÷1.21 (mayoría FA)
          // Aproximación conservadora: usamos ÷1.21 sobre todo el saldo
          const saldo = d.clientes.filter(c=>c.saldoTotal>0).reduce((a,c)=>a+c.saldoTotal,0);
          setCcRiesgo(saldo/1.21*0.15);
        }
        setCcCargando(false);
      })
      .catch(()=>setCcCargando(false));
  },[session.username]);
  const ventasRec = misVentas.filter(v=>v.fecha>=str6m);
  const ticketProm = ventasRec.length > 0 ? Math.round(ventasRec.reduce((a,v)=>a+v.importe,0)/ventasRec.length) : 0;

  const facPorCliente = {};
  misVentas.forEach(v=>{ facPorCliente[v.cliente]=(facPorCliente[v.cliente]||0)+v.importe; });
  const clienteTop = Object.entries(facPorCliente).sort((a,b)=>b[1]-a[1])[0];

  useEffect(() => {
    if (window.Chart) { setChartReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
    s.onload = ()=>setChartReady(true);
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!chartReady || !canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current=null; }

    const año = n => Array.from({length:12},(_,i)=>({ key:`${n}-${String(i+1).padStart(2,"0")}` }));
    const ult6 = () => { const b=new Date(); return Array.from({length:6},(_,i)=>{ const d=new Date(b.getFullYear(),b.getMonth()-5+i,1); return { key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`, label:`${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` }; }); };

    const fmtYAx = v => {
      if (v === 0) return "$0";
      if (Math.abs(v) >= 1000000) return `$${(v/1000000).toFixed(v%1000000===0?0:1)}M`;
      if (Math.abs(v) >= 1000)    return `$${Math.round(v/1000)}K`;
      return `$${v}`;
    };
    const fmtTip = v => `$${v.toLocaleString("es-AR")}`;

    let labels, datasets, type;
    const map = {};
    misVentas.forEach(v=>{ const k=v.fecha?.slice(0,7); if(k) map[k]=(map[k]||0)+v.importe; });

    if (tabGraf==="facturacion") {
      labels = MESES; type = "line";
      datasets = [
        { label:"2025", data:año(2025).map(m=>map[m.key]||0), borderColor:"#243040", backgroundColor:"#24304010", borderWidth:1.5, pointRadius:3, tension:.3, fill:false },
        { label:"2026", data:año(2026).map(m=>map[m.key]||0), borderColor:"#c17f4a", backgroundColor:"#c17f4a10", borderWidth:2.5, pointRadius:5, tension:.3, fill:true },
      ];
    } else {
      const meses = ult6(); labels = meses.map(m=>m.label); type = "bar";
      const data = meses.map(m=>map[m.key]||0);
      const col = tabGraf==="pedidos" ? "#6b8f5e" : "#7ba7bc";
      datasets = [{ label:"Facturación", data, backgroundColor:data.map((_,i)=>i===data.length-1?col:col+"40"), borderColor:col, borderWidth:1.5, borderRadius:6 }];
    }

    chartRef.current = new window.Chart(canvasRef.current.getContext("2d"), {
      type, data:{ labels, datasets },
      options: { responsive:true, maintainAspectRatio:false,
        plugins: {
          legend:{ display:tabGraf==="facturacion", labels:{ color:"#8a8880", font:{size:10}, boxWidth:10 } },
          tooltip:{ callbacks:{ label:c=>` ${fmtTip(c.parsed.y)}` }, backgroundColor:"#131a22", borderColor:"#1e2a34", borderWidth:1, titleColor:"#f0ede8", bodyColor:"#8a8880" }
        },
        scales: {
          x:{ ticks:{ color:"#4a5060", font:{size:9} }, grid:{ color:"#1c2530" } },
          y:{ ticks:{ color:"#4a5060", font:{size:9}, callback: v => fmtYAx(v) }, grid:{ color:"#1c253060" }, beginAtZero:true }
        }
      },
    });
    return ()=>{ if(chartRef.current){chartRef.current.destroy();chartRef.current=null;} };
  }, [tabGraf, chartReady, misVentas]);

  return (
    <Root session={session} onNav={onNav} vistaVendedor={vistaVendedor} vista={vista}>
      <div style={{ overflowY:"auto", paddingBottom:80 }}>
        <div style={{ background:"linear-gradient(160deg,#080c10 0%,#0d1a24 100%)", padding:"24px 20px 20px", borderBottom:"1px solid #1e2a34" }}>
          <div style={{ fontSize:9, color:"#c17f4a60", marginBottom:4, textTransform:"uppercase", letterSpacing:2, fontWeight:700 }}>Mi progreso</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:600, color:"#f0ede8" }}>{session.nombre}</div>
          <div style={{ fontSize:11, color:"#4a5060", marginTop:4 }}>{hoy.toLocaleDateString("es-AR",{month:"long",year:"numeric"})}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:16 }}>
            {[
              { l:"Facturación este mes", v:fmtM(facMes),       c:"#c17f4a" },
              { l:"Clientes activos",     v:act3m.size,         c:"#6b8f5e" },
              { l:"Ticket promedio",      v:fmtM(ticketProm),   c:"#c8c4be" },
              { l:"A recuperar",          v:aRec.size,        c:"#c25b4e" },
            ].map(({l,v,c})=>(
              <div key={l} style={{ background:"#131a22", borderRadius:12, padding:"12px 14px", border:"1px solid #1e2a34" }}>
                <div style={{ fontSize:8, color:"#8a8880", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>{l}</div>
                <div style={{ fontSize:22, fontWeight:800, color:c }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:16 }}>
          {/* Comisión — facturada + en riesgo */}
          <div style={{background:"linear-gradient(135deg,#0a1a0e,#071208)",border:"1px solid #5ab86e30",borderRadius:14,padding:"16px 18px",marginBottom:14}}>
            <div style={{fontSize:9,color:"#5ab86e",fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Comisión · {mesStr}</div>

            {/* Cobrado estimado */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:14}}>
              <div>
                <div style={{fontSize:9,color:"#3a5a3a",marginBottom:3}}>FACTURADO</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:"#5ab86e"}}>
                  {comisionMes.toLocaleString("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0})}
                </div>
                <div style={{fontSize:10,color:"#2a4a2a",marginTop:2}}>base neta {facMesNeto.toLocaleString("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0})}</div>
              </div>
              {ccRiesgo > 0 && (
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:9,color:"#c25b4e",marginBottom:3}}>EN RIESGO</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:"#c25b4e"}}>
                    -{ccCargando?"…":ccRiesgo.toLocaleString("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0})}
                  </div>
                  <div style={{fontSize:9,color:"#5a2a2a",marginTop:2}}>sin cobrar</div>
                </div>
              )}
            </div>

            {/* Barra visual cobrado vs riesgo */}
            {ccRiesgo > 0 && comisionMes > 0 && (()=>{
              const total = comisionMes + ccRiesgo;
              const pctCob = Math.round(comisionMes/total*100);
              return (
                <div>
                  <div style={{height:6,borderRadius:99,background:"#0a1a0e",overflow:"hidden",marginBottom:6}}>
                    <div style={{height:"100%",width:`${pctCob}%`,background:"#5ab86e",borderRadius:99,transition:"width .4s"}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#2a4a2a"}}>
                    <span style={{color:"#5ab86e"}}>{pctCob}% cobrado</span>
                    <span style={{color:"#c25b4e"}}>{100-pctCob}% pendiente</span>
                  </div>
                </div>
              );
            })()}

            {ccRiesgo === 0 && !ccCargando && (
              <div style={{fontSize:10,color:"#5ab86e",marginTop:4}}>✓ Sin deuda pendiente</div>
            )}
          </div>

          <div style={{ background:"#131a22", borderRadius:14, border:"1px solid #1e2a34", overflow:"hidden", marginBottom:14 }}>
            <div style={{ display:"flex", borderBottom:"1px solid #1e2a34" }}>
              {[["facturacion","Facturación","#c17f4a"],["pedidos","Por mes","#6b8f5e"]].map(([id,l,col])=>(
                <button key={id} onClick={()=>setTabGraf(id)} style={{ flex:1, background:"none", border:"none", borderBottom:`2px solid ${tabGraf===id?col:"transparent"}`, color:tabGraf===id?col:"#4a5060", padding:"10px", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:.8 }}>{l}</button>
              ))}
            </div>
            <div style={{ padding:"8px 12px 12px", height:220 }}>
              {!chartReady ? <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", color:"#4a5060", fontSize:12 }}>Cargando...</div>
                : <canvas ref={canvasRef} style={{ width:"100%", height:"100%" }} />}
            </div>
          </div>

          <div style={{ background:"#131a22", borderRadius:14, border:"1px solid #1e2a34", padding:16, marginBottom:14 }}>
            <div style={{ fontSize:9, fontWeight:700, color:"#8a8880", textTransform:"uppercase", letterSpacing:1.5, marginBottom:14 }}>Salud de tu cartera</div>
            {[
              { id:"activos3m",    l:"Compraron en los últimos 3 meses",       v:act3m.size,             c:"#6b8f5e", pct:Math.round(act3m.size/misClientes.length*100)||0 },
              { id:"medios",       l:"Compraron entre 3 y 6 meses",            v:act6m.size-act3m.size,  c:"#c17f4a", pct:Math.round((act6m.size-act3m.size)/misClientes.length*100)||0 },
              { id:"recuperar",    l:"Con historial pero +6 meses sin comprar", v:aRec.size,            c:"#c25b4e", pct:Math.round(aRec.size/misClientes.length*100)||0 },
              { id:"sinHistorial", l:"Sin compras en el período cargado",       v:sinH,                   c:"#8a8880", pct:Math.round(sinH/misClientes.length*100)||0 },
            ].map(({id,l,v,c,pct})=>(
              <div key={id} onClick={()=>onIrACartera(id)} style={{ marginBottom:14, cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                  <span style={{ fontSize:12, color:"#c8c4be" }}>{l}</span>
                  <span style={{ fontSize:14, fontWeight:800, color:c, marginLeft:8 }}>{v} <span style={{ fontSize:10, color:"#4a5060", fontWeight:400 }}>({pct}%)</span></span>
                </div>
                <div style={{ background:"#0d1117", borderRadius:4, height:3 }}>
                  <div style={{ background:c, height:"100%", width:`${pct}%`, borderRadius:4 }} />
                </div>
              </div>
            ))}
          </div>

          {clienteTop && (
            <div style={{ background:"#131a22", borderRadius:14, border:"1px solid #c17f4a20", padding:16, marginBottom:14 }}>
              <div style={{ fontSize:8, color:"#8a8880", textTransform:"uppercase", letterSpacing:1.5, marginBottom:10, fontWeight:700 }}>Cliente top</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:600, color:"#f0ede8" }}>{clienteTop[0].split(" ").slice(0,4).join(" ")}</div>
                  <div style={{ fontSize:11, color:"#8a8880", marginTop:2 }}>Mayor facturación acumulada</div>
                </div>
                <div style={{ fontSize:24, fontWeight:900, color:"#c17f4a" }}>{fmtM(clienteTop[1])}</div>
              </div>
            </div>
          )}

          <div style={{ background:"#131a22", borderRadius:14, padding:"16px 18px", textAlign:"center", border:"1px solid #1e2a34" }}>
            <div style={{ fontSize:8, color:"#8a8880", textTransform:"uppercase", letterSpacing:1.5, marginBottom:6, fontWeight:700 }}>Tu cartera</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:34, fontWeight:600, color:"#f0ede8" }}>{misClientes.length} <span style={{ fontSize:16, color:"#8a8880" }}>ópticas</span></div>
            <div style={{ fontSize:12, color:"#8a8880", marginTop:6 }}>Facturación acumulada: <strong style={{color:"#c17f4a"}}>{fmtM(facTotal)}</strong></div>
          </div>
        </div>
      </div>
    </Root>
  );
}

// ─── ANÁLISIS IA ─────────────────────────────────────────────────────────────
function AnalisisIA({ datos }) {
  const [analisis, setAnalisis] = React.useState(null);
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [editandoContexto, setEditandoContexto] = React.useState(false);

  // Cargar contexto desde localStorage al montar
  const [contexto, setContexto] = React.useState(() => {
    try { return localStorage.getItem("crm_contexto_ia") || ""; } catch { return ""; }
  });

  const guardarContexto = (texto) => {
    setContexto(texto);
    try { localStorage.setItem("crm_contexto_ia", texto); } catch {}
  };

  const analizar = async () => {
    setCargando(true);
    setError(null);
    setAnalisis(null);
    try {
      const r = await fetch('/api/analisis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datos, contexto: contexto.trim() || null })
      });
      let data;
      try { data = await r.json(); } catch {
        throw new Error(`Error del servidor (${r.status})`);
      }
      if (!r.ok || data.error) throw new Error(data?.error || `Error ${r.status}`);

      const secciones = [];
      // Separar las dos partes
      const partes = data.texto.split(/---\s*PARTE\s*\d+[^-]*---/i).filter(s=>s.trim());
      partes.forEach((parte, pi) => {
        // Secciones con →
        const subSecs = parte.split("→").filter(s=>s.trim());
        if (pi === 0) {
          // Parte 1: secciones con →
          subSecs.forEach(s => {
            const lines = s.trim().split("\n");
            secciones.push({ titulo: lines[0].trim(), cuerpo: lines.slice(1).join("\n").trim(), parte: 1 });
          });
        } else {
          // Parte 2: vendedores, separados por nombre en mayúsculas
          secciones.push({ titulo: "REACTIVACIÓN POR VENDEDOR", cuerpo: parte.trim(), parte: 2 });
        }
      });
      // Fallback: si no hay separadores de parte, parsear todo con →
      if (secciones.length === 0) {
        data.texto.split("→").filter(s=>s.trim()).forEach(s => {
          const lines = s.trim().split("\n");
          secciones.push({ titulo: lines[0].trim(), cuerpo: lines.slice(1).join("\n").trim(), parte: 1 });
        });
      }
      setAnalisis(secciones);
    } catch(e) {
      setError("No se pudo generar el análisis: " + e.message);
    } finally {
      setCargando(false);
    }
  };

  const COLORES_SECC = {
    "PANORAMA DEL MES":             "#7ba7bc",
    "SITUACIÓN GENERAL":            "#7ba7bc",
    "LO QUE HAY QUE MOVER":        "#c25b4e",
    "ALERTA REAL":                  "#c25b4e",
    "OPORTUNIDAD CONCRETA":         "#6b8f5e",
    "ACCIÓN DE LA SEMANA":          "#c17f4a",
    "DECISIÓN ESTA SEMANA":         "#c17f4a",
    "LECTURA DEL CONTEXTO ACTUAL":  "#9b7fc4",
    "VOLUMEN O MARGEN":             "#9b7fc4",
    "MIRADA DE MEDIANO PLAZO":      "#9b7fc4",
    "BRIEFING VENDEDORES":          "#6b8f5e",
    "REACTIVACIÓN POR VENDEDOR":    "#6b8f5e",
  };

  return (
    <div style={{ background:"#0d1117", borderRadius:14, border:"1px solid #1e2a34", overflow:"hidden", marginBottom:16 }}>
      <div style={{ padding:"14px 16px", borderBottom: analisis||cargando ? "1px solid #1e2a34" : "none" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#f0ede8" }}>Análisis estratégico IA</div>
            <div style={{ fontSize:10, color:"#4a5060", marginTop:2 }}>Claude lee todos los datos y da su visión</div>
          </div>
          <button onClick={analizar} disabled={cargando}
            style={{ background:cargando?"#131a22":"#c17f4a", color:cargando?"#4a5060":"#080c10", border:"none", borderRadius:10, padding:"9px 16px", fontSize:12, fontWeight:800, minWidth:100, flexShrink:0 }}>
            {cargando ? "Analizando..." : analisis ? "↻ Actualizar" : "✦ Analizar"}
          </button>
        </div>
        {/* Contexto permanente */}
        <div style={{ marginTop:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <span style={{ fontSize:9, fontWeight:700, color:"#4a5060", textTransform:"uppercase", letterSpacing:1 }}>Contexto del negocio</span>
            <button onClick={()=>setEditandoContexto(e=>!e)}
              style={{ background:"none", border:"1px solid #1e2a34", borderRadius:6, color:"#8a8880", fontSize:10, padding:"3px 10px", fontWeight:700 }}>
              {editandoContexto ? "✓ Guardar" : "✏ Editar"}
            </button>
          </div>
          {editandoContexto ? (
            <textarea
              value={contexto}
              onChange={e=>guardarContexto(e.target.value)}
              placeholder="Escribí contexto permanente que Claude siempre va a considerar: situación de cada vendedor, cambios recientes, objetivos del trimestre, zonas nuevas, clientes clave perdidos o ganados..."
              rows={4}
              style={{ width:"100%", background:"#080c10", color:"#c8c4be", border:"1px solid #c17f4a40", borderRadius:10, padding:"10px 12px", fontSize:12, resize:"none", boxSizing:"border-box", fontFamily:"'LeagueSpartan',sans-serif", lineHeight:1.6 }}
            />
          ) : (
            <div onClick={()=>setEditandoContexto(true)}
              style={{ background:"#080c10", borderRadius:10, padding:"10px 12px", border:"1px solid #1e2a34", minHeight:40, cursor:"pointer" }}>
              {contexto
                ? <div style={{ fontSize:12, color:"#8a8880", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{contexto}</div>
                : <div style={{ fontSize:12, color:"#2a3545", fontStyle:"italic" }}>Sin contexto guardado. Tocá Editar para agregar.</div>
              }
            </div>
          )}
        </div>
      </div>

      {cargando && (
        <div style={{ padding:"20px 16px", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:20, height:20, border:"2px solid #1e2a34", borderTopColor:"#c17f4a", borderRadius:"50%", animation:"spin 0.8s linear infinite", flexShrink:0 }} />
          <div style={{ fontSize:12, color:"#8a8880" }}>Leyendo datos y generando análisis...</div>
        </div>
      )}

      {error && (
        <div style={{ padding:"12px 16px", color:"#c25b4e", fontSize:12 }}>{error}</div>
      )}

      {analisis && !cargando && (
        <div style={{ padding:"12px 16px 16px" }}>
          {analisis.map((s, i) => {
            const color = COLORES_SECC[s.titulo] || "#8a8880";
            return (
              <div key={i} style={{ marginBottom: i < analisis.length-1 ? 16 : 0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                  <span style={{ width:3, height:14, background:color, borderRadius:99, display:"inline-block", flexShrink:0 }} />
                  <span style={{ fontSize:9, fontWeight:700, color:color, textTransform:"uppercase", letterSpacing:1.2 }}>{s.titulo}</span>
                </div>
                <div style={{ fontSize:13, color:"#c8c4be", lineHeight:1.7, paddingLeft:9 }}>{s.cuerpo}</div>
              </div>
            );
          })}
          <div style={{ marginTop:14, fontSize:9, color:"#4a5060", textAlign:"right" }}>
            Generado {new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HOOK CHART.JS ───────────────────────────────────────────────────────────
function useChartJs() {
  const [ready, setReady] = useState(!!window.Chart);
  useEffect(() => {
    if (window.Chart) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);
  return ready;
}

// ─── GRÁFICOS ADMIN (6 gráficos estratégicos) ────────────────────────────────
function ChartCard({ title, sub, height, accent, children }) {
  return (
    <div style={{background:"#0d1117",borderRadius:16,border:"1px solid #1e2a34",marginBottom:16,overflow:"hidden",boxShadow:"0 4px 24px #00000040"}}>
      <div style={{padding:"14px 18px 0", borderBottom:"1px solid #1a2530", paddingBottom:12, background:"#131a22"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {accent && <div style={{width:3,height:18,background:accent,borderRadius:99,flexShrink:0}}/>}
          <div style={{fontSize:14,fontWeight:800,color:"#f0ede8",letterSpacing:.3}}>{title}</div>
        </div>
        {sub && <div style={{fontSize:11,color:"#6a7890",marginTop:4,lineHeight:1.5,paddingLeft:accent?11:0}}>{sub}</div>}
      </div>
      <div style={{padding:"12px 16px 18px",height:height||230}}>
        {children}
      </div>
    </div>
  );
}

function Grafico1({ ventas }) {
  const chartReady = useChartJs();
  const ref = useRef(null); const chart = useRef(null);
  useEffect(()=>{
    if(!chartReady||!ref.current) return;
    if(chart.current){chart.current.destroy();chart.current=null;}
    const map={};
    ventas.forEach(v=>{const k=v.fecha?.slice(0,7);if(k)map[k]=(map[k]||0)+v.importe;});
    const ML=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const yr = n => Array.from({length:12},(_,i)=>map[`${n}-${String(i+1).padStart(2,"0")}`]||0);
    chart.current=new window.Chart(ref.current.getContext("2d"),{type:"bar",data:{labels:ML,datasets:[
      {label:"2025",data:yr(2025),backgroundColor:"#2a3f55",borderColor:"#3d5a7a",borderWidth:1,borderRadius:5},
      {label:"2026",data:yr(2026),backgroundColor:"#5a8a4a",borderColor:"#6b8f5e",borderWidth:1,borderRadius:5},
    ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,labels:{color:"#c8c4be",font:{size:11},boxWidth:12,padding:16}},tooltip:{callbacks:{label:c=>` $${(c.parsed.y||0).toLocaleString("es-AR")}`},backgroundColor:"#0d1117",borderColor:"#2a3545",borderWidth:1,titleColor:"#f0ede8",bodyColor:"#8a8880",padding:10}},scales:{x:{ticks:{color:"#6a7890",font:{size:9}},grid:{color:"#1a2530"}},y:{ticks:{color:"#6a7890",font:{size:9},callback:v=>v>=1000000?`$${(v/1000000).toFixed(1)}M`:v>=1000?`$${Math.round(v/1000)}K`:`$${v}`},grid:{color:"#1a253060"},beginAtZero:true}}}});
    return()=>{if(chart.current){chart.current.destroy();chart.current=null;}};
  },[ventas,chartReady]);
  if(!chartReady) return <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"#4a5060",fontSize:12}}>Cargando...</div>;
  return <canvas ref={ref} style={{width:"100%",height:"100%"}}/>;
}

function Grafico2({ ventas, clientes }) {
  const chartReady = useChartJs();
  const ref = useRef(null); const chart = useRef(null);
  useEffect(()=>{
    if(!chartReady||!ref.current) return;
    if(chart.current){chart.current.destroy();chart.current=null;}
    const VDS=[{v:"matias",n:"Matías",c:"#e8924a"},{v:"miguel",n:"Miguel",c:"#4ab8e8"},{v:"nicolas",n:"Nicolás",c:"#5ab86e"},{v:"mauro",n:"Mauro",c:"#b06ae8"}];
    const tots=VDS.map(vd=>{const sus=new Set(clientes.filter(c=>c.vendedor===vd.v).map(c=>c.nombre.toUpperCase().trim()));return ventas.filter(vt=>sus.has(vt.cliente.trim())).reduce((a,vt)=>a+vt.importe,0);});
    const total=tots.reduce((a,v)=>a+v,0)||1;
    chart.current=new window.Chart(ref.current.getContext("2d"),{type:"doughnut",data:{labels:VDS.map(v=>v.n),datasets:[{data:tots,backgroundColor:VDS.map(v=>v.c),borderColor:"#0d1117",borderWidth:4,hoverOffset:8}]},options:{responsive:true,maintainAspectRatio:false,cutout:"58%",plugins:{legend:{display:true,position:"right",labels:{color:"#c8c4be",font:{size:12},boxWidth:14,generateLabels:()=>VDS.map((vd,i)=>({text:`${vd.n}  ${Math.round(tots[i]/total*100)}%`,fillStyle:vd.c,strokeStyle:vd.c,hidden:false,index:i}))}},tooltip:{callbacks:{label:c=>`${c.label}: $${(c.parsed||0).toLocaleString("es-AR")}`},backgroundColor:"#0d1117",borderColor:"#2a3545",borderWidth:1,titleColor:"#f0ede8",bodyColor:"#c8c4be",padding:10}}}});
    return()=>{if(chart.current){chart.current.destroy();chart.current=null;}};
  },[ventas,clientes,chartReady]);
  if(!chartReady) return <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"#4a5060",fontSize:12}}>Cargando...</div>;
  return <canvas ref={ref} style={{width:"100%",height:"100%"}}/>;
}

function Grafico3({ ventas, clientes }) {
  const chartReady = useChartJs();
  const ref = useRef(null); const chart = useRef(null);
  useEffect(()=>{
    if(!chartReady||!ref.current) return;
    if(chart.current){chart.current.destroy();chart.current=null;}
    const {act3m,act6m,aRec,sinH}=calcSalud(ventas,clientes);
    chart.current=new window.Chart(ref.current.getContext("2d"),{type:"bar",data:{labels:["Activos 3m","Tibiando 3-6m","A recuperar",`Sin historial`],datasets:[{data:[act3m.size,act6m.size-act3m.size,aRec.size,sinH],backgroundColor:["#5ab86e","#e8924a","#e84a5a","#3a4560"],borderRadius:6,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:"y",plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${c.parsed.x} clientes`},backgroundColor:"#0d1117",borderColor:"#2a3545",borderWidth:1,titleColor:"#f0ede8",bodyColor:"#c8c4be",padding:10}},scales:{x:{ticks:{color:"#6a7890",font:{size:9}},grid:{color:"#1e2d3d"}},y:{ticks:{color:"#c8c4be",font:{size:11}},grid:{display:false}}}}});
    return()=>{if(chart.current){chart.current.destroy();chart.current=null;}};
  },[ventas,clientes,chartReady]);
  if(!chartReady) return <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"#4a5060",fontSize:12}}>Cargando...</div>;
  return <canvas ref={ref} style={{width:"100%",height:"100%"}}/>;
}

function Grafico4({ ventas, clientes }) {
  const chartReady = useChartJs();
  const ref = useRef(null); const chart = useRef(null);
  useEffect(()=>{
    if(!chartReady||!ref.current) return;
    if(chart.current){chart.current.destroy();chart.current=null;}
    const hoy6m=new Date(); hoy6m.setMonth(hoy6m.getMonth()-6); const str6m=hoy6m.toISOString().slice(0,10);
    const VDS=[{v:"matias",n:"Matías"},{v:"miguel",n:"Miguel"},{v:"nicolas",n:"Nicolás"},{v:"mauro",n:"Mauro"}];
    const d1=[],d2=[];
    VDS.forEach(vd=>{
      const sus=new Set(clientes.filter(c=>c.vendedor===vd.v).map(c=>c.nombre.toUpperCase().trim()));
      const cpm={};
      ventas.filter(vt=>sus.has(vt.cliente.trim())&&vt.fecha>=str6m).forEach(vt=>{cpm[vt.cliente]=(cpm[vt.cliente]||0)+1;});
      const vals=Object.values(cpm);
      d1.push(vals.filter(n=>n===1).length);
      d2.push(vals.filter(n=>n>=2).length);
    });
    chart.current=new window.Chart(ref.current.getContext("2d"),{type:"bar",data:{labels:VDS.map(v=>v.n),datasets:[{label:"1 compra",data:d1,backgroundColor:"#2a3a52",borderRadius:5},{label:"2+ compras",data:d2,backgroundColor:"#5ab86e",borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,labels:{color:"#c8c4be",font:{size:11},boxWidth:12}},tooltip:{callbacks:{label:c=>` ${c.parsed.y} clientes`},backgroundColor:"#0d1117",borderColor:"#2a3545",borderWidth:1,titleColor:"#f0ede8",bodyColor:"#c8c4be",padding:10}},scales:{x:{ticks:{color:"#c8c4be",font:{size:11}},grid:{display:false}},y:{ticks:{color:"#6a7890",font:{size:9}},grid:{color:"#1e2d3d"},beginAtZero:true}}}});
    return()=>{if(chart.current){chart.current.destroy();chart.current=null;}};
  },[ventas,clientes,chartReady]);
  if(!chartReady) return <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"#4a5060",fontSize:12}}>Cargando...</div>;
  return <canvas ref={ref} style={{width:"100%",height:"100%"}}/>;
}

function Grafico5({ ventas }) {
  const chartReady = useChartJs();
  const ref = useRef(null); const chart = useRef(null);
  useEffect(()=>{
    if(!chartReady||!ref.current) return;
    if(chart.current){chart.current.destroy();chart.current=null;}
    const base=new Date();
    const meses=Array.from({length:12},(_,i)=>{const d=new Date(base.getFullYear(),base.getMonth()-11+i,1);return{key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,label:`${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][d.getMonth()]} ${String(d.getFullYear()).slice(2)}`};});
    const nuevos=[],reacts=[];
    meses.forEach(m=>{
      const vMes=ventas.filter(v=>v.fecha?.startsWith(m.key));
      const cMes=new Set(vMes.map(v=>v.cliente.trim()));
      const hist=new Set(ventas.filter(v=>v.fecha?.slice(0,7)<m.key).map(v=>v.cliente.trim()));
      nuevos.push([...cMes].filter(n=>!hist.has(n)).length);
      reacts.push([...cMes].filter(n=>hist.has(n)).length);
    });
    chart.current=new window.Chart(ref.current.getContext("2d"),{type:"bar",data:{labels:meses.map(m=>m.label),datasets:[{label:"Nuevos",data:nuevos,backgroundColor:"#4ab8e8",borderRadius:5},{label:"Reactivados",data:reacts,backgroundColor:"#e8924a",borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,labels:{color:"#c8c4be",font:{size:11},boxWidth:12}},tooltip:{callbacks:{label:c=>` ${c.parsed.y} clientes`},backgroundColor:"#0d1117",borderColor:"#2a3545",borderWidth:1,titleColor:"#f0ede8",bodyColor:"#c8c4be",padding:10}},scales:{x:{ticks:{color:"#6a7890",font:{size:9}},grid:{color:"#1e2d3d"}},y:{ticks:{color:"#6a7890",font:{size:9}},grid:{color:"#1e2d3d60"},beginAtZero:true}}}});
    return()=>{if(chart.current){chart.current.destroy();chart.current=null;}};
  },[ventas,chartReady]);
  if(!chartReady) return <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"#4a5060",fontSize:12}}>Cargando...</div>;
  return <canvas ref={ref} style={{width:"100%",height:"100%"}}/>;
}

function Grafico6({ ventas, clientes }) {
  const chartReady = useChartJs();
  const ref = useRef(null); const chart = useRef(null);
  useEffect(()=>{
    if(!chartReady||!ref.current) return;
    if(chart.current){chart.current.destroy();chart.current=null;}
    const VDS=[{v:"matias",n:"Matías\nCba/Mza/Costa",c:"#e8924a"},{v:"miguel",n:"Miguel\nNorte",c:"#4ab8e8"},{v:"nicolas",n:"Nicolás\nNqn/SF/LP",c:"#5ab86e"},{v:"mauro",n:"Mauro\nRío Cuarto/SL",c:"#b06ae8"}];
    const data=VDS.map(vd=>{const sus=new Set(clientes.filter(c=>c.vendedor===vd.v).map(c=>c.nombre.toUpperCase().trim()));return ventas.filter(vt=>sus.has(vt.cliente.trim())).reduce((a,vt)=>a+vt.importe,0);});
    const fmtY=v=>v>=1000000?`$${(v/1000000).toFixed(1)}M`:v>=1000?`$${Math.round(v/1000)}K`:`$${v}`;
    chart.current=new window.Chart(ref.current.getContext("2d"),{type:"bar",data:{labels:VDS.map(v=>v.n),datasets:[{data,backgroundColor:VDS.map(v=>v.c),borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${fmtY(c.parsed.y)}`},backgroundColor:"#0d1117",borderColor:"#2a3545",borderWidth:1,titleColor:"#f0ede8",bodyColor:"#c8c4be",padding:10}},scales:{x:{ticks:{color:"#c8c4be",font:{size:9}},grid:{display:false}},y:{ticks:{color:"#4a5060",font:{size:9},callback:v=>fmtY(v)},grid:{color:"#1c253060"},beginAtZero:true}}}});
    return()=>{if(chart.current){chart.current.destroy();chart.current=null;}};
  },[ventas,clientes,chartReady]);
  if(!chartReady) return <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"#4a5060",fontSize:12}}>Cargando...</div>;
  return <canvas ref={ref} style={{width:"100%",height:"100%"}}/>;
}

function GraficosAdmin({ ventas, clientes, ventasCargando }) {
  const [tab, setTab] = React.useState("mes");

  const TABS = [
    { id:"mes",   label:"Este mes",   ico:"⚡" },
    { id:"tend",  label:"Tendencia",  ico:"📈" },
    { id:"largo", label:"Largo plazo",ico:"🔭" },
  ];

  const tabBar = (
    <div style={{ display:"flex", background:"#0a0e14", borderBottom:"1px solid #1c2530", marginBottom:16, position:"sticky", top:0, zIndex:10 }}>
      {TABS.map(t => (
        <button key={t.id} onClick={()=>setTab(t.id)}
          style={{ flex:1, background:"none", border:"none", borderBottom:tab===t.id?"2px solid #c17f4a":"2px solid transparent", padding:"12px 4px 10px", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
          <span style={{ fontSize:16 }}>{t.ico}</span>
          <span style={{ fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:tab===t.id?"#c17f4a":"#4a5060" }}>{t.label}</span>
        </button>
      ))}
    </div>
  );

  // ── PESTAÑA 1: ESTE MES ──
  // G1: Facturación este mes por vendedor (barras) vs mismo mes año anterior
  // G2: Clientes activos este mes vs mes anterior (barras agrupadas)
  // G3: Nuevos vs reactivados este mes (dona)
  // G4: Rendimiento vendedores este mes (barras horizontales)

  // ── PESTAÑA 2: TENDENCIA ──
  // G1: Curva facturación mensual últimos 12 meses
  // G2: Ticket promedio histórico
  // G3: Clientes activos histórico

  // ── PESTAÑA 3: LARGO PLAZO ──
  // G1: Concentración por vendedor
  // G2: Salud de cartera
  // G3: Distribución geográfica
  // G4: Velocidad de recompra

  const loading = (
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 4px",marginBottom:4}}>
      <div style={{width:8,height:8,borderRadius:"50%",background:"#c17f4a",animation:"pulse 1.2s ease-in-out infinite"}}/>
      <span style={{fontSize:11,color:"#c17f4a80",letterSpacing:1}}>Cargando ventas...</span>
    </div>
  );

  return (
    <div>
      {tabBar}
      {ventasCargando && loading}

      {tab==="mes" && (
        <>
          <ChartCard title="Facturación este mes · por vendedor" sub="Comparado con el mismo mes del año anterior." height={250} accent="#c17f4a">
            <GraficoMesVendedor ventas={ventas} clientes={clientes}/>
          </ChartCard>
          <ChartCard title="Nuevos vs reactivados · este mes" sub="Dos motores distintos de crecimiento." height={220} accent="#7ba7bc">
            <GraficoNuevosReactivadosMes ventas={ventas}/>
          </ChartCard>
          <ChartCard title="Rendimiento vendedores · este mes" sub="Facturación parcial y proyección al cierre." height={240} accent="#6b8f5e">
            <GraficoRendimientoMes ventas={ventas} clientes={clientes}/>
          </ChartCard>
        </>
      )}

      {tab==="tend" && (
        <>
          <ChartCard title="Facturación · 2025 vs 2026" sub="Verde = este año · gris = año anterior." height={260} accent="#6b8f5e">
            <Grafico1 ventas={ventas}/>
          </ChartCard>
          <ChartCard title="Ticket promedio · histórico" sub="Importe promedio por factura cada mes." height={220} accent="#7ba7bc">
            <Grafico3Tend ventas={ventas}/>
          </ChartCard>
          <ChartCard title="Nuevos vs reactivados · 12 meses" sub="Azul = clientes nuevos · naranja = clientes que volvieron." height={250} accent="#7ba7bc"><Grafico5 ventas={ventas}/></ChartCard>
          <ChartCard title="Clientes activos · histórico" sub="Ópticas que compraron en ventana de 3 meses." height={220} accent="#9b7fc4">
            <Grafico2Tend ventas={ventas}/>
          </ChartCard>
        </>
      )}

      {tab==="largo" && (
        <>
          <ChartCard title="Concentración por vendedor" sub="Participación % en la facturación acumulada total." height={230} accent="#c17f4a">
            <Grafico2 ventas={ventas} clientes={clientes}/>
          </ChartCard>
          <ChartCard title="Salud de cartera" sub="Rojo = facturación dormida. Reactivar cuesta menos que conseguir uno nuevo." height={210} accent="#c25b4e">
            <Grafico3 ventas={ventas} clientes={clientes}/>
          </ChartCard>
          <ChartCard title="Distribución geográfica" sub="Facturación acumulada por zona de cada vendedor." height={240} accent="#9b7fc4">
            <Grafico6 ventas={ventas} clientes={clientes}/>
          </ChartCard>
          <ChartCard title="Velocidad de recompra · 6 meses" sub="Verde = compraron 2+ veces · gris = una sola compra." height={240} accent="#6b8f5e">
            <Grafico4 ventas={ventas} clientes={clientes}/>
          </ChartCard>
        </>
      )}
    </div>
  );
}

// ── Gráfico: Facturación este mes por vendedor vs año anterior ──
function GraficoMesVendedor({ ventas, clientes }) {
  const chartReady = useChartJs();
  const ref = useRef(null); const chart = useRef(null);
  useEffect(()=>{
    if(!chartReady||!ref.current) return;
    if(chart.current){chart.current.destroy();chart.current=null;}
    const hoy = new Date();
    const mesStr = hoy.toISOString().slice(0,7);
    const mesAntStr = `${hoy.getFullYear()-1}-${String(hoy.getMonth()+1).padStart(2,"0")}`;
    const VDS=[{v:"matias",n:"Matías",c:"#e8924a"},{v:"miguel",n:"Miguel",c:"#4ab8e8"},{v:"nicolas",n:"Nicolás",c:"#5ab86e"},{v:"mauro",n:"Mauro",c:"#b06ae8"}];
    const d1=[],d2=[];
    VDS.forEach(vd=>{
      const sus=new Set(clientes.filter(c=>c.vendedor===vd.v).map(c=>c.nombre.toUpperCase().trim()));
      d1.push(ventas.filter(vt=>sus.has(vt.cliente.trim())&&vt.fecha?.startsWith(mesStr)&&esVentaReal(vt)).reduce((a,v)=>a+v.importe,0));
      d2.push(ventas.filter(vt=>sus.has(vt.cliente.trim())&&vt.fecha?.startsWith(mesAntStr)&&esVentaReal(vt)).reduce((a,v)=>a+v.importe,0));
    });
    const fmtY=v=>v>=1000000?`$${(v/1000000).toFixed(1)}M`:v>=1000?`$${Math.round(v/1000)}K`:`$${v}`;
    chart.current=new window.Chart(ref.current.getContext("2d"),{type:"bar",data:{labels:VDS.map(v=>v.n),datasets:[
      {label:`${hoy.getFullYear()-1}`,data:d2,backgroundColor:"#2a3f55",borderRadius:4},
      {label:`${hoy.getFullYear()}`,data:d1,backgroundColor:VDS.map(v=>v.c),borderRadius:4},
    ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,labels:{color:"#c8c4be",font:{size:11},boxWidth:12}},tooltip:{callbacks:{label:c=>` ${fmtY(c.parsed.y)}`},backgroundColor:"#0d1117",borderColor:"#2a3545",borderWidth:1,titleColor:"#f0ede8",bodyColor:"#c8c4be",padding:10}},scales:{x:{ticks:{color:"#c8c4be",font:{size:11}},grid:{display:false}},y:{ticks:{color:"#6a7890",font:{size:9},callback:v=>fmtY(v)},grid:{color:"#1e2d3d60"},beginAtZero:true}}}});
    return()=>{if(chart.current){chart.current.destroy();chart.current=null;}};
  },[ventas,clientes,chartReady]);
  if(!chartReady) return <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"#4a5060",fontSize:12}}>Cargando...</div>;
  return <canvas ref={ref} style={{width:"100%",height:"100%"}}/>;
}

// ── Gráfico: Nuevos vs reactivados este mes (dona) ──
function GraficoNuevosReactivadosMes({ ventas }) {
  const chartReady = useChartJs();
  const ref = useRef(null); const chart = useRef(null);
  useEffect(()=>{
    if(!chartReady||!ref.current) return;
    if(chart.current){chart.current.destroy();chart.current=null;}
    const hoy = new Date();
    const mesStr = hoy.toISOString().slice(0,7);
    const vMes = ventas.filter(v=>v.fecha?.startsWith(mesStr)&&esVentaReal(v));
    const cMes = new Set(vMes.map(v=>v.cliente.trim()));
    const hist = new Set(ventas.filter(v=>v.fecha?.slice(0,7)<mesStr&&esVentaReal(v)).map(v=>v.cliente.trim()));
    const nuevos = [...cMes].filter(n=>!hist.has(n)).length;
    const reacts = [...cMes].filter(n=>hist.has(n)).length;
    const total = nuevos + reacts || 1;
    chart.current=new window.Chart(ref.current.getContext("2d"),{type:"doughnut",data:{labels:[`Nuevos (${nuevos})`,`Reactivados (${reacts})`],datasets:[{data:[nuevos,reacts],backgroundColor:["#4ab8e8","#e8924a"],borderColor:"#0d1117",borderWidth:4,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:"60%",plugins:{legend:{display:true,position:"right",labels:{color:"#c8c4be",font:{size:12},boxWidth:14,padding:16}},tooltip:{callbacks:{label:c=>`${c.label}: ${Math.round(c.parsed/total*100)}%`},backgroundColor:"#0d1117",borderColor:"#2a3545",borderWidth:1,titleColor:"#f0ede8",bodyColor:"#c8c4be",padding:10}}}});
    return()=>{if(chart.current){chart.current.destroy();chart.current=null;}};
  },[ventas,chartReady]);
  if(!chartReady) return <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"#4a5060",fontSize:12}}>Cargando...</div>;
  return <canvas ref={ref} style={{width:"100%",height:"100%"}}/>;
}

// ── Gráfico: Rendimiento vendedores este mes (barras horizontales) ──
function GraficoRendimientoMes({ ventas, clientes }) {
  const chartReady = useChartJs();
  const ref = useRef(null); const chart = useRef(null);
  useEffect(()=>{
    if(!chartReady||!ref.current) return;
    if(chart.current){chart.current.destroy();chart.current=null;}
    const hoy = new Date();
    const mesStr = hoy.toISOString().slice(0,7);
    const diaHoy = hoy.getDate();
    const diasTot = new Date(hoy.getFullYear(),hoy.getMonth()+1,0).getDate();
    const VDS=[{v:"matias",n:"Matías",c:"#e8924a"},{v:"miguel",n:"Miguel",c:"#4ab8e8"},{v:"nicolas",n:"Nicolás",c:"#5ab86e"},{v:"mauro",n:"Mauro",c:"#b06ae8"}];
    const facParcial=[],facProy=[];
    VDS.forEach(vd=>{
      const sus=new Set(clientes.filter(c=>c.vendedor===vd.v).map(c=>c.nombre.toUpperCase().trim()));
      const f=ventas.filter(vt=>sus.has(vt.cliente.trim())&&vt.fecha?.startsWith(mesStr)&&esVentaReal(vt)).reduce((a,v)=>a+v.importe,0);
      facParcial.push(f);
      facProy.push(diaHoy>0?Math.round(f/diaHoy*diasTot):0);
    });
    const fmtY=v=>v>=1000000?`$${(v/1000000).toFixed(1)}M`:v>=1000?`$${Math.round(v/1000)}K`:`$${v}`;
    chart.current=new window.Chart(ref.current.getContext("2d"),{type:"bar",data:{labels:VDS.map(v=>v.n),datasets:[
      {label:"Parcial",data:facParcial,backgroundColor:VDS.map(v=>v.c+"99"),borderRadius:4},
      {label:"Proyectado",data:facProy,backgroundColor:VDS.map(v=>v.c+"33"),borderColor:VDS.map(v=>v.c),borderWidth:1.5,borderRadius:4,borderDash:[4,4]},
    ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,labels:{color:"#c8c4be",font:{size:11},boxWidth:12}},tooltip:{callbacks:{label:c=>` ${fmtY(c.parsed.y)}`},backgroundColor:"#0d1117",borderColor:"#2a3545",borderWidth:1,titleColor:"#f0ede8",bodyColor:"#c8c4be",padding:10}},scales:{x:{ticks:{color:"#c8c4be",font:{size:11}},grid:{display:false}},y:{ticks:{color:"#6a7890",font:{size:9},callback:v=>fmtY(v)},grid:{color:"#1e2d3d60"},beginAtZero:true}}}});
    return()=>{if(chart.current){chart.current.destroy();chart.current=null;}};
  },[ventas,clientes,chartReady]);
  if(!chartReady) return <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"#4a5060",fontSize:12}}>Cargando...</div>;
  return <canvas ref={ref} style={{width:"100%",height:"100%"}}/>;
}

// ── Gráfico tendencia: clientes activos histórico ──
function Grafico2Tend({ ventas }) {
  const chartReady = useChartJs();
  const ref = useRef(null); const chart = useRef(null);
  useEffect(()=>{
    if(!chartReady||!ref.current) return;
    if(chart.current){chart.current.destroy();chart.current=null;}
    const mesesMap={};
    ventas.filter(esVentaReal).forEach(v=>{const k=v.fecha?.slice(0,7);if(k)mesesMap[k]=true;});
    const meses=Object.keys(mesesMap).sort();
    if(!meses.length) return;
    const data=meses.map(mes=>{
      const desde3m=new Date(mes+"-01"); desde3m.setMonth(desde3m.getMonth()-3);
      const str3m=desde3m.toISOString().slice(0,7);
      return new Set(ventas.filter(v=>esVentaReal(v)&&v.fecha?.slice(0,7)>=str3m&&v.fecha?.slice(0,7)<=mes).map(v=>v.cliente)).size;
    });
    const labels=meses.map(m=>{const[y,mo]=m.split("-");return`${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][parseInt(mo)-1]} ${y.slice(2)}`;});
    chart.current=new window.Chart(ref.current.getContext("2d"),{type:"line",data:{labels,datasets:[{label:"Clientes activos",data,borderColor:"#b06ae8",backgroundColor:"#b06ae815",borderWidth:2.5,pointRadius:meses.length>18?0:4,pointBackgroundColor:"#b06ae8",tension:.4,fill:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${c.parsed.y} clientes`},backgroundColor:"#0d1117",borderColor:"#2a3545",borderWidth:1,titleColor:"#f0ede8",bodyColor:"#c8c4be",padding:10}},scales:{x:{ticks:{color:"#6a7890",font:{size:9},maxTicksLimit:12},grid:{color:"#1e2d3d"}},y:{ticks:{color:"#6a7890",font:{size:9}},grid:{color:"#1e2d3d60"},beginAtZero:true}}}});
    return()=>{if(chart.current){chart.current.destroy();chart.current=null;}};
  },[ventas,chartReady]);
  if(!chartReady) return <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"#4a5060",fontSize:12}}>Cargando...</div>;
  return <canvas ref={ref} style={{width:"100%",height:"100%"}}/>;
}

// ── Gráfico tendencia: ticket promedio histórico ──
function Grafico3Tend({ ventas }) {
  const chartReady = useChartJs();
  const ref = useRef(null); const chart = useRef(null);
  useEffect(()=>{
    if(!chartReady||!ref.current) return;
    if(chart.current){chart.current.destroy();chart.current=null;}
    const mesesMap={};
    ventas.filter(esVentaReal).forEach(v=>{const k=v.fecha?.slice(0,7);if(k)mesesMap[k]=true;});
    const meses=Object.keys(mesesMap).sort();
    if(!meses.length) return;
    const data=meses.map(mes=>{
      const vs=ventas.filter(v=>esVentaReal(v)&&v.fecha?.startsWith(mes));
      return vs.length>0?Math.round(vs.reduce((a,v)=>a+v.importe,0)/vs.length):0;
    });
    const labels=meses.map(m=>{const[y,mo]=m.split("-");return`${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][parseInt(mo)-1]} ${y.slice(2)}`;});
    const fmtY=v=>v>=1000000?`$${(v/1000000).toFixed(1)}M`:v>=1000?`$${Math.round(v/1000)}K`:`$${v}`;
    chart.current=new window.Chart(ref.current.getContext("2d"),{type:"line",data:{labels,datasets:[{label:"Ticket promedio",data,borderColor:"#4ab8e8",backgroundColor:"#4ab8e815",borderWidth:2.5,pointRadius:meses.length>18?0:4,pointBackgroundColor:"#4ab8e8",tension:.4,fill:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${fmtY(c.parsed.y)}`},backgroundColor:"#0d1117",borderColor:"#2a3545",borderWidth:1,titleColor:"#f0ede8",bodyColor:"#c8c4be",padding:10}},scales:{x:{ticks:{color:"#6a7890",font:{size:9},maxTicksLimit:12},grid:{color:"#1e2d3d"}},y:{ticks:{color:"#6a7890",font:{size:9},callback:v=>fmtY(v)},grid:{color:"#1e2d3d60"},beginAtZero:true}}}});
    return()=>{if(chart.current){chart.current.destroy();chart.current=null;}};
  },[ventas,chartReady]);
  if(!chartReady) return <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"#4a5060",fontSize:12}}>Cargando...</div>;
  return <canvas ref={ref} style={{width:"100%",height:"100%"}}/>;
}

function AgendarVisita({ optica, vendedor }) {
  const pad = n => String(n).padStart(2,"0");
  const hoy = new Date();
  const [fecha,setFecha]=useState(`${hoy.getFullYear()}-${pad(hoy.getMonth()+1)}-${pad(hoy.getDate())}`);
  const [hora,setHora]=useState("09:00");
  const [duracion,setDuracion]=useState("60");
  const [nota,setNota]=useState("");

  const agendar = () => {
    const [y,m,d]=[...fecha.split("-")],[h,min]=[...hora.split(":")];
    const inicio=`${y}${m}${d}T${h}${min}00`;
    const total=parseInt(h)*60+parseInt(min)+parseInt(duracion);
    const fin=`${y}${m}${d}T${pad(Math.floor(total/60)%24)}${pad(total%60)}00`;
    const url=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Visita Central Eyewear — ${optica.nombre}`)}&dates=${inicio}/${fin}&details=${encodeURIComponent(`Vendedor: ${vendedor}\nCliente: ${optica.nombre}${nota?"\n\nNotas: "+nota:""}`)}&location=${encodeURIComponent([optica.domicilio,optica.ciudad,optica.provincia].filter(Boolean).join(", "))}`;
    window.open(url,"_blank");
  };

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
        <div><Label>Fecha</Label><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} /></div>
        <div><Label>Hora</Label><input type="time" value={hora} onChange={e=>setHora(e.target.value)} /></div>
      </div>
      <div style={{ marginBottom:12 }}>
        <Label>Duración</Label>
        <div style={{ display:"flex", gap:8 }}>
          {[["30","30m"],["60","1h"],["90","1h30"],["120","2h"]].map(([v,l])=>(
            <button key={v} onClick={()=>setDuracion(v)} style={{ flex:1, padding:"10px 4px", borderRadius:10, fontSize:12, fontWeight:700, background:duracion===v?"#1a1e33":"#131a22", color:duracion===v?"#7ba7bc":"#8a8880", border:duracion===v?"1.5px solid #7ba7bc":"1px solid #1e2a34" }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:14 }}><Label>Nota</Label><input value={nota} onChange={e=>setNota(e.target.value)} placeholder="Llevar nueva colección..." /></div>
      <button onClick={agendar} style={{ width:"100%", background:"#0f1d2a", color:"#7ba7bc", padding:"13px", borderRadius:12, border:"1px solid #7ba7bc40", fontWeight:700, fontSize:13 }}>Agregar a Google Calendar</button>
    </div>
  );
}

// ─── ALERTAS CLIENTE ──────────────────────────────────────────────────────────
function AlertasCliente({ cliente, vendedor, tel, onGuardar }) {
  const [alertas, setAlertas] = React.useState(cliente.alertas || []);
  const [texto, setTexto] = React.useState("");
  const hoyStr = new Date().toISOString().slice(0,10);
  const [fecha, setFecha] = React.useState(hoyStr); // fecha default = hoy
  const [catMsg, setCatMsg] = React.useState(null);

  const hoy = new Date().toISOString().slice(0,10);

  const agregar = () => {
    if (!texto.trim()) return;
    const nueva = {
      id: Date.now(),
      texto: texto.trim(),
      fecha: fecha || null,
      vendedor,
      creada: new Date().toLocaleDateString("es-AR"),
      activa: true,
    };
    const nuevas = [nueva, ...alertas];
    setAlertas(nuevas);
    onGuardar(nuevas);
    setTexto("");
    setFecha("");
  };

  const resolver = (id) => {
    const nuevas = alertas.map(a => a.id===id ? {...a, activa:false} : a);
    setAlertas(nuevas);
    onGuardar(nuevas);
  };

  const eliminar = (id) => {
    const nuevas = alertas.filter(a => a.id!==id);
    setAlertas(nuevas);
    onGuardar(nuevas);
  };

  const activas   = alertas.filter(a=>a.activa).sort((a,b)=>{
    if (!a.fecha && !b.fecha) return 0;
    if (!a.fecha) return 1;
    if (!b.fecha) return -1;
    return a.fecha.localeCompare(b.fecha);
  });
  const resueltas = alertas.filter(a=>!a.activa);

  const estaVencida = (f) => f && f < hoy;
  const diasHastaAlerta = (f) => {
    if (!f) return null;
    const diff = Math.ceil((new Date(f) - new Date()) / 86400000);
    return diff;
  };

  return (
    <div style={{ padding:16 }}>

      {/* Nueva alerta */}
      <div style={{ background:"#131a22", borderRadius:14, border:"1px solid #1e2a34", padding:14, marginBottom:16 }}>
        <div style={{ fontSize:9, fontWeight:700, color:"#c17f4a", textTransform:"uppercase", letterSpacing:1.5, marginBottom:12 }}>Nueva alerta</div>
        <textarea
          value={texto}
          onChange={e=>setTexto(e.target.value)}
          placeholder="Ej: tiene deuda pendiente, el dueño cambia en abril, pide siempre descuento..."
          rows={2}
          style={{ width:"100%", background:"#0d1117", color:"#c8c4be", border:"1px solid #1e2a34", borderRadius:10, padding:"10px 12px", fontSize:13, resize:"none", boxSizing:"border-box", fontFamily:"'LeagueSpartan',sans-serif", lineHeight:1.5, marginBottom:10 }}
        />
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <input
            type="date"
            value={fecha}
            onChange={e=>setFecha(e.target.value)}
            style={{ flex:1, background:"#0d1117", color:"#c8c4be", border:"1px solid #1e2a34", borderRadius:10, padding:"9px 12px", fontSize:12 }}
          />
          <button onClick={agregar} disabled={!texto.trim()}
            style={{ background:texto.trim()?"#c17f4a":"#131a22", color:texto.trim()?"#080c10":"#4a5060", border:"none", borderRadius:10, padding:"9px 16px", fontSize:13, fontWeight:800 }}>
            + Agregar
          </button>
        </div>
      </div>

      {/* Alertas activas */}
      {activas.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:9, fontWeight:700, color:"#8a8880", textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>
            Alertas activas <span style={{ color:"#c17f4a" }}>· {activas.length}</span>
          </div>
          {activas.map(a => {
            const d = diasHastaAlerta(a.fecha);
            const vencida = estaVencida(a.fecha);
            const borderColor = vencida ? "#c25b4e" : d!==null && d<=3 ? "#c17f4a" : "#1e2a34";
            return (
              <div key={a.id} style={{ background:"#131a22", borderRadius:12, border:`1px solid ${borderColor}`, padding:12, marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:"#c8c4be", lineHeight:1.5, marginBottom:6 }}>{a.texto}</div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:10, color:"#4a5060" }}>{a.vendedor} · {a.creada}</span>
                      {a.fecha && (
                        <span style={{ fontSize:10, fontWeight:700,
                          color: vencida?"#c25b4e" : d===0?"#f0ede8" : d<=3?"#c17f4a":"#8a8880",
                          background: vencida?"#c25b4e20" : d===0?"#f0ede820" : d<=3?"#c17f4a20":"transparent",
                          borderRadius:4, padding:"1px 6px" }}>
                          {vencida ? `Venció hace ${Math.abs(d)}d` : d===0 ? "Vence hoy" : d===1 ? "Vence mañana" : `Vence en ${d}d`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <button onClick={()=>resolver(a.id)} title="Marcar como resuelta"
                      style={{ background:"#142218", color:"#6b8f5e", border:"1px solid #6b8f5e40", borderRadius:8, padding:"5px 8px", fontSize:12 }}>✓</button>
                    <button onClick={()=>eliminar(a.id)} title="Eliminar"
                      style={{ background:"#1a1010", color:"#c25b4e", border:"1px solid #c25b4e30", borderRadius:8, padding:"5px 8px", fontSize:12 }}>✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activas.length === 0 && (
        <div style={{ textAlign:"center", color:"#4a5060", fontSize:12, padding:"16px 0", marginBottom:16 }}>Sin alertas activas</div>
      )}

      {/* Mensajes predeterminados */}
      <div>
        <div style={{ fontSize:9, fontWeight:700, color:"#8a8880", textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>Mensajes WhatsApp</div>
        {MSGS_CATS.map(cat=>(
          <div key={cat.id} style={{ marginBottom:8 }}>
            <button onClick={()=>setCatMsg(catMsg===cat.id ? null : cat.id)}
              style={{ width:"100%", background:catMsg===cat.id?cat.color+"15":"#131a22", color:catMsg===cat.id?cat.color:"#8a8880", border:`1px solid ${catMsg===cat.id?cat.color+"40":"#1e2a34"}`, borderRadius:10, padding:"10px 14px", fontSize:12, fontWeight:700, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span>{cat.label}</span>
              <span style={{ fontSize:10 }}>{catMsg===cat.id?"▲":"▼"}</span>
            </button>
            {catMsg===cat.id && (
              <div style={{ background:"#0d1117", borderRadius:"0 0 10px 10px", border:`1px solid ${cat.color}30`, borderTop:"none", overflow:"hidden" }}>
                {cat.msgs.map(([k,txt])=>(
                  <div key={k} style={{ padding:"12px 14px", borderBottom:"1px solid #111820" }}>
                    <div style={{ fontSize:9, color:cat.color, marginBottom:6, textTransform:"uppercase", letterSpacing:1, fontWeight:700 }}>{k}</div>
                    <div style={{ fontSize:12, color:"#8a8880", marginBottom:10, lineHeight:1.6 }}>{txt}</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={()=>{ setTexto(txt); setCatMsg(null); window.scrollTo(0,0); }}
                        style={{ flex:1, background:"#131a22", color:"#c17f4a", padding:"8px", border:"1px solid #c17f4a30", borderRadius:8, fontSize:11, fontWeight:700 }}>↑ Usar como alerta</button>
                      {tel && <a href={`https://wa.me/54${tel}?text=${encodeURIComponent(txt)}`} target="_blank"
                        style={{ flex:1, background:"#0f1e14", color:"#6b8f5e", padding:"8px", borderRadius:8, fontSize:11, fontWeight:700, textDecoration:"none", textAlign:"center", border:"1px solid #6b8f5e40" }}>Enviar WA</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resueltas */}
      {resueltas.length > 0 && (
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:9, fontWeight:700, color:"#2a3545", textTransform:"uppercase", letterSpacing:1.5, marginBottom:8 }}>Resueltas ({resueltas.length})</div>
          {resueltas.map(a=>(
            <div key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #111820", opacity:.5 }}>
              <div style={{ fontSize:12, color:"#4a5060", textDecoration:"line-through" }}>{a.texto}</div>
              <button onClick={()=>eliminar(a.id)} style={{ background:"none", border:"none", color:"#4a5060", fontSize:11 }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── NUEVO PEDIDO ─────────────────────────────────────────────────────────────
function NuevoPedido({ cliente, vendedor, isAdmin, adminUnlocked, onGuardar }) {
  const [pedidos, setPedidos] = React.useState(cliente.pedidos || []);
  const [enviando, setEnviando] = React.useState(false);
  const [error, setError] = React.useState("");
  const [exito, setExito] = React.useState("");
  const [obs, setObs] = React.useState("");
  const [link, setLink] = React.useState("");
  const [tipo, setTipo] = React.useState("Pedido"); // Pedido | Presupuesto | Consulta | Otro
  const [archivos, setArchivos] = React.useState([]);

  const camaraRef = React.useRef(null);
  const galeriaRef = React.useRef(null);

  const puedeCargar = !isAdmin || adminUnlocked;

  const leerArchivo = (file) => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.includes(",") ? result.split(",")[1] : btoa(result);
      res({ nombre: file.name || "archivo", base64, tipo: file.type || "image/jpeg" });
    };
    reader.onerror = () => rej(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });

  const handleArchivos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = "";
    try {
      const leidos = await Promise.all(files.map(leerArchivo));
      setArchivos(prev => [...prev, ...leidos]);
      setError("");
    } catch(err) { setError("Error al leer el archivo: " + err.message); }
  };

  const quitarArchivo = (i) => setArchivos(prev => prev.filter((_,idx)=>idx!==i));

  const confirmar = async () => {
    if (archivos.length === 0 && !obs.trim() && !link.trim()) {
      setError("Agregá al menos un archivo, un link o una observación");
      return;
    }
    setEnviando(true);
    setError("");
    setExito("");
    try {
      const hoy = new Date();
      const nuevo = {
        fecha: hoy.toLocaleDateString("es-AR"),
        hora:  hoy.toLocaleTimeString("es-AR", { hour:"2-digit", minute:"2-digit" }),
        vendedor,
        tipo,
        link: link.trim() || null,
        observaciones: obs,
        archivos: archivos.map(a => ({ nombre: a.nombre, tipo: a.tipo })),
      };

      // Mandar mail — esperamos la respuesta para mostrar errores
      const mailRes = await fetch("/api/pedido-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente: cliente.nombre, vendedor,
          fecha: nuevo.fecha, hora: nuevo.hora,
          tipo, link: link.trim(), observaciones: obs,
          archivos,
        })
      });
      if (!mailRes.ok) {
        const err = await mailRes.json().catch(()=>({}));
        throw new Error(err.error || `Error ${mailRes.status} al enviar mail`);
      }

      // Guardar en historial — usar callback para tener el estado más reciente
      setPedidos(prev => {
        const nuevos = [nuevo, ...prev];
        onGuardar(nuevos);
        return nuevos;
      });

      setArchivos([]); setObs(""); setLink(""); setTipo("Pedido");
      setExito("Pedido registrado y enviado ✓");
      setTimeout(()=>setExito(""), 4000);
    } catch(err) {
      setError("Error: " + err.message);
    } finally {
      setEnviando(false);
    }
  };

  const TIPOS = ["Pedido","Presupuesto","Consulta","Otro"];
  const nroPedido = pedidos.length + 1;

  return (
    <div style={{ padding:16 }}>

      {puedeCargar && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:9, fontWeight:700, color:"#8a8880", textTransform:"uppercase", letterSpacing:1.5 }}>Nuevo pedido</div>
            <div style={{ fontSize:11, color:"#c17f4a", fontWeight:700, background:"#c17f4a15", borderRadius:6, padding:"3px 10px" }}>#{nroPedido}</div>
          </div>

          {/* Link + tipo */}
          <div style={{ display:"flex", gap:8, marginBottom:10 }}>
            <input
              value={link}
              onChange={e=>setLink(e.target.value)}
              placeholder="Link del pedido (Drive, WhatsApp, etc.)..."
              style={{ flex:1 }}
            />
            <select
              value={tipo}
              onChange={e=>setTipo(e.target.value)}
              style={{ background:"#131a22", color:"#c8c4be", border:"1px solid #1e2a34", borderRadius:10, padding:"0 12px", fontSize:12, fontWeight:700, minWidth:110 }}>
              {TIPOS.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Observaciones */}
          <textarea
            value={obs}
            onChange={e=>setObs(e.target.value)}
            placeholder="Observaciones del pedido..."
            rows={3}
            style={{ width:"100%", background:"#0d1117", color:"#c8c4be", border:"1px solid #1e2a34", borderRadius:10, padding:"10px 12px", fontSize:13, resize:"none", boxSizing:"border-box", fontFamily:"'LeagueSpartan',sans-serif", marginBottom:10 }}
          />

          {/* Botones de archivo — solo Cámara y Fototeca */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
            <button onClick={()=>camaraRef.current?.click()}
              style={{ background:"#131a22", color:"#c8c4be", border:"1px solid #1e2a34", borderRadius:10, padding:"12px 6px", fontSize:12, fontWeight:700, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:20 }}>📷</span>Cámara
            </button>
            <button onClick={()=>galeriaRef.current?.click()}
              style={{ background:"#131a22", color:"#c8c4be", border:"1px solid #1e2a34", borderRadius:10, padding:"12px 6px", fontSize:12, fontWeight:700, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:20 }}>🖼</span>Fototeca / Archivos
            </button>
          </div>

          <input ref={camaraRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleArchivos} />
          <input ref={galeriaRef} type="file" accept="image/*,application/pdf,.pdf" multiple style={{ display:"none" }} onChange={handleArchivos} />

          {/* Archivos cargados */}
          {archivos.length > 0 && (
            <div style={{ marginBottom:10 }}>
              {archivos.map((a, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, background:"#131a22", borderRadius:8, padding:"7px 12px", marginBottom:5, border:"1px solid #1e2a34" }}>
                  <span style={{ fontSize:13 }}>{a.tipo.includes("pdf") ? "📄" : "🖼"}</span>
                  <span style={{ flex:1, fontSize:12, color:"#c8c4be", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.nombre}</span>
                  <button onClick={()=>quitarArchivo(i)} style={{ background:"none", border:"none", color:"#c25b4e", fontSize:14 }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {error && <div style={{ background:"#1a1010", color:"#c25b4e", borderRadius:8, padding:"8px 12px", fontSize:12, marginBottom:10 }}>{error}</div>}
          {exito && <div style={{ background:"#0f1e14", color:"#6b8f5e", borderRadius:8, padding:"8px 12px", fontSize:12, marginBottom:10 }}>{exito}</div>}

          <button onClick={confirmar} disabled={enviando}
            style={{ width:"100%", background:enviando?"#131a22":"#6b8f5e", color:enviando?"#4a5060":"#080c10", border:"none", borderRadius:10, padding:"13px", fontSize:13, fontWeight:800 }}>
            {enviando ? "Enviando..." : "✓ Registrar y enviar pedido"}
          </button>
        </div>
      )}

      {/* Historial */}
      <div style={{ fontSize:9, fontWeight:700, color:"#8a8880", textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>
        Historial de pedidos {pedidos.length>0 && <span style={{ color:"#c17f4a" }}>· {pedidos.length}</span>}
      </div>

      {pedidos.length===0
        ? <div style={{ textAlign:"center", color:"#4a5060", fontSize:12, padding:"20px 0" }}>Sin pedidos registrados</div>
        : pedidos.map((p, pi) => (
            <div key={pi} style={{ background:"#131a22", borderRadius:12, border:"1px solid #1e2a34", marginBottom:10, overflow:"hidden" }}>
              <div style={{ padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #1e2a34" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:10, color:"#c17f4a", fontWeight:800, background:"#c17f4a15", borderRadius:4, padding:"1px 7px" }}>#{pedidos.length - pi}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:"#c8c4be" }}>{p.fecha} · {p.hora}</span>
                  </div>
                  <div style={{ fontSize:10, color:"#c17f4a80", marginTop:1 }}>{p.vendedor}{p.tipo && ` · ${p.tipo}`}</div>
                </div>
                {p.archivos?.length>0 && <span style={{ fontSize:10, color:"#7ba7bc", background:"#7ba7bc15", borderRadius:4, padding:"2px 8px" }}>{p.archivos.length} archivo{p.archivos.length>1?"s":""}</span>}
              </div>
              {p.link && (
                <div style={{ padding:"8px 14px", borderBottom:"1px solid #111820" }}>
                  <a href={p.link} target="_blank" style={{ fontSize:12, color:"#7ba7bc", textDecoration:"none", overflow:"hidden", textOverflow:"ellipsis", display:"block", whiteSpace:"nowrap" }}>🔗 {p.link}</a>
                </div>
              )}
              {p.observaciones && (
                <div style={{ padding:"8px 14px", fontSize:12, color:"#8a8880", lineHeight:1.5 }}>{p.observaciones}</div>
              )}
              {p.items?.length>0 && (
                <div style={{ padding:"6px 14px 10px", borderTop:"1px solid #111820" }}>
                  {p.pedidoId && <div style={{ fontSize:10, color:"#c17f4a", fontWeight:800, margin:"4px 0 6px" }}>{p.pedidoId}</div>}
                  {p.items.map((it,ii)=>(
                    <div key={ii} style={{ display:"flex", justifyContent:"space-between", fontSize:11.5, color:"#c8c4be", padding:"2px 0" }}>
                      <span><b>{it.modelo}</b>{it.marca && it.marca!=="CENTRAL" ? ` (${it.marca})` : ""} · {(it.colores||[]).filter(c=>c.color).map(c=>c.color+(c.cantidad>1?` (${c.cantidad})`:"")).join("; ")||"único"}</span>
                      <span style={{ color:"#8a8880" }}>{it.sinCargo ? "SIN CARGO" : "$ "+Math.round(it.precioUnitario||0).toLocaleString("es-AR")}</span>
                    </div>
                  ))}
                  {(p.total!=null) && <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, fontWeight:800, color:"#c8c4be", marginTop:6, paddingTop:6, borderTop:"1px solid #1e2a34" }}><span>{p.unidades} unidades</span><span style={{ color:"#c17f4a" }}>{"$ "+Math.round(p.total).toLocaleString("es-AR")}</span></div>}
                </div>
              )}
              {p.archivos?.map((a,ai)=>(
                <div key={ai} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderTop:"1px solid #111820" }}>
                  <span style={{ fontSize:11 }}>{a.tipo?.includes("pdf")?"📄":"🖼"}</span>
                  <span style={{ fontSize:11, color:"#4a5060" }}>{a.nombre}</span>
                </div>
              ))}
            </div>
          ))
      }
    </div>
  );
}

// ─── HISTORIAL NOTAS ──────────────────────────────────────────────────────────
function HistorialCliente({ clienteId, notasIniciales, vendedor, input, setInput, onGuardar }) {
  const [entradas, setEntradas] = useState(notasIniciales || []);

  const guardar = async () => {
    if (!input.trim()) return;
    const nueva = {
      fecha: new Date().toLocaleDateString("es-AR"),
      hora:  new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}),
      vendedor,
      texto: input.trim()
    };
    const nuevas = [nueva, ...entradas];
    setEntradas(nuevas);
    setInput("");
    onGuardar(nuevas);
  };

  const borrar = (idx) => {
    const nuevas = entradas.filter((_,i)=>i!==idx);
    setEntradas(nuevas);
    onGuardar(nuevas);
  };

  return (
    <div style={{ background:"#131a22", borderRadius:14, padding:16, border:"1px solid #1e2a34" }}>
      <div style={{ fontWeight:700, fontSize:9, marginBottom:12, color:"#8a8880", textTransform:"uppercase", letterSpacing:1.5 }}>
        Notas {entradas.length>0 && <span style={{ color:"#7ba7bc" }}>· {entradas.length}</span>}
      </div>
      <textarea rows={4} placeholder="Anotá lo que hablaron, acordaron, o cualquier detalle..." value={input} onChange={e=>setInput(e.target.value)}
        style={{ width:"100%", background:"#0d1117", color:"#c8c4be", border:"1px solid #1e2a34", borderRadius:10, padding:"12px 14px", fontSize:13, resize:"vertical", marginBottom:10, boxSizing:"border-box", lineHeight:1.6, fontFamily:"'LeagueSpartan',sans-serif" }} />
      <button onClick={guardar} style={{ width:"100%", background:"#7ba7bc", color:"#080c10", padding:"11px", borderRadius:10, border:"none", fontWeight:800, fontSize:13, marginBottom:entradas.length?14:0 }}>Registrar nota</button>
      {entradas.map((e,i)=>(
        <div key={i} style={{ borderTop:"1px solid #1c2530", paddingTop:12, marginTop:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <div style={{ display:"flex", gap:6 }}>
              <span style={{ fontSize:10, fontWeight:700, color:"#7ba7bc" }}>{e.vendedor}</span>
              <span style={{ fontSize:9, color:"#4a5060" }}>{e.fecha} · {e.hora}</span>
            </div>
            <button onClick={()=>borrar(i)} style={{ background:"none", border:"none", color:"#4a5060", fontSize:14, padding:"0 4px" }}>✕</button>
          </div>
          <div style={{ fontSize:13, color:"#c8c4be", lineHeight:1.6 }}>{e.texto}</div>
        </div>
      ))}
      {entradas.length===0 && <div style={{ textAlign:"center", color:"#4a5060", fontSize:12 }}>Sin notas aún</div>}
    </div>
  );
}


// ─── PANEL GESTIONES (Daniela / Admin) ───────────────────────────────────────
function PanelGestiones({ session, clientes }) {
  const [gestiones, setGestiones]   = React.useState(null);
  const [cargando,  setCargando]    = React.useState(true);
  const [filtroV,   setFiltroV]     = React.useState("todos");
  const [filtroE,   setFiltroE]     = React.useState(null);
  const [busq,      setBusq]        = React.useState("");

  const VENDEDORES = ["todos","matias","miguel","nicolas","mauro","central"];
  const ESTADOS    = ["Prometió pago","No contestó","Sin respuesta","Contactado","Pagó","Incobrable"];
  const ECOL       = { Contactado:"#5ab86e","No contestó":"#e8924a","Prometió pago":"#7ba7bc",
    "Pagó":"#5ab86e44","Sin respuesta":"#4a5060",Incobrable:"#c25b4e" };

  React.useEffect(() => {
    setCargando(true);
    fetch("/api/gestiones")
      .then(r=>r.json())
      .then(d=>{ setGestiones(d.ok ? d.gestiones : []); setCargando(false); })
      .catch(()=>{ setGestiones([]); setCargando(false); });
  }, []);

  const lista = React.useMemo(() => {
    if (!gestiones) return [];
    return gestiones.filter(g => {
      if (filtroV !== "todos" && g.vendedor !== filtroV) return false;
      if (filtroE && g.estado !== filtroE) return false;
      if (busq && !g.clienteNombre?.toLowerCase().includes(busq.toLowerCase())) return false;
      return true;
    });
  }, [gestiones, filtroV, filtroE, busq]);

  const pendientes = (gestiones||[]).filter(g => g.estado === "Prometió pago").length;

  if (cargando) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:200}}>
      <div style={{width:26,height:26,border:"2px solid #1e2a34",borderTopColor:"#c17f4a",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
    </div>
  );

  return (
    <div style={{padding:"16px 16px 100px",background:"#0a0e14",minHeight:"100vh"}}>
      <div style={{marginBottom:14,marginTop:8}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:600,color:"#f0ede8",marginBottom:4}}>Gestiones</div>
        <div style={{fontSize:11,color:"#4a5060"}}>{lista.length} registros{pendientes>0?` · `:""}
          {pendientes>0 && <span style={{color:"#7ba7bc",fontWeight:700}}>{pendientes} prometieron pago ⚡</span>}
        </div>
      </div>

      {/* Filtros */}
      <input placeholder="Buscar cliente..." value={busq} onChange={e=>setBusq(e.target.value)}
        style={{marginBottom:10,display:"block",width:"100%",boxSizing:"border-box"}}/>
      <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",marginBottom:10,paddingBottom:2}}>
        {VENDEDORES.map(v=>(
          <button key={v} onClick={()=>setFiltroV(v)}
            style={{padding:"5px 12px",borderRadius:999,border:`1px solid ${filtroV===v?"#c17f4a":"#1e2a34"}`,background:filtroV===v?"#c17f4a22":"transparent",color:filtroV===v?"#c17f4a":"#3a4a58",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>
            {v==="todos"?"Todos":v.charAt(0).toUpperCase()+v.slice(1)}
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",marginBottom:14,paddingBottom:2}}>
        <button onClick={()=>setFiltroE(null)}
          style={{padding:"5px 12px",borderRadius:999,border:`1px solid ${!filtroE?"#7ba7bc":"#1e2a34"}`,background:!filtroE?"#7ba7bc22":"transparent",color:!filtroE?"#7ba7bc":"#3a4a58",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>
          Todos
        </button>
        {ESTADOS.map(e=>{
          const c=ECOL[e]||"#4a5060";
          return (
            <button key={e} onClick={()=>setFiltroE(e===filtroE?null:e)}
              style={{padding:"5px 12px",borderRadius:999,border:`1px solid ${filtroE===e?c:"#1e2a34"}`,background:filtroE===e?c+"22":"transparent",color:filtroE===e?c:"#3a4a58",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>
              {e}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <div style={{textAlign:"center",padding:40,color:"#2a3a48",fontSize:12}}>Sin gestiones{filtroE?" con ese estado":""}</div>
      ) : lista.map((g,i) => {
        const ec = ECOL[g.estado]||"#4a5060";
        return (
          <div key={i} style={{background:"#0d1420",border:`1px solid ${g.estado==="Prometió pago"?"#7ba7bc30":"#1a2430"}`,borderRadius:12,padding:"12px 14px",marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <div style={{fontSize:13,fontWeight:700,color:"#f0ede8"}}>{g.clienteNombre}</div>
              <span style={{fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:999,background:ec+"22",color:ec,border:`1px solid ${ec}44`,flexShrink:0,marginLeft:8}}>{g.estado}</span>
            </div>
            <div style={{fontSize:10,color:"#3a4a58",marginBottom:g.nota?6:0,display:"flex",gap:8,flexWrap:"wrap"}}>
              <span>{g.fecha?.split("-").reverse().join("/")}</span>
              <span>· {g.tipo}</span>
              <span style={{color:"#c17f4a88"}}>· {g.vendedor}</span>
              {g.usuario && <span style={{color:"#2a3848"}}>por {g.usuario}</span>}
            </div>
            {g.nota && <div style={{fontSize:12,color:"#6a7880",lineHeight:1.5}}>{g.nota}</div>}
          </div>
        );
      })}
    </div>
  );
}


// ─── SEGUIMIENTOS PENDIENTES ─────────────────────────────────────────────────
function SeguimientosPendientes({ session, clientes, onGestion }) {
  const [seguim,    setSeguim]    = React.useState(null);
  const [ccData,    setCcData]    = React.useState(null);
  const [cargando,  setCargando]  = React.useState(true);
  const hoy     = new Date().toISOString().slice(0,10);
  const hoyFmt  = new Date().toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"});
  const mesNom  = new Date().toLocaleDateString("es-AR",{month:"long",year:"numeric"});

  const ECOL = {
    Contactado:"#62955c","No contestó":"#c8844e","Prometió pago":"#7eaec4",
    "Pagó":"#62955c","Sin respuesta":"#5a6472",Incobrable:"#c05850"
  };
  const VCOL = {matias:"#c8844e",miguel:"#7eaec4",nicolas:"#62955c",mauro:"#a06ae8",central:"#c8844e"};

  const cargar = React.useCallback(() => {
    setCargando(true);
    // Traer seguimientos pendientes + CC de todos en paralelo
    Promise.all([
      fetch(`/api/gestiones?seguimientoHasta=${hoy}`).then(r=>r.json()).catch(()=>({ok:false})),
      fetch("/api/cuentas-corrientes").then(r=>r.json()).catch(()=>({ok:false})),
    ]).then(([gd, ccd]) => {
      if (gd.ok)  setSeguim(gd.gestiones || []);
      else        setSeguim([]);
      if (ccd.ok) setCcData(ccd.clientes || []);
      else        setCcData([]);
      setCargando(false);
    });
  }, [hoy]);

  React.useEffect(cargar, []);

  // Métricas de cobranza del período actual
  const metricas = React.useMemo(() => {
    if (!ccData) return null;
    const conDeuda = ccData.filter(c => c.saldoTotal > 0);
    const totalDeuda = conDeuda.reduce((a,c) => a+c.saldoTotal, 0);
    // Vencidas: facturas con vencimiento <= hoy
    let totalVencido = 0;
    conDeuda.forEach(c => {
      (c.comprobantes||[]).forEach(cp => {
        if (cp.saldo > 0 && cp.vencimiento && cp.vencimiento <= hoy) totalVencido += cp.saldo;
      });
    });
    // Por vendedor
    const porV = {};
    conDeuda.forEach(c => {
      const v = c.vendedor || "sin asignar";
      porV[v] = (porV[v]||0) + c.saldoTotal;
    });
    return { conDeuda: conDeuda.length, totalDeuda, totalVencido, porV };
  }, [ccData, hoy]);

  const fmtM = n => {
    if (!n) return "$0";
    if (n >= 1000000) return `$${(n/1000000).toFixed(1)}M`;
    if (n >= 1000)    return `$${(n/1000).toFixed(0)}K`;
    return `$${Math.round(n).toLocaleString("es-AR")}`;
  };

  const vencidos = (seguim||[]).filter(g => g.fechaSeguimiento < hoy);
  const hoyItems = (seguim||[]).filter(g => g.fechaSeguimiento === hoy);

  if (cargando) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:300,gap:16}}>
      <Spinner size={28}/>
      <div style={{fontSize:12,color:"#3a4858"}}>Cargando cobranzas...</div>
    </div>
  );

  return (
    <div style={{padding:"16px 16px 100px",background:"#06090d",minHeight:"100vh"}}>

      {/* Header del día */}
      <div style={{marginBottom:20,marginTop:8}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,color:"#5a6878",
          textTransform:"capitalize",marginBottom:4}}>{hoyFmt}</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:600,
          color:"#f2ede6",marginBottom:2}}>Cobranzas</div>
        <div style={{fontSize:11,color:"#5a6878"}}>{mesNom}</div>
      </div>

      {/* KPIs de deuda del período */}
      {metricas && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <div style={{background:"#0c1118",borderRadius:14,padding:"14px 12px",
            border:"1px solid #1e2c3a",gridColumn:"span 2",
            display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:9,color:"#5a6878",textTransform:"uppercase",
                letterSpacing:2,fontWeight:700,marginBottom:4}}>Deuda total activa</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,
                fontWeight:700,color:"#c8844e",letterSpacing:-.5}}>
                {fmtM(metricas.totalDeuda)}
              </div>
              <div style={{fontSize:10,color:"#3a4858",marginTop:3}}>
                {metricas.conDeuda} clientes con saldo
              </div>
            </div>
            {metricas.totalVencido > 0 && (
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:9,color:"#c05850",textTransform:"uppercase",
                  letterSpacing:1.5,fontWeight:700,marginBottom:4}}>Vencida</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,
                  fontWeight:700,color:"#c05850"}}>
                  {fmtM(metricas.totalVencido)}
                </div>
              </div>
            )}
          </div>

          {/* Por vendedor */}
          {Object.entries(metricas.porV)
            .sort((a,b)=>b[1]-a[1]).slice(0,4)
            .map(([v,m]) => {
              const vc = VCOL[v]||"#c8844e";
              return (
                <div key={v} style={{background:"#0c1118",borderRadius:12,padding:"11px 12px",
                  border:`1px solid ${vc}22`}}>
                  <div style={{fontSize:9,color:vc,textTransform:"capitalize",
                    fontWeight:700,marginBottom:4}}>{v}</div>
                  <div style={{fontSize:16,fontWeight:800,color:"#f2ede6"}}>{fmtM(m)}</div>
                </div>
              );
            })}
        </div>
      )}

      {/* Seguimientos pendientes */}
      {(vencidos.length > 0 || hoyItems.length > 0) ? (
        <div style={{marginBottom:20}}>
          <div style={{fontSize:9,color:"#5a6878",textTransform:"uppercase",
            letterSpacing:2,fontWeight:700,marginBottom:10}}>
            Seguimientos pendientes
            <span style={{marginLeft:8,color:vencidos.length>0?"#c05850":"#7eaec4",fontWeight:800}}>
              {vencidos.length > 0 ? `${vencidos.length} vencido${vencidos.length!==1?"s":""}` : `${hoyItems.length} para hoy`}
            </span>
          </div>

          {[...vencidos.map(g=>({...g,_urgente:true})), ...hoyItems].map((g,i) => {
            const ec = ECOL[g.estado]||"#5a6472";
            const vc = VCOL[g.vendedor]||"#c8844e";
            return (
              <div key={i} style={{background:g._urgente?"#120c0c":"#0c1118",
                border:`1px solid ${g._urgente?"rgba(192,88,80,.25)":"#1e2c3a"}`,
                borderRadius:14,padding:"13px 14px",marginBottom:9}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#f2ede6",
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {g.clienteNombre}
                    </div>
                    <div style={{fontSize:10,color:"#3a4858",marginTop:2,display:"flex",gap:6}}>
                      <span>{g.tipo}</span>
                      <span style={{color:ec}}>· {g.estado}</span>
                      <span style={{color:vc}}>· {g.vendedor}</span>
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
                    <div style={{fontSize:9,fontWeight:800,
                      color:g._urgente?"#c05850":"#7eaec4",textTransform:"uppercase",
                      letterSpacing:1}}>
                      {g._urgente ? `Vencido ${g.fechaSeguimiento.split("-").reverse().join("/")}` : "Hoy"}
                    </div>
                  </div>
                </div>
                {g.nota && <div style={{fontSize:12,color:"#5a6878",lineHeight:1.5,marginBottom:8}}>{g.nota}</div>}
                <button onClick={()=>onGestion&&onGestion(g)}
                  style={{width:"100%",background:"#111820",border:"1px solid #1e2c3a",
                    borderRadius:10,padding:"10px",color:"#c8844e",fontSize:11,
                    fontWeight:800,fontFamily:"inherit"}}>
                  📝 Registrar contacto
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{background:"#0c1118",borderRadius:14,padding:"24px 16px",
          textAlign:"center",marginBottom:16,border:"1px solid #1e2c3a"}}>
          <div style={{fontSize:24,marginBottom:8}}>✓</div>
          <div style={{fontSize:13,fontWeight:700,color:"#62955c",marginBottom:3}}>Sin seguimientos pendientes</div>
          <div style={{fontSize:11,color:"#3a4858"}}>Todos al día</div>
        </div>
      )}

      {/* Los más urgentes de CC — clientes con más deuda vencida */}
      {ccData && ccData.filter(c=>c.saldoTotal>0).length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{fontSize:9,color:"#5a6878",textTransform:"uppercase",
            letterSpacing:2,fontWeight:700,marginBottom:10}}>
            Pendientes más urgentes
          </div>
          {ccData
            .filter(c => c.saldoTotal > 0)
            .sort((a,b) => b.saldoTotal - a.saldoTotal)
            .slice(0,8)
            .map((c,i) => {
              const vc = VCOL[c.vendedor]||"#c8844e";
              const tieneVenc = (c.comprobantes||[]).some(cp=>cp.saldo>0&&cp.vencimiento&&cp.vencimiento<=hoy);
              return (
                <div key={i} style={{background:"#0c1118",border:`1px solid ${tieneVenc?"rgba(192,88,80,.2)":"#1a2530"}`,
                  borderRadius:13,padding:"12px 14px",marginBottom:8,
                  display:"flex",alignItems:"center",gap:12}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#f2ede6",
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {c.cliente.split(" ").slice(0,4).join(" ")}
                    </div>
                    <div style={{fontSize:10,color:vc,marginTop:2,display:"flex",gap:6,alignItems:"center"}}>
                      <span>{c.vendedor}</span>
                      {tieneVenc && <span style={{color:"#c05850",fontWeight:700}}>· con vencidas</span>}
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,
                      fontWeight:700,color:tieneVenc?"#c05850":"#c8844e"}}>
                      {fmtM(c.saldoTotal)}
                    </div>
                    <button onClick={()=>onGestion&&onGestion({
                      clienteNombre:c.cliente, clienteId:c.airtableId||"",
                      vendedor:c.vendedor, saldoTotal:c.saldoTotal
                    })}
                      style={{marginTop:4,background:"#111820",border:"1px solid #1e2c3a",
                        borderRadius:7,padding:"4px 10px",color:"#c8844e",
                        fontSize:10,fontWeight:700,fontFamily:"inherit"}}>
                      📝
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Cerrar día */}
      <button onClick={()=>{
        const body = `Resumen de cobranzas — ${hoyFmt}\n\nDeuda activa: ${metricas?fmtM(metricas.totalDeuda):"—"}\nClientes con deuda: ${metricas?.conDeuda||0}\nSeguimientos vencidos: ${vencidos.length}\nPara hoy: ${hoyItems.length}\n\n---\nCentral Eyewear CRM`;
        window.location.href = `mailto:alexisnassimoff@gmail.com?subject=Cobranzas ${hoyFmt}&body=${encodeURIComponent(body)}`;
      }}
        style={{width:"100%",background:"transparent",border:"1px solid #1e2c3a",
          borderRadius:13,padding:"13px",color:"#5a6878",fontSize:12,fontWeight:700,
          fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:4}}>
        <span style={{fontSize:16}}>🌙</span> Cerrar día · enviar resumen a Ale
      </button>

      <button onClick={cargar}
        style={{width:"100%",marginTop:8,background:"transparent",border:"1px solid #1a2530",
          borderRadius:11,padding:"10px",color:"#3a4858",fontSize:11,fontWeight:700,fontFamily:"inherit"}}>
        ↻ Actualizar
      </button>
    </div>
  );
}



// ════════════════════════════════════════════════════════════════════════════
// ── CONSULTORÍA IA (Coach) ───────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
function ConsultoriaIA({ ventas, clientes, session }) {
  const [msgs,    setMsgs]    = React.useState([]);
  const [input,   setInput]   = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const endRef = React.useRef(null);
  const mesStr = new Date().toISOString().slice(0,7);

  // Contexto del negocio para la IA
  const contexto = React.useMemo(() => {
    const hoy = new Date().toISOString().slice(0,10);
    const h3m = new Date(); h3m.setMonth(h3m.getMonth()-3);
    const str3m = h3m.toISOString().slice(0,10);
    const ventasMes = ventas.filter(v=>v.fecha?.startsWith(mesStr)&&esVentaReal(v));
    const facMes    = ventasMes.reduce((a,v)=>a+netoSinIVA(v),0);
    const cliActivos = new Set(ventas.filter(v=>v.fecha>=str3m&&esVentaReal(v)).map(v=>v.cliente)).size;
    const cliTotal   = clientes.length;
    const porV = {};
    ventasMes.forEach(v=>{const vn=v.vendedor||"?";porV[vn]=(porV[vn]||0)+netoSinIVA(v);});
    const topV = Object.entries(porV).sort((a,b)=>b[1]-a[1]).map(([v,m])=>`${v}: $${Math.round(m/1000)}K`).join(", ");
    const fmtM = n => n>=1000000?`$${(n/1000000).toFixed(1)}M`:`$${Math.round(n/1000)}K`;
    return `Eres el coach estratégico de Central Eyewear, distribuidora mayorista de marcos ópticos en Argentina. Datos actuales del negocio:
- Período: ${mesStr}
- Facturación neta del mes (sin IVA): ${fmtM(facMes)}
- Total clientes: ${cliTotal} (${cliActivos} activos últimos 3 meses)
- Vendedores y ventas del mes: ${topV||"sin datos"}
- Comisión vendedores: 15% sobre cobrado neto sin IVA
Responde en español, de forma directa y orientada a resultados. Máximo 4 párrafos por respuesta.`;
  }, [ventas, clientes, mesStr]);

  const SUGERENCIAS = [
    "¿Cuál es mi mayor riesgo este mes?",
    "¿Qué vendedor necesita más atención?",
    "Clientes que podría estar perdiendo",
    "Estrategia para reactivar dormidos",
    "¿Cómo mejorar el flujo de cobranza?",
    "Top 3 acciones para esta semana",
  ];

  const enviar = async (txt) => {
    const texto = (txt || input).trim();
    if (!texto || loading) return;
    setInput("");
    const nuevos = [...msgs, { role:"user", content:texto }];
    setMsgs(nuevos);
    setLoading(true);
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          system: contexto,
          messages: nuevos.map(m=>({role:m.role, content:m.content}))
        })
      });
      const d = await r.json();
      const resp = d.content?.[0]?.text || "No pude procesar la consulta.";
      setMsgs(p=>[...p, {role:"assistant", content:resp}]);
    } catch(e) {
      setMsgs(p=>[...p, {role:"assistant", content:"Error al conectar con la IA. Intentá de nuevo."}]);
    }
    setLoading(false);
  };

  React.useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs, loading]);

  return (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100dvh - 56px)",background:"#06090d"}}>
      {/* Header */}
      <div style={{padding:"16px 16px 12px",borderBottom:"1px solid #18222e",background:"#08101a",flexShrink:0}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:600,color:"#f2ede6",marginBottom:2}}>Coach IA</div>
        <div style={{fontSize:11,color:"#5a6878"}}>Análisis estratégico de tu cartera · {new Date().toLocaleDateString("es-AR",{month:"long",year:"numeric"})}</div>
      </div>

      {/* Mensajes */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 16px",display:"flex",flexDirection:"column",gap:12}}>
        {msgs.length === 0 && (
          <div>
            <div style={{textAlign:"center",padding:"32px 16px 20px"}}>
              <div style={{fontSize:32,marginBottom:12}}>🧠</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#f2ede6",marginBottom:6}}>¿En qué te ayudo?</div>
              <div style={{fontSize:12,color:"#3a4858"}}>Análisis de cartera, vendedores, estrategia, cobranza</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {SUGERENCIAS.map((s,i)=>(
                <button key={i} onClick={()=>enviar(s)}
                  style={{background:"#0c1118",border:"1px solid #1e2c3a",borderRadius:12,
                    padding:"12px 14px",color:"#c2bcb4",fontSize:13,fontWeight:500,
                    textAlign:"left",fontFamily:"inherit",lineHeight:1.4}}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",flexDirection:m.role==="user"?"row-reverse":"row",gap:10,alignItems:"flex-start"}}>
            <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,
              background:m.role==="user"?"#c8844e22":"#1e2c3a",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>
              {m.role==="user"?"👤":"🧠"}
            </div>
            <div style={{maxWidth:"82%",background:m.role==="user"?"#1a2434":"#0c1118",
              borderRadius:m.role==="user"?"14px 4px 14px 14px":"4px 14px 14px 14px",
              padding:"11px 14px",border:`1px solid ${m.role==="user"?"#2a3a4a":"#1a2530"}`,
              animation:"fadeIn .2s ease"}}>
              <div style={{fontSize:13,color:m.role==="user"?"#c2bcb4":"#f2ede6",lineHeight:1.65,whiteSpace:"pre-wrap"}}>
                {m.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:"#1e2c3a",display:"flex",alignItems:"center",justifyContent:"center"}}>🧠</div>
            <div style={{background:"#0c1118",borderRadius:"4px 14px 14px 14px",padding:"12px 16px",border:"1px solid #1a2530"}}>
              <div style={{display:"flex",gap:5,alignItems:"center"}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{width:7,height:7,borderRadius:"50%",background:"#c8844e",
                    animation:`pulse 1.2s ease ${i*.2}s infinite`}}/>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Input */}
      <div style={{padding:"12px 16px 20px",borderTop:"1px solid #18222e",background:"#08101a",flexShrink:0}}>
        {msgs.length > 0 && (
          <div style={{display:"flex",gap:6,marginBottom:8,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
            {SUGERENCIAS.slice(0,3).map((s,i)=>(
              <button key={i} onClick={()=>enviar(s)}
                style={{background:"#0c1118",border:"1px solid #1e2c3a",borderRadius:999,
                  padding:"5px 12px",color:"#5a6878",fontSize:10,fontWeight:600,
                  whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
          <textarea value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();enviar();}}}
            placeholder="Preguntá sobre tu cartera, vendedores, estrategia..."
            rows={2} style={{flex:1,resize:"none",borderRadius:12,padding:"11px 13px",
              fontSize:13,lineHeight:1.5,maxHeight:120}}/>
          <button onClick={()=>enviar()} disabled={!input.trim()||loading}
            style={{background:"#c8844e",border:"none",borderRadius:10,width:42,height:42,
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
              opacity:(!input.trim()||loading)?.4:1,fontSize:18}}>
            ➤
          </button>
        </div>
        <button onClick={()=>setMsgs([])}
          style={{width:"100%",marginTop:8,background:"transparent",border:"none",
            color:"#2a3848",fontSize:10,fontFamily:"inherit"}}>
          Limpiar conversación
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ── CARTERA DE CLIENTES ──────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
function CarteraClientes({ ventas, clientes }) {
  const mesStr  = new Date().toISOString().slice(0,7);
  const mesAnt  = (()=>{ const d=new Date(); d.setMonth(d.getMonth()-1); return d.toISOString().slice(0,7); })();
  const h3m     = (()=>{ const d=new Date(); d.setMonth(d.getMonth()-3); return d.toISOString().slice(0,10); })();
  const h6m     = (()=>{ const d=new Date(); d.setMonth(d.getMonth()-6); return d.toISOString().slice(0,10); })();
  const h3mAnt  = (()=>{ const d=new Date(); d.setMonth(d.getMonth()-4); return d.toISOString().slice(0,10); })();
  const fmtM = n => n>=1000000?`$${(n/1000000).toFixed(1)}M`:n>=1000?`$${(n/1000).toFixed(0)}K`:`$${Math.round(n)}`;

  const ventasReales = ventas.filter(esVentaReal);

  // Clientes activos este mes y mes anterior
  const cliMes    = new Set(ventasReales.filter(v=>v.fecha?.startsWith(mesStr)).map(v=>v.cliente));
  const cliMesAnt = new Set(ventasReales.filter(v=>v.fecha?.startsWith(mesAnt)).map(v=>v.cliente));
  const cliActivos3m = new Set(ventasReales.filter(v=>v.fecha>=h3m).map(v=>v.cliente));
  const todosCli  = new Set(ventasReales.map(v=>v.cliente));

  // Nuevos este mes (no compraron antes)
  const nuevos = [...cliMes].filter(c => !ventasReales.some(v=>v.cliente===c&&v.fecha<mesStr));

  // Reactivados (compran este mes, no compraron en los 3 meses previos pero sí antes)
  const reactivados = [...cliMes].filter(c => {
    const tieneAnt = ventasReales.some(v=>v.cliente===c&&v.fecha<mesStr);
    const dormido  = !ventasReales.some(v=>v.cliente===c&&v.fecha>=h3mAnt&&v.fecha<mesStr);
    return tieneAnt && dormido;
  });

  // Top 10 por facturación del mes
  const facPorCli = {};
  ventasReales.filter(v=>v.fecha?.startsWith(mesStr)).forEach(v=>{
    facPorCli[v.cliente]=(facPorCli[v.cliente]||0)+netoSinIVA(v);
  });
  const top10 = Object.entries(facPorCli).sort((a,b)=>b[1]-a[1]).slice(0,10);

  // Salud de cartera
  const totalCli   = clientes.length;
  const activos    = cliActivos3m.size;
  const medios     = [...todosCli].filter(c=>!cliActivos3m.has(c)&&ventasReales.some(v=>v.cliente===c&&v.fecha>=h6m)).length;
  const recuperar  = [...todosCli].filter(c=>!cliActivos3m.has(c)&&!ventasReales.some(v=>v.cliente===c&&v.fecha>=h6m)&&ventasReales.some(v=>v.cliente===c)).length;
  const sinHist    = totalCli - activos - medios - recuperar;

  const pct = n => Math.round(n/totalCli*100);
  const mesNom = new Date().toLocaleDateString("es-AR",{month:"long",year:"numeric"});

  return (
    <div style={{padding:"16px 16px 100px",background:"#06090d",minHeight:"100vh"}}>
      <div style={{marginBottom:20,marginTop:8}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:600,color:"#f2ede6",marginBottom:2}}>Cartera</div>
        <div style={{fontSize:11,color:"#5a6878"}}>{mesNom} · {totalCli} clientes totales</div>
      </div>

      {/* KPIs del mes */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9,marginBottom:16}}>
        <KPI l="Activos mes" v={cliMes.size} c="#c8844e"/>
        <KPI l="Nuevos" v={nuevos.length} c="#62955c"/>
        <KPI l="Reactivados" v={reactivados.length} c="#7eaec4"/>
      </div>

      {/* Salud de la cartera */}
      <div style={{background:"#0c1118",borderRadius:16,padding:"16px",border:"1px solid #1e2c3a",marginBottom:14}}>
        <div style={{fontSize:9,color:"#5a6878",textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:14}}>Salud de la cartera</div>
        {[
          {l:"Activos · compra < 3m",  n:activos,   c:"#62955c"},
          {l:"Entibiando · 3-6m",       n:medios,    c:"#c8844e"},
          {l:"Recuperar · +6m",         n:recuperar, c:"#c05850"},
          {l:"Sin historial",           n:sinHist,   c:"#3a4858"},
        ].map(r=>(
          <div key={r.l} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,color:r.c,fontWeight:600}}>{r.l}</span>
              <span style={{fontSize:12,color:"#f2ede6",fontWeight:700}}>{r.n} <span style={{color:"#3a4858",fontWeight:400}}>({pct(r.n)}%)</span></span>
            </div>
            <div style={{height:5,borderRadius:99,background:"#1a2530",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct(r.n)}%`,background:r.c,borderRadius:99,
                boxShadow:`0 0 8px ${r.c}60`,transition:"width .6s"}}/>
            </div>
          </div>
        ))}
      </div>

      {/* Top 10 clientes del mes */}
      <div style={{background:"#0c1118",borderRadius:16,padding:"16px",border:"1px solid #1e2c3a",marginBottom:14}}>
        <div style={{fontSize:9,color:"#5a6878",textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:14}}>
          Top 10 · {mesNom}
        </div>
        {top10.length === 0 ? (
          <Empty icon="📊" msg="Sin ventas registradas este mes"/>
        ) : top10.map(([cli,monto],i)=>{
          const maxM = top10[0][1];
          return (
            <div key={i} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                  <span style={{fontSize:10,fontWeight:800,color:i<3?"#c8844e":"#3a4858",
                    width:20,textAlign:"right",flexShrink:0}}>#{i+1}</span>
                  <span style={{fontSize:12,color:"#c2bcb4",fontWeight:600,
                    whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                    {cli.split(" ").slice(0,3).join(" ")}
                  </span>
                </div>
                <span style={{fontSize:12,fontWeight:800,color:"#f2ede6",flexShrink:0,marginLeft:8}}>
                  {fmtM(monto)}
                </span>
              </div>
              <div style={{height:4,borderRadius:99,background:"#1a2530",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.round(monto/maxM*100)}%`,
                  background:i===0?"linear-gradient(90deg,#c8844e,#d49662)":i<3?"#7eaec4":"#2a3848",
                  borderRadius:99}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nuevos y reactivados */}
      {nuevos.length > 0 && (
        <div style={{background:"#0c1118",borderRadius:16,padding:"16px",border:"1px solid #62955c30",marginBottom:14}}>
          <div style={{fontSize:9,color:"#62955c",textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:12}}>
            ✨ Nuevos este mes · {nuevos.length}
          </div>
          {nuevos.slice(0,5).map((c,i)=>(
            <div key={i} style={{fontSize:12,color:"#c2bcb4",padding:"6px 0",borderBottom:"1px solid #131d28"}}>
              {c.split(" ").slice(0,4).join(" ")}
            </div>
          ))}
        </div>
      )}
      {reactivados.length > 0 && (
        <div style={{background:"#0c1118",borderRadius:16,padding:"16px",border:"1px solid #7eaec430",marginBottom:14}}>
          <div style={{fontSize:9,color:"#7eaec4",textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:12}}>
            🔄 Reactivados · {reactivados.length}
          </div>
          {reactivados.slice(0,5).map((c,i)=>(
            <div key={i} style={{fontSize:12,color:"#c2bcb4",padding:"6px 0",borderBottom:"1px solid #131d28"}}>
              {c.split(" ").slice(0,4).join(" ")}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ── PANEL DE VENDEDORES ──────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
function PanelVendedores({ ventas, clientes }) {
  const mesStr = new Date().toISOString().slice(0,7);
  const mesAnt = (()=>{ const d=new Date(); d.setMonth(d.getMonth()-1); return d.toISOString().slice(0,7); })();
  const h3m    = (()=>{ const d=new Date(); d.setMonth(d.getMonth()-3); return d.toISOString().slice(0,10); })();
  const fmtM = n => n>=1000000?`$${(n/1000000).toFixed(1)}M`:n>=1000?`$${(n/1000).toFixed(0)}K`:`$${Math.round(n)}`;

  const VENDEDORES = ["matias","nicolas","miguel","mauro","central"];
  const VNOMBRES   = {matias:"Matías",nicolas:"Nicolás",miguel:"Miguel",mauro:"Mauro",central:"Central"};
  const VCOL       = {matias:"#c8844e",nicolas:"#62955c",miguel:"#7eaec4",mauro:"#a06ae8",central:"#c8844e"};

  const ventasReales = ventas.filter(esVentaReal);

  // Métricas por vendedor
  const metricas = VENDEDORES.map(v => {
    const vVentas  = ventasReales.filter(x=>x.vendedor===v);
    const vMes     = vVentas.filter(x=>x.fecha?.startsWith(mesStr));
    const vMesAnt  = vVentas.filter(x=>x.fecha?.startsWith(mesAnt));
    const facMes   = vMes.reduce((a,x)=>a+netoSinIVA(x),0);
    const facAnt   = vMesAnt.reduce((a,x)=>a+netoSinIVA(x),0);
    const comision = Math.round(facMes*0.15);
    const cliCarta = clientes.filter(c=>c.vendedor===v).length;
    const cliAct   = new Set(vVentas.filter(x=>x.fecha>=h3m).map(x=>x.cliente)).size;
    const trend    = facAnt>0 ? Math.round((facMes-facAnt)/facAnt*100) : null;
    return { v, facMes, facAnt, comision, cliCarta, cliAct, trend };
  }).filter(m=>m.cliCarta>0||m.facMes>0);

  // Ordenar por facturación del mes
  metricas.sort((a,b)=>b.facMes-a.facMes);
  const maxFac = metricas[0]?.facMes || 1;
  const totalMes = metricas.reduce((a,m)=>a+m.facMes,0);

  const mesNom = new Date().toLocaleDateString("es-AR",{month:"long",year:"numeric"});

  return (
    <div style={{padding:"16px 16px 100px",background:"#06090d",minHeight:"100vh"}}>
      <div style={{marginBottom:20,marginTop:8}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:600,color:"#f2ede6",marginBottom:2}}>Vendedores</div>
        <div style={{fontSize:11,color:"#5a6878"}}>{mesNom} · Total: {fmtM(totalMes)} neto</div>
      </div>

      {/* Ranking */}
      {metricas.map((m,i)=>{
        const vc = VCOL[m.v]||"#c8844e";
        const pct = Math.round(m.facMes/maxFac*100);
        const medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":"";
        return (
          <div key={m.v} style={{background:"#0c1118",borderRadius:16,padding:"16px",
            border:`1px solid ${i===0?vc+"44":"#1e2c3a"}`,marginBottom:12,
            boxShadow:i===0?`0 4px 20px ${vc}18`:"none"}}>

            {/* Nombre + posición */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:vc+"18",
                  border:`1.5px solid ${vc}44`,display:"flex",alignItems:"center",
                  justifyContent:"center",fontSize:13,fontWeight:900,color:vc}}>
                  {i+1}
                </div>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:"#f2ede6"}}>
                    {medal} {VNOMBRES[m.v]||m.v}
                  </div>
                  <div style={{fontSize:10,color:"#3a4858",marginTop:1}}>
                    {m.cliCarta} clientes · {m.cliAct} activos
                  </div>
                </div>
              </div>
              {m.trend !== null && (
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,fontWeight:800,
                    color:m.trend>=0?"#62955c":"#c05850"}}>
                    {m.trend>=0?"+":""}{m.trend}%
                  </div>
                  <div style={{fontSize:9,color:"#3a4858"}}>vs mes ant.</div>
                </div>
              )}
            </div>

            {/* Barra facturación */}
            <div style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:9,color:"#5a6878",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Facturado neto</span>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:vc}}>{fmtM(m.facMes)}</span>
              </div>
              <div style={{height:6,borderRadius:99,background:"#1a2530",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${vc},${vc}bb)`,
                  borderRadius:99,boxShadow:`0 0 10px ${vc}60`,transition:"width .6s"}}/>
              </div>
            </div>

            {/* Comisión */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              background:"#111820",borderRadius:10,padding:"10px 12px"}}>
              <div>
                <div style={{fontSize:9,color:"#5a6878",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Comisión estimada · 15%</div>
                <div style={{fontSize:9,color:"#3a4858"}}>sobre cobrado neto sin IVA</div>
              </div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:"#62955c"}}>
                {fmtM(m.comision)}
              </div>
            </div>

            {/* % del total */}
            {totalMes > 0 && (
              <div style={{textAlign:"center",marginTop:10,fontSize:10,color:"#3a4858"}}>
                {Math.round(m.facMes/totalMes*100)}% del total del mes
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ── EMAIL BLAST ─────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
const PLANTILLAS = [
  { id:"recordatorio_pago",   label:"Recordatorio de pago",    desc:"Para clientes con deuda pendiente" },
  { id:"vencimiento_proximo", label:"Vencimiento próximo",      desc:"Aviso preventivo antes del vencimiento" },
  { id:"novedad_catalogo",    label:"Novedades de catálogo",    desc:"Nuevas colecciones disponibles" },
  { id:"bienvenida",          label:"Bienvenida al cliente",    desc:"Para clientes nuevos" },
  { id:"libre",               label:"Mensaje libre",            desc:"Escribí el texto vos mismo" },
];

function EmailBlast({ clientes, session }) {
  const [plantilla,   setPlantilla]   = React.useState("recordatorio_pago");
  const [asunto,      setAsunto]      = React.useState("Recordatorio de pago · Central Eyewear");
  const [cuerpo,      setCuerpo]      = React.useState("");
  const [filtroV,     setFiltroV]     = React.useState("todos");
  const [soloEmail,   setSoloEmail]   = React.useState(true);
  const [seleccion,   setSeleccion]   = React.useState(new Set());
  const [selAll,      setSelAll]      = React.useState(false);
  const [enviando,    setEnviando]    = React.useState(false);
  const [resultado,   setResultado]   = React.useState(null);
  const [paso,        setPaso]        = React.useState(1); // 1=configurar, 2=revisar

  const VCOL = {matias:"#c8844e",nicolas:"#62955c",miguel:"#7eaec4",mauro:"#a06ae8"};
  const VNOMS = {matias:"Matías",nicolas:"Nicolás",miguel:"Miguel",mauro:"Mauro",central:"Central"};

  // Filtrar clientes con email
  const candidatos = React.useMemo(()=>{
    let lista = soloEmail
      ? clientes.filter(c => c.email || c.mail)
      : clientes.filter(c => c.email || c.mail || c.whatsapp || c.telefono);
    if (filtroV!=="todos") lista=lista.filter(c=>c.vendedor===filtroV);
    return lista;
  },[clientes,filtroV,soloEmail]);

  React.useEffect(()=>{
    if(selAll) setSeleccion(new Set(candidatos.map(c=>c.airtableId)));
    else       setSeleccion(new Set());
  },[selAll,candidatos]);

  const toggle = id => setSeleccion(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});

  const selList = candidatos.filter(c=>seleccion.has(c.airtableId));

  const asuntosPorPlantilla = {
    recordatorio_pago:   "Recordatorio de pago · Central Eyewear",
    vencimiento_proximo: "Aviso de vencimiento · Central Eyewear",
    novedad_catalogo:    "Novedades de temporada · Central Eyewear",
    bienvenida:          "Bienvenido a Central Eyewear",
    libre:               "",
  };
  React.useEffect(()=>{ setAsunto(asuntosPorPlantilla[plantilla]||""); },[plantilla]);

  const enviar = async () => {
    if (!selList.length) return;
    setEnviando(true);
    setResultado(null);
    try {
      const destinatarios = selList.map(c=>({
        email: c.email,
        nombre: c.nombre,
        empresa: c.razonSocial||c.nombre,
      }));
      const r = await fetch("/api/send-email", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ destinatarios, asunto, plantilla, cuerpoTexto:cuerpo })
      });
      const d = await r.json();
      setResultado(d);
    } catch(e) {
      setResultado({ok:false,error:e.message});
    }
    setEnviando(false);
  };

  const conEmail    = clientes.filter(c=>c.email||c.mail).length;
  const conWA       = clientes.filter(c=>!c.email&&!c.mail&&(c.whatsapp||c.telefono)).length;
  const sinContacto = clientes.length - conEmail - conWA;

  return (
    <div style={{padding:"16px 16px 100px",background:"#06090d",minHeight:"100vh"}}>
      <div style={{marginBottom:20,marginTop:8}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:600,color:"#f2ede6",marginBottom:2}}>Email Blast</div>
        <div style={{fontSize:11,color:"#5a6878"}}>
          {conEmail} con email · {conWA} solo WhatsApp · {sinContacto} sin contacto
        </div>
      </div>

      {/* Pasos */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[{n:1,l:"Configurar"},{n:2,l:"Revisar y enviar"}].map(p=>(
          <button key={p.n} onClick={()=>setPaso(p.n)}
            style={{flex:1,background:paso===p.n?"#c8844e22":"#0c1118",
              border:`1.5px solid ${paso===p.n?"#c8844e":"#1e2c3a"}`,borderRadius:10,
              padding:"10px",color:paso===p.n?"#c8844e":"#5a6878",
              fontSize:12,fontWeight:700,fontFamily:"inherit"}}>
            {p.n}. {p.l}
          </button>
        ))}
      </div>

      {paso === 1 && (
        <div style={{animation:"fadeIn .2s ease"}}>
          {/* Plantilla */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:9,color:"#5a6878",textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:8}}>Plantilla</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {PLANTILLAS.map(p=>(
                <button key={p.id} onClick={()=>setPlantilla(p.id)}
                  style={{background:plantilla===p.id?"#111820":"#0c1118",
                    border:`1.5px solid ${plantilla===p.id?"#c8844e":"#1e2c3a"}`,borderRadius:12,
                    padding:"12px 14px",textAlign:"left",fontFamily:"inherit",
                    display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:plantilla===p.id?"#f2ede6":"#7a7670"}}>{p.label}</div>
                    <div style={{fontSize:11,color:"#3a4858",marginTop:2}}>{p.desc}</div>
                  </div>
                  <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${plantilla===p.id?"#c8844e":"#1e2c3a"}`,
                    background:plantilla===p.id?"#c8844e":"transparent",flexShrink:0,
                    display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {plantilla===p.id && <div style={{width:6,height:6,borderRadius:"50%",background:"#06090d"}}/>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Asunto */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:9,color:"#5a6878",textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:6}}>Asunto del mail</div>
            <input value={asunto} onChange={e=>setAsunto(e.target.value)} placeholder="Asunto..."/>
          </div>

          {/* Texto libre */}
          {(plantilla==="libre"||plantilla==="novedad_catalogo") && (
            <div style={{marginBottom:14}}>
              <div style={{fontSize:9,color:"#5a6878",textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:6}}>Mensaje</div>
              <textarea value={cuerpo} onChange={e=>setCuerpo(e.target.value)}
                rows={4} placeholder="Escribí tu mensaje aquí..." style={{resize:"vertical"}}/>
            </div>
          )}

          {/* Filtros */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:9,color:"#5a6878",textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:8}}>Filtrar destinatarios</div>
            <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
              {["todos","matias","nicolas","miguel","mauro"].map(v=>(
                <button key={v} onClick={()=>setFiltroV(v)}
                  style={{padding:"6px 13px",borderRadius:999,fontFamily:"inherit",
                    border:`1px solid ${filtroV===v?"#c8844e":"#1e2c3a"}`,
                    background:filtroV===v?"#c8844e22":"transparent",
                    color:filtroV===v?"#c8844e":"#5a6878",
                    fontSize:11,fontWeight:700}}>
                  {v==="todos"?"Todos":(VNOMS[v]||v)}
                </button>
              ))}
            </div>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
              <div onClick={()=>setSoloEmail(p=>!p)}
                style={{width:20,height:20,borderRadius:6,
                  border:`1.5px solid ${soloEmail?"#c8844e":"#1e2c3a"}`,
                  background:soloEmail?"#c8844e22":"transparent",
                  display:"flex",alignItems:"center",justifyContent:"center"}}>
                {soloEmail && <span style={{fontSize:12,color:"#c8844e"}}>✓</span>}
              </div>
              <span style={{fontSize:12,color:"#7a7670"}}>Solo clientes con email (para envío masivo)</span>
            </label>
          </div>

          <BtnPrimary full onClick={()=>setPaso(2)} disabled={!asunto.trim()}>
            Siguiente → revisar destinatarios
          </BtnPrimary>
        </div>
      )}

      {paso === 2 && (
        <div style={{animation:"fadeIn .2s ease"}}>
          {resultado ? (
            <div style={{background:resultado.ok?"#0a1a0e":"#1a0a0a",borderRadius:16,
              padding:"20px",border:`1px solid ${resultado.ok?"#62955c30":"#c0585030"}`,marginBottom:14,textAlign:"center"}}>
              <div style={{fontSize:28,marginBottom:10}}>{resultado.ok?"✅":"❌"}</div>
              {resultado.ok ? (
                <>
                  <div style={{fontSize:16,fontWeight:700,color:"#62955c",marginBottom:4}}>
                    {resultado.enviados} emails enviados
                  </div>
                  {resultado.errores>0 && <div style={{fontSize:12,color:"#c05850"}}>{resultado.errores} con error</div>}
                </>
              ) : (
                <>
                  <div style={{fontSize:14,fontWeight:700,color:"#c05850",marginBottom:8}}>Error al enviar</div>
                  <div style={{fontSize:12,color:"#7a7670"}}>{resultado.error}</div>
                  {resultado.error?.includes("RESEND_API_KEY") && (
                    <div style={{marginTop:12,fontSize:11,color:"#5a6878",background:"#111820",borderRadius:10,padding:"10px 12px",textAlign:"left"}}>
                      <strong style={{color:"#c8844e"}}>Cómo activar emails:</strong><br/>
                      1. Creá cuenta gratis en resend.com<br/>
                      2. Verificá tu dominio o usá su sandbox<br/>
                      3. Copiá la API Key<br/>
                      4. En Vercel → Settings → Env Vars → Agregar RESEND_API_KEY
                    </div>
                  )}
                </>
              )}
              <button onClick={()=>setResultado(null)}
                style={{marginTop:14,background:"#1e2c3a",border:"none",borderRadius:10,
                  padding:"10px 20px",color:"#c2bcb4",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>
                Nuevo envío
              </button>
            </div>
          ) : (
            <>
              {/* Resumen */}
              <div style={{background:"#0c1118",borderRadius:14,padding:"14px",border:"1px solid #1e2c3a",marginBottom:14}}>
                <div style={{fontSize:11,color:"#5a6878",marginBottom:8}}>Resumen del envío</div>
                <Row l="Plantilla"      v={PLANTILLAS.find(p=>p.id===plantilla)?.label}/>
                <Row l="Asunto"         v={asunto||"—"}/>
                <Row l="Vendedor"       v={filtroV==="todos"?"Todos":VNOMS[filtroV]||filtroV}/>
                <Row l="Candidatos"     v={`${candidatos.length} clientes`}/>
              </div>

              {/* Lista destinatarios */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{fontSize:9,color:"#5a6878",textTransform:"uppercase",letterSpacing:2,fontWeight:700}}>
                  Destinatarios · {seleccion.size} seleccionados
                </div>
                <button onClick={()=>setSelAll(p=>!p)}
                  style={{background:"none",border:"none",color:"#c8844e",fontSize:11,fontWeight:700,fontFamily:"inherit"}}>
                  {selAll?"Ninguno":"Todos"}
                </button>
              </div>
              <div style={{maxHeight:280,overflowY:"auto",marginBottom:14,borderRadius:12,border:"1px solid #1e2c3a",overflow:"hidden"}}>
                {candidatos.map((c,i)=>{
                  const sel = seleccion.has(c.airtableId);
                  const vc = VCOL[c.vendedor]||"#c8844e";
                  return (
                    <div key={i} onClick={()=>toggle(c.airtableId)}
                      style={{display:"flex",alignItems:"center",gap:10,
                        padding:"10px 12px",borderBottom:"1px solid #131d28",
                        background:sel?"#111820":"transparent",cursor:"pointer"}}>
                      <div style={{width:18,height:18,borderRadius:5,flexShrink:0,
                        border:`1.5px solid ${sel?"#c8844e":"#2a3848"}`,
                        background:sel?"#c8844e":"transparent",
                        display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {sel && <span style={{fontSize:11,color:"#06090d",fontWeight:900}}>✓</span>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:"#c2bcb4",
                          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                          {c.nombre?.split(" ").slice(0,3).join(" ")}
                        </div>
                        <div style={{fontSize:10,color:"#3a4858",marginTop:1,display:"flex",gap:6,alignItems:"center"}}>
                        {(c.email||c.mail)
                          ? <span style={{color:"#7eaec4"}}>✉ {c.email||c.mail}</span>
                          : <span style={{color:"#62955c"}}>💬 solo WhatsApp</span>
                        }
                      </div>
                      </div>
                      <span style={{fontSize:9,color:vc,fontWeight:700,flexShrink:0}}>{c.vendedor}</span>
                    </div>
                  );
                })}
              </div>

              <BtnPrimary full onClick={enviar} disabled={enviando||seleccion.size===0}
                icon={enviando?"⏳":"✉️"}>
                {enviando?`Enviando ${selList.length} mails...`:`Enviar a ${seleccion.size} clientes`}
              </BtnPrimary>
              <button onClick={()=>setPaso(1)}
                style={{width:"100%",marginTop:8,background:"transparent",border:"none",
                  color:"#3a4858",fontSize:12,fontFamily:"inherit",padding:"8px"}}>
                ← Volver a configurar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// ── COMUNICACIÓN ADM (Daniela) ───────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
const MATERIALES_KEY = "central_materiales_v2";
const DRIVE_LISTAS = "https://drive.google.com/drive/folders/1DZP6CLy1IFOPJJ1HSAwAFOyWOy-wtThb";
const MATERIALES_DEFAULT = [
  { id:"m1", nombre:"Listas de precios — temporada actual", tipo:"precio",   url:DRIVE_LISTAS, descripcion:"2 listas de precios mayoristas · Google Drive" },
  { id:"m2", nombre:"Catálogo general de marcos",           tipo:"catalogo", url:"",            descripcion:"Catálogo completo con imágenes y referencias" },
  { id:"m3", nombre:"Novedades de temporada",               tipo:"novedad",  url:"",            descripcion:"Imágenes de nuevos modelos disponibles" },
  { id:"m4", nombre:"Material de marketing para óptica",    tipo:"imagen",   url:"",            descripcion:"Pack de imágenes para redes sociales y vidriera" },
];
const MAT_ICO  = { precio:"💰", catalogo:"📋", novedad:"✨", imagen:"🖼", otro:"📄" };
const MAT_NOM  = { precio:"Lista de precios", catalogo:"Catálogo", novedad:"Novedades", imagen:"Imágenes", otro:"Otro" };
const MAT_COL  = { precio:"#c8844e", catalogo:"#7eaec4", novedad:"#a06ae8", imagen:"#62955c", otro:"#5a6878" };

function ComunicacionAdm({ clientes, session }) {
  const [vista,       setVista]       = React.useState("home"); // home | biblioteca | enviar | editar
  const [materiales,  setMateriales]  = React.useState(()=>{
    try { const s=localStorage.getItem(MATERIALES_KEY); return s?JSON.parse(s):MATERIALES_DEFAULT; }
    catch { return MATERIALES_DEFAULT; }
  });
  const [matSel,      setMatSel]      = React.useState(null); // material seleccionado para enviar
  const [editando,    setEditando]    = React.useState(null); // material en edición
  const [enviando,    setEnviando]    = React.useState(false);
  const [resultado,   setResultado]   = React.useState(null);
  const [seleccion,   setSeleccion]   = React.useState(new Set());
  const [filtroV,     setFiltroV]     = React.useState("todos");
  const [msgExtra,    setMsgExtra]    = React.useState("");

  const VCOL  = {matias:"#c8844e",nicolas:"#62955c",miguel:"#7eaec4",mauro:"#a06ae8",central:"#c8844e"};
  const VNOMS = {matias:"Matías",nicolas:"Nicolás",miguel:"Miguel",mauro:"Mauro",central:"Central"};

  const guardarMateriales = (nuevos) => {
    setMateriales(nuevos);
    try { localStorage.setItem(MATERIALES_KEY, JSON.stringify(nuevos)); } catch {}
  };

  const candidatos = React.useMemo(()=>{
    let l = clientes.filter(c => c.email || c.whatsapp || c.telefono || c.mail);
    if(filtroV!=="todos") l=l.filter(c=>c.vendedor===filtroV);
    return l;
  },[clientes,filtroV]);

  const toggle = id => setSeleccion(p=>{ const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  const selList = candidatos.filter(c=>seleccion.has(c.airtableId));

  const enviar = async () => {
    if (!selList.length || !matSel) return;
    setEnviando(true); setResultado(null);
    const plantillaHtml = generarHtmlMaterial(matSel, msgExtra);
    try {
      const r = await fetch("/api/send-email", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          destinatarios: selList.map(c=>({email:c.email,nombre:c.nombre,empresa:c.razonSocial||c.nombre})),
          asunto: `${matSel.nombre} · Central Eyewear`,
          cuerpoHtml: null, // se genera en el backend por plantilla
          plantilla: "material_comunicacion",
          materialNombre: matSel.nombre,
          materialUrl: matSel.url,
          materialDesc: matSel.descripcion,
          cuerpoTexto: msgExtra,
        })
      });
      const d = await r.json();
      setResultado(d);
    } catch(e) { setResultado({ok:false,error:e.message}); }
    setEnviando(false);
  };

  function generarHtmlMaterial(mat, extra) {
    const tc = MAT_COL[mat.tipo]||"#c8844e";
    return `<!-- preview --><b>${mat.nombre}</b><br>${mat.url?"Ver material: "+mat.url:""}`;
  }

  // ── VISTAS ───────────────────────────────────────────────────────────────

  if (vista === "editar" && editando) {
    const e = editando;
    const save = () => {
      const nuevos = materiales.map(m=>m.id===e.id?e:m);
      guardarMateriales(nuevos); setEditando(null); setVista("biblioteca");
    };
    return (
      <div style={{padding:"16px 16px 100px",background:"#06090d",minHeight:"100vh"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,marginTop:8}}>
          <button onClick={()=>setVista("biblioteca")}
            style={{background:"none",border:"none",color:"#5a6878",fontSize:20,padding:4}}>←</button>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#f2ede6"}}>
            Editar material
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <div style={{fontSize:9,color:"#5a6878",textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:6}}>Nombre</div>
            <input value={e.nombre} onChange={ev=>setEditando(p=>({...p,nombre:ev.target.value}))} placeholder="Nombre del material"/>
          </div>
          <div>
            <div style={{fontSize:9,color:"#5a6878",textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:6}}>Tipo</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {Object.entries(MAT_NOM).map(([k,v])=>(
                <button key={k} onClick={()=>setEditando(p=>({...p,tipo:k}))}
                  style={{padding:"6px 13px",borderRadius:999,fontFamily:"inherit",
                    border:`1px solid ${e.tipo===k?MAT_COL[k]:"#1e2c3a"}`,
                    background:e.tipo===k?MAT_COL[k]+"22":"transparent",
                    color:e.tipo===k?MAT_COL[k]:"#5a6878",fontSize:11,fontWeight:700}}>
                  {MAT_ICO[k]} {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:9,color:"#5a6878",textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:6}}>
              Link del archivo
            </div>
            <input value={e.url} onChange={ev=>setEditando(p=>({...p,url:ev.target.value}))}
              placeholder="https://drive.google.com/... o Dropbox, etc."/>
            <div style={{fontSize:10,color:"#3a4858",marginTop:6}}>
              Pegá el link de Google Drive, Dropbox o donde guardes el archivo. Asegurate que sea accesible para cualquiera con el link.
            </div>
          </div>
          <div>
            <div style={{fontSize:9,color:"#5a6878",textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:6}}>Descripción</div>
            <textarea value={e.descripcion} onChange={ev=>setEditando(p=>({...p,descripcion:ev.target.value}))}
              rows={2} placeholder="Descripción breve para el email..." style={{resize:"none"}}/>
          </div>
          <BtnPrimary full onClick={save}>Guardar</BtnPrimary>
        </div>
      </div>
    );
  }

  if (vista === "enviar" && matSel) {
    const tc = MAT_COL[matSel.tipo]||"#c8844e";
    return (
      <div style={{padding:"16px 16px 100px",background:"#06090d",minHeight:"100vh"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,marginTop:8}}>
          <button onClick={()=>{setVista("home");setResultado(null);}}
            style={{background:"none",border:"none",color:"#5a6878",fontSize:20,padding:4}}>←</button>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#f2ede6"}}>
            Enviar material
          </div>
        </div>

        {/* Material seleccionado */}
        <div style={{background:"#0c1118",borderRadius:14,padding:"14px",border:`1px solid ${tc}30`,marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:10,background:tc+"18",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
              {MAT_ICO[matSel.tipo]||"📄"}
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#f2ede6"}}>{matSel.nombre}</div>
              <div style={{fontSize:11,color:"#5a6878",marginTop:2}}>{matSel.descripcion}</div>
            </div>
          </div>
          {!matSel.url && (
            <div style={{marginTop:10,fontSize:11,color:"#c8844e",background:"#1a1208",
              borderRadius:8,padding:"8px 10px"}}>
              ⚠️ Este material no tiene link. Editalo primero desde la biblioteca.
            </div>
          )}
        </div>

        {resultado ? (
          <div style={{background:resultado.ok?"#0a1a0e":"#1a0a0a",borderRadius:16,
            padding:"24px 16px",border:`1px solid ${resultado.ok?"#62955c30":"#c0585030"}`,textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:10}}>{resultado.ok?"✅":"❌"}</div>
            {resultado.ok ? (
              <div style={{fontSize:16,fontWeight:700,color:"#62955c"}}>{resultado.enviados} emails enviados</div>
            ) : (
              <>
                <div style={{fontSize:14,fontWeight:700,color:"#c05850",marginBottom:8}}>Error</div>
                <div style={{fontSize:12,color:"#7a7670"}}>{resultado.error}</div>
                {resultado.error?.includes("RESEND_API_KEY") && (
                  <div style={{marginTop:12,fontSize:11,color:"#5a6878",background:"#111820",borderRadius:10,padding:"10px 12px",textAlign:"left"}}>
                    <strong style={{color:"#c8844e"}}>Para activar emails:</strong><br/>
                    1. resend.com → crear cuenta gratis<br/>
                    2. Verificar dominio<br/>
                    3. Vercel → Env Vars → RESEND_API_KEY
                  </div>
                )}
              </>
            )}
            <button onClick={()=>{setVista("home");setResultado(null);setSeleccion(new Set());}}
              style={{marginTop:14,background:"#1e2c3a",border:"none",borderRadius:10,
                padding:"10px 20px",color:"#c2bcb4",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>
              Volver
            </button>
          </div>
        ) : (
          <>
            {/* Mensaje adicional */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:9,color:"#5a6878",textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:6}}>
                Mensaje adicional (opcional)
              </div>
              <textarea value={msgExtra} onChange={e=>setMsgExtra(e.target.value)}
                rows={3} placeholder="Ej: Cualquier consulta estamos disponibles..." style={{resize:"none"}}/>
            </div>

            {/* Filtro vendedor */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:9,color:"#5a6878",textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:8}}>
                Filtrar por vendedor
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["todos","matias","nicolas","miguel","mauro"].map(v=>(
                  <button key={v} onClick={()=>{setFiltroV(v);setSeleccion(new Set());}}
                    style={{padding:"6px 12px",borderRadius:999,fontFamily:"inherit",
                      border:`1px solid ${filtroV===v?"#c8844e":"#1e2c3a"}`,
                      background:filtroV===v?"#c8844e22":"transparent",
                      color:filtroV===v?"#c8844e":"#5a6878",fontSize:11,fontWeight:700}}>
                    {v==="todos"?"Todos":(VNOMS[v]||v)}
                  </button>
                ))}
              </div>
            </div>

            {/* Selección clientes */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:9,color:"#5a6878",textTransform:"uppercase",letterSpacing:2,fontWeight:700}}>
                Destinatarios · {seleccion.size} / {candidatos.length}
              </div>
              <button onClick={()=>{
                if(seleccion.size===candidatos.length) setSeleccion(new Set());
                else setSeleccion(new Set(candidatos.map(c=>c.airtableId)));
              }} style={{background:"none",border:"none",color:"#c8844e",fontSize:11,fontWeight:700,fontFamily:"inherit"}}>
                {seleccion.size===candidatos.length?"Ninguno":"Todos"}
              </button>
            </div>
            <div style={{maxHeight:260,overflowY:"auto",borderRadius:12,border:"1px solid #1e2c3a",overflow:"hidden",marginBottom:14}}>
              {candidatos.map((c,i)=>{
                const sel = seleccion.has(c.airtableId);
                const vc = VCOL[c.vendedor]||"#c8844e";
                return (
                  <div key={i} onClick={()=>toggle(c.airtableId)}
                    style={{display:"flex",alignItems:"center",gap:10,
                      padding:"10px 12px",borderBottom:"1px solid #131d28",
                      background:sel?"#111820":"transparent",cursor:"pointer"}}>
                    <div style={{width:18,height:18,borderRadius:5,flexShrink:0,
                      border:`1.5px solid ${sel?"#c8844e":"#2a3848"}`,
                      background:sel?"#c8844e":"transparent",
                      display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {sel && <span style={{fontSize:11,color:"#06090d",fontWeight:900}}>✓</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#c2bcb4",
                        whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        {c.nombre?.split(" ").slice(0,3).join(" ")}
                      </div>
                      <div style={{fontSize:10,color:"#3a4858",display:"flex",gap:6,alignItems:"center"}}>
                        {(c.email||c.mail)
                          ? <span style={{color:"#7eaec4"}}>✉ {c.email||c.mail}</span>
                          : <span style={{color:"#62955c"}}>💬 WhatsApp</span>
                        }
                      </div>
                    </div>
                    <span style={{fontSize:9,color:vc,fontWeight:700,flexShrink:0}}>{c.vendedor}</span>
                  </div>
                );
              })}
            </div>

            <BtnPrimary full icon={enviando?"⏳":"📤"}
              onClick={enviar}
              disabled={enviando||seleccion.size===0||!matSel.url}>
              {enviando?`Enviando ${selList.length} mails...`:`Enviar a ${seleccion.size} clientes`}
            </BtnPrimary>
            {!matSel.url && (
              <div style={{fontSize:11,color:"#c05850",textAlign:"center",marginTop:8}}>
                Agregá el link del archivo antes de enviar
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  if (vista === "biblioteca") {
    return (
      <div style={{padding:"16px 16px 100px",background:"#06090d",minHeight:"100vh"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,marginTop:8}}>
          <button onClick={()=>setVista("home")}
            style={{background:"none",border:"none",color:"#5a6878",fontSize:20,padding:4}}>←</button>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#f2ede6"}}>
            Biblioteca de materiales
          </div>
        </div>

        {materiales.map((m,i)=>{
          const tc = MAT_COL[m.tipo]||"#c8844e";
          return (
            <div key={i} style={{background:"#0c1118",borderRadius:14,padding:"14px 16px",
              border:"1px solid #1e2c3a",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:m.url?8:0}}>
                <div style={{width:38,height:38,borderRadius:10,background:tc+"18",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:18,flexShrink:0}}>{MAT_ICO[m.tipo]||"📄"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#f2ede6",marginBottom:2}}>
                    {m.nombre}
                  </div>
                  <div style={{fontSize:10,color:"#5a6878"}}>{m.descripcion}</div>
                  {m.url ? (
                    <div style={{fontSize:10,color:tc,marginTop:4,display:"flex",alignItems:"center",gap:4}}>
                      <span>🔗</span>
                      <span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:200}}>
                        {m.url}
                      </span>
                    </div>
                  ) : (
                    <div style={{fontSize:10,color:"#c05850",marginTop:4}}>⚠️ Sin link — tocá para agregar</div>
                  )}
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:10}}>
                <button onClick={()=>{setEditando({...m});setVista("editar");}}
                  style={{flex:1,background:"#111820",border:"1px solid #1e2c3a",borderRadius:9,
                    padding:"9px",color:"#c2bcb4",fontSize:11,fontWeight:700,fontFamily:"inherit"}}>
                  ✏️ Editar link
                </button>
                <button onClick={()=>{setMatSel(m);setVista("enviar");}}
                  style={{flex:1,background:tc+"18",border:`1px solid ${tc}44`,borderRadius:9,
                    padding:"9px",color:tc,fontSize:11,fontWeight:700,fontFamily:"inherit"}}>
                  📤 Enviar
                </button>
              </div>
            </div>
          );
        })}

        {/* Agregar nuevo material */}
        <button onClick={()=>{
          const nuevo = {id:`m${Date.now()}`,nombre:"Nuevo material",tipo:"otro",url:"",descripcion:""};
          guardarMateriales([...materiales,nuevo]);
          setEditando(nuevo);setVista("editar");
        }} style={{width:"100%",background:"#0c1118",border:"1.5px dashed #1e2c3a",borderRadius:14,
          padding:"16px",color:"#3a4858",fontSize:13,fontWeight:700,fontFamily:"inherit",
          display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:4}}>
          + Agregar material
        </button>
      </div>
    );
  }

  // ── HOME ──────────────────────────────────────────────────────────────────
  const conEmail = clientes.filter(c=>c.email).length;
  return (
    <div style={{padding:"16px 16px 100px",background:"#06090d",minHeight:"100vh"}}>
      <div style={{marginBottom:20,marginTop:8}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:600,color:"#f2ede6",marginBottom:2}}>
          Comunicación
        </div>
        <div style={{fontSize:11,color:"#5a6878"}}>
          {clientes.length} clientes · {clientes.filter(c=>c.email||c.mail).length} con email · {clientes.filter(c=>!c.email&&!c.mail&&(c.whatsapp||c.telefono)).length} solo WhatsApp
        </div>
      </div>

      {/* Acceso rápido a materiales */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:9,color:"#5a6878",textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:10}}>
          Envío rápido
        </div>
        {materiales.map((m,i)=>{
          const tc = MAT_COL[m.tipo]||"#c8844e";
          return (
            <button key={i} onClick={()=>{setMatSel(m);setVista("enviar");}}
              style={{width:"100%",background:"#0c1118",border:"1px solid #1e2c3a",borderRadius:14,
                padding:"14px 16px",marginBottom:8,textAlign:"left",fontFamily:"inherit",
                display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:11,background:tc+"18",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                {MAT_ICO[m.tipo]||"📄"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:"#f2ede6",
                  whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {m.nombre}
                </div>
                <div style={{fontSize:10,marginTop:2,display:"flex",alignItems:"center",gap:4}}>
                  <span style={{color:tc,fontWeight:700}}>{MAT_NOM[m.tipo]||"Material"}</span>
                  {!m.url && <span style={{color:"#c05850"}}>· sin link</span>}
                </div>
              </div>
              <span style={{color:"#3a4858",fontSize:18,flexShrink:0}}>›</span>
            </button>
          );
        })}
      </div>

      {/* Ir a biblioteca */}
      <button onClick={()=>setVista("biblioteca")}
        style={{width:"100%",background:"#111820",border:"1.5px solid #1e2c3a",borderRadius:14,
          padding:"14px",color:"#c2bcb4",fontSize:13,fontWeight:700,fontFamily:"inherit",
          display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        📁 Administrar biblioteca de materiales
      </button>

      {/* Info sobre emails faltantes */}
      {clientes.filter(c=>!c.email&&!c.mail&&!c.whatsapp&&!c.telefono).length > 0 && (
        <div style={{marginTop:14,background:"#0c1118",borderRadius:12,padding:"12px 14px",
          border:"1px solid #c8844e22"}}>
          <div style={{fontSize:11,color:"#c8844e",fontWeight:700,marginBottom:4}}>
            ⚠️ {clientes.filter(c=>!c.email&&!c.mail&&!c.whatsapp&&!c.telefono).length} clientes sin ningún contacto
          </div>
          <div style={{fontSize:11,color:"#5a6878"}}>
            Pedile al vendedor que complete email o WhatsApp en la ficha del cliente.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RENDER ───────────────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
