/* ============================================================
   MÓDULO NOTA DE PEDIDO DIGITAL — componentes para app.jsx
   Pegar este bloque completo en public/app.jsx ANTES del componente App.
   Sigue las convenciones del repo: un solo archivo, sin build, React global.

   Diseñado para velocidad máxima de carga:
   - buscar modelo → tocar cada color suma 1 unidad (tocar varias veces suma más)
   - un renglón por modelo con los colores agrupados: "TRACE — C1 (2); C4 (5) · 7 u"
   - precio automático (sin IVA por defecto), editable por el vendedor:
     precio manual, descuento % rápido, o SIN CARGO (bonificación/regalo)

   Ítem del carrito (mismo shape que la API y el PDF):
   { marca, modelo, colores:[{color,cantidad,codigo}], precioUnitario,
     precioLista, descuentoPct?, sinCargo?, precioManual? }
   ============================================================ */

const PED_API = "/api";
const PED_CACHE_KEY = "ce_articulos_cache";
const PED_WIP_KEY = "ce_pedido_wip";
const PED_CACHE_MIN = 10;

const pedPeso = (n) => "$ " + Math.round(n || 0).toLocaleString("es-AR");
const pedCant = (it) => (it.colores || []).reduce((a, c) => a + (c.cantidad || 0), 0);
const pedSubtotal = (it) => (it.sinCargo ? 0 : pedCant(it) * (it.precioUnitario || 0));

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

// precio automático de un color: lista según IVA + recargo por provincia del cliente
function pedPrecioAuto(colorObj, tipoLista, cliente, config) {
  let p = tipoLista === "coniva" ? colorObj.coniva : colorObj.siniva;
  if (cliente && config && config.recargoProvincia) {
    const prov = String(cliente.provincia || "").toUpperCase().trim();
    if (config.recargoProvincia[prov]) p += config.recargoProvincia[prov];
  }
  return p;
}

const COND_VENTA_OPCIONES = ["Contado", "30", "30-60", "30-60-90", "60-90-120"];
const DESCUENTOS_RAPIDOS = [5, 10, 15, 20];

