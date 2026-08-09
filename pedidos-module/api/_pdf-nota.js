// Generador del PDF de la nota de pedido — letra grande y clara, multipágina.
// Un renglón por modelo (colores agrupados: "C1 (2); C4 (5)"), casilla ☐ a la
// izquierda para que stock confirme cada renglón al armar el pedido.
// El guion bajo en el nombre evita que Vercel lo trate como serverless function.
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const A4 = { w: 595.28, h: 841.89 };
const MARGEN = 40;
const NEGRO = rgb(0.07, 0.07, 0.07);
const GRIS = rgb(0.45, 0.45, 0.45);
const GRIS_FILA = rgb(0.955, 0.955, 0.955);

const fmtPeso = (n) => "$ " + Math.round(n || 0).toLocaleString("es-AR");

// Columnas: casilla stock | cant | modelo(+marca) | colores | p.unit | subtotal
const COLS = [
  { titulo: "", x: MARGEN, w: 26, align: "center" },            // ☐
  { titulo: "CANT.", x: MARGEN + 26, w: 40, align: "center" },
  { titulo: "MODELO", x: MARGEN + 66, w: 148, align: "left" },
  { titulo: "COLORES", x: MARGEN + 214, w: 155, align: "left" },
  { titulo: "P. UNITARIO", x: MARGEN + 369, w: 74, align: "right" },
  { titulo: "SUBTOTAL", x: MARGEN + 443, w: 72, align: "right" },
];

const coloresTexto = (it) => {
  const cs = (it.colores || []).filter((c) => c.color);
  if (!cs.length) return "—";
  return cs.map((c) => c.color + (c.cantidad > 1 ? ` (${c.cantidad})` : "")).join(";  ");
};
const cantidadDe = (it) =>
  it.colores && it.colores.length
    ? it.colores.reduce((a, c) => a + (c.cantidad || 0), 0)
    : it.cantidad || 0;

