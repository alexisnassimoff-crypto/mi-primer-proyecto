// Generador del PDF de la nota de pedido — letra grande y clara, multipágina.
// Un renglón por color, cada uno con su casilla ☐ para que stock confirme.
// El guion bajo en el nombre evita que Vercel lo trate como serverless function.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const A4 = { w: 595.28, h: 841.89 };
const MARGEN = 40;
const NEGRO = rgb(0.07, 0.07, 0.07);
const GRIS = rgb(0.45, 0.45, 0.45);
const GRIS_FILA = rgb(0.955, 0.955, 0.955);

const fmtPeso = (n) => "$ " + Math.round(n || 0).toLocaleString("es-AR");

// Columnas: casilla stock | cant | modelo(+marca) | color | p.unit | subtotal
const COLS = [
  { titulo: "", x: MARGEN, w: 26, align: "center" },
  { titulo: "CANT.", x: MARGEN + 26, w: 42, align: "center" },
  { titulo: "MODELO", x: MARGEN + 68, w: 200, align: "left" },
  { titulo: "COLOR", x: MARGEN + 268, w: 68, align: "center" },
  { titulo: "P. UNITARIO", x: MARGEN + 336, w: 92, align: "right" },
  { titulo: "SUBTOTAL", x: MARGEN + 428, w: 87, align: "right" },
];

export const cantidadDe = (it) =>
  it.colores && it.colores.length
    ? it.colores.reduce((a, c) => a + (c.cantidad || 0), 0)
    : it.cantidad || 0;

// explota los ítems del carrito (agrupados por modelo) en un renglón por color
const aRenglones = (items) => {
  const out = [];
  for (const it of items) {
    const colores = it.colores && it.colores.length ? it.colores : [{ color: "", cantidad: it.cantidad || 0 }];
    for (const c of colores) {
      if (!c.cantidad) continue;
      out.push({
        cantidad: c.cantidad,
        modelo: it.modelo,
        marca: it.marca,
        color: c.color || "—",
        precioUnitario: it.precioUnitario || 0,
        precioLista: it.precioLista,
        descuentoPct: it.descuentoPct,
        sinCargo: !!it.sinCargo,
      });
    }
  }
  return out;
};

export async function generarNotaPedidoPDF(pedido) {
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

  const renglones = aRenglones(items);
  renglones.forEach((r, idx) => {
    const conMarca = r.marca && r.marca !== "CENTRAL";
    const notaPrecio = r.sinCargo || r.descuentoPct || (r.precioLista && r.precioLista !== r.precioUnitario);
    const dosLineas = conMarca || notaPrecio;
    const altoFila = dosLineas ? 33 : 22;

    if (y - altoFila < MARGEN + 95) nuevaPagina();
    if (idx % 2 === 1)
      page.drawRectangle({ x: MARGEN, y: y - altoFila + 5, width: A4.w - 2 * MARGEN, height: altoFila, color: GRIS_FILA });

    const yy = y - 11;
    page.drawRectangle({ x: COLS[0].x + 7, y: yy - 2.5, width: 11, height: 11, borderColor: NEGRO, borderWidth: 1.1 });
    texto(r.cantidad, COLS[1].x + 3, yy, 13.5, bold, NEGRO, "center", COLS[1].w - 6);
    texto(String(r.modelo || "").toUpperCase(), COLS[2].x + 3, yy, 13, bold, NEGRO, "left", COLS[2].w - 6);
    if (conMarca) texto(r.marca, COLS[2].x + 3, yy - 13, 9.5, font, GRIS, "left", COLS[2].w - 6);
    texto(r.color, COLS[3].x + 3, yy, 13, bold, NEGRO, "center", COLS[3].w - 6);

    if (r.sinCargo) {
      texto("SIN CARGO", COLS[4].x + 3, yy, 10.5, bold, NEGRO, "right", COLS[4].w - 6);
      texto("bonificación", COLS[4].x + 3, yy - 12, 8.5, font, GRIS, "right", COLS[4].w - 6);
      texto("$ 0", COLS[5].x + 3, yy, 11.5, font, NEGRO, "right", COLS[5].w - 6);
    } else {
      texto(fmtPeso(r.precioUnitario), COLS[4].x + 3, yy, 11.5, font, NEGRO, "right", COLS[4].w - 6);
      if (r.descuentoPct)
        texto("lista " + fmtPeso(r.precioLista) + " (-" + r.descuentoPct + "%)", COLS[4].x + 3, yy - 12, 8.5, font, GRIS, "right", COLS[4].w - 6);
      else if (r.precioLista && r.precioLista !== r.precioUnitario)
        texto("lista " + fmtPeso(r.precioLista), COLS[4].x + 3, yy - 12, 8.5, font, GRIS, "right", COLS[4].w - 6);
      texto(fmtPeso(r.cantidad * r.precioUnitario), COLS[5].x + 3, yy, 11.5, font, NEGRO, "right", COLS[5].w - 6);
    }
    y -= altoFila;
  });

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