/* ============ Wizard principal ============ */
function NuevoPedidoDigital({ session, clientes, pedidoCtx, onClose, onAbrirNuevaOptica }) {
  const { cat, err, recargar } = useCatalogo();
  const draft = pedidoCtx && pedidoCtx.draft;
  const [paso, setPaso] = React.useState(1); // 1 artículos · 2 cliente · 3 revisión
  const [items, setItems] = React.useState(draft ? draft.items || [] : []);
  const [cliente, setCliente] = React.useState(
    (pedidoCtx && pedidoCtx.cliente) ||
    (draft && clientes.find((c) => c.airtableId === draft.clienteRecordId)) || null
  );
  const [tipoLista, setTipoLista] = React.useState(draft ? draft.tipoLista || "siniva" : "siniva");
  const [condVenta, setCondVenta] = React.useState(draft ? draft.condVenta : "");
  const [obs, setObs] = React.useState(draft ? draft.observaciones : "");
  const [recordId, setRecordId] = React.useState(draft ? draft.recordId : null);
  const [busca, setBusca] = React.useState("");
  const [abierto, setAbierto] = React.useState(null); // key marca+modelo expandido
  const [selColores, setSelColores] = React.useState({}); // {color: cantidad} del modelo abierto
  const [buscaCli, setBuscaCli] = React.useState("");
  const [editandoPrecio, setEditandoPrecio] = React.useState(null); // índice de ítem
  const [enviando, setEnviando] = React.useState(false);
  const [errEnvio, setErrEnvio] = React.useState(null);
  const [exito, setExito] = React.useState(null);
  const [preguntaCopia, setPreguntaCopia] = React.useState(false);
  const [copiaCliente, setCopiaCliente] = React.useState(null);
  const [emailCliente, setEmailCliente] = React.useState("");

  const config = cat && cat.config;
  React.useEffect(() => {
    if (config && !draft) setTipoLista(config.ivaDefault || "siniva");
  }, [config]);

  const unidades = items.reduce((a, i) => a + pedCant(i), 0);
  const total = items.reduce((a, i) => a + pedSubtotal(i), 0);

  // espejo anti-cierre en localStorage
  React.useEffect(() => {
    if (!items.length && !cliente) return;
    try {
      localStorage.setItem(PED_WIP_KEY, JSON.stringify({
        items, clienteId: cliente && cliente.airtableId, tipoLista, condVenta, obs, recordId, ts: Date.now(),
      }));
    } catch (e) {}
  }, [items, cliente, tipoLista, condVenta, obs, recordId]);
  const limpiarWip = () => { try { localStorage.removeItem(PED_WIP_KEY); } catch (e) {} };

  // repricear ítems automáticos (no tocados a mano) al cambiar cliente o IVA
  const repricear = (nuevoTipo, nuevoCliente) => {
    if (!cat) return;
    const porKey = {};
    (cat.modelos || []).forEach((m) => { porKey[m.marca + "|" + m.modelo] = m; });
    setItems((prev) => prev.map((it) => {
      if (it.precioManual || it.sinCargo || it.descuentoPct) return it;
      const m = porKey[(it.marca || "") + "|" + it.modelo];
      if (!m) return it;
      const c0 = m.colores.find((c) => it.colores.some((ic) => ic.color === c.color)) || m.colores[0];
      if (!c0) return it;
      const p = pedPrecioAuto(c0, nuevoTipo, nuevoCliente, config);
      return { ...it, precioUnitario: p, precioLista: p };
    }));
  };

  const elegirCliente = (c) => { repricear(tipoLista, c); setCliente(c); setPaso(3); };
  const cambiarIva = (t) => { setTipoLista(t); repricear(t, cliente); };

  // agregar los colores seleccionados del modelo abierto — agrupa por precio en renglones
  const agregarSeleccion = (m) => {
    const porPrecio = {};
    for (const c of m.colores) {
      const cant = selColores[c.color || "_"];
      if (!cant) continue;
      const p = pedPrecioAuto(c, tipoLista, cliente, config);
      (porPrecio[p] = porPrecio[p] || []).push({ color: c.color, cantidad: cant, codigo: c.codigo });
    }
    if (!Object.keys(porPrecio).length) return;
    setItems((prev) => {
      const copia = prev.slice();
      for (const [precio, colores] of Object.entries(porPrecio)) {
        const p = Number(precio);
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
      vendedor: session.user, cliente: cliente ? cliente.nombre : "",
      clienteRecordId: cliente ? cliente.airtableId : "",
      items, tipoLista, condVenta, observaciones: obs,
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
      let rid = recordId;
      const base = {
        vendedor: session.user, cliente: cliente.nombre, clienteRecordId: cliente.airtableId,
        items, tipoLista, condVenta, observaciones: obs,
      };
      if (!rid) {
        const r = await fetch(PED_API + "/pedidos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(base) });
        rid = (await r.json()).recordId; setRecordId(rid);
      } else {
        await fetch(PED_API + "/pedidos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recordId: rid, ...base }) });
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
        const det = j.priceChanges.map((c) => `${c.modelo}: ${pedPeso(c.anterior)} → ${pedPeso(c.vigente)}`).join("\n");
        if (confirm("Algunos precios de lista cambiaron desde que armaste el pedido:\n\n" + det + "\n\n¿Enviar con los precios vigentes?")) return enviar(true);
        setEnviando(false); return;
      }
      if (!r.ok) throw new Error(j.error || "Error " + r.status);
      limpiarWip(); setExito(j);
    } catch (e) { setErrEnvio(String(e.message || e)); }
    setEnviando(false);
  };

  /* ---------- estilos ---------- */
  const S = {
    wrap: { maxWidth: 560, margin: "0 auto", padding: "12px 14px 120px" },
    top: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    titulo: { fontSize: 19, fontWeight: 800, letterSpacing: 0.3 },
    cerrar: { border: "none", background: "#eee", borderRadius: 10, padding: "8px 14px", fontSize: 14, fontWeight: 600 },
    input: { width: "100%", padding: "13px 14px", fontSize: 16, borderRadius: 12, border: "1.5px solid #ddd", boxSizing: "border-box" },
    card: { background: "#fff", border: "1px solid #e6e6e6", borderRadius: 14, padding: "12px 13px", marginBottom: 7 },
    chip: (on) => ({ display: "inline-block", padding: "9px 14px", margin: "3px 5px 3px 0", borderRadius: 999, fontSize: 14.5, fontWeight: 700, border: on ? "2px solid #111" : "1.5px solid #ccc", background: on ? "#111" : "#fff", color: on ? "#fff" : "#111" }),
    btnP: { width: "100%", padding: "15px", fontSize: 16.5, fontWeight: 800, borderRadius: 13, border: "none", background: "#111", color: "#fff" },
    btnS: { width: "100%", padding: "13px", fontSize: 15, fontWeight: 700, borderRadius: 13, border: "1.5px solid #111", background: "#fff", color: "#111" },
    barra: { position: "fixed", left: 0, right: 0, bottom: 0, background: "#111", color: "#fff", padding: "13px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 60 },
    colorBtn: (n) => ({ position: "relative", minWidth: 62, padding: "12px 8px", margin: "3px 5px 3px 0", borderRadius: 12, fontSize: 15, fontWeight: 800, textAlign: "center", border: n ? "2px solid #111" : "1.5px solid #ccc", background: n ? "#111" : "#fff", color: n ? "#fff" : "#111" }),
    badge: { position: "absolute", top: -7, right: -7, background: "#e53935", color: "#fff", borderRadius: 999, minWidth: 20, height: 20, fontSize: 12.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" },
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

  /* ---------- paso 1: artículos — tocar color = +1 unidad ---------- */
  if (paso === 1) {
    if (err) return <div style={S.wrap}>{cabecera("Nuevo Pedido")}<div style={S.card}>Error cargando catálogo: {err} <button style={{ ...S.btnS, marginTop: 10 }} onClick={recargar}>Reintentar</button></div></div>;
    if (!cat) return <div style={S.wrap}>{cabecera("Nuevo Pedido")}<div style={{ textAlign: "center", padding: 50, color: "#888" }}>Cargando catálogo…</div></div>;
    const q = busca.toUpperCase().trim();
    const mods = (cat.modelos || []).filter((m) => !q || m.modelo.includes(q) || m.marca.includes(q));
    const selTotal = Object.values(selColores).reduce((a, b) => a + b, 0);
    return (
      <div style={S.wrap}>
        {cabecera("Nuevo Pedido")}
        <div style={{ position: "sticky", top: 0, background: "#fafafa", paddingBottom: 8, zIndex: 40 }}>
          <input style={S.input} placeholder="Buscar modelo o marca…" value={busca} autoFocus
            onChange={(e) => { setBusca(e.target.value); setAbierto(null); setSelColores({}); }} />
          {cliente && <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>Cliente: <b>{cliente.nombre}</b></div>}
        </div>
        {mods.slice(0, 30).map((m) => {
          const key = m.marca + "|" + m.modelo;
          const precios = m.colores.map((c) => pedPrecioAuto(c, tipoLista, cliente, config));
          const pMin = Math.min(...precios), pMax = Math.max(...precios);
          return (
            <div key={key} style={S.card} onClick={() => { if (abierto !== key) { setAbierto(key); setSelColores({}); } }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <span style={{ fontSize: 17, fontWeight: 800 }}>{m.modelo}</span>
                  {m.marca !== "CENTRAL" && <span style={{ fontSize: 12.5, color: "#888", marginLeft: 8 }}>{m.marca}</span>}
                </div>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{pMin === pMax ? pedPeso(pMin) : "desde " + pedPeso(pMin)}</span>
              </div>
              {abierto === key && (
                <div style={{ marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ fontSize: 12.5, color: "#888", marginBottom: 4 }}>Tocá cada color para sumar unidades{m.colores.length > 1 ? " (podés elegir varios)" : ""}:</div>
                  <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {m.colores.map((c) => {
                      const k = c.color || "_";
                      const n = selColores[k] || 0;
                      return (
                        <button key={k} style={S.colorBtn(n)}
                          onClick={() => setSelColores({ ...selColores, [k]: n + 1 })}>
                          {c.color || "ÚNICO"}
                          {n > 0 && <span style={S.badge}>{n}</span>}
                        </button>
                      );
                    })}
                  </div>
                  {selTotal > 0 && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                      <button style={{ ...S.btnS, width: "auto", padding: "10px 14px" }}
                        onClick={() => {
                          const copia = { ...selColores };
                          const ks = Object.keys(copia).filter((k) => copia[k] > 0);
                          const last = ks[ks.length - 1];
                          if (last) { copia[last]--; if (!copia[last]) delete copia[last]; setSelColores(copia); }
                        }}>− quitar</button>
                      <button style={{ ...S.btnP, flex: 1, padding: "12px" }} onClick={() => agregarSeleccion(m)}>
                        Agregar {selTotal} {selTotal === 1 ? "unidad" : "unidades"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {mods.length === 0 && <div style={{ textAlign: "center", color: "#888", padding: 30 }}>Sin resultados para “{busca}”</div>}
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
    const qc = buscaCli.toUpperCase().trim();
    const propios = (clientes || []).filter((c) => !qc || String(c.nombre || "").toUpperCase().includes(qc));
    return (
      <div style={S.wrap}>
        {cabecera("¿Para qué cliente?", () => setPaso(1))}
        <input style={{ ...S.input, marginBottom: 10 }} placeholder="Buscar en tu cartera…" value={buscaCli} autoFocus onChange={(e) => setBuscaCli(e.target.value)} />
        <button style={{ ...S.btnS, marginBottom: 10 }} onClick={() => onAbrirNuevaOptica && onAbrirNuevaOptica((nuevo) => elegirCliente(nuevo))}>+ Nueva óptica</button>
        {propios.slice(0, 30).map((c) => (
          <div key={c.airtableId} style={S.card} onClick={() => elegirCliente(c)}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{c.nombre}</div>
            <div style={{ fontSize: 13, color: "#888" }}>{[c.ciudad || c.localidad, c.provincia].filter(Boolean).join(" · ")}</div>
          </div>
        ))}
      </div>
    );
  }

  /* ---------- paso 3: revisión — precio editable, descuentos, sin cargo ---------- */
  const actualizarItem = (i, cambios) => {
    const copia = items.slice();
    copia[i] = { ...copia[i], ...cambios };
    setItems(copia);
  };
  return (
    <div style={S.wrap}>
      {cabecera("Revisar pedido", () => setPaso(1))}
      <div style={{ ...S.card, background: "#fafafa" }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>{cliente ? cliente.nombre : "Sin cliente"}</div>
        <div style={{ fontSize: 13, color: "#888" }}><a style={{ color: "#555" }} onClick={() => setPaso(2)}>cambiar cliente</a></div>
        <div style={{ marginTop: 8 }}>
          <button style={S.chip(tipoLista === "siniva")} onClick={() => cambiarIva("siniva")}>Sin IVA</button>
          <button style={S.chip(tipoLista === "coniva")} onClick={() => cambiarIva("coniva")}>Con IVA</button>
        </div>
      </div>
      {items.map((it, i) => (
        <div key={i} style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 800, fontSize: 15.5 }}>{it.modelo}</span>
              {it.marca !== "CENTRAL" && <span style={{ color: "#888", fontSize: 12, marginLeft: 6 }}>{it.marca}</span>}
              <div style={{ fontSize: 13.5, color: "#333", marginTop: 2 }}>
                {(it.colores || []).filter((c) => c.color).map((c) => c.color + (c.cantidad > 1 ? ` (${c.cantidad})` : "")).join(";  ") || "único"}
                {" · "}<b>{pedCant(it)} u</b>
              </div>
              <div style={{ fontSize: 13.5, marginTop: 2 }} onClick={() => setEditandoPrecio(editandoPrecio === i ? null : i)}>
                {it.sinCargo
                  ? <b style={{ color: "#2e7d32" }}>SIN CARGO (bonificación)</b>
                  : <span>{pedCant(it)} × <b>{pedPeso(it.precioUnitario)}</b>
                      {it.descuentoPct ? <span style={{ color: "#e53935" }}> (-{it.descuentoPct}%)</span> : null}
                      {it.precioManual ? <span style={{ color: "#888" }}> (manual)</span> : null}
                      {" = "}<b>{pedPeso(pedSubtotal(it))}</b></span>}
                <span style={{ color: "#888" }}> ✎</span>
              </div>
            </div>
            <button style={{ border: "none", background: "none", fontSize: 18, color: "#c62828" }} onClick={() => setItems(items.filter((_, j) => j !== i))}>🗑</button>
          </div>
          {editandoPrecio === i && (
            <div style={{ marginTop: 8, borderTop: "1px solid #eee", paddingTop: 8 }}>
              <div style={{ fontSize: 12.5, color: "#888", marginBottom: 4 }}>Precio lista: {pedPeso(it.precioLista)} — tocá para ajustar:</div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
                {DESCUENTOS_RAPIDOS.map((d) => (
                  <button key={d} style={S.chip(it.descuentoPct === d)} onClick={() =>
                    actualizarItem(i, it.descuentoPct === d
                      ? { descuentoPct: null, sinCargo: false, precioManual: false, precioUnitario: it.precioLista }
                      : { descuentoPct: d, sinCargo: false, precioManual: false, precioUnitario: Math.round(it.precioLista * (1 - d / 100)) })
                  }>-{d}%</button>
                ))}
                <button style={S.chip(!!it.sinCargo)} onClick={() =>
                  actualizarItem(i, it.sinCargo
                    ? { sinCargo: false, descuentoPct: null, precioManual: false, precioUnitario: it.precioLista }
                    : { sinCargo: true, descuentoPct: null, precioManual: false, precioUnitario: 0 })
                }>Sin cargo</button>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                <span style={{ fontSize: 13.5, color: "#666" }}>Precio manual: $</span>
                <input type="number" min="0" style={{ ...S.input, width: 130, padding: "9px 10px" }}
                  value={it.precioManual ? it.precioUnitario : ""}
                  placeholder={String(it.precioLista)}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!e.target.value) actualizarItem(i, { precioManual: false, descuentoPct: null, sinCargo: false, precioUnitario: it.precioLista });
                    else if (v >= 0) actualizarItem(i, { precioManual: true, descuentoPct: null, sinCargo: false, precioUnitario: v });
                  }} />
                <button style={{ ...S.cerrar }} onClick={() => setEditandoPrecio(null)}>OK</button>
              </div>
            </div>
          )}
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
          <button style={{ ...S.btnP, opacity: items.length && cliente ? 1 : 0.4 }} disabled={!items.length || !cliente}
            onClick={() => { setPreguntaCopia(true); setEmailCliente((cliente && cliente.mail) || ""); }}>
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
          onClose={() => { setPedidoCtx(null); setVista(session.role==="admin" ? "admin" : "lista"); }}
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
        su salida (items planos de /api/vision) se convierte a ítems agrupados:
        agrupar por modelo → colores[] y buscar precio en el catálogo cacheado.

   D) package.json: dependencias "pdf-lib" y "nodemailer".

   E) Vercel env vars: GMAIL_USER=pedidosfocusvision@gmail.com, GMAIL_APP_PASSWORD=(app password).
   ============================================================ */
