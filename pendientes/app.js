/* ============================================================
   Pendientes — app
   Todo vive en localStorage de este dispositivo. Sin dependencias.
   Módulos: ics.js (archivos .ics) y parser.js (carga rápida en castellano).
   ============================================================ */
(function () {
'use strict';

/* ---------- utilidades ---------- */
const $ = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => (n < 10 ? '0' : '') + n;
const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const uid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
const clone = o => JSON.parse(JSON.stringify(o));
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const fromYmd = s => { const p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
const todayStr = () => ymd(new Date());
const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const slug = s => Parser.plain(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'evento';
const short = s => s.replace(/\.$/, '');
const F = {
  wdLong: new Intl.DateTimeFormat('es-AR', { weekday: 'long' }),
  wdShort: new Intl.DateTimeFormat('es-AR', { weekday: 'short' }),
  moLong: new Intl.DateTimeFormat('es-AR', { month: 'long' }),
  moShort: new Intl.DateTimeFormat('es-AR', { month: 'short' }),
  money0: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }),
  money2: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 })
};
const fmtMoney = n => (Number.isInteger(n) ? F.money0 : F.money2).format(n);

/* ---------- íconos (trazo, 24×24) ---------- */
const ICONS = {
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  glasses: '<circle cx="6.5" cy="14.5" r="3.5"/><circle cx="17.5" cy="14.5" r="3.5"/><path d="M10 14.5h4M3 14.5l1.8-6.5h2.7M21 14.5l-1.8-6.5h-2.7"/>',
  people: '<circle cx="9" cy="8" r="3.25"/><path d="M3 19.5a6 6 0 0 1 12 0"/><circle cx="17" cy="9.5" r="2.5"/><path d="M15.5 15.2a4.5 4.5 0 0 1 6 4.3"/>',
  home: '<path d="M3.5 11.5L12 4.5l8.5 7"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
  star: '<path d="M12 3.5l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17.4l-5.4 2.9 1.1-6.1-4.5-4.3 6.1-.8z"/>',
  heart: '<path d="M12 20.3S3.5 15.3 3.5 9.3A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 8.5 2.1c0 6-8.5 11-8.5 11z"/>',
  wallet: '<path d="M3.5 7.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2V9"/><path d="M3.5 7.5v10a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2h-13a2 2 0 0 1-2-2"/><path d="M16 14.5h1.5"/>',
  cart: '<path d="M3 4.5h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h7.8a1.5 1.5 0 0 0 1.5-1.1L20 8.5H6.3"/><circle cx="10" cy="19.5" r="1.2"/><circle cx="16.5" cy="19.5" r="1.2"/>',
  tag: '<path d="M3.5 11.5V4.5h7l9 9-7 7z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
  briefcase: '<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2M3.5 12.5h17"/>',
  bell: '<path d="M6.5 16.5v-5a5.5 5.5 0 0 1 11 0v5l1.5 2h-14z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  pin: '<path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.3 12 21 12 21z"/><circle cx="12" cy="10" r="2.3"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  auto: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor"/>',
  sliders: '<path d="M4 6.5h9M18 6.5h2M4 12h2M11 12h9M4 17.5h11M20 17.5h0"/><circle cx="15.5" cy="6.5" r="2"/><circle cx="8.5" cy="12" r="2"/><circle cx="17.5" cy="17.5" r="2"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  trash: '<path d="M4.5 6.5h15M9.5 6.5v-2h5v2M7 6.5l.8 13h8.4l.8-13"/>',
  share: '<path d="M12 3.5v11M8 7.5l4-4 4 4"/><path d="M5.5 11.5v7a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-7"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M3.5 7.5l8.5 6 8.5-6"/>',
  whatsapp: '<path fill="currentColor" stroke="none" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.42 1.31-1.96 1.36-.5.05-.98.23-3.3-.69-2.78-1.1-4.55-3.94-4.69-4.12-.14-.18-1.13-1.5-1.13-2.86 0-1.36.71-2.03.96-2.31.25-.28.55-.35.73-.35h.52c.17 0 .4-.06.62.48.24.57.8 1.98.87 2.12.07.14.12.31.02.49-.09.18-.14.29-.28.45-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.28.72 1.18 1.54 1.91 1.06.94 1.95 1.23 2.23 1.37.28.14.44.12.6-.07.17-.19.7-.81.88-1.09.19-.28.37-.23.63-.14.25.09 1.62.76 1.9.9.28.14.46.21.53.33.07.11.07.64-.17 1.32Z"/>',
  google: '<circle cx="12" cy="12" r="8.5"/><text x="12" y="16" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor" stroke="none" font-family="system-ui,sans-serif">G</text>',
  repeat: '<path d="M17 2.5l3 3-3 3"/><path d="M4 11V8.5a3 3 0 0 1 3-3h13"/><path d="M7 21.5l-3-3 3-3"/><path d="M20 13v2.5a3 3 0 0 1-3 3H4"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  money: '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  car: '<path d="M4 15l1.5-5a2 2 0 0 1 1.9-1.5h9.2a2 2 0 0 1 1.9 1.5L20 15"/><rect x="3" y="15" width="18" height="4.5" rx="1.5"/><circle cx="7.5" cy="17.3" r="1" fill="currentColor"/><circle cx="16.5" cy="17.3" r="1" fill="currentColor"/>',
  book: '<path d="M4.5 4.5h6a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5h-6.5z"/><path d="M19.5 4.5h-6a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5h6.5z"/>',
  gift: '<rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M3.5 13h17M12 9v11"/><path d="M12 9c-2-.5-4.5-.5-5-2.5S9 3 12 9c3-6 5.5-4.5 5-2.5S14 8.5 12 9z"/>',
  plane: '<path d="M21 3L10.5 13.5M21 3l-7 18-3.5-7.5L3 10z"/>',
  tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  phone: '<path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5L16 14l4 1.5V19a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  paw: '<circle cx="7" cy="9" r="1.8"/><circle cx="11" cy="6" r="1.8"/><circle cx="15.5" cy="6.5" r="1.8"/><circle cx="19" cy="10" r="1.8"/><path d="M8 17.5c0-3 2-5 5-5s5 2 5 5c0 2-1.5 3-3 3s-2-1-2-1-.5 1-2 1-3-1-3-3z"/>',
  eye: '<path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/>',
  more: '<circle cx="6" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="18" cy="12" r="1.3" fill="currentColor"/>'
};
const icon = (name, cls) => `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.tag}</svg>`;
const TOPIC_ICONS = ['tag', 'briefcase', 'glasses', 'people', 'home', 'star', 'heart', 'wallet', 'money', 'cart', 'car', 'book', 'gift', 'plane', 'tool', 'phone', 'sparkle', 'paw', 'flag', 'calendar'];
const ICON_LABELS = { tag: 'Etiqueta', briefcase: 'Maletín', glasses: 'Anteojos', people: 'Personas', home: 'Casa', star: 'Estrella', heart: 'Corazón', wallet: 'Billetera', money: 'Dinero', cart: 'Carrito', car: 'Auto', book: 'Libro', gift: 'Regalo', plane: 'Avión', tool: 'Herramienta', phone: 'Teléfono', sparkle: 'Brillo', paw: 'Mascota', flag: 'Bandera', calendar: 'Calendario' };
const PALETTE = ['#0E7490', '#D97706', '#059669', '#7C3AED', '#E11D48', '#2563EB', '#65A30D', '#DB2777', '#0891B2', '#9333EA'];

