/* ============================================================
   Pendientes — temas de fábrica (compartidos)
   Los usa la app (window.Temas) y el servidor (require): el mismo
   nombre, alias y palabras clave en los dos lados, así «anotar por
   Siri» entiende los temas igual que la app.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.Temas = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULT_TOPICS = [
    { id: 'central', name: 'Central', color: '#0E7490', icon: 'glasses', aliases: ['trabajo', 'laburo', 'empresa', 'eyewear'],
      keywords: 'central|matias|miguel|nicolas|nico|mauro|daniela|alberto|diego|optica|opticas|muestrario|valija|valijas|mercado ?libre|ml|estuche|estuches|anteojo|anteojos|lente|lentes|marco|marcos|pedido|pedidos|cliente|clientes|proveedor|proveedores|stock|kive|contenido|web|vercel|airtable|vendedor|vendedores|crm|comision|comisiones|importacion|aduana|despachante|catalogo|exhibidor' },
    { id: 'familia', name: 'Familia', color: '#D97706', icon: 'people', aliases: ['fam', 'flia'],
      keywords: 'mama|mami|papa|papi|hermana|hermano|abuela|abuelo|familia|familiar|primo|prima|tia|tio|sobrina|sobrino|cumple|cumpleanos|asado|suegra|suegro|cunada|cunado' },
    { id: 'casa', name: 'La casa', color: '#059669', icon: 'home', aliases: ['hogar', 'depto'],
      keywords: 'casa|depto|departamento|plomero|electricista|gasista|arreglar|arreglo|pintar|pintor|limpieza|limpiar|jardin|jardinero|pileta|aire|heladera|lavarropas|cerrajero|portero|consorcio|mudanza|cortina|cortinas|lampara|cocina|bano|balcon|terraza' },
    { id: 'harper', name: 'Harper', color: '#7C3AED', icon: 'star', aliases: [], keywords: 'harper' },
    { id: 'juli', name: 'Relación con Juli', color: '#E11D48', icon: 'heart', aliases: ['julieta', 'pareja', 'nosotros'], keywords: 'juli|julieta|aniversario|cita|cena romantica' },
    { id: 'gastos', name: 'Gastos de la casa', color: '#2563EB', icon: 'wallet', aliases: ['gasto', 'pagos', 'pago', 'cuentas'],
      keywords: 'pagar|pago|factura|expensas|cuota|cuotas|luz|gas|agua|internet|abl|impuesto|impuestos|seguro|prepaga|alquiler|tarjeta|vence|vencimiento|monotributo|afip|arca|edesur|edenor|metrogas|aysa|colegio|cuota del colegio|obra social|patente' },
    { id: 'compras', name: 'Compras de la casa', color: '#65A30D', icon: 'cart', aliases: ['compra', 'super', 'lista'],
      keywords: 'comprar|compra|compras|super|supermercado|verduleria|carniceria|panaderia|farmacia|chino|dietetica|panales|comida|mercado|leche|pan|huevos|carne|verdura|fruta|yerba|cafe|jabon|papel higienico|shampoo' },
    { id: 'otros', name: 'Otros', color: '#6B7280', icon: 'tag', aliases: ['otro', 'varios'], keywords: '' }
  ];
  /* al adivinar el tema por el texto, se prueba en este orden */
  var SUGGEST_ORDER = ['harper', 'juli', 'familia', 'compras', 'gastos', 'casa', 'central'];

  return { DEFAULT_TOPICS: DEFAULT_TOPICS, SUGGEST_ORDER: SUGGEST_ORDER };
}));
