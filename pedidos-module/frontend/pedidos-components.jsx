/* ============================================================
   MÓDULO NOTA DE PEDIDO DIGITAL — componentes para app.jsx
   Pegar este bloque completo en public/app.jsx ANTES del componente App.
   Sigue las convenciones del repo: un solo archivo, sin build, React global.

   INTEGRACIÓN EN App (ver notas al final del archivo):
   1) estado:  const [pedidoCtx, setPedidoCtx] = useState(null);
   2) render:  vista==="pedido" → <NuevoPedidoDigital .../>
               vista==="pedidos" → <ListaPedidos .../>
   3) HomeVendedor: botón primario "Nuevo Pedido" → setVista("pedido")
   4) DetalleCliente tab Pedidos: botón → setPedidoCtx({cliente: sel}); setVista("pedido")
   ============================================================ */

const PED_API = "/api";
const PED_CACHE_KEY = "ce_articulos_cache";
const PED_WIP_KEY = "ce_pedido_wip";
const PED_CACHE_MIN = 10;

const pedPeso = (n) => "$ " + Math.round(n || 0).toLocaleString("es-AR");

// --- catálogo con cache en localStorage ---
function useCatalogo() {
  const [cat, setCat] = React.useState(null);
  const [err, setErr] = React.useState(null);
  const cargar = React.useCallback((force) => {
    try {
      if (!force) {
        const raw = localStorage.getItem(PED_CACHE_KEY);
        if (raw) {
          const c = JSON.parse(raw);
          if (Date.now() - c.ts < PED_CACHE_MIN * 60000) { setCat(c.data); return; }
        }
      }
    } catch (e) {}
    fetch(PED_API + "/articulos")
      .then((r) => { if (!r.ok) throw new Error("Error " + r.status); return r.json(); })
      .then((data) => {
        setCat(data);
        try { localStorage.setItem(PED_CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch (e) {}
      })
      .catch((e) => setErr(String(e.message || e)));
  }, []);
  React.useEffect(() => { cargar(false); }, [cargar]);
  return { cat, err, recargar: () => cargar(true) };
}

// --- resolución de lista de precios: override cliente → provincia → default ---
function resolverLista(cliente, config) {
  if (!config) return 1;
  if (cliente) {
    const ov = cliente.listaPrecio || (cliente.crm && cliente.crm.listaPrecio);
    if (ov === 1 || ov === 2) return ov;
    const prov = String(cliente.provincia || "").toUpperCase().trim();
    if (prov && config.listaProvincia && config.listaProvincia[prov]) return config.listaProvincia[prov];
  }
  return config.listaDefault || 1;
}
const precioDe = (art, lista) => (lista === 2 ? art.precio2 : art.precio1);

const COND_VENTA_OPCIONES = ["Contado", "30", "30-60", "30-60-90", "60-90-120"];

/* ============ Wizard principal ============ */
function NuevoPedidoDigital({ session, clientes, pedidoCtx, onClose, onAbrirNuevaOptica }) {
  const { cat, err, recargar } = useCatalogo();
  const draft = pedidoCtx && pedidoCtx.draft;
  const [paso, setPaso] = React.useState(1); // 1 artículos · 2 cliente · 3 revisión · 4 envío
  const [items, setItems] = React.useState(draft ? draft.items : []);
  const [cliente, setCliente] = React.useState(
    (pedidoCtx && pedidoCtx.cliente) ||
    (draft && clientes.find((c) => c.airtableId === draft.clienteRecordId)) || null
  );
  const [condVenta, setCondVenta] = React.useState(draft ? draft.condVenta : "");
  const [obs, setObs] = React.useState(draft ? draft.observaciones : "");
  const [recordId, setRecordId] = React.useState(draft ? draft.recordId : null);
  const [busca, setBusca] = React.useState("");
  const [abierto, setAbierto] = React.useState(null); // modelo expandido
  const [colorSel, setColorSel] = React.useState("");
  const [cant, setCant] = React.useState(1);
  const [buscaCli, setBuscaCli] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const [errEnvio, setErrEnvio] = React.useState(null);
  const [exito, setExito] = React.useState(null);
  const [preguntaCopia, setPreguntaCopia] = React.useState(false);
  const [copiaCliente, setCopiaCliente] = React.useState(null); // null=sin responder
  const [emailCliente, setEmailCliente] = React.useState("");
  const [avisoLista, setAvisoLista] = React.useState(null);

  const config = cat && cat.config;
  const lista = resolverLista(cliente, config);
  const unidades = items.reduce((a, i) => a + i.cantidad, 0);
  const total = items.reduce((a, i) => a + i.cantidad * i.precioUnitario, 0);

  // espejo anti-cierre en localStorage
  React.useEffect(() => {
    if (!items.length && !cliente) return;
    try {
      localStorage.setItem(PED_WIP_KEY, JSON.stringify({
        items, clienteId: cliente && cliente.airtableId, condVenta, obs, recordId, ts: Date.now(),
      }));
    } catch (e) {}
  }, [items, cliente, condVenta, obs, recordId]);
  const limpiarWip = () => { try { localStorage.removeItem(PED_WIP_KEY); } catch (e) {} };

  // al cambiar cliente, repricear si cambia la lista
  const elegirCliente = (c) => {
    const nueva = resolverLista(c, config);
    if (items.length && nueva !== lista) {
      const porModelo = {};
      (cat.articulos || []).forEach((a) => { porModelo[a.modelo] = a; });
      setItems(items.map((it) => {
        const art = porModelo[it.modelo];
        return art ? { ...it, precioUnitario: precioDe(art, nueva) } : it;
      }));
      setAvisoLista("Precios actualizados a Lista " + nueva);
      setTimeout(() => setAvisoLista(null), 4000);
    }
    setCliente(c);
    setPaso(3);
  };

  const agregarItem = (art) => {
    if (!colorSel) return;
    const idx = items.findIndex((i) => i.modelo === art.modelo && i.color === colorSel);
    if (idx >= 0) {
      const copia = items.slice();
      copia[idx] = { ...copia[idx], cantidad: copia[idx].cantidad + cant };
      setItems(copia);
    } else {
      setItems(items.concat([{
        modelo: art.modelo, linea: art.linea, color: colorSel,
        cantidad: cant, precioUnitario: precioDe(art, lista),
      }]));
    }
    setAbierto(null); setColorSel(""); setCant(1); setBusca("");
  };

  const guardarBorrador = async (silencioso) => {
    const body = {
      vendedor: session.user, cliente: cliente ? cliente.nombre : "",
      clienteRecordId: cliente ? cliente.airtableId : "",
      items, listaPrecio: lista, condVenta, observaciones: obs,
    };
    try {
      if (recordId) {
        await fetch(PED_API + "/pedidos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recordId, ...body }) });
      } else {
        const r = await fetch(PED_API + "/pedidos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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
      // asegurar que exista el registro y esté al día
      let rid = recordId;
      if (!rid) {
        const r = await fetch(PED_API + "/pedidos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          vendedor: session.user, cliente: cliente.nombre, clienteRecordId: cliente.airtableId,
          items, listaPrecio: lista, condVenta, observaciones: obs }) });
        rid = (await r.json()).recordId; setRecordId(rid);
      } else {
        await fetch(PED_API + "/pedidos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
          recordId: rid, items, cliente: cliente.nombre, clienteRecordId: cliente.airtableId,
          listaPrecio: lista, condVenta, observaciones: obs }) });
      }
      const r = await fetch(PED_API + "/pedidos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        action: "enviar", recordId: rid,
        copiaCliente: !!copiaCliente, emailCliente, guardarEmailCliente: copiaCliente && !cliente.mail,
        vendedorNombre: session.nombre, confirmarPrecios: !!confirmarPrecios,
        clienteInfo: {
          domicilio: [cliente.calle, cliente.numero].filter(Boolean).join(" ") || cliente.domicilio || "",
          localidad: cliente.ciudad || cliente.localidad || "", provincia: cliente.provincia || "",
          cuit: cliente.cuit || "", condicionIva: cliente.condicionIva || "", telefono: cliente.telefono || "",
        },
      }) });
      const j = await r.json();
      if (r.status === 409 && j.priceChanges) {
        const det = j.priceChanges.map((c) => `${c.modelo} ${c.color}: ${pedPeso(c.anterior)} → ${pedPeso(c.vigente)}`).join("\n");
        if (confirm("Algunos precios cambiaron desde que armaste el pedido:\n\n" + det + "\n\n¿Enviar con los precios vigentes?")) return enviar(true);
        setEnviando(false); return;
      }
      if (!r.ok) throw new Error(j.error || "Error " + r.status);
      limpiarWip(); setExito(j);
    } catch (e) { setErrEnvio(String(e.message || e)); }
    setEnviando(false);
  };

  /* ---------- estilos base (coherentes con el shell del CRM) ---------- */
  const S = {
    wrap: { maxWidth: 560, margin: "0 auto", padding: "12px 14px 120px" },
    top: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    titulo: { fontSize: 19, fontWeight: 800, letterSpacing: 0.3 },
    cerrar: { border: "none", background: "#eee", borderRadius: 10, padding: "8px 14px", fontSize: 14, fontWeight: 600 },
    input: { width: "100%", padding: "13px 14px", fontSize: 16, borderRadius: 12, border: "1.5px solid #ddd", boxSizing: "border-box" },
    card: { background: "#fff", border: "1px solid #e6e6e6", borderRadius: 14, padding: "13px 14px", marginBottom: 8 },
    chip: (on) => ({ display: "inline-block", padding: "10px 16px", margin: "4px 6px 4px 0", borderRadius: 999, fontSize: 15, fontWeight: 700, border: on ? "2px solid #111" : "1.5px solid #ccc", background: on ? "#111" : "#fff", color: on ? "#fff" : "#111" }),
    btnP: { width: "100%", padding: "15px", fontSize: 16.5, fontWeight: 800, borderRadius: 13, border: "none", background: "#111", color: "#fff" },
    btnS: { width: "100%", padding: "14px", fontSize: 15.5, fontWeight: 700, borderRadius: 13, border: "1.5px solid #111", background: "#fff", color: "#111" },
    barra: { position: "fixed", left: 0, right: 0, bottom: 0, background: "#111", color: "#fff", padding: "13px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 60 },
    stepper: { display: "flex", alignItems: "center", gap: 12 },
    stepBtn: { width: 44, height: 44, borderRadius: 12, fontSize: 22, fontWeight: 800, border: "1.5px solid #ccc", background: "#fff" },
  };

  if (exito) return (
    <div style={S.wrap}>
      <div style={{ textAlign: "center", paddingTop: 60 }}>
        <div style={{ fontSize: 54 }}>✅</div>
        <h2 style={{ fontSize: 24, margin: "12px 0 6px" }}>Pedido {exito.pedidoId} enviado</h2>
        <p style={{ color: "#555", fontSize: 16 }}>{exito.unidades} unidades · {pedPeso(exito.total)}</p>
        <p style={{ color: "#555", fontSize: 14.5 }}>Enviado a {exito.emailedTo.join(" y ")}</p>
        {(exito.warnings || []).map((w, i) => <p key={i} style={{ color: "#b26a00", fontSize: 13.5 }}>⚠️ {w}</p>)}
        <button style={{ ...S.btnP, marginTop: 24 }} onClick={() => onClose("enviado")}>Listo</button>
      </div>
    </div>
  );

  const cabecera = (titulo, atras) => (
    <div style={S.top}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {atras && <button style={S.cerrar} onClick={atras}>←</button>}
        <span style={S.titulo}>{titulo}</span>
      </div>
      <button style={S.cerrar} onClick={async () => {
        if (items.length && !(await guardarBorrador(true))) { if (!confirm("No se pudo guardar el borrador. ¿Salir igual?")) return; }
        else limpiarWip();
        onClose(items.length ? "borrador" : null);
      }}>✕</button>
    </div>
  );

  /* ---------- paso 1: artículos ---------- */
  if (paso === 1) {
    if (err) return <div style={S.wrap}>{cabecera("Nuevo Pedido")}<div style={S.card}>Error cargando catálogo: {err} <button style={{ ...S.btnS, marginTop: 10 }} onClick={recargar}>Reintentar</button></div></div>;
    if (!cat) return <div style={S.wrap}>{cabecera("Nuevo Pedido")}<div style={{ textAlign: "center", padding: 50, color: "#888" }}>Cargando catálogo…</div></div>;
    const q = busca.toUpperCase().trim();
    const arts = (cat.articulos || []).filter((a) => !q || a.modelo.includes(q) || a.linea.toUpperCase().includes(q));
    return (
      <div style={S.wrap}>
        {cabecera("Nuevo Pedido")}
        {avisoLista && <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 10, padding: "9px 12px", marginBottom: 8, fontSize: 14 }}>{avisoLista}</div>}
        <div style={{ position: "sticky", top: 0, background: "#fafafa", paddingBottom: 8, zIndex: 40 }}>
          <input style={S.input} placeholder="Buscar modelo o línea…" value={busca} autoFocus
            onChange={(e) => { setBusca(e.target.value); setAbierto(null); }} />
          {cliente && <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>Cliente: <b>{cliente.nombre}</b> · Lista {lista}</div>}
        </div>
        {arts.slice(0, 40).map((a) => (
          <div key={a.modelo} style={S.card} onClick={() => { if (abierto !== a.modelo) { setAbierto(a.modelo); setColorSel(""); setCant(1); } }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div><span style={{ fontSize: 17, fontWeight: 800 }}>{a.modelo}</span>
                <span style={{ fontSize: 13, color: "#888", marginLeft: 8 }}>{a.linea}</span></div>
              <span style={{ fontSize: 15.5, fontWeight: 700 }}>{pedPeso(precioDe(a, lista))}</span>
            </div>
            {abierto === a.modelo && (
              <div style={{ marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
                <div>{a.colores.map((c) => <button key={c} style={S.chip(colorSel === c)} onClick={() => setColorSel(c)}>{c}</button>)}</div>
                <div style={{ ...S.stepper, marginTop: 10 }}>
                  <button style={S.stepBtn} onClick={() => setCant(Math.max(1, cant - 1))}>−</button>
                  <input type="number" min="1" value={cant} onChange={(e) => setCant(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: 64, textAlign: "center", fontSize: 19, fontWeight: 800, padding: "9px 0", borderRadius: 10, border: "1.5px solid #ccc" }} />
                  <button style={S.stepBtn} onClick={() => setCant(cant + 1)}>+</button>
                  <button style={{ ...S.btnP, width: "auto", flex: 1, padding: "12px", opacity: colorSel ? 1 : 0.4 }}
                    disabled={!colorSel} onClick={() => agregarItem(a)}>Agregar</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {arts.length === 0 && <div style={{ textAlign: "center", color: "#888", padding: 30 }}>Sin resultados para “{busca}”</div>}
        <div style={S.barra}>
          <span style={{ fontSize: 15 }}><b>{unidades}</b> unid. · <b>{pedPeso(total)}</b></span>
          <button style={{ background: "#fff", color: "#111", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 15, fontWeight: 800, opacity: items.length ? 1 : 0.4 }}
            disabled={!items.length} onClick={() => setPaso(cliente ? 3 : 2)}>
            {cliente ? "Revisar →" : "Elegir cliente →"}
          </button>
        </div>
      </div>
    );
  }

  /* ---------- paso 2: cliente ---------- */
  if (paso === 2) {
    const q = buscaCli.toUpperCase().trim();
    const propios = (clientes || []).filter((c) => !q || String(c.nombre || "").toUpperCase().includes(q));
    return (
      <div style={S.wrap}>
        {cabecera("¿Para qué cliente?", () => setPaso(1))}
        <input style={{ ...S.input, marginBottom: 10 }} placeholder="Buscar en tu cartera…" value={buscaCli} autoFocus onChange={(e) => setBuscaCli(e.target.value)} />
        <button style={{ ...S.btnS, marginBottom: 10 }} onClick={() => onAbrirNuevaOptica && onAbrirNuevaOptica((nuevo) => elegirCliente(nuevo))}>+ Nueva óptica</button>
        {propios.slice(0, 30).map((c) => (
          <div key={c.airtableId} style={S.card} onClick={() => elegirCliente(c)}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{c.nombre}</div>
            <div style={{ fontSize: 13, color: "#888" }}>{[c.ciudad || c.localidad, c.provincia].filter(Boolean).join(" · ")} · Lista {resolverLista(c, config)}</div>
          </div>
        ))}
      </div>
    );
  }

  /* ---------- paso 3: revisión ---------- */
  return (
    <div style={S.wrap}>
      {cabecera("Revisar pedido", () => setPaso(1))}
      <div style={{ ...S.card, background: "#fafafa" }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>{cliente ? cliente.nombre : "Sin cliente"}</div>
        <div style={{ fontSize: 13, color: "#888" }}>Lista {lista} · <a style={{ color: "#555" }} onClick={() => setPaso(2)}>cambiar cliente</a></div>
      </div>
      {items.map((it, i) => (
        <div key={i} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: 15.5 }}>{it.modelo}</span>
            <span style={{ color: "#888", fontSize: 13, marginLeft: 6 }}>{it.linea} · {it.color}</span>
            <div style={{ fontSize: 13.5, color: "#555" }}>{it.cantidad} × {pedPeso(it.precioUnitario)} = <b>{pedPeso(it.cantidad * it.precioUnitario)}</b></div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button style={{ ...S.stepBtn, width: 36, height: 36, fontSize: 18 }} onClick={() => {
              const c = items.slice();
              if (c[i].cantidad > 1) { c[i] = { ...c[i], cantidad: c[i].cantidad - 1 }; setItems(c); }
              else setItems(items.filter((_, j) => j !== i));
            }}>−</button>
            <button style={{ ...S.stepBtn, width: 36, height: 36, fontSize: 18 }} onClick={() => {
              const c = items.slice(); c[i] = { ...c[i], cantidad: c[i].cantidad + 1 }; setItems(c);
            }}>+</button>
            <button style={{ border: "none", background: "none", fontSize: 18, color: "#c62828" }} onClick={() => setItems(items.filter((_, j) => j !== i))}>🗑</button>
          </div>
        </div>
      ))}
      <button style={{ ...S.btnS, marginBottom: 12 }} onClick={() => setPaso(1)}>+ Agregar más artículos</button>
      <div style={S.card}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#666", marginBottom: 6 }}>Condiciones de venta</div>
        <div>{COND_VENTA_OPCIONES.map((o) => <button key={o} style={S.chip(condVenta === o)} onClick={() => setCondVenta(condVenta === o ? "" : o)}>{o}</button>)}</div>
      </div>
      <textarea style={{ ...S.input, minHeight: 70, marginBottom: 10 }} placeholder="Observaciones (opcional)" value={obs} onChange={(e) => setObs(e.target.value)} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, margin: "6px 2px 14px" }}>
        <span>{unidades} unidades</span><b style={{ fontSize: 20 }}>{pedPeso(total)}</b>
      </div>
      {errEnvio && <div style={{ background: "#ffebee", border: "1px solid #ef9a9a", borderRadius: 10, padding: "10px 12px", marginBottom: 10, fontSize: 14 }}>No se pudo enviar: {errEnvio}. El pedido quedó como borrador — probá de nuevo.</div>}
      {!preguntaCopia ? (
        <div style={{ display: "grid", gap: 8 }}>
          <button style={S.btnP} disabled={!items.length || !cliente} onClick={() => { setPreguntaCopia(true); setEmailCliente((cliente && cliente.mail) || ""); }}>
            Enviar pedido
          </button>
          <button style={S.btnS} onClick={() => guardarBorrador(false)}>Guardar borrador</button>
        </div>
      ) : (
        <div style={S.card}>
          <div style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 8 }}>¿Enviarle una copia al cliente?</div>
          {copiaCliente == null && <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.btnS, flex: 1 }} onClick={() => setCopiaCliente(false)}>No</button>
            <button style={{ ...S.btnP, flex: 1 }} onClick={() => setCopiaCliente(true)}>Sí</button>
          </div>}
          {copiaCliente === true && (
            <input style={{ ...S.input, marginTop: 8 }} type="email" placeholder="Mail del cliente" value={emailCliente}
              onChange={(e) => setEmailCliente(e.target.value)} autoFocus={!emailCliente} />
          )}
          {copiaCliente === true && !((cliente && cliente.mail)) && emailCliente &&
            <div style={{ fontSize: 12.5, color: "#888", marginTop: 4 }}>Se guardará en la ficha del cliente</div>}
          {copiaCliente != null && (
            <button style={{ ...S.btnP, marginTop: 10, opacity: enviando ? 0.6 : 1 }} disabled={enviando || (copiaCliente && !/\S+@\S+\.\S+/.test(emailCliente))}
              onClick={() => enviar(false)}>
              {enviando ? "Generando PDF y enviando…" : "Confirmar y enviar"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ============ Lista de pedidos del vendedor ============ */
function ListaPedidos({ session, onAbrirBorrador, onClose }) {
  const [pedidos, setPedidos] = React.useState(null);
  React.useEffect(() => {
    const q = session.role === "admin" ? "" : "?vendedor=" + encodeURIComponent(session.user);
    fetch(PED_API + "/pedidos" + q).then((r) => r.json()).then((j) => setPedidos(j.pedidos || [])).catch(() => setPedidos([]));
  }, []);
  const S = { card: { background: "#fff", border: "1px solid #e6e6e6", borderRadius: 14, padding: "13px 14px", marginBottom: 8 } };
  const grupo = (titulo, arr, esBorrador) => arr.length > 0 && (
    <div key={titulo}>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: "#888", margin: "14px 2px 8px", textTransform: "uppercase" }}>{titulo}</div>
      {arr.map((p) => (
        <div key={p.recordId} style={S.card} onClick={() => esBorrador && onAbrirBorrador(p)}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b style={{ fontSize: 15.5 }}>{p.cliente || "(sin cliente)"}</b>
            <b>{pedPeso(p.total)}</b>
          </div>
          <div style={{ fontSize: 13, color: "#888" }}>
            {p.pedidoId ? p.pedidoId + " · " : ""}{p.fecha} · {p.unidades} unid.
            {session.role === "admin" ? " · " + p.vendedor : ""}
            {esBorrador ? " · toca para continuar" : ""}
          </div>
        </div>
      ))}
    </div>
  );
  if (!pedidos) return <div style={{ textAlign: "center", padding: 50, color: "#888" }}>Cargando pedidos…</div>;
  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "12px 14px 90px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 19, fontWeight: 800 }}>Mis pedidos</span>
        <button style={{ border: "none", background: "#eee", borderRadius: 10, padding: "8px 14px", fontWeight: 600 }} onClick={onClose}>✕</button>
      </div>
      {pedidos.length === 0 && <div style={{ textAlign: "center", color: "#888", padding: 40 }}>Todavía no hay pedidos</div>}
      {grupo("Borradores", pedidos.filter((p) => p.estado === "borrador"), true)}
      {grupo("Enviados", pedidos.filter((p) => p.estado === "enviado"), false)}
    </div>
  );
}

/* ============================================================
   NOTAS DE INTEGRACIÓN EN App (verificar contra el código real):

   A) Estados nuevos en App:
        const [pedidoCtx, setPedidoCtx] = useState(null);
      y aceptar vista === "pedido" | "pedidos" en la cadena de render,
      ANTES de los guards de admin (~línea 960):

        if (vista === "pedido") return <NuevoPedidoDigital
          session={session}
          clientes={clientes.filter(c => session.role==="admin" || c.vendedor===session.user)}
          pedidoCtx={pedidoCtx}
          onClose={(motivo) => { setPedidoCtx(null); setVista(session.role==="admin" ? "admin" : "lista"); }}
          onAbrirNuevaOptica={(cb) => { … abrir NuevaOptica con callback onCreated → cb(nuevoCliente) … }}
        />;
        if (vista === "pedidos") return <ListaPedidos
          session={session}
          onAbrirBorrador={(p) => { setPedidoCtx({ draft: p }); setVista("pedido"); }}
          onClose={() => setVista(session.role==="admin" ? "admin" : "lista")}
        />;

   B) HomeVendedor: botón primario grande "🕶 Nuevo Pedido" → setVista("pedido")
      y acceso "Mis pedidos" → setVista("pedidos").

   C) DetalleCliente → tab Pedidos:
      - botón primario "Nuevo Pedido" → setPedidoCtx({ cliente: sel }); setVista("pedido")
      - el flujo foto existente queda como botón secundario "Cargar desde foto";
        su salida (items de /api/vision) puede inyectarse como
        setPedidoCtx({ cliente: sel, draft: { items: itemsDeVision, ... } }).

   D) api/crm.js: agregar "listaPrecio" a CRM_KEYS para el override por cliente.

   E) package.json: dependencias "pdf-lib" y "nodemailer".

   F) Vercel env vars: GMAIL_USER=pedidosfocusvision@gmail.com, GMAIL_APP_PASSWORD=(app password).
   ============================================================ */