/* ---------- datos por defecto ---------- */
const DEFAULT_TOPICS = [
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
const SUGGEST_ORDER = ['harper', 'juli', 'familia', 'compras', 'gastos', 'casa', 'central'];
const KINDS = { tarea: { label: 'Tarea', icon: 'check' }, reunion: { label: 'Reunión', icon: 'people' }, recordatorio: { label: 'Recordatorio', icon: 'bell' } };
const ALERTS_TIMED = [['', 'Sin alerta'], ['0', 'En el momento'], ['5', '5 min antes'], ['10', '10 min antes'], ['15', '15 min antes'], ['30', '30 min antes'], ['60', '1 hora antes'], ['120', '2 horas antes'], ['1440', '1 día antes'], ['2880', '2 días antes'], ['10080', '1 semana antes']];
const ALERTS_ALLDAY = [['', 'Sin alerta'], ['-540', 'Ese día, 9:00'], ['900', '1 día antes, 9:00'], ['2340', '2 días antes, 9:00'], ['9540', '1 semana antes, 9:00']];
const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240, 480];
const REPEATS = [['none', 'No se repite'], ['daily', 'Todos los días'], ['weekly', 'Todas las semanas'], ['monthly', 'Todos los meses'], ['yearly', 'Todos los años']];
const DEFAULT_SETTINGS = { name: '', email: '', alertTimed: 15, alertAllDay: -540, meetingDuration: 60, theme: 'auto' };
const DB_KEY = 'pendientes.v1';

/* ---------- estado ---------- */
function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(DB_KEY) || 'null'); } catch (e) { s = null; }
  if (!s || typeof s !== 'object') s = {};
  s.items = Array.isArray(s.items) ? s.items : [];
  s.settings = Object.assign({}, DEFAULT_SETTINGS, s.settings || {});
  s.people = Array.isArray(s.people) ? s.people : [];
  s.places = Array.isArray(s.places) ? s.places : [];
  const mine = Array.isArray(s.topics) && s.topics.length ? s.topics : clone(DEFAULT_TOPICS);
  /* los temas de fábrica reciben alias y palabras clave actualizadas; lo que editó el usuario se respeta */
  s.topics = mine.map(t => { const d = DEFAULT_TOPICS.find(x => x.id === t.id); return d ? Object.assign({}, t, { aliases: d.aliases, keywords: d.keywords }) : t; });
  if (!s.topics.some(t => t.id === 'otros')) s.topics.push(clone(DEFAULT_TOPICS[DEFAULT_TOPICS.length - 1]));
  return s;
}
let state = load();
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(DB_KEY, JSON.stringify(state)); } catch (e) { toast('No se pudo guardar en este navegador (¿modo privado?)'); } }, 40);
}
const ui = { view: 'temas', filter: null, query: '', showDone: false, composerTopic: 'auto', editing: null, apiOk: false };
try { ui.composerTopic = localStorage.getItem('pendientes.ctopic') || 'auto'; } catch (e) {}

/* ---------- ítems ---------- */
const byId = id => state.items.find(x => x.id === id);
const topicOf = id => state.topics.find(t => t.id === id) || state.topics.find(t => t.id === 'otros') || state.topics[0];
function itemStart(it) { if (!it.date) return null; const d = fromYmd(it.date); if (it.time) { const p = it.time.split(':'); d.setHours(+p[0], +p[1], 0, 0); } return d; }
function itemEnd(it) { const s = itemStart(it); if (!s) return null; if (!it.time) return addDays(s, 1); return new Date(s.getTime() + (it.duration || 60) * 60000); }
function dayDiff(dateStr) { return Math.round((fromYmd(dateStr) - fromYmd(todayStr())) / 86400000); }
function isOverdue(it) { if (it.done || !it.date) return false; const dd = dayDiff(it.date); if (dd < 0) return true; return dd === 0 && !!it.time && itemStart(it).getTime() < Date.now(); }
function whenLabel(it) {
  if (!it.date) return '';
  const dd = dayDiff(it.date), d = fromYmd(it.date); let s;
  if (dd === 0) s = 'Hoy'; else if (dd === 1) s = 'Mañana'; else if (dd === -1) s = 'Ayer';
  else if (dd > 1 && dd < 7) s = cap(F.wdLong.format(d));
  else { s = short(F.wdShort.format(d)) + ' ' + d.getDate() + ' ' + short(F.moShort.format(d)); if (d.getFullYear() !== new Date().getFullYear()) s += ' ' + d.getFullYear(); }
  if (it.time) s += ' · ' + it.time;
  return s;
}
function longWhen(it) {
  const d = fromYmd(it.date);
  let s = cap(F.wdLong.format(d)) + ' ' + d.getDate() + ' de ' + F.moLong.format(d);
  if (d.getFullYear() !== new Date().getFullYear()) s += ' de ' + d.getFullYear();
  if (it.time) { const e = itemEnd(it); s += ' · ' + it.time + ' a ' + pad(e.getHours()) + ':' + pad(e.getMinutes()); } else s += ' · todo el día';
  return s;
}
function sortPending(a, b) {
  const sa = itemStart(a), sb = itemStart(b);
  if (sa && sb && sa - sb) return sa - sb;
  if (sa && !sb) return -1; if (!sa && sb) return 1;
  if ((b.priority || 0) - (a.priority || 0)) return (b.priority || 0) - (a.priority || 0);
  return (b.createdAt || 0) - (a.createdAt || 0);
}
function matchesQuery(it) {
  if (!ui.query) return true;
  const hay = Parser.plain([it.title, it.notes, it.location, (it.invitees || []).join(' '), topicOf(it.topic).name].join(' '));
  return hay.indexOf(Parser.plain(ui.query)) >= 0;
}
const pending = () => state.items.filter(it => !it.done && matchesQuery(it));
function counts() {
  const p = pending();
  return {
    overdue: p.filter(it => it.date && dayDiff(it.date) < 0).length,
    today: p.filter(it => it.date && dayDiff(it.date) === 0).length,
    week: p.filter(it => it.date && dayDiff(it.date) > 0 && dayDiff(it.date) <= 7).length,
    undated: p.filter(it => !it.date).length,
    total: p.length
  };
}
function durLabel(m) { m = Number(m); if (!m) return ''; if (m < 60) return m + ' min'; const h = Math.floor(m / 60), r = m % 60; return r ? h + ' h ' + pad(r) : h + ' h'; }
function repeatLabel(r) { const x = REPEATS.find(o => o[0] === r); return x ? x[1] : ''; }
function alertLabelFor(min, allDay) {
  if (min === null || min === undefined || min === '') return 'Sin alerta';
  const list = allDay ? ALERTS_ALLDAY : ALERTS_TIMED;
  const hit = list.find(o => o[0] === String(min));
  if (hit) return hit[1];
  min = Number(min);
  if (min === 0) return 'En el momento';
  const a = Math.abs(min), u = a % 1440 === 0 ? (a / 1440) + (a === 1440 ? ' día' : ' días') : a % 60 === 0 ? (a / 60) + ' h' : a + ' min';
  return min > 0 ? u + ' antes' : u + ' después';
}
function defaultAlertFor(date, time) { if (!date) return null; return time ? state.settings.alertTimed : state.settings.alertAllDay; }

