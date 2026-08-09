// /api/pedidos — catálogo + CRUD de notas de pedido + pipeline de envío (PDF + email).
//   GET    ?seccion=catalogo       → catálogo agrupado por modelo + config (cache CDN 5 min)
//   GET    ?vendedor=matias        → borradores y enviados del vendedor (sin filtro = todos, admin)
//   POST   {vendedor, cliente, ...}          → crea borrador
//   POST   {action:"enviar", recordId, ...}  → genera PDF, manda mail, marca enviado
//   PATCH  {recordId, items?, estado?, ...}  → actualiza borrador / anula
//
// Ítem: { marca, modelo, colores:[{color,cantidad,codigo}], precioUnitario,
//         precioLista, descuentoPct?, sinCargo?, precioManual? }
import nodemailer from "nodemailer";
import { generarNotaPedidoPDF, cantidadDe } from "./_pdf-nota.js";
import { CATALOGO_BASE } from "./_articulos-data.js";

const BASE = process.env.AIRTABLE_BASE;
const TOKEN = process.env.AIRTABLE_TOKEN;
const API = `https://api.airtable.com/v0/${BASE}`;
const H = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };
const CASILLA_PEDIDOS = "pedidosfocusvision@gmail.com";

// La importación CSV dejó un BOM (﻿) en el nombre del primer campo de las
// tablas nuevas ("﻿Codigo", "﻿PedidoID", "﻿Clave"). Se normaliza al leer y se
// usa el nombre exacto al escribir PedidoID.
const F_PEDIDO_ID = "﻿PedidoID";
const campos = (rec) => {
  const out = {};
  for (const k in rec.fields) out[k.replace(/^﻿/, "")] = rec.fields[k];
  return out;
};

const hoyISO = () => new Date().toISOString().slice(0, 10);
const fechaAR = () =>
  new Date().toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
const fmtPeso = (n) => "$ " + Math.round(n || 0).toLocaleString("es-AR");

