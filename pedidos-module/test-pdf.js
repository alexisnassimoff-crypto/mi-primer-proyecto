const fs = require("fs");
const { generarNotaPedidoPDF } = require("./api/_pdf-nota.js");

// Precios reales sin IVA de la planilla rptPreciosListasSuc
const items = [
  { marca: "CENTRAL", modelo: "TRACE", colores: [{ color: "C1", cantidad: 2 }, { color: "C4", cantidad: 5 }], precioUnitario: 43900, precioLista: 43900 },
  { marca: "CENTRAL", modelo: "ARCANE", colores: [{ color: "C1", cantidad: 1 }, { color: "C4", cantidad: 1 }, { color: "C5", cantidad: 2 }], precioUnitario: 43900, precioLista: 43900 },
  { marca: "CENTRAL", modelo: "CLIX", colores: [{ color: "C2", cantidad: 3 }], precioUnitario: 45900, precioLista: 45900 },
  { marca: "CENTRAL", modelo: "VIENA", colores: [{ color: "C1", cantidad: 2 }, { color: "C2", cantidad: 1 }, { color: "C4", cantidad: 1 }], precioUnitario: 22900, precioLista: 22900 },
  { marca: "CENTRAL", modelo: "LISBOA", colores: [{ color: "C1", cantidad: 1 }], precioUnitario: 22900, precioLista: 22900 },
  { marca: "CENTRAL", modelo: "LISBOA", colores: [{ color: "C2", cantidad: 2 }, { color: "C3", cantidad: 1 }], precioUnitario: 32900, precioLista: 32900 },
  { marca: "CENTRAL", modelo: "HUDSON", colores: [{ color: "C1", cantidad: 1 }, { color: "C2", cantidad: 1 }, { color: "C3", cantidad: 1 }], precioUnitario: 35010, precioLista: 38900, descuentoPct: 10 },
  { marca: "CENTRAL", modelo: "PEAK", colores: [{ color: "C2", cantidad: 1 }, { color: "C4", cantidad: 2 }, { color: "C5", cantidad: 1 }], precioUnitario: 29900, precioLista: 29900 },
  { marca: "JORDAN", modelo: "2045", colores: [{ color: "C1", cantidad: 2 }], precioUnitario: 35000, precioLista: 38000, precioManual: true },
  { marca: "ALBERTA FERRETTI", modelo: "10027", colores: [], cantidad: 1, precioUnitario: 5800, precioLista: 5800 },
  { marca: "CENTRAL", modelo: "AURA", colores: [{ color: "C1", cantidad: 1 }], precioUnitario: 0, precioLista: 43900, sinCargo: true },
  { marca: "CENTRAL", modelo: "ATENAS", colores: [{ color: "C1", cantidad: 1 }, { color: "C2", cantidad: 1 }, { color: "C3", cantidad: 2 }, { color: "C5", cantidad: 1 }, { color: "C6", cantidad: 1 }, { color: "C7", cantidad: 2 }, { color: "C8", cantidad: 1 }], precioUnitario: 27900, precioLista: 27900 },
];
// completar hasta ~30 renglones para probar paginación
["AERO","APEX","APOLLO","ARCADIA","ARTIC","ASTON","ASTRA","ATLAS","ATOM","AXEL","AMSTERDAM","ANDREW","ALAR","AMALFI","ARTIST","ASH","AURORA","AVIATOR"].forEach((mod, i) => {
  items.push({ marca: "CENTRAL", modelo: mod, colores: [{ color: "C" + ((i % 4) + 1), cantidad: 1 }, { color: "C" + ((i % 4) + 5), cantidad: i % 3 }].filter(c => c.cantidad), precioUnitario: 31900, precioLista: 31900 });
});

generarNotaPedidoPDF({
  pedidoId: "PED-0001",
  fechaDisplay: "9/8/2026",
  vendedorNombre: "Nicolás",
  tipoLista: "siniva",
  condVenta: "30-60-90",
  observaciones: "Pedido de muestra del sistema digital. HUDSON con 10% de descuento, JORDAN 2045 con precio manual, AURA sin cargo por bonificación.",
  cliente: {
    nombre: "ÓPTICA MURANO — HEIMAN DIEGO NAVARRO", domicilio: "Santa Fe 309",
    localidad: "Neuquén", provincia: "Neuquén", cuit: "20-31066355-8",
    condicionIva: "C", telefono: "299-655493",
  },
  items,
}).then((buf) => {
  fs.writeFileSync("nota-pedido-muestra.pdf", buf);
  const unidades = items.reduce((a, i) => a + (i.colores.length ? i.colores.reduce((x, c) => x + c.cantidad, 0) : i.cantidad || 0), 0);
  const total = items.reduce((a, i) => a + (i.sinCargo ? 0 : (i.colores.length ? i.colores.reduce((x, c) => x + c.cantidad, 0) : i.cantidad || 0) * i.precioUnitario), 0);
  console.log(`OK — ${items.length} renglones, ${unidades} unidades, total $${total.toLocaleString("es-AR")}, ${buf.length} bytes`);
});