/* ---------- render ---------- */
function renderAll() {
  renderHeader(); renderKpis(); renderSegExtra();
  if (ui.view === 'temas') renderTemas(); else renderAgenda();
  $('#viewTemas').hidden = ui.view !== 'temas';
  $('#viewAgenda').hidden = ui.view !== 'agenda';
  $$('.seg [role="tab"]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.view === ui.view)));
}
function renderHeader() {
  const d = new Date();
  $('#todayLabel').textContent = cap(F.wdLong.format(d)) + ' ' + d.getDate() + ' de ' + F.moLong.format(d);
  const c = counts();
  $('#eyebrow').textContent = 'Pendientes · ' + (c.total === 1 ? '1 abierto' : c.total + ' abiertos');
}
function renderKpis() {
  const c = counts();
  const tiles = [['overdue', 'Vencidos', c.overdue, 'is-danger'], ['today', 'Hoy', c.today, 'is-today'], ['week', '7 días', c.week, ''], ['undated', 'Sin fecha', c.undated, '']];
  $('#kpis').innerHTML = tiles.map(t => `<button type="button" class="kpi ${t[3]}${t[2] ? ' has' : ''}" data-filter="${t[0]}" aria-pressed="${ui.filter === t[0]}"><span class="kpi__n">${t[2]}</span><span class="kpi__l">${t[1]}</span></button>`).join('');
}
function renderSegExtra() {
  const el = $('#segExtra');
  if (ui.view !== 'agenda') { el.innerHTML = ui.query ? `<span class="chip is-on">«${esc(ui.query)}»</span>` : ''; return; }
  const names = { overdue: 'Vencidos', today: 'Hoy', week: '7 días', undated: 'Sin fecha' };
  el.innerHTML = (ui.filter ? `<button type="button" class="chip is-on" data-act="clear-filter">${names[ui.filter]} ${icon('x')}</button>` : '') +
    `<label><input type="checkbox" id="showDone"${ui.showDone ? ' checked' : ''}> Hechas</label>`;
}
/* En el iPhone el link al .ics va en la misma pestaña: Safari muestra la hoja nativa de Calendario.
   En una pestaña nueva queda la pantalla en blanco. En otros dispositivos se descarga el archivo. */
function icsAttrs(it) { return isIOS() ? '' : ` download="${esc(slug(it.title || 'evento'))}.ics"`; }
function calLink(it, cls, label) {
  const inner = icon('calendar') + (label ? `<span>${label}</span>` : '');
  if (ui.apiOk) return `<a class="${cls}" href="${esc(links(it).ios)}"${icsAttrs(it)} aria-label="Agregar al calendario" title="Agregar al calendario">${inner}</a>`;
  return `<button type="button" class="${cls}" data-act="cal" aria-label="Agregar al calendario" title="Agregar al calendario">${inner}</button>`;
}
function itemRow(it, opts) {
  opts = opts || {};
  const tp = topicOf(it.topic), over = isOverdue(it), dd = it.date ? dayDiff(it.date) : null;
  const meta = [];
  if (it.date) meta.push(`<span class="when${over ? ' is-overdue' : dd === 0 ? ' is-today' : ''}">${icon(it.time ? 'clock' : 'calendar')}${esc(whenLabel(it))}</span>`);
  if (opts.showTopic) meta.push(`<span class="meta meta--topic" style="--tc:${esc(tp.color)}"><i class="dot"></i>${esc(tp.name)}</span>`);
  if (it.kind === 'reunion') meta.push(`<span class="meta">${icon('people')}${it.invitees && it.invitees.length ? esc(it.invitees.slice(0, 2).join(', ')) + (it.invitees.length > 2 ? ' +' + (it.invitees.length - 2) : '') : 'Reunión'}</span>`);
  else if (it.kind === 'recordatorio') meta.push(`<span class="meta">${icon('bell')}Recordatorio</span>`);
  if (it.date && it.alert !== null && it.alert !== undefined && it.alert !== '') meta.push(`<span class="meta">${icon('bell')}${esc(alertLabelFor(it.alert, !it.time))}</span>`);
  if (it.repeat && it.repeat !== 'none') meta.push(`<span class="meta">${icon('repeat')}${esc(repeatLabel(it.repeat))}</span>`);
  if (it.location) meta.push(`<span class="meta">${icon('pin')}${esc(it.location)}</span>`);
  if (it.amount !== null && it.amount !== undefined) meta.push(`<span class="meta meta--amt">${esc(fmtMoney(it.amount))}</span>`);
  if (it.notes && opts.showNotes) meta.push(`<span class="meta">${esc(it.notes.slice(0, 60))}</span>`);
  return `<li class="item${it.done ? ' is-done' : ''}${over ? ' is-overdue' : ''}${it.priority ? ' is-pri' : ''}" data-id="${esc(it.id)}">
    <button type="button" class="check" data-act="toggle" aria-label="${it.done ? 'Volver a pendiente' : 'Marcar hecha'}" aria-pressed="${!!it.done}">${icon('check')}</button>
    <div class="item__body" data-act="open" role="button" tabindex="0" aria-label="Abrir: ${esc(it.title)}"><div class="item__title">${it.priority ? '<span class="pri" title="Prioridad alta"></span>' : ''}<span>${esc(it.title)}</span></div>${meta.length ? `<div class="item__meta">${meta.join('')}</div>` : ''}</div>
    ${it.date && !it.done ? calLink(it, 'item__cal') : ''}
  </li>`;
}
function helloCard() {
  const ex = ['Llamar a Matías mañana 10:00 #central !30m', 'Pagar expensas el 10 $185.000', 'Cena con Juli viernes a la noche', 'Pediatra Harper 15/10 9hs !1d', 'Comprar pañales y leche', 'Plomero pasado mañana a la tarde'];
  return `<section class="hello">
    <h2 class="hello__title">Escribilo como lo dirías.</h2>
    <p>La barra de abajo entiende fechas, horas, temas, alertas, invitados y montos. Tocá un ejemplo para probarlo:</p>
    <ul class="hello__ex">${ex.map(e => `<li><code data-act="example">${esc(e)}</code></li>`).join('')}</ul>
    <p>Cada pendiente con fecha se manda al calendario del iPhone con un toque, con su alerta y sus invitados.</p>
    <button type="button" class="btn btn--ghost" data-act="samples">Cargar ejemplos para ver cómo queda</button>
  </section>`;
}
function renderTemas() {
  const el = $('#viewTemas'), p = pending();
  let html = state.items.length ? '' : helloCard();
  html += '<div class="board">';
  state.topics.forEach(tp => {
    if (tp.hidden) return;
    const its = p.filter(it => it.topic === tp.id).sort(sortPending);
    const done = state.items.filter(it => it.done && it.topic === tp.id && matchesQuery(it)).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
    if (tp.id === 'otros' && !its.length && !done.length) return;
    if (ui.query && !its.length && !done.length) return;
    const sum = its.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    html += `<section class="topic" style="--tc:${esc(tp.color)}" data-topic="${esc(tp.id)}">
      <header class="topic__head"><span class="topic__icon">${icon(tp.icon)}</span><h2 class="topic__name">${esc(tp.name)}</h2><span class="topic__count">${its.length}</span>${sum ? `<span class="topic__sum">${esc(fmtMoney(sum))}</span>` : ''}<button type="button" class="icon-btn topic__add" data-act="add-topic" data-topic="${esc(tp.id)}" aria-label="Agregar en ${esc(tp.name)}">${icon('plus')}</button></header>
      ${its.length ? `<ul class="list">${its.map(it => itemRow(it)).join('')}</ul>` : '<p class="empty">Nada pendiente.</p>'}
      ${done.length ? `<details class="done"><summary>Hechas · ${done.length}</summary><ul class="list">${done.slice(0, 25).map(it => itemRow(it)).join('')}</ul></details>` : ''}
    </section>`;
  });
  html += '</div>';
  el.innerHTML = html;
}
function dayGroup(dateStr, items) {
  const d = fromYmd(dateStr), dd = dayDiff(dateStr);
  const full = cap(F.wdLong.format(d)) + ' ' + d.getDate() + ' de ' + F.moLong.format(d) + (d.getFullYear() !== new Date().getFullYear() ? ' de ' + d.getFullYear() : '');
  const name = dd === 0 ? 'Hoy' : dd === 1 ? 'Mañana' : cap(F.wdLong.format(d)) + ' ' + d.getDate();
  const sub = dd <= 1 ? full : F.moLong.format(d) + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : '') + ' · en ' + dd + ' días';
  return { name, sub, items, kind: dd === 0 ? 'today' : 'future' };
}
function renderAgenda() {
  const el = $('#viewAgenda'), p = pending().sort(sortPending), f = ui.filter, groups = [];
  const overdue = p.filter(it => it.date && dayDiff(it.date) < 0);
  const undated = p.filter(it => !it.date);
  const byDay = {};
  p.filter(it => it.date && dayDiff(it.date) >= 0).forEach(it => { (byDay[it.date] = byDay[it.date] || []).push(it); });
  const days = Object.keys(byDay).sort();
  if (f === 'overdue') groups.push({ name: 'Vencidos', sub: overdue.length ? overdue.length + ' sin resolver' : '', items: overdue, kind: 'overdue' });
  else if (f === 'today') groups.push(dayGroup(todayStr(), byDay[todayStr()] || []));
  else if (f === 'week') { const wk = days.filter(d => dayDiff(d) > 0 && dayDiff(d) <= 7); if (!wk.length) groups.push({ name: 'Próximos 7 días', sub: '', items: [], kind: 'future' }); wk.forEach(d => groups.push(dayGroup(d, byDay[d]))); }
  else if (f === 'undated') groups.push({ name: 'Sin fecha', sub: 'Ponele fecha a lo que importa', items: undated, kind: 'undated' });
  else {
    if (overdue.length) groups.push({ name: 'Vencidos', sub: overdue.length + ' sin resolver', items: overdue, kind: 'overdue' });
    if (!byDay[todayStr()]) groups.push(dayGroup(todayStr(), []));
    days.forEach(d => groups.push(dayGroup(d, byDay[d])));
    if (undated.length) groups.push({ name: 'Sin fecha', sub: undated.length + (undated.length === 1 ? ' pendiente' : ' pendientes'), items: undated, kind: 'undated' });
  }
  if (ui.showDone) {
    const done = state.items.filter(it => it.done && matchesQuery(it)).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
    if (done.length) groups.push({ name: 'Hechas', sub: done.length + ' en total', items: done.slice(0, 60), kind: 'done' });
  }
  el.innerHTML = groups.map(g => `<section class="day day--${g.kind}"><header class="day__head"><h2 class="day__name">${esc(g.name)}</h2><span class="day__sub">${esc(g.sub)}</span></header>${g.items.length ? `<ul class="list">${g.items.map(it => itemRow(it, { showTopic: true })).join('')}</ul>` : `<p class="empty">${g.kind === 'today' ? 'Nada para hoy. Buen momento para adelantar algo de la lista.' : 'Nada por acá.'}</p>`}</section>`).join('');
}