async function at(path, opts = {}) {
  const r = await fetch(`${API}/${path}`, { headers: H, ...opts });
  if (!r.ok) throw new Error(`Airtable ${path.split("?")[0]}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function fetchAll(tabla, params = "") {
  let records = [], offset = "";
  do {
    const j = await at(`${encodeURIComponent(tabla)}?pageSize=100${params}${offset ? `&offset=${offset}` : ""}`);
    records = records.concat(j.records || []);
    offset = j.offset || "";
  } while (offset);
  return records;
}

// lee ARTICULOS completando Modelo/Color/Marca vacíos desde CATALOGO_BASE
async function fetchArticulos() {
  const recs = await fetchAll("ARTICULOS", "&filterByFormula=" + encodeURIComponent("NOT({Inactivo})"));
  return recs.map((r) => {
    const f = campos(r);
    const codigo = String(f.Codigo || "").trim();
    const base = CATALOGO_BASE[codigo] || ["", "", ""];
    return {
      codigo,
      marca: String(f.Marca || base[0] || "").toUpperCase().trim(),
      modelo: String(f.Modelo || base[1] || "").toUpperCase().trim(),
      color: String(f.Color || base[2] || "").toUpperCase().trim(),
      coniva: f.PrecioConIva || 0,
      siniva: f.PrecioSinIva || 0,
    };
  }).filter((a) => a.codigo && a.modelo);
}

const parsearPedido = (r) => {
  const f = campos(r);
  let items = [];
  try { items = JSON.parse(f.Items || "[]"); } catch (e) {}
  return {
    recordId: r.id,
    pedidoId: f.PedidoID || "",
    numero: f.Numero || null,
    fecha: f.Fecha || "",
    vendedor: f.Vendedor || "",
    cliente: f.Cliente || "",
    clienteRecordId: f.ClienteRecordId || "",
    items,
    total: f.Total || 0,
    unidades: f.Unidades || 0,
    tipoLista: f.TipoLista || "siniva",
    estado: f.Estado || "borrador",
    condVenta: f.CondVenta || "",
    observaciones: f.Observaciones || "",
    emailCliente: f.EmailCliente || "",
    enviadoAt: f.EnviadoAt || "",
  };
};

const totales = (items) => ({
  total: items.reduce((a, i) => a + (i.sinCargo ? 0 : cantidadDe(i) * (i.precioUnitario || 0)), 0),
  unidades: items.reduce((a, i) => a + cantidadDe(i), 0),
});

// ---------- catálogo ----------
async function catalogo(res) {
  const [arts, configRecs] = await Promise.all([fetchArticulos(), fetchAll("CONFIG")]);

  const porModelo = new Map();
  for (const a of arts) {
    const key = a.marca + "|" + a.modelo;
    if (!porModelo.has(key)) porModelo.set(key, { marca: a.marca, modelo: a.modelo, colores: [] });
    porModelo.get(key).colores.push({ codigo: a.codigo, color: a.color, coniva: a.coniva, siniva: a.siniva });
  }
  const modelos = Array.from(porModelo.values());
  for (const m of modelos)
    m.colores.sort((x, y) => x.color.localeCompare(y.color, undefined, { numeric: true }));
  modelos.sort((x, y) =>
    (x.marca === "CENTRAL" ? 0 : 1) - (y.marca === "CENTRAL" ? 0 : 1) ||
    x.modelo.localeCompare(y.modelo));

  const config = { ivaDefault: "siniva", recargoProvincia: {} };
  for (const r of configRecs) {
    const f = campos(r);
    const clave = String(f.Clave || "").trim();
    const valor = String(f.Valor || "").trim();
    if (clave === "iva_default" && (valor === "siniva" || valor === "coniva")) config.ivaDefault = valor;
    else if (clave.startsWith("recargo_provincia:")) {
      const monto = parseInt(valor, 10);
      if (monto) config.recargoProvincia[clave.slice("recargo_provincia:".length).toUpperCase().trim()] = monto;
    }
  }

  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
  return res.status(200).json({ modelos, config, fetchedAt: new Date().toISOString() });
}

// ---------- envío ----------
async function enviarPedido(body) {
  const { recordId, copiaCliente, emailCliente, vendedorNombre, clienteInfo } = body;
  if (!recordId) throw { status: 400, msg: "Falta recordId" };

  const rec = await at(`PEDIDOS/${recordId}`);
  const pedido = parsearPedido(rec);
  if (pedido.estado === "enviado") throw { status: 409, msg: "Este pedido ya fue enviado" };
  if (!pedido.items.length) throw { status: 400, msg: "El pedido no tiene ítems" };

  // Revalidar SOLO precios automáticos (los manuales, con descuento o sin cargo se respetan)
  const arts = await fetchArticulos();
  const porCodigo = {};
  for (const a of arts) porCodigo[a.codigo] = a;
  const cambios = [];
  for (const it of pedido.items) {
    if (it.precioManual || it.sinCargo || it.descuentoPct) continue;
    const cod = it.colores && it.colores[0] && it.colores[0].codigo;
    const cat = cod && porCodigo[cod];
    if (!cat) continue;
    const vigente = pedido.tipoLista === "coniva" ? cat.coniva : cat.siniva;
    if (vigente && vigente !== it.precioUnitario)
      cambios.push({ modelo: it.modelo, anterior: it.precioUnitario, vigente });
  }
  if (cambios.length && !body.confirmarPrecios)
    throw { status: 409, msg: "precios_cambiados", priceChanges: cambios };
  if (cambios.length)
    for (const it of pedido.items) {
      const c = cambios.find((x) => x.modelo === it.modelo);
      if (c) { it.precioUnitario = c.vigente; it.precioLista = c.vigente; }
    }

  // Número secuencial: máximo existente + 1 (volumen bajo, sin riesgo real de carrera)
  const conNumero = await fetchAll("PEDIDOS", "&filterByFormula=" + encodeURIComponent("{Numero}>0") + "&fields%5B%5D=Numero");
  const numero = conNumero.reduce((m, r) => Math.max(m, campos(r).Numero || 0), 0) + 1;
  const pedidoId = "PED-" + String(numero).padStart(4, "0");

  const { total, unidades } = totales(pedido.items);
  const cli = clienteInfo || {};

  const pdfBuffer = await generarNotaPedidoPDF({
    pedidoId,
    fechaDisplay: fechaAR(),
    vendedor: pedido.vendedor,
    vendedorNombre: vendedorNombre || pedido.vendedor,
    tipoLista: pedido.tipoLista,
    condVenta: pedido.condVenta,
    observaciones: pedido.observaciones,
    cliente: {
      nombre: pedido.cliente,
      domicilio: cli.domicilio || "",
      localidad: cli.localidad || "",
      provincia: cli.provincia || "",
      cuit: cli.cuit || "",
      condicionIva: cli.condicionIva || "",
      telefono: cli.telefono || "",
    },
    items: pedido.items,
  });

  // Email — un solo envío: to casilla de pedidos, cc cliente si pidió copia
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  const mailCliente = copiaCliente ? String(emailCliente || "").trim() : "";
  const nombreArchivo = `${pedidoId}-${pedido.cliente.replace(/[^A-Z0-9ÁÉÍÓÚÑ ]/gi, "").trim().replace(/\s+/g, "-")}.pdf`;
  await transporter.sendMail({
    from: `"Central Eyewear — Pedidos" <${process.env.GMAIL_USER}>`,
    to: CASILLA_PEDIDOS,
    cc: mailCliente || undefined,
    subject: `${pedidoId} · ${pedido.cliente} · ${fmtPeso(total)}`,
    html: `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#111">
      <h2 style="margin:0 0 4px">Nota de pedido ${pedidoId}</h2>
      <p style="margin:0 0 12px;color:#666">Central Eyewear · ${fechaAR()}</p>
      <p><b>Cliente:</b> ${pedido.cliente}<br>
      <b>Vendedor:</b> ${vendedorNombre || pedido.vendedor}<br>
      <b>Unidades:</b> ${unidades} · <b>Total:</b> ${fmtPeso(total)}${pedido.condVenta ? `<br><b>Cond. de venta:</b> ${pedido.condVenta}` : ""}</p>
      <p style="color:#666">El detalle completo está en el PDF adjunto.</p></div>`,
    attachments: [{ filename: nombreArchivo, content: pdfBuffer, contentType: "application/pdf" }],
  });

  // Si el vendedor cargó un mail nuevo del cliente, guardarlo en su ficha
  let warnings = [];
  if (mailCliente && body.guardarEmailCliente && pedido.clienteRecordId) {
    try {
      await at(`CLIENTES/${pedido.clienteRecordId}`, {
        method: "PATCH",
        body: JSON.stringify({ fields: { Mail: mailCliente } }),
      });
    } catch (e) { warnings.push("No se pudo guardar el mail en la ficha del cliente"); }
  }

  // Marcar enviado
  await at(`PEDIDOS/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({
      fields: {
        [F_PEDIDO_ID]: pedidoId, Numero: numero, Estado: "enviado",
        EnviadoAt: new Date().toISOString(),
        Items: JSON.stringify(pedido.items), Total: total, Unidades: unidades,
        EmailCliente: mailCliente || undefined,
      },
    }),
  });

  // Espejo en CRM_Data.pedidos[] (merge vía misma lógica que api/crm.js) para el historial del cliente
  if (pedido.clienteRecordId) {
    try {
      const cliRec = await at(`CLIENTES/${pedido.clienteRecordId}`);
      let crm = {};
      try { crm = JSON.parse(cliRec.fields.CRM_Data || "{}"); } catch (e) {}
      crm.pedidos = crm.pedidos || [];
      const ahora = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
      crm.pedidos.unshift({
        pedidoId,
        fecha: ahora.split(",")[0].trim(),
        hora: (ahora.split(",")[1] || "").trim().slice(0, 6).trim(),
        vendedor: vendedorNombre || pedido.vendedor,
        tipo: "Pedido",
        link: null,
        observaciones: pedido.observaciones || `${unidades} unidades · ${fmtPeso(total)}`,
        archivos: [],
        items: pedido.items,
        total,
        unidades,
        origen: "digital",
      });
      await at(`CLIENTES/${pedido.clienteRecordId}`, {
        method: "PATCH",
        body: JSON.stringify({ fields: { CRM_Data: JSON.stringify(crm) } }),
      });
    } catch (e) { warnings.push("Pedido enviado, pero no se pudo reflejar en el historial del cliente"); }
  }

  return { ok: true, pedidoId, total, unidades, emailedTo: [CASILLA_PEDIDOS].concat(mailCliente ? [mailCliente] : []), warnings };
}

