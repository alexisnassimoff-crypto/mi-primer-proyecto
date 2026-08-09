// Generador del PDF de la nota de pedido — letra grande y clara, multipágina.
// Módulo compartido: lo usa api/pedidos.js (action:"enviar").
// El guion bajo en el nombre evita que Vercel lo trate como serverless function.
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const A4 = { w: 595.28, h: 841.89 };
const MARGEN = 42;
const NEGRO = rgb(0.07, 0.07, 0.07);
const GRIS = rgb(0.45, 0.45, 0.45);
const GRIS_FILA = rgb(0.955, 0.955, 0.955);
const LINEA = rgb(0.85, 0.85, 0.85);

const fmtPeso = (n) => "$ " + Math.round(n || 0).toLocaleString("es-AR");

// Columnas de la tabla de ítems: x de inicio y ancho
const COLS = [
  { titulo: "CANT.", x: MARGEN, w: 48, align: "center" },
  { titulo: "MODELO", x: MARGEN + 48, w: 168, align: "left" },
  { titulo: "LÍNEA", x: MARGEN + 216, w: 105, align: "left" },
  { titulo: "COLOR", x: MARGEN + 321, w: 58, align: "center" },
  { titulo: "P. UNITARIO", x: MARGEN + 379, w: 66, align: "right" },
  { titulo: "SUBTOTAL", x: MARGEN + 445, w: 66, align: "right" },
];

async function generarNotaPedidoPDF(pedido) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const items = pedido.items || [];
  const totalUnidades = items.reduce((a, i) => a + (i.cantidad || 0), 0);
  const total = items.reduce((a, i) => a + (i.cantidad || 0) * (i.precioUnitario || 0), 0);

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
    // Marca
    texto("CENTRAL EYEWEAR", MARGEN, y - 18, 21, bold);
    texto("NOTA DE PEDIDO", MARGEN, y - 40, 13, font, GRIS);
    // Nº y fecha a la derecha
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
      "Lista " + (pedido.listaPrecio || 1),
    ].filter(Boolean).join("    ");
    texto(l3, MARGEN, y, 11.5, font, GRIS);
    y -= 12;
  };

  const cabeceraTabla = () => {
    y -= 18;
    for (const col of COLS) texto(col.titulo, col.x + 4, y, 10.5, bold, GRIS, col.align, col.w - 8);
    y -= 6;
    page.drawLine({ start: { x: MARGEN, y }, end: { x: A4.w - MARGEN, y }, thickness: 1, color: NEGRO });
    y -= 4;
  };

  const nuevaPagina = () => {
    texto("Página " + numPagina, MARGEN, MARGEN - 14, 9, font, GRIS);
    page = doc.addPage([A4.w, A4.h]);
    numPagina++;
    y = A4.h - MARGEN;
    cabeceraPagina();
    cabeceraTabla();
  };

  cabeceraPagina();
  bloqueCliente();
  cabeceraTabla();

  const ALTO_FILA = 21;
  items.forEach((it, idx) => {
    if (y - ALTO_FILA < MARGEN + 90) nuevaPagina();
    if (idx % 2 === 1)
      page.drawRectangle({ x: MARGEN, y: y - ALTO_FILA + 5, width: A4.w - 2 * MARGEN, height: ALTO_FILA, color: GRIS_FILA });
    const yy = y - 10;
    const sub = (it.cantidad || 0) * (it.precioUnitario || 0);
    texto(it.cantidad, COLS[0].x + 4, yy, 13, bold, NEGRO, "center", COLS[0].w - 8);
    texto(String(it.modelo || "").toUpperCase(), COLS[1].x + 4, yy, 13, bold, NEGRO, "left", COLS[1].w - 8);
    texto(it.linea || "", COLS[2].x + 4, yy, 11.5, font, NEGRO, "left", COLS[2].w - 8);
    texto(it.color || "", COLS[3].x + 4, yy, 13, bold, NEGRO, "center", COLS[3].w - 8);
    texto(fmtPeso(it.precioUnitario), COLS[4].x + 4, yy, 11.5, font, NEGRO, "right", COLS[4].w - 8);
    texto(fmtPeso(sub), COLS[5].x + 4, yy, 11.5, font, NEGRO, "right", COLS[5].w - 8);
    y -= ALTO_FILA;
  });

  // Totales
  if (y < MARGEN + 130) nuevaPagina();
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
    // envolver texto largo a ~95 chars por línea
    const palabras = String(pedido.observaciones).split(/\s+/);
    let linea = "";
    for (const p of palabras) {
      if ((linea + " " + p).length > 95) { texto(linea, MARGEN, y, 11.5, font); y -= 14; linea = p; }
      else linea = linea ? linea + " " + p : p;
    }
    if (linea) { texto(linea, MARGEN, y, 11.5, font); y -= 14; }
  }

  texto("Página " + numPagina, MARGEN, MARGEN - 14, 9, font, GRIS);
  texto("Central Eyewear — pedido generado digitalmente", A4.w - MARGEN - 250, MARGEN - 14, 9, font, GRIS, "right", 250);

  return Buffer.from(await doc.save());
}

module.exports = { generarNotaPedidoPDF };