/* ---------- calendario e invitaciones ---------- */
function toEvent(it) {
  const tp = topicOf(it.topic);
  const desc = [it.notes, it.amount !== null && it.amount !== undefined ? 'Monto: ' + fmtMoney(it.amount) : '', 'Tema: ' + tp.name, it.invitees && it.invitees.length ? 'Con: ' + it.invitees.join(', ') : ''].filter(Boolean).join('\n');
  const alarms = [it.alert, it.alert2].filter(v => v !== null && v !== undefined && v !== '' && !isNaN(v)).map(Number);
  return {
    uid: (it.id || uid()) + '@pendientes', title: it.title, description: desc, location: it.location || '',
    start: itemStart(it), end: itemEnd(it), allDay: !it.time, alarms,
    rrule: it.repeat && it.repeat !== 'none' ? 'FREQ=' + it.repeat.toUpperCase() : '',
    organizer: state.settings.email ? { name: state.settings.name, email: state.settings.email } : null,
    attendees: (it.invitees || []).map(ICS.parseWho).filter(a => a.email), priority: it.priority ? 1 : 0
  };
}
function inviteText(it, link) {
  const lines = ['📅 ' + it.title, '🗓 ' + longWhen(it)];
  if (it.location) lines.push('📍 ' + it.location);
  if (it.notes) lines.push('📝 ' + it.notes);
  if (state.settings.name) lines.push('— ' + state.settings.name);
  if (link) lines.push('', '➕ Agregar a tu calendario: ' + link);
  return lines.join('\n');
}
function links(it) {
  const ev = toEvent(it);
  const ios = ui.apiOk ? '/api/ics?' + new URLSearchParams(ICS.paramsFromEvent(ev)).toString() : null;
  const g = new URLSearchParams({ action: 'TEMPLATE', text: ev.title, dates: ev.allDay ? ICS.toDateOnly(ev.start) + '/' + ICS.toDateOnly(ev.end) : ICS.toUTC(ev.start) + '/' + ICS.toUTC(ev.end) });
  if (ev.description) g.set('details', ev.description);
  if (ev.location) g.set('location', ev.location);
  const emails = ev.attendees.map(a => a.email);
  if (emails.length) g.set('add', emails.join(','));
  if (ev.rrule) g.set('recur', 'RRULE:' + ev.rrule);
  const text = inviteText(it, ios ? location.origin + ios : null);
  return {
    ios, text,
    google: 'https://calendar.google.com/calendar/render?' + g.toString(),
    wa: 'https://wa.me/?text=' + encodeURIComponent(text),
    mail: 'mailto:' + emails.join(',') + '?subject=' + encodeURIComponent(it.title) + '&body=' + encodeURIComponent(text)
  };
}
function downloadIcs(items, name) {
  const text = ICS.build({ events: items.map(toEvent), name: 'Pendientes' });
  if (ui.apiOk && items.length > 1) { postIcs(text, name); return; }
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name + '.ics'; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  if (isIOS()) toast('Se descargó el .ics: abrilo desde Descargas y tocá «Añadir todo».');
}
function postIcs(text, name) {
  const f = document.createElement('form'); f.method = 'POST'; f.action = '/api/ics'; f.target = isIOS() ? '_self' : '_blank'; f.hidden = true;
  const t = document.createElement('textarea'); t.name = 'ics'; t.value = text;
  const n = document.createElement('input'); n.type = 'hidden'; n.name = 'f'; n.value = name;
  f.appendChild(t); f.appendChild(n); document.body.appendChild(f); f.submit(); setTimeout(() => f.remove(), 1000);
}
function copyText(text) {
  const done = () => toast('Copiado. Pegalo donde quieras.');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
  else fallbackCopy(text, done);
}
function fallbackCopy(text, done) {
  const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
  document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('No se pudo copiar'); } t.remove();
}
function calActionsHtml(it) {
  if (!it.date) return '<p class="cal-hint">Ponele fecha para mandarlo al calendario o invitar a alguien.</p>';
  const L = links(it), iosLabel = isIOS() ? 'Agregar al iPhone' : 'Calendario (.ics)';
  const first = L.ios ? `<a class="cal-btn cal-btn--primary" href="${esc(L.ios)}"${icsAttrs(it)}>${icon('calendar')}${iosLabel}</a>`
    : `<button type="button" class="cal-btn cal-btn--primary" data-act="ics">${icon('calendar')}${iosLabel}</button>`;
  return first +
    `<a class="cal-btn" href="${esc(L.google)}" target="_blank" rel="noopener">${icon('google')}Google</a>` +
    `<a class="cal-btn" href="${esc(L.wa)}" target="_blank" rel="noopener">${icon('whatsapp')}WhatsApp</a>` +
    `<a class="cal-btn" href="${esc(L.mail)}">${icon('mail')}Mail</a>` +
    `<button type="button" class="cal-btn" data-act="copy">${icon('copy')}Copiar</button>` +
    (navigator.share ? `<button type="button" class="cal-btn" data-act="share">${icon('share')}Compartir</button>` : '');
}