// ---------- handler ----------
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      if (req.query.seccion === "catalogo") return await catalogo(res);
      const vendedor = String(req.query.vendedor || "").trim();
      const filtro = vendedor
        ? "&filterByFormula=" + encodeURIComponent(`AND({Vendedor}="${vendedor}",{Estado}!="anulado")`)
        : "&filterByFormula=" + encodeURIComponent(`{Estado}!="anulado"`);
      const recs = await fetchAll("PEDIDOS", filtro);
      const pedidos = recs.map(parsearPedido)
        .filter((p) => p.pedidoId !== "EJEMPLO-BORRAR")
        .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
      return res.status(200).json({ pedidos });
    }

    if (req.method === "POST") {
      const body = req.body || {};
      if (body.action === "enviar") {
        const out = await enviarPedido(body);
        return res.status(200).json(out);
      }
      const items = body.items || [];
      const { total, unidades } = totales(items);
      const j = await at("PEDIDOS", {
        method: "POST",
        body: JSON.stringify({
          fields: {
            Fecha: hoyISO(),
            Vendedor: body.vendedor || "",
            Cliente: String(body.cliente || "").toUpperCase().trim(),
            ClienteRecordId: body.clienteRecordId || "",
            Items: JSON.stringify(items),
            Total: total, Unidades: unidades,
            TipoLista: body.tipoLista || "siniva",
            Estado: "borrador",
            CondVenta: body.condVenta || "",
            Observaciones: body.observaciones || "",
          },
        }),
      });
      return res.status(200).json({ recordId: j.id });
    }

    if (req.method === "PATCH") {
      const body = req.body || {};
      if (!body.recordId) return res.status(400).json({ error: "Falta recordId" });
      const fields = {};
      if (body.items) {
        const { total, unidades } = totales(body.items);
        fields.Items = JSON.stringify(body.items);
        fields.Total = total; fields.Unidades = unidades;
      }
      if (body.cliente != null) fields.Cliente = String(body.cliente).toUpperCase().trim();
      if (body.clienteRecordId != null) fields.ClienteRecordId = body.clienteRecordId;
      if (body.tipoLista != null) fields.TipoLista = body.tipoLista;
      if (body.condVenta != null) fields.CondVenta = body.condVenta;
      if (body.observaciones != null) fields.Observaciones = body.observaciones;
      if (body.estado === "anulado") fields.Estado = "anulado";
      const j = await at(`PEDIDOS/${body.recordId}`, { method: "PATCH", body: JSON.stringify({ fields }) });
      return res.status(200).json({ recordId: j.id, ok: true });
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (e) {
    if (e && e.status)
      return res.status(e.status).json({ error: e.msg, priceChanges: e.priceChanges });
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