async function generarNotaPedidoPDF(pedido) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const items = pedido.items || [];
  const totalUnidades = items.reduce((a, i) => a + cantidadDe(i), 0);
  const total = items.reduce((a, i) => a + (i.sinCargo ? 0 : cantidadDe(i) * (i.precioUnitario || 0)), 0);

  let page = doc.addPage([A4.w, A4.h]);
  let y = A4.h - MARGEN;
  let numPagina = 1;

  const texto = (t, x, yy, size, f, color, align, wCol) => {
    t = String(t == null ? "" : t);
    let tx = x;
    if (align === "right") tx = x + wCol - f.widthOfTextAtSize(t, size);
    else if (align === "center") tx = x + (wCol - f.widthOfTextAtSize(t, size)) / 2;
    page.drawText(t, { x: tx, y: yy, size, font: f, color: color || NEGRO });
  };

  const cabeceraPagina = () => {
    texto("CENTRAL EYEWEAR", MARGEN, y - 18, 21, bold);
    texto("NOTA DE PEDIDO", MARGEN, y - 40, 13, font, GRIS);
    const derX = A4.w - MARGEN - 200;
    texto(pedido.pedidoId || "PED-", derX, y - 18, 17, bold, NEGRO, "right", 200);
    texto("Fecha: " + (pedido.fechaDisplay || pedido.fecha || ""), derX, y - 36, 11.5, font, GRIS, "right", 200);
    texto("Documento no válido como factura", derX, y - 50, 8.5, font, GRIS, "right", 200);
    y -= 64;
    page.drawLine({ start: { x: MARGEN, y }, end: { x: A4.w - MARGEN, y }, thickness: 1.4, color: NEGRO });
    y -= 8;
  };

  const bloqueCliente = () => {
    const c = pedido.cliente || {};
    y -= 16;
    texto(String(c.nombre || "").toUpperCase(), MARGEN, y, 15.5, bold);
    y -= 17;
    const l1 = [c.domicilio, c.localidad, c.provincia].filter(Boolean).join("  ·  ");
    if (l1) { texto(l1, MARGEN, y, 11.5, font); y -= 15; }
    const l2 = [
      c.cuit ? "CUIT: " + c.cuit : null,
      c.condicionIva ? "IVA: " + c.condicionIva : null,
      c.telefono ? "Tel: " + c.telefono : null,
    ].filter(Boolean).join("    ");
    if (l2) { texto(l2, MARGEN, y, 11.5, font); y -= 15; }
    const l3 = [
      pedido.condVenta ? "Condiciones de venta: " + pedido.condVenta : null,
      "Vendedor: " + (pedido.vendedorNombre || pedido.vendedor || ""),
      pedido.tipoLista === "coniva" ? "Precios con IVA" : "Precios sin IVA",
    ].filter(Boolean).join("    ");
    texto(l3, MARGEN, y, 11.5, font, GRIS);
    y -= 12;
  };

  const cabeceraTabla = () => {
    y -= 18;
    for (const col of COLS) if (col.titulo) texto(col.titulo, col.x + 3, y, 10, bold, GRIS, col.align, col.w - 6);
    y -= 6;
    page.drawLine({ start: { x: MARGEN, y }, end: { x: A4.w - MARGEN, y }, thickness: 1, color: NEGRO });
    y -= 4;
  };

  const piePagina = () => {
    texto("Página " + numPagina, MARGEN, MARGEN - 16, 9, font, GRIS);
    texto("Central Eyewear — pedido generado digitalmente", A4.w - MARGEN - 250, MARGEN - 16, 9, font, GRIS, "right", 250);
  };

  const nuevaPagina = () => {
    piePagina();
    page = doc.addPage([A4.w, A4.h]);
    numPagina++;
    y = A4.h - MARGEN;
    cabeceraPagina();
    cabeceraTabla();
  };

  cabeceraPagina();
  bloqueCliente();
  cabeceraTabla();

  items.forEach((it, idx) => {
    const cant = cantidadDe(it);
    const conMarca = it.marca && it.marca !== "CENTRAL";
    // colores puede necesitar 2 líneas
    const colTxt = coloresTexto(it);
    const colW = COLS[3].w - 6;
    let colLineas = [colTxt];
    if (font.widthOfTextAtSize(colTxt, 11.5) > colW) {
      const partes = colTxt.split(";  ");
      colLineas = [];
      let linea = "";
      for (const p of partes) {
        const cand = linea ? linea + ";  " + p : p;
        if (font.widthOfTextAtSize(cand, 11.5) > colW && linea) { colLineas.push(linea + ";"); linea = p; }
        else linea = cand;
      }
      if (linea) colLineas.push(linea);
    }
    const lineasInfo = Math.max(colLineas.length, conMarca ? 2 : 1, it.sinCargo || it.descuentoPct ? 2 : 1);
    const altoFila = 10 + lineasInfo * 13;

    if (y - altoFila < MARGEN + 95) nuevaPagina();
    if (idx % 2 === 1)
      page.drawRectangle({ x: MARGEN, y: y - altoFila + 5, width: A4.w - 2 * MARGEN, height: altoFila, color: GRIS_FILA });

    const yy = y - 11;
    // casilla para stock (sin tildar)
    page.drawRectangle({ x: COLS[0].x + 7, y: yy - 2.5, width: 11, height: 11, borderColor: NEGRO, borderWidth: 1.1 });
    texto(cant, COLS[1].x + 3, yy, 13.5, bold, NEGRO, "center", COLS[1].w - 6);
    texto(String(it.modelo || "").toUpperCase(), COLS[2].x + 3, yy, 13, bold, NEGRO, "left", COLS[2].w - 6);
    if (conMarca) texto(it.marca, COLS[2].x + 3, yy - 13, 9.5, font, GRIS, "left", COLS[2].w - 6);
    colLineas.forEach((l, li) => texto(l, COLS[3].x + 3, yy - li * 13, 11.5, bold, NEGRO, "left", colW));

    if (it.sinCargo) {
      texto("SIN CARGO", COLS[4].x + 3, yy, 10.5, bold, NEGRO, "right", COLS[4].w - 6);
      texto("bonificación", COLS[4].x + 3, yy - 12, 8.5, font, GRIS, "right", COLS[4].w - 6);
      texto("$ 0", COLS[5].x + 3, yy, 11.5, font, NEGRO, "right", COLS[5].w - 6);
    } else {
      texto(fmtPeso(it.precioUnitario), COLS[4].x + 3, yy, 11.5, font, NEGRO, "right", COLS[4].w - 6);
      if (it.descuentoPct) texto("-" + it.descuentoPct + "%", COLS[4].x + 3, yy - 12, 9, font, GRIS, "right", COLS[4].w - 6);
      else if (it.precioLista && it.precioLista !== it.precioUnitario)
        texto("lista " + fmtPeso(it.precioLista), COLS[4].x + 3, yy - 12, 8.5, font, GRIS, "right", COLS[4].w - 6);
      texto(fmtPeso(cant * it.precioUnitario), COLS[5].x + 3, yy, 11.5, font, NEGRO, "right", COLS[5].w - 6);
    }
    y -= altoFila;
  });

  // Totales
  if (y < MARGEN + 135) nuevaPagina();
  y -= 4;
  page.drawLine({ start: { x: MARGEN, y }, end: { x: A4.w - MARGEN, y }, thickness: 1.4, color: NEGRO });
  y -= 24;
  texto("Total de unidades: " + totalUnidades, MARGEN, y, 13, font);
  texto("TOTAL  " + fmtPeso(total), MARGEN + 220, y - 3, 19, bold, NEGRO, "right", A4.w - 2 * MARGEN - 220);
  y -= 18;

  if (pedido.observaciones) {
    y -= 16;
    texto("Observaciones:", MARGEN, y, 11, bold, GRIS);
    y -= 15;
    const palabras = String(pedido.observaciones).split(/\s+/);
    let linea = "";
    for (const p of palabras) {
      if ((linea + " " + p).length > 95) { texto(linea, MARGEN, y, 11.5, font); y -= 14; linea = p; }
      else linea = linea ? linea + " " + p : p;
    }
    if (linea) { texto(linea, MARGEN, y, 11.5, font); y -= 14; }
  }

  piePagina();
  return Buffer.from(await doc.save());
}

module.exports = { generarNotaPedidoPDF, cantidadDe };