/* ---------- mutaciones ---------- */
function rememberPeople(it) {
  (it.invitees || []).forEach(p => { if (p && state.people.indexOf(p) < 0) state.people.unshift(p); });
  if (it.location && state.places.indexOf(it.location) < 0) state.places.unshift(it.location);
  state.people = state.people.slice(0, 60); state.places = state.places.slice(0, 40);
}
function addItem(it) { state.items.unshift(it); rememberPeople(it); save(); renderAll(); }
function nextOccurrence(dateStr, repeat) {
  const d = fromYmd(dateStr), today = fromYmd(todayStr());
  let guard = 0;
  do {
    if (repeat === 'daily') d.setDate(d.getDate() + 1);
    else if (repeat === 'weekly') d.setDate(d.getDate() + 7);
    else if (repeat === 'monthly') d.setMonth(d.getMonth() + 1);
    else d.setFullYear(d.getFullYear() + 1);
  } while (d <= today && ++guard < 1000);
  return ymd(d);
}
function toggleDone(id) {
  const it = byId(id); if (!it) return;
  if (!it.done && it.repeat && it.repeat !== 'none' && it.date) {
    const prev = it.date; it.date = nextOccurrence(it.date, it.repeat); it.updatedAt = Date.now(); save(); renderAll();
    toast('Hecha. Se repite: pasa a ' + whenLabel(it), [{ label: 'Deshacer', fn: () => { it.date = prev; save(); renderAll(); } }]);
    return;
  }
  it.done = !it.done; it.doneAt = it.done ? Date.now() : null; it.updatedAt = Date.now(); save(); renderAll();
  toast(it.done ? 'Hecha: ' + it.title : 'Vuelve a pendientes', [{ label: 'Deshacer', fn: () => { it.done = !it.done; it.doneAt = it.done ? Date.now() : null; save(); renderAll(); } }]);
}
function removeItem(id) {
  const idx = state.items.findIndex(x => x.id === id); if (idx < 0) return;
  const it = state.items[idx]; state.items.splice(idx, 1); save(); renderAll();
  toast('Eliminado: ' + it.title, [{ label: 'Deshacer', fn: () => { state.items.splice(Math.min(idx, state.items.length), 0, it); save(); renderAll(); } }]);
}
function resolveTopic(parsed, text) {
  if (parsed.topic) return { id: parsed.topic, auto: false };
  if (ui.composerTopic !== 'auto' && topicOf(ui.composerTopic).id === ui.composerTopic) return { id: ui.composerTopic, auto: false };
  const ordered = SUGGEST_ORDER.map(id => state.topics.find(t => t.id === id)).filter(Boolean).concat(state.topics.filter(t => SUGGEST_ORDER.indexOf(t.id) < 0));
  return { id: Parser.suggestTopic(text, parsed, ordered) || 'otros', auto: true };
}
function buildFromParse(p, text) {
  const t = resolveTopic(p, text);
  return {
    id: uid(), title: p.title || text.trim(), notes: '', topic: t.id, kind: p.kind, date: p.date, time: p.time,
    duration: p.duration || (p.time ? (p.kind === 'reunion' ? Number(state.settings.meetingDuration) : 60) : null),
    alert: p.alert !== undefined ? p.alert : defaultAlertFor(p.date, p.time), alert2: p.alert2 !== undefined && p.alert2 !== null ? p.alert2 : null,
    repeat: p.repeat || 'none', invitees: p.invitees, location: p.location || '', amount: p.amount, priority: p.priority,
    done: false, doneAt: null, createdAt: Date.now(), updatedAt: Date.now()
  };
}
function loadSamples() {
  const t = fromYmd(todayStr()), dow = t.getDay();
  const fri = addDays(t, ((5 - dow + 7) % 7) || 7), sun = addDays(t, ((0 - dow + 7) % 7) || 7);
  const mk = (o) => Object.assign({ id: uid(), notes: 'Ejemplo: borralo cuando quieras.', kind: 'tarea', date: null, time: null, duration: null, alert: null, alert2: null, repeat: 'none', invitees: [], location: '', amount: null, priority: 0, done: false, doneAt: null, createdAt: Date.now(), updatedAt: Date.now() }, o);
  const s = [
    mk({ title: 'Llamar a Matías por la ruta de Córdoba', topic: 'central', kind: 'reunion', date: ymd(addDays(t, 1)), time: '10:00', duration: 30, alert: 15, invitees: ['Matías'] }),
    mk({ title: 'Revisar stock de estuches', topic: 'central', priority: 1 }),
    mk({ title: 'Pagar expensas', topic: 'gastos', date: ymd(new Date(t.getFullYear(), t.getMonth(), 10) <= t ? new Date(t.getFullYear(), t.getMonth() + 1, 10) : new Date(t.getFullYear(), t.getMonth(), 10)), alert: -540, amount: 185000, repeat: 'monthly' }),
    mk({ title: 'Comprar pañales y leche', topic: 'compras' }),
    mk({ title: 'Pediatra Harper', topic: 'harper', date: ymd(addDays(t, 3)), time: '09:00', duration: 45, alert: 60, alert2: 1440 }),
    mk({ title: 'Cena con Juli', topic: 'juli', kind: 'reunion', date: ymd(fri), time: '20:30', duration: 120, alert: 60 }),
    mk({ title: 'Plomero: pérdida en la cocina', topic: 'casa', date: ymd(addDays(t, 2)), time: '15:00', duration: 60, alert: 30 }),
    mk({ title: 'Asado familiar', topic: 'familia', kind: 'reunion', date: ymd(sun), time: '13:00', duration: 240, alert: 120 }),
    mk({ title: 'Mandar muestrario a Mendoza', topic: 'central', date: ymd(addDays(t, -2)), alert: -540 })
  ];
  s.forEach(it => state.items.push(it));
  save(); renderAll();
  toast('Cargué 9 ejemplos. Marcalos o borralos cuando quieras.');
}

/* ---------- aviso (toast) ---------- */
let toastTimer = null;
function toast(msg, actions) {
  const el = $('#toast');
  el.innerHTML = `<span class="toast__msg">${esc(msg)}</span>` + (actions && actions.length ? `<span class="toast__acts">${actions.map((a, i) => {
    if (a.cal) return ui.apiOk ? `<a href="${esc(links(a.cal).ios)}"${icsAttrs(a.cal)}>${esc(a.label)}</a>` : `<button type="button" data-ti="${i}">${esc(a.label)}</button>`;
    return `<button type="button" data-ti="${i}">${esc(a.label)}</button>`;
  }).join('')}</span>` : '');
  el.hidden = false;
  el.onclick = e => { const b = e.target.closest('[data-ti]'); if (!b) return; const a = actions[+b.dataset.ti]; if (a.cal) downloadIcs([a.cal], slug(a.cal.title)); else if (a.fn) a.fn(); el.hidden = true; };
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, actions && actions.length ? 7000 : 3500);
}

/* ---------- carga rápida ---------- */
function renderComposerTopic() {
  const b = $('#composerTopic');
  if (ui.composerTopic === 'auto' || topicOf(ui.composerTopic).id !== ui.composerTopic) { ui.composerTopic = 'auto'; b.innerHTML = icon('sparkle') + '<span>Auto</span>'; b.style.removeProperty('--tc'); b.classList.add('is-auto'); }
  else { const tp = topicOf(ui.composerTopic); b.innerHTML = icon(tp.icon) + '<span>' + esc(tp.name) + '</span>'; b.style.setProperty('--tc', tp.color); b.classList.remove('is-auto'); }
  try { localStorage.setItem('pendientes.ctopic', ui.composerTopic); } catch (e) {}
}
function renderTopicMenu() {
  const m = $('#topicMenu');
  const opts = [{ id: 'auto', name: 'Auto', icon: 'sparkle', color: '#6B7280', hint: 'según el texto' }].concat(state.topics.filter(t => !t.hidden));
  m.innerHTML = opts.map(t => `<button type="button" role="option" data-topic="${esc(t.id)}" aria-selected="${ui.composerTopic === t.id}" style="--tc:${esc(t.color)}"><span class="tdot">${icon(t.icon)}</span><span>${esc(t.name)}</span>${t.hint ? `<small>${t.hint}</small>` : ''}</button>`).join('');
}
function toggleTopicMenu(open) {
  const m = $('#topicMenu'), b = $('#composerTopic');
  const show = open === undefined ? m.hidden : open;
  if (show) renderTopicMenu();
  m.hidden = !show; b.setAttribute('aria-expanded', String(show));
}
let previewTimer = null;
function renderPreview() {
  const text = $('#quickInput').value, el = $('#preview');
  if (!text.trim()) { el.innerHTML = '<span class="hint">Probá: <b>mañana 10:00</b> · <b>el viernes</b> · <b>#central</b> · <b>@matias</b> · <b>!30m</b> · <b>$5000</b> · <b>todos los lunes</b></span>'; return; }
  const p = Parser.parse(text, { topics: state.topics }), t = resolveTopic(p, text), tp = topicOf(t.id), chips = [];
  chips.push(`<span class="pchip pchip--topic" style="--tc:${esc(tp.color)}">${icon(tp.icon)}${esc(tp.name)}${t.auto ? ' <em>auto</em>' : ''}</span>`);
  if (p.date) chips.push(`<span class="pchip">${icon(p.time ? 'clock' : 'calendar')}${esc(whenLabel({ date: p.date, time: p.time }))}</span>`);
  else chips.push(`<span class="pchip pchip--muted">${icon('calendar')}Sin fecha</span>`);
  if (p.kind !== 'tarea') chips.push(`<span class="pchip">${icon(KINDS[p.kind].icon)}${KINDS[p.kind].label}</span>`);
  if (p.duration) chips.push(`<span class="pchip">${icon('clock')}${durLabel(p.duration)}</span>`);
  const al = p.alert !== undefined ? p.alert : defaultAlertFor(p.date, p.time);
  if (p.date && al !== null) chips.push(`<span class="pchip">${icon('bell')}${esc(alertLabelFor(al, !p.time))}</span>`);
  if (p.date && p.alert2 !== undefined && p.alert2 !== null) chips.push(`<span class="pchip">${icon('bell')}${esc(alertLabelFor(p.alert2, !p.time))}</span>`);
  if (p.repeat) chips.push(`<span class="pchip">${icon('repeat')}${esc(repeatLabel(p.repeat))}</span>`);
  if (p.invitees.length) chips.push(`<span class="pchip">${icon('people')}${esc(p.invitees.join(', '))}</span>`);
  if (p.location) chips.push(`<span class="pchip">${icon('pin')}${esc(p.location)}</span>`);
  if (p.amount !== null) chips.push(`<span class="pchip">${icon('money')}${esc(fmtMoney(p.amount))}</span>`);
  if (p.priority) chips.push(`<span class="pchip pchip--pri">${icon('flag')}Alta</span>`);
  p.hints.forEach(h => { if (h.indexOf('tema-desconocido:') === 0) chips.push(`<span class="pchip pchip--muted">#${esc(h.slice(17))}: no es un tema</span>`); });
  el.innerHTML = chips.join('');
}
function submitQuick() {
  const input = $('#quickInput'), text = input.value;
  if (!text.trim()) { openSheet(null); return; }
  const p = Parser.parse(text, { topics: state.topics });
  if (!p.title) { toast('Falta decir qué hay que hacer'); return; }
  const it = buildFromParse(p, text);
  addItem(it);
  input.value = ''; renderPreview();
  const acts = [{ label: 'Editar', fn: () => openSheet(it.id) }];
  if (it.date) acts.unshift({ label: 'Calendario', cal: it });
  toast(cap(topicOf(it.topic).name) + ': ' + it.title + (it.date ? ' · ' + whenLabel(it) : ''), acts);
}

