const fs = require("fs");
const { generarNotaPedidoPDF } = require("./api/_pdf-nota.js");

const L = { hyde: ["HYDE", 42900], caps: ["CÁPSULA", 47900], hr: ["HR", 37900], metal: ["METAL", 42900], acet: ["ACETATO", 42900], min: ["MINERAL", 42900], dis: ["DISEÑO", 46900], tr: ["TR", 33900] };
const filas = [
  [2,"FILAMENT","hyde","C3"],[1,"AETHER","hyde","C2"],[1,"EZRA","hyde","C2"],[1,"ZENTA","hyde","C4"],
  [1,"DELF","hyde","C1"],[1,"TEVA","hyde","C1"],[1,"OLIVE","caps","C3"],[1,"TRACE","caps","C4"],
  [1,"MOU","hr","C25"],[1,"RITMO","hr","C180"],[1,"LIOR","hr","C3"],[1,"GLORIA","hr","C3"],
  [1,"HUDSON","caps","C5"],[1,"ICONIC","caps","C3"],[2,"VIENA","metal","C1"],[1,"NAIROBI","metal","C3"],
  [1,"NOQUI","metal","C5"],[1,"PARIS","metal","C6"],[1,"COPENHAGEN","metal","C3"],[1,"LONDRES","acet","C5"],
  [1,"VOID","acet","C3"],[1,"ROTERDAM","acet","C2"],[1,"SNAKE","acet","C3"],[1,"BIARRITZ","acet","C3"],
  [1,"QUANTUM","acet","C3"],[1,"RIO","acet","C2"],[1,"AIR","min","C8"],[1,"SUN","min","C7"],
  [1,"BOOMER","min","C4"],[1,"SEQUOIA","acet","C1"],[1,"WILD","min","C7"],[1,"LISBOA","hr","C6"],
  [1,"ATENAS","hr","C3"],[1,"CADAQUES","hr","C1"],[1,"LIFT","hr","C04"],[1,"GENUA","min","C1"],
  [1,"RUDA","min","C6"],[1,"TEL AVIV","min","C1"],[1,"BETANCURIA","min","C5"],[1,"EMERALD","min","C4"],
  [1,"MIKO","min","C4"],[1,"CENX","dis","C4"],[1,"PEAK","tr","C5"],[1,"BALI","dis","C2"],
];
const items = filas.map(([cantidad, modelo, lk, color]) => ({
  modelo, color, cantidad, linea: L[lk][0], precioUnitario: L[lk][1],
}));

generarNotaPedidoPDF({
  pedidoId: "PED-0001",
  fechaDisplay: "9/8/2026",
  vendedor: "nicolas",
  vendedorNombre: "Nicolás",
  listaPrecio: 2,
  condVenta: "30-60-90",
  observaciones: "Pedido de muestra generado por el sistema digital — mismos artículos que la última nota manuscrita de Óptica Murano.",
  cliente: {
    nombre: "ÓPTICA MURANO — HEIMAN DIEGO NAVARRO", domicilio: "Santa Fe 309",
    localidad: "Neuquén", provincia: "Neuquén", cuit: "20-31066355-8",
    condicionIva: "C", telefono: "299-655493",
  },
  items,
}).then((buf) => {
  fs.writeFileSync("nota-pedido-muestra.pdf", buf);
  const unidades = items.reduce((a, i) => a + i.cantidad, 0);
  const total = items.reduce((a, i) => a + i.cantidad * i.precioUnitario, 0);
  console.log(`OK — ${items.length} renglones, ${unidades} unidades, total $${total.toLocaleString("es-AR")}, ${buf.length} bytes`);
});