/* ---------- hoja de edición ---------- */
const f = id => $('#' + id);
function fillSelect(sel, pairs, value) { sel.innerHTML = pairs.map(p => `<option value="${esc(p[0])}">${esc(p[1])}</option>`).join(''); sel.value = value; if (sel.value !== value) sel.selectedIndex = 0; }
function renderTopicChips(selected) {
  f('f_topic').innerHTML = state.topics.filter(t => !t.hidden || t.id === selected).map(t => `<button type="button" class="chip chip--topic" role="radio" aria-checked="${t.id === selected}" data-topic="${esc(t.id)}" style="--tc:${esc(t.color)}">${icon(t.icon)}${esc(t.name)}</button>`).join('');
}
function renderKind(selected) {
  f('f_kind').innerHTML = Object.keys(KINDS).map(k => `<button type="button" role="radio" aria-checked="${k === selected}" data-kind="${k}">${icon(KINDS[k].icon)}${KINDS[k].label}</button>`).join('');
}
function renderQuickChips() {
  const t = fromYmd(todayStr()), dv = f('f_date').value, tv = f('f_time').value;
  const chips = [['Hoy', ymd(t)], ['Mañana', ymd(addDays(t, 1))], [cap(short(F.wdShort.format(addDays(t, 2)))), ymd(addDays(t, 2))], [cap(short(F.wdShort.format(addDays(t, 3)))), ymd(addDays(t, 3))],
    ['Lunes', ymd(addDays(t, ((1 - t.getDay() + 7) % 7) || 7))], ['+1 sem', ymd(addDays(t, 7))], ['Sin fecha', '']];
  f('quickDates').innerHTML = chips.map(c => `<button type="button" class="chip" data-date="${c[1]}" aria-pressed="${dv === c[1]}">${esc(c[0])}</button>`).join('');
  const times = [['9:00', '09:00'], ['10:00', '10:00'], ['12:00', '12:00'], ['15:00', '15:00'], ['18:00', '18:00'], ['20:00', '20:00'], ['Todo el día', '']];
  f('quickTimes').innerHTML = times.map(c => `<button type="button" class="chip" data-time="${c[1]}" aria-pressed="${tv === c[1]}">${esc(c[0])}</button>`).join('');
}
function syncAlertOptions(a1, a2) {
  const allDay = !f('f_time').value, list = allDay ? ALERTS_ALLDAY : ALERTS_TIMED;
  const cur1 = a1 !== undefined ? a1 : f('f_alert').value, cur2 = a2 !== undefined ? a2 : f('f_alert2').value;
  const norm = v => (v === null || v === undefined) ? '' : String(v);
  const pick = (v, dflt) => list.some(o => o[0] === norm(v)) ? norm(v) : dflt;
  fillSelect(f('f_alert'), list, pick(cur1, f('f_date').value ? norm(defaultAlertFor(f('f_date').value, f('f_time').value)) : ''));
  fillSelect(f('f_alert2'), list, pick(cur2, ''));
}
function fillForm(d) {
  f('f_title').value = d.title || '';
  renderTopicChips(d.topic); renderKind(d.kind || 'tarea');
  f('f_date').value = d.date || ''; f('f_time').value = d.time || '';
  fillSelect(f('f_duration'), DURATIONS.map(m => [String(m), durLabel(m)]), String(d.duration || (d.kind === 'reunion' ? state.settings.meetingDuration : 60)));
  fillSelect(f('f_repeat'), REPEATS, d.repeat || 'none');
  syncAlertOptions(d.alert, d.alert2);
  f('f_invitees').value = (d.invitees || []).join(', ');
  f('f_location').value = d.location || '';
  f('f_amount').value = d.amount !== null && d.amount !== undefined ? String(d.amount).replace('.', ',') : '';
  f('f_priority').checked = !!d.priority;
  f('f_notes').value = d.notes || '';
  $('#dl_people').innerHTML = state.people.map(p => `<option value="${esc(p)}">`).join('');
  $('#dl_places').innerHTML = state.places.map(p => `<option value="${esc(p)}">`).join('');
  renderQuickChips();
}
function readForm() {
  const topicBtn = $('#f_topic [aria-checked="true"]'), kindBtn = $('#f_kind [aria-checked="true"]');
  const amtRaw = f('f_amount').value.replace(/[^\d.,]/g, '');
  const amount = amtRaw ? Parser.parseAmount(amtRaw) : null;
  const time = f('f_time').value ? f('f_time').value.slice(0, 5) : null;
  const sel = v => (v === '' ? null : Number(v));
  return {
    title: f('f_title').value.trim(), topic: topicBtn ? topicBtn.dataset.topic : 'otros', kind: kindBtn ? kindBtn.dataset.kind : 'tarea',
    date: f('f_date').value || null, time, duration: time ? Number(f('f_duration').value) : null,
    alert: f('f_date').value ? sel(f('f_alert').value) : null, alert2: f('f_date').value ? sel(f('f_alert2').value) : null,
    repeat: f('f_repeat').value, invitees: f('f_invitees').value.split(',').map(s => s.trim()).filter(Boolean),
    location: f('f_location').value.trim(), amount: amount === null || isNaN(amount) ? null : amount, priority: f('f_priority').checked ? 1 : 0, notes: f('f_notes').value.trim()
  };
}
function renderCalActions() {
  const d = readForm(); d.id = ui.editing || 'borrador';
  $('#calActions').innerHTML = calActionsHtml(d);
}
function openSheet(idOrDraft) {
  const it = typeof idOrDraft === 'string' ? byId(idOrDraft) : null;
  ui.editing = it ? it.id : null;
  const base = { title: '', notes: '', topic: ui.composerTopic !== 'auto' ? ui.composerTopic : 'otros', kind: 'tarea', date: null, time: null, duration: null, alert: undefined, alert2: null, repeat: 'none', invitees: [], location: '', amount: null, priority: 0 };
  const data = it || Object.assign(base, idOrDraft && typeof idOrDraft === 'object' ? idOrDraft : {});
  fillForm(data);
  $('#sheetTitle').textContent = it ? 'Editar' : 'Nuevo pendiente';
  $('#btnDelete').hidden = !it; $('#btnDone').hidden = !it;
  if (it) $('#btnDone').textContent = it.done ? 'Volver a pendiente' : 'Marcar hecha';
  renderCalActions();
  const dlg = $('#sheet');
  if (!dlg.open) dlg.showModal();
  dlg.querySelector('.sheet__body').scrollTop = 0;
  if (!it) setTimeout(() => f('f_title').focus(), 60);
}
function saveSheet() {
  const d = readForm();
  if (!d.title) { f('f_title').focus(); toast('Falta decir qué hay que hacer'); return; }
  if (ui.editing) {
    const it = byId(ui.editing); if (!it) return;
    Object.assign(it, d, { updatedAt: Date.now() }); rememberPeople(it); save(); renderAll();
    $('#sheet').close(); toast('Guardado', it.date && !it.done ? [{ label: 'Calendario', cal: it }] : []);
  } else {
    const it = Object.assign({ id: uid(), done: false, doneAt: null, createdAt: Date.now(), updatedAt: Date.now() }, d);
    addItem(it); $('#sheet').close();
    toast(cap(topicOf(it.topic).name) + ': ' + it.title + (it.date ? ' · ' + whenLabel(it) : ''), it.date ? [{ label: 'Calendario', cal: it }] : []);
  }
}

/* ---------- ajustes ---------- */
function renderTopicEditor() {
  $('#topicEditor').innerHTML = state.topics.map(t => `<div class="trow${t.hidden ? ' is-hidden' : ''}" data-id="${esc(t.id)}">
    <input type="color" value="${esc(t.color)}" data-f="color" aria-label="Color de ${esc(t.name)}">
    <select data-f="icon" aria-label="Ícono de ${esc(t.name)}">${TOPIC_ICONS.map(i => `<option value="${i}"${i === t.icon ? ' selected' : ''}>${ICON_LABELS[i] || i}</option>`).join('')}</select>
    <input type="text" value="${esc(t.name)}" data-f="name" aria-label="Nombre del tema" maxlength="40">
    <button type="button" class="icon-btn" data-act="t-hide" aria-label="${t.hidden ? 'Mostrar' : 'Ocultar'}" title="${t.hidden ? 'Mostrar' : 'Ocultar'}">${icon(t.hidden ? 'eyeOff' : 'eye')}</button>
    ${t.id === 'otros' ? '<span></span>' : `<button type="button" class="icon-btn" data-act="t-del" aria-label="Eliminar tema" title="Eliminar tema">${icon('trash')}</button>`}
  </div>`).join('');
}
function openSettings() {
  const s = state.settings;
  f('s_name').value = s.name || ''; f('s_email').value = s.email || '';
  fillSelect(f('s_alertTimed'), ALERTS_TIMED, String(s.alertTimed)); fillSelect(f('s_alertAllDay'), ALERTS_ALLDAY, String(s.alertAllDay));
  fillSelect(f('s_meetingDuration'), DURATIONS.map(m => [String(m), durLabel(m)]), String(s.meetingDuration));
  f('s_theme').value = s.theme || 'auto';
  renderTopicEditor();
  const dlg = $('#settings'); if (!dlg.open) dlg.showModal();
}
function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = 'pendientes-respaldo-' + todayStr() + '.json'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function importJson(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const inc = JSON.parse(r.result);
      if (!inc || !Array.isArray(inc.items)) throw new Error('formato');
      let added = 0, updated = 0;
      inc.items.forEach(x => { if (!x || !x.id) return; const cur = byId(x.id); if (!cur) { state.items.push(x); added++; } else if ((x.updatedAt || 0) > (cur.updatedAt || 0)) { Object.assign(cur, x); updated++; } });
      (inc.topics || []).forEach(t => { if (t && t.id && !state.topics.some(x => x.id === t.id)) state.topics.splice(state.topics.length - 1, 0, t); });
      if (inc.settings) state.settings = Object.assign({}, state.settings, inc.settings);
      (inc.people || []).forEach(p => { if (state.people.indexOf(p) < 0) state.people.push(p); });
      (inc.places || []).forEach(p => { if (state.places.indexOf(p) < 0) state.places.push(p); });
      save(); applyTheme(); renderAll(); renderTopicEditor();
      toast('Respaldo restaurado: ' + added + ' nuevos, ' + updated + ' actualizados');
    } catch (e) { toast('Ese archivo no es un respaldo de Pendientes'); }
  };
  r.readAsText(file);
}

/* ---------- tema visual ---------- */
function applyTheme() {
  const t = state.settings.theme || 'auto';
  if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
  const b = $('#btnTheme');
  b.innerHTML = icon(t === 'auto' ? 'auto' : t === 'light' ? 'sun' : 'moon');
  b.setAttribute('aria-label', 'Apariencia: ' + (t === 'auto' ? 'automática' : t === 'light' ? 'clara' : 'oscura'));
  const dark = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const meta = $('#metaTheme'); if (meta) meta.content = dark ? '#0E1013' : '#F2F3F6';
}

/* ---------- eventos ---------- */
function bind() {
  $('#btnSearch').innerHTML = icon('search'); $('#btnSettings').innerHTML = icon('gear');
  $('#btnMore').innerHTML = icon('sliders'); $('#btnAdd').innerHTML = icon('arrowUp');
  $('#sheetClose').innerHTML = icon('x'); $('#settingsClose').innerHTML = icon('x');

  document.addEventListener('click', e => {
    const act = e.target.closest('[data-act]');
    const li = e.target.closest('.item');
    if (act) {
      const a = act.dataset.act;
      if (a === 'toggle' && li) { toggleDone(li.dataset.id); return; }
      if (a === 'open' && li) { openSheet(li.dataset.id); return; }
      if (a === 'cal' && li) { const it = byId(li.dataset.id); if (it) downloadIcs([it], slug(it.title)); return; }
      if (a === 'add-topic') { ui.composerTopic = act.dataset.topic; renderComposerTopic(); renderPreview(); $('#quickInput').focus(); return; }
      if (a === 'clear-filter') { ui.filter = null; renderAll(); return; }
      if (a === 'example') { $('#quickInput').value = act.textContent; renderPreview(); $('#quickInput').focus(); return; }
      if (a === 'samples') { loadSamples(); return; }
      if (a === 'ics') { const d = readForm(); d.id = ui.editing || uid(); downloadIcs([d], slug(d.title || 'evento')); return; }
      if (a === 'copy') { copyText(links(Object.assign(readForm(), { id: ui.editing || 'x' })).text); return; }
      if (a === 'share') { const d = Object.assign(readForm(), { id: ui.editing || 'x' }); navigator.share({ title: d.title, text: links(d).text }).catch(() => {}); return; }
    }
    const kpi = e.target.closest('.kpi');
    if (kpi) { ui.filter = ui.filter === kpi.dataset.filter ? null : kpi.dataset.filter; ui.view = 'agenda'; renderAll(); return; }
    const tab = e.target.closest('.seg [role="tab"]');
    if (tab) { ui.view = tab.dataset.view; renderAll(); return; }
    const topt = e.target.closest('#topicMenu [data-topic]');
    if (topt) { ui.composerTopic = topt.dataset.topic; renderComposerTopic(); renderPreview(); toggleTopicMenu(false); $('#quickInput').focus(); return; }
    if (!e.target.closest('#topicMenu') && !e.target.closest('#composerTopic')) toggleTopicMenu(false);
  });
  document.addEventListener('keydown', e => {
    const body = e.target.closest('.item__body');
    if (body && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openSheet(body.closest('.item').dataset.id); return; }
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || $('#sheet').open || $('#settings').open;
    if (typing) { if (e.key === 'Escape' && e.target.id === 'quickInput') e.target.blur(); return; }
    if (e.key === '/' || e.key === 'n') { e.preventDefault(); $('#quickInput').focus(); }
    else if (e.key === '1') { ui.view = 'temas'; renderAll(); }
    else if (e.key === '2') { ui.view = 'agenda'; renderAll(); }
  });

  $('#btnSearch').addEventListener('click', () => {
    const bar = $('#searchBar'), on = bar.hidden; bar.hidden = !on; $('#btnSearch').setAttribute('aria-pressed', String(on));
    if (on) $('#searchInput').focus(); else { $('#searchInput').value = ''; ui.query = ''; renderAll(); }
  });
  $('#searchInput').addEventListener('input', e => { ui.query = e.target.value.trim(); renderAll(); });
  $('#btnTheme').addEventListener('click', () => { const order = ['auto', 'light', 'dark']; state.settings.theme = order[(order.indexOf(state.settings.theme || 'auto') + 1) % 3]; save(); applyTheme(); });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  $('#btnSettings').addEventListener('click', openSettings);
  document.addEventListener('change', e => { if (e.target.id === 'showDone') { ui.showDone = e.target.checked; renderAll(); } });

  /* carga rápida */
  $('#quickForm').addEventListener('submit', e => { e.preventDefault(); submitQuick(); });
  $('#quickInput').addEventListener('input', () => { clearTimeout(previewTimer); previewTimer = setTimeout(renderPreview, 60); });
  $('#composerTopic').addEventListener('click', () => toggleTopicMenu());
  $('#btnMore').addEventListener('click', () => {
    const text = $('#quickInput').value.trim();
    if (!text) { openSheet(null); return; }
    const p = Parser.parse(text, { topics: state.topics }), it = buildFromParse(p, text);
    delete it.id; openSheet(it); $('#quickInput').value = ''; renderPreview();
  });

  /* hoja */
  const sheet = $('#sheet');
  $('#itemForm').addEventListener('submit', e => { e.preventDefault(); saveSheet(); });
  $('#sheetClose').addEventListener('click', () => sheet.close());
  sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });
  $('#btnDelete').addEventListener('click', () => { if (ui.editing) { const id = ui.editing; sheet.close(); removeItem(id); } });
  $('#btnDone').addEventListener('click', () => { if (ui.editing) { const id = ui.editing; sheet.close(); toggleDone(id); } });
  $('#f_topic').addEventListener('click', e => { const b = e.target.closest('[data-topic]'); if (!b) return; $$('#f_topic [role="radio"]').forEach(x => x.setAttribute('aria-checked', String(x === b))); renderCalActions(); });
  $('#f_kind').addEventListener('click', e => { const b = e.target.closest('[data-kind]'); if (!b) return; $$('#f_kind [role="radio"]').forEach(x => x.setAttribute('aria-checked', String(x === b))); if (b.dataset.kind === 'reunion') f('f_duration').value = String(state.settings.meetingDuration); renderCalActions(); });
  $('#quickDates').addEventListener('click', e => { const b = e.target.closest('[data-date]'); if (!b) return; f('f_date').value = b.dataset.date; renderQuickChips(); syncAlertOptions(); renderCalActions(); });
  $('#quickTimes').addEventListener('click', e => { const b = e.target.closest('[data-time]'); if (!b) return; f('f_time').value = b.dataset.time; if (b.dataset.time && !f('f_date').value) { f('f_date').value = todayStr(); } renderQuickChips(); syncAlertOptions(); renderCalActions(); });
  f('f_date').addEventListener('change', () => { renderQuickChips(); syncAlertOptions(); renderCalActions(); });
  f('f_time').addEventListener('change', () => { if (f('f_time').value && !f('f_date').value) f('f_date').value = todayStr(); renderQuickChips(); syncAlertOptions(); renderCalActions(); });
  let calTimer = null;
  $('#itemForm').addEventListener('input', e => { if (/^f_(title|invitees|location|notes|duration|repeat|alert|alert2|amount)$/.test(e.target.id)) { clearTimeout(calTimer); calTimer = setTimeout(renderCalActions, 200); } });
  $('#itemForm').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); saveSheet(); } });

  /* ajustes */
  const st = $('#settings');
  $('#settingsForm').addEventListener('submit', e => { e.preventDefault(); st.close(); });
  $('#settingsClose').addEventListener('click', () => st.close());
  st.addEventListener('click', e => { if (e.target === st) st.close(); });
  st.addEventListener('close', () => { save(); renderAll(); });
  ['s_name', 's_email', 's_alertTimed', 's_alertAllDay', 's_meetingDuration', 's_theme'].forEach(id => {
    f(id).addEventListener('change', e => {
      const v = e.target.value;
      if (id === 's_name') state.settings.name = v.trim();
      else if (id === 's_email') state.settings.email = v.trim();
      else if (id === 's_theme') { state.settings.theme = v; applyTheme(); }
      else state.settings[id.slice(2)] = Number(v);
      save();
    });
  });
  $('#topicEditor').addEventListener('input', e => {
    const row = e.target.closest('.trow'); if (!row) return;
    const t = state.topics.find(x => x.id === row.dataset.id); if (!t) return;
    const fld = e.target.dataset.f; if (!fld) return;
    t[fld] = fld === 'name' ? e.target.value.trim() || t.name : e.target.value; save();
  });
  $('#topicEditor').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const row = b.closest('.trow'), t = state.topics.find(x => x.id === row.dataset.id); if (!t) return;
    if (b.dataset.act === 't-hide') { t.hidden = !t.hidden; save(); renderTopicEditor(); }
    if (b.dataset.act === 't-del') {
      if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.innerHTML = '<span style="font-size:12px;font-weight:700">¿Sí?</span>'; setTimeout(() => { b.dataset.confirm = ''; b.innerHTML = icon('trash'); }, 3000); return; }
      const n = state.items.filter(it => it.topic === t.id).length;
      state.items.forEach(it => { if (it.topic === t.id) it.topic = 'otros'; });
      state.topics = state.topics.filter(x => x.id !== t.id);
      if (ui.composerTopic === t.id) { ui.composerTopic = 'auto'; renderComposerTopic(); }
      save(); renderTopicEditor(); toast('Tema eliminado' + (n ? '. ' + n + ' pendientes pasaron a Otros' : ''));
    }
  });
  $('#btnAddTopic').addEventListener('click', () => {
    const t = { id: 't' + Date.now().toString(36), name: 'Nuevo tema', color: PALETTE[state.topics.length % PALETTE.length], icon: 'tag', aliases: [], keywords: '' };
    state.topics.splice(state.topics.length - 1, 0, t); save(); renderTopicEditor();
    const inp = $(`#topicEditor .trow[data-id="${t.id}"] [data-f="name"]`); if (inp) { inp.focus(); inp.select(); }
  });
  $('#btnExportIcs').addEventListener('click', () => {
    const its = state.items.filter(it => !it.done && it.date);
    if (!its.length) { toast('No hay pendientes con fecha para mandar'); return; }
    downloadIcs(its, 'pendientes'); toast(its.length + ' eventos listos para el calendario');
  });
  $('#btnExportJson').addEventListener('click', exportJson);
  $('#importFile').addEventListener('change', e => { if (e.target.files[0]) importJson(e.target.files[0]); e.target.value = ''; });
  $('#btnClearDone').addEventListener('click', () => {
    const gone = state.items.filter(it => it.done); if (!gone.length) { toast('No hay hechas para borrar'); return; }
    state.items = state.items.filter(it => !it.done); save(); renderAll();
    toast('Borré ' + gone.length + ' hechas', [{ label: 'Deshacer', fn: () => { state.items = state.items.concat(gone); save(); renderAll(); } }]);
  });

  /* en el iPhone, la barra de carga sube con el teclado */
  if (window.visualViewport) {
    const vv = window.visualViewport, comp = $('#composer');
    const follow = () => { const off = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)); comp.style.setProperty('--kb', off + 'px'); };
    vv.addEventListener('resize', follow); vv.addEventListener('scroll', follow);
  }

  /* el reloj avanza: lo vencido cambia de color sin recargar */
  setInterval(() => { if (!document.hidden) renderAll(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderAll(); });
}

/* ---------- arranque ---------- */
function init() {
  applyTheme(); bind(); renderComposerTopic(); renderPreview(); renderAll();
  if (/^https?:$/.test(location.protocol)) {
    fetch('/api/ics?ping=1', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(j => { ui.apiOk = !!(j && j.ok); if (ui.apiOk) renderAll(); }).catch(() => {});
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
init();
})();
