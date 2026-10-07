/* ============================================================
   Pendientes — app
   Inicio (hoy + temas), Agenda y un formulario que pregunta de a una
   cosa. Todo vive en localStorage de este dispositivo. Sin dependencias.
   Módulos: ics.js (archivos .ics) y parser.js (entiende frases en castellano).
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
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  chevL: '<path d="M15 5l-7 7 7 7"/>',
  chevR: '<path d="M9 5l7 7-7 7"/>',
  chevD: '<path d="M6 9l6 6 6-6"/>',
  home: '<path d="M3.5 11.5L12 4.5l8.5 7"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  bell: '<path d="M6.5 16.5v-5a5.5 5.5 0 0 1 11 0v5l1.5 2h-14z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  repeat: '<path d="M17 2.5l3 3-3 3"/><path d="M4 11V8.5a3 3 0 0 1 3-3h13"/><path d="M7 21.5l-3-3 3-3"/><path d="M20 13v2.5a3 3 0 0 1-3 3H4"/>',
  pin: '<path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.3 12 21 12 21z"/><circle cx="12" cy="10" r="2.3"/>',
  people: '<circle cx="9" cy="8" r="3.25"/><path d="M3 19.5a6 6 0 0 1 12 0"/><circle cx="17" cy="9.5" r="2.5"/><path d="M15.5 15.2a4.5 4.5 0 0 1 6 4.3"/>',
  money: '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  note: '<path d="M6 3.5h8.5L18 7v13.5H6z"/><path d="M14 3.5V7.5h4M9 12h6M9 16h6"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  share: '<path d="M12 3.5v11M8 7.5l4-4 4 4"/><path d="M5.5 11.5v7a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-7"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M3.5 7.5l8.5 6 8.5-6"/>',
  whatsapp: '<path fill="currentColor" stroke="none" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.42 1.31-1.96 1.36-.5.05-.98.23-3.3-.69-2.78-1.1-4.55-3.94-4.69-4.12-.14-.18-1.13-1.5-1.13-2.86 0-1.36.71-2.03.96-2.31.25-.28.55-.35.73-.35h.52c.17 0 .4-.06.62.48.24.57.8 1.98.87 2.12.07.14.12.31.02.49-.09.18-.14.29-.28.45-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.28.72 1.18 1.54 1.91 1.06.94 1.95 1.23 2.23 1.37.28.14.44.12.6-.07.17-.19.7-.81.88-1.09.19-.28.37-.23.63-.14.25.09 1.62.76 1.9.9.28.14.46.21.53.33.07.11.07.64-.17 1.32Z"/>',
  google: '<circle cx="12" cy="12" r="8.5"/><text x="12" y="16" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor" stroke="none" font-family="system-ui,sans-serif">G</text>',
  trash: '<path d="M4.5 6.5h15M9.5 6.5v-2h5v2M7 6.5l.8 13h8.4l.8-13"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  eye: '<path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/>',
  /* íconos de temas */
  tag: '<path d="M3.5 11.5V4.5h7l9 9-7 7z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
  briefcase: '<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2M3.5 12.5h17"/>',
  glasses: '<circle cx="6.5" cy="14.5" r="3.5"/><circle cx="17.5" cy="14.5" r="3.5"/><path d="M10 14.5h4M3 14.5l1.8-6.5h2.7M21 14.5l-1.8-6.5h-2.7"/>',
  star: '<path d="M12 3.5l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17.4l-5.4 2.9 1.1-6.1-4.5-4.3 6.1-.8z"/>',
  heart: '<path d="M12 20.3S3.5 15.3 3.5 9.3A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 8.5 2.1c0 6-8.5 11-8.5 11z"/>',
  wallet: '<path d="M3.5 7.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2V9"/><path d="M3.5 7.5v10a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2h-13a2 2 0 0 1-2-2"/><path d="M16 14.5h1.5"/>',
  cart: '<path d="M3 4.5h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h7.8a1.5 1.5 0 0 0 1.5-1.1L20 8.5H6.3"/><circle cx="10" cy="19.5" r="1.2"/><circle cx="16.5" cy="19.5" r="1.2"/>',
  car: '<path d="M4 15l1.5-5a2 2 0 0 1 1.9-1.5h9.2a2 2 0 0 1 1.9 1.5L20 15"/><rect x="3" y="15" width="18" height="4.5" rx="1.5"/>',
  book: '<path d="M4.5 4.5h6a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5h-6.5z"/><path d="M19.5 4.5h-6a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5h6.5z"/>',
  gift: '<rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M3.5 13h17M12 9v11"/><path d="M12 9c-2-.5-4.5-.5-5-2.5S9 3 12 9c3-6 5.5-4.5 5-2.5S14 8.5 12 9z"/>',
  plane: '<path d="M21 3L10.5 13.5M21 3l-7 18-3.5-7.5L3 10z"/>',
  tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  phone: '<path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5L16 14l4 1.5V19a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  paw: '<circle cx="7" cy="9" r="1.8"/><circle cx="11" cy="6" r="1.8"/><circle cx="15.5" cy="6.5" r="1.8"/><circle cx="19" cy="10" r="1.8"/><path d="M8 17.5c0-3 2-5 5-5s5 2 5 5c0 2-1.5 3-3 3s-2-1-2-1-.5 1-2 1-3-1-3-3z"/>'
};
const icon = name => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ICONS.tag}</svg>`;
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
const ALERTS_TIMED = [['', 'Sin aviso'], ['0', 'En el momento'], ['5', '5 min antes'], ['10', '10 min antes'], ['15', '15 min antes'], ['30', '30 min antes'], ['60', '1 hora antes'], ['120', '2 horas antes'], ['1440', '1 día antes'], ['2880', '2 días antes'], ['10080', '1 semana antes']];
const ALERTS_ALLDAY = [['', 'Sin aviso'], ['-540', 'Ese día a las 9'], ['900', 'El día anterior a las 9'], ['2340', 'Dos días antes a las 9'], ['9540', 'Una semana antes a las 9']];
const ASK_ALERT_TIMED = [['15', '15 min antes'], ['60', '1 hora antes'], ['1440', '1 día antes'], ['0', 'En el momento'], ['', 'No avisar']];
const ASK_ALERT_ALLDAY = [['-540', 'Ese día a las 9'], ['900', 'El día anterior'], ['', 'No avisar']];
const ASK_TIMES = [['09:00', '9:00'], ['12:00', '12:00'], ['15:00', '15:00'], ['18:00', '18:00'], ['20:00', '20:00'], ['custom', 'Otra hora']];
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
  /* los temas de fábrica reciben alias y palabras clave al día; lo que editaste se respeta */
  s.topics = mine.map(t => { const d = DEFAULT_TOPICS.find(x => x.id === t.id); return d ? Object.assign({}, t, { aliases: d.aliases, keywords: d.keywords }) : t; });
  if (!s.topics.some(t => t.id === 'otros')) s.topics.push(clone(DEFAULT_TOPICS[DEFAULT_TOPICS.length - 1]));
  return s;
}
let state = load();
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(DB_KEY, JSON.stringify(state)); } catch (e) { toast('No se pudo guardar en este navegador'); } }, 40);
}
const ui = { view: 'inicio', topicId: null, depth: 0, apiOk: false, agendaAll: false };

/* ---------- pendientes ---------- */
const byId = id => state.items.find(x => x.id === id);
const topicOf = id => state.topics.find(t => t.id === id) || state.topics.find(t => t.id === 'otros') || state.topics[0];
const visibleTopics = () => state.topics.filter(t => !t.hidden);
const pending = () => state.items.filter(it => !it.done);
function itemStart(it) { if (!it.date) return null; const d = fromYmd(it.date); if (it.time) { const p = it.time.split(':'); d.setHours(+p[0], +p[1], 0, 0); } return d; }
function itemEnd(it) { const s = itemStart(it); if (!s) return null; if (!it.time) return addDays(s, 1); return new Date(s.getTime() + (it.duration || 60) * 60000); }
function dayDiff(dateStr) { return Math.round((fromYmd(dateStr) - fromYmd(todayStr())) / 86400000); }
function isLate(it) { if (it.done || !it.date) return false; const dd = dayDiff(it.date); if (dd < 0) return true; return dd === 0 && !!it.time && itemStart(it).getTime() < Date.now(); }
function whenLabel(it) {
  if (!it.date) return '';
  const dd = dayDiff(it.date), d = fromYmd(it.date); let s;
  if (dd === 0) s = 'Hoy'; else if (dd === 1) s = 'Mañana'; else if (dd === -1) s = 'Ayer';
  else if (dd > 1 && dd < 7) s = cap(F.wdLong.format(d));
  else { s = cap(short(F.wdShort.format(d))) + ' ' + d.getDate() + ' ' + short(F.moShort.format(d)); if (d.getFullYear() !== new Date().getFullYear()) s += ' ' + d.getFullYear(); }
  if (it.time) s += ' · ' + it.time;
  return s;
}
function dateLong(s) {
  const d = fromYmd(s), dd = dayDiff(s);
  let base = F.wdLong.format(d) + ' ' + d.getDate() + ' de ' + F.moLong.format(d);
  if (d.getFullYear() !== new Date().getFullYear()) base += ' de ' + d.getFullYear();
  return dd === 0 ? 'Hoy, ' + base : dd === 1 ? 'Mañana, ' + base : cap(base);
}
function longWhen(it) {
  let s = dateLong(it.date);
  if (it.time) { const e = itemEnd(it); s += ', de ' + it.time + ' a ' + pad(e.getHours()) + ':' + pad(e.getMinutes()); } else s += ', todo el día';
  return s;
}
function sortPending(a, b) {
  const sa = itemStart(a), sb = itemStart(b);
  if (sa && sb && sa - sb) return sa - sb;
  if (sa && !sb) return -1; if (!sa && sb) return 1;
  if ((b.priority || 0) - (a.priority || 0)) return (b.priority || 0) - (a.priority || 0);
  return (b.createdAt || 0) - (a.createdAt || 0);
}
function durLabel(m) { m = Number(m); if (!m) return ''; if (m < 60) return m + ' min'; const h = Math.floor(m / 60), r = m % 60; return r ? h + ' h ' + pad(r) : h + ' h'; }
function repeatLabel(r) { const x = REPEATS.find(o => o[0] === r); return x ? x[1] : ''; }
function alertLabelFor(min, allDay) {
  if (min === null || min === undefined || min === '') return 'Sin aviso';
  const list = allDay ? ALERTS_ALLDAY : ALERTS_TIMED, hit = list.find(o => o[0] === String(min));
  if (hit) return hit[1];
  min = Number(min);
  if (min === 0) return 'En el momento';
  const a = Math.abs(min), u = a % 1440 === 0 ? (a / 1440) + (a === 1440 ? ' día' : ' días') : a % 60 === 0 ? (a / 60) + (a === 60 ? ' hora' : ' horas') : a + ' min';
  return min > 0 ? u + ' antes' : u + ' después';
}
function defaultAlertFor(date, time) { if (!date) return null; return time ? Number(state.settings.alertTimed) : Number(state.settings.alertAllDay); }
/* Un aviso "con hora" son minutos antes; uno "de todo el día" se mide desde la medianoche. */
function alertValid(v, timed) { if (v === null || v === undefined) return true; v = Number(v); return timed ? v >= 0 : ALERTS_ALLDAY.some(o => o[0] === String(v)); }
function toAllDayAlert(v) { if (v === null || v === undefined) return v; return v < 1440 ? -540 : Math.round(v / 1440) * 1440 - 540; }

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
/* En el iPhone el link al .ics va en la misma pestaña: Safari muestra la hoja de Calendario.
   En una pestaña nueva queda la pantalla en blanco. En otros equipos se descarga el archivo. */
function icsAttrs(it) { return isIOS() ? '' : ` download="${esc(slug(it.title || 'evento'))}.ics"`; }
function downloadIcs(items, name) {
  const text = ICS.build({ events: items.map(toEvent), name: 'Pendientes' });
  if (ui.apiOk && items.length > 1) { postIcs(text, name); return; }
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name + '.ics'; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  if (isIOS()) toast('Abrilo desde Descargas y tocá «Añadir todo»');
}
function postIcs(text, name) {
  const f = document.createElement('form'); f.method = 'POST'; f.action = '/api/ics'; f.target = isIOS() ? '_self' : '_blank'; f.hidden = true;
  const t = document.createElement('textarea'); t.name = 'ics'; t.value = text;
  const n = document.createElement('input'); n.type = 'hidden'; n.name = 'f'; n.value = name;
  f.appendChild(t); f.appendChild(n); document.body.appendChild(f); f.submit(); setTimeout(() => f.remove(), 1000);
}
function copyText(text) {
  const done = () => toast('Copiado');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
  else fallbackCopy(text, done);
}
function fallbackCopy(text, done) {
  const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
  document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('No se pudo copiar'); } t.remove();
}

/* ---------- cambios ---------- */
function rememberPeople(it) {
  (it.invitees || []).forEach(p => { if (p && state.people.indexOf(p) < 0) state.people.unshift(p); });
  if (it.location && state.places.indexOf(it.location) < 0) state.places.unshift(it.location);
  state.people = state.people.slice(0, 60); state.places = state.places.slice(0, 40);
}
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
    const prev = it.date; it.date = nextOccurrence(it.date, it.repeat); it.updatedAt = Date.now(); save(); render();
    toast('Hecho. Vuelve ' + whenLabel(it).toLowerCase(), [{ label: 'Deshacer', fn: () => { it.date = prev; save(); render(); } }]);
    return;
  }
  it.done = !it.done; it.doneAt = it.done ? Date.now() : null; it.updatedAt = Date.now(); save(); render();
  toast(it.done ? 'Hecho' : 'Volvió a pendientes', [{ label: 'Deshacer', fn: () => { it.done = !it.done; it.doneAt = it.done ? Date.now() : null; save(); render(); } }]);
}
function removeItem(id) {
  const idx = state.items.findIndex(x => x.id === id); if (idx < 0) return;
  const it = state.items[idx]; state.items.splice(idx, 1); save(); render();
  toast('Eliminado', [{ label: 'Deshacer', fn: () => { state.items.splice(Math.min(idx, state.items.length), 0, it); save(); render(); } }]);
}
function loadSamples() {
  const t = fromYmd(todayStr()), dow = t.getDay();
  const fri = addDays(t, ((5 - dow + 7) % 7) || 7), sun = addDays(t, ((0 - dow + 7) % 7) || 7);
  const tenth = new Date(t.getFullYear(), t.getMonth(), 10) <= t ? new Date(t.getFullYear(), t.getMonth() + 1, 10) : new Date(t.getFullYear(), t.getMonth(), 10);
  const mk = o => Object.assign({ id: uid(), notes: 'Ejemplo: borralo cuando quieras.', kind: 'tarea', date: null, time: null, duration: null, alert: null, alert2: null, repeat: 'none', invitees: [], location: '', amount: null, priority: 0, done: false, doneAt: null, createdAt: Date.now(), updatedAt: Date.now() }, o);
  [
    mk({ title: 'Llamar a Matías por la ruta de Córdoba', topic: 'central', kind: 'reunion', date: todayStr(), time: '18:00', duration: 30, alert: 15, invitees: ['Matías'] }),
    mk({ title: 'Revisar stock de estuches', topic: 'central', priority: 1 }),
    mk({ title: 'Pagar expensas', topic: 'gastos', date: ymd(tenth), alert: -540, amount: 185000, repeat: 'monthly' }),
    mk({ title: 'Comprar pañales y leche', topic: 'compras' }),
    mk({ title: 'Pediatra Harper', topic: 'harper', date: ymd(addDays(t, 3)), time: '09:00', duration: 45, alert: 60, alert2: 1440 }),
    mk({ title: 'Cena con Juli', topic: 'juli', kind: 'reunion', date: ymd(fri), time: '20:30', duration: 120, alert: 60 }),
    mk({ title: 'Plomero: pérdida en la cocina', topic: 'casa', date: ymd(addDays(t, 2)), time: '15:00', duration: 60, alert: 30 }),
    mk({ title: 'Asado familiar', topic: 'familia', kind: 'reunion', date: ymd(sun), time: '13:00', duration: 240, alert: 120 }),
    mk({ title: 'Mandar muestrario a Mendoza', topic: 'central', date: ymd(addDays(t, -2)), alert: -540 })
  ].forEach(it => state.items.push(it));
  save(); render();
  toast('Listo: 9 ejemplos para mirar');
}

/* ---------- pantallas ---------- */
function whenHtml(it, timeOnly) {
  if (!it.date || it.done) return '';
  const late = isLate(it), today = dayDiff(it.date) === 0;
  const txt = timeOnly ? (it.time || '') : whenLabel(it);
  if (!txt && !late) return '';
  return `<span class="when${late ? ' is-late' : today ? ' is-today' : ''}">${late ? 'Atrasado' + (txt ? ' · ' : '') : ''}${esc(txt)}</span>`;
}
function rowHtml(it, o) {
  o = o || {};
  const t = topicOf(it.topic), meta = [];
  const w = whenHtml(it, o.timeOnly); if (w) meta.push(w);
  if (o.topic) meta.push(`<span class="tdot" style="--tc:${esc(t.color)}">${esc(t.name)}</span>`);
  if (it.repeat && it.repeat !== 'none' && it.date && !it.done) meta.push(`<span title="${esc(repeatLabel(it.repeat))}">${icon('repeat')}<span class="sr">${esc(repeatLabel(it.repeat))}</span></span>`);
  if (it.priority && !it.done) meta.push('<span class="imp">Importante</span>');
  return `<li class="row${it.done ? ' is-done' : ''}${it.priority ? ' is-pri' : ''}" data-id="${esc(it.id)}">` +
    `<button type="button" class="check" data-act="toggle" aria-label="${it.done ? 'Volver a pendientes' : 'Marcar como hecho'}: ${esc(it.title)}"><span class="check__c">${icon('check')}</span></button>` +
    `<button type="button" class="row__body" data-act="open"><span class="row__title">${esc(it.title)}</span>${meta.length ? `<span class="row__meta">${meta.join('')}</span>` : ''}</button></li>`;
}
function tilesHtml() {
  const p = pending();
  return visibleTopics().filter(t => t.id !== 'otros' || p.some(it => it.topic === 'otros')).map(t => {
    const its = p.filter(it => it.topic === t.id), late = its.filter(isLate).length;
    return `<button type="button" class="tile" data-go="tema" data-topic="${esc(t.id)}" style="--tc:${esc(t.color)}">` +
      `<span class="ticon">${icon(t.icon)}</span><span class="tile__name">${esc(t.name)}</span>` +
      `<span class="tile__count">${its.length ? plural(its.length, 'pendiente', 'pendientes') : 'Nada pendiente'}</span>` +
      (late ? `<span class="late-pill">${plural(late, 'atrasado', 'atrasados')}</span>` : '') + '</button>';
  }).join('');
}
function viewInicio() {
  let h = '';
  if (!state.items.length) {
    h += `<section class="card welcome"><h2>Empezá por acá</h2><p>Tocá <b>Nuevo</b> para anotar tu primer pendiente.</p><button type="button" class="btn btn--secondary" data-act="samples">Ver con ejemplos</button></section>`;
  } else {
    const p = pending(), hoy = p.filter(it => it.date && dayDiff(it.date) <= 0).sort(sortPending);
    if (hoy.length) {
      const show = hoy.slice(0, 6);
      h += `<div class="card"><ul class="list">${show.map(it => rowHtml(it, { topic: true })).join('')}</ul>` +
        (hoy.length > show.length ? `<button type="button" class="addrow" data-go="agenda">${icon('calendar')}Ver ${hoy.length - show.length} más en la agenda</button>` : '') + '</div>';
    } else {
      const next = p.filter(it => it.date && dayDiff(it.date) > 0).sort(sortPending)[0];
      h += `<div class="card"><p class="empty">Nada para hoy.</p>${next ? `<p class="empty-k">Lo próximo</p><ul class="list">${rowHtml(next, { topic: true })}</ul>` : ''}</div>`;
    }
  }
  h += `<section class="section" aria-labelledby="hTemas"><h2 class="section__h" id="hTemas">Temas</h2><div class="tiles">${tilesHtml()}</div></section>`;
  return h;
}
function viewTema(id) {
  const t = topicOf(id);
  const p = pending().filter(it => it.topic === t.id).sort(sortPending);
  const done = state.items.filter(it => it.done && it.topic === t.id).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
  let h = `<div class="card">${p.length ? `<ul class="list">${p.map(it => rowHtml(it)).join('')}</ul>` : ''}` +
    `<button type="button" class="addrow" data-act="new-in" data-topic="${esc(t.id)}">${icon('plus')}Agregar en ${esc(t.name)}</button></div>`;
  if (done.length) h += `<details class="fold section"><summary>Hechas · ${done.length} ${icon('chevD')}</summary><div class="card"><ul class="list">${done.slice(0, 30).map(it => rowHtml(it)).join('')}</ul></div></details>`;
  return h;
}
function group(title, sub, items, kind, emptyText) {
  return `<section class="section"><h2 class="section__h${kind === 'late' ? ' is-late' : kind === 'today' ? ' is-today' : ''}">${esc(title)}${sub ? `<span class="section__sub">${esc(sub)}</span>` : ''}</h2>` +
    `<div class="card">${items.length ? `<ul class="list">${items.map(it => rowHtml(it, { topic: true, timeOnly: kind !== 'late' })).join('')}</ul>` : `<p class="empty">${esc(emptyText || 'Nada.')}</p>`}</div></section>`;
}
function viewAgenda() {
  const p = pending().sort(sortPending);
  if (!p.length) return `<div class="card"><p class="empty">No hay nada pendiente.</p></div>`;
  const late = p.filter(it => it.date && dayDiff(it.date) < 0), undated = p.filter(it => !it.date), byDay = {};
  p.filter(it => it.date && dayDiff(it.date) >= 0).forEach(it => { (byDay[it.date] = byDay[it.date] || []).push(it); });
  const days = Object.keys(byDay).sort(), near = days.filter(d => dayDiff(d) <= 14), far = days.filter(d => dayDiff(d) > 14);
  const dayGroup = d => {
    const dt = fromYmd(d), dd = dayDiff(d);
    const title = dd === 0 ? 'Hoy' : dd === 1 ? 'Mañana' : cap(F.wdLong.format(dt)) + ' ' + dt.getDate();
    const sub = dd <= 1 ? F.wdLong.format(dt) + ' ' + dt.getDate() + ' de ' + F.moLong.format(dt) : 'de ' + F.moLong.format(dt) + (dt.getFullYear() !== new Date().getFullYear() ? ' de ' + dt.getFullYear() : '');
    return group(title, sub, byDay[d], dd === 0 ? 'today' : 'day');
  };
  let h = '';
  if (late.length) h += group('Atrasados', '', late, 'late');
  if (!byDay[todayStr()]) h += group('Hoy', '', [], 'today', 'Nada para hoy.');
  near.forEach(d => { h += dayGroup(d); });
  if (far.length) {
    if (ui.agendaAll) far.forEach(d => { h += dayGroup(d); });
    else h += `<div class="section"><button type="button" class="btn btn--secondary btn--block" data-act="agenda-all">Ver más adelante · ${far.reduce((s, d) => s + byDay[d].length, 0)}</button></div>`;
  }
  if (undated.length) h += `<details class="fold section"><summary>Sin fecha · ${undated.length} ${icon('chevD')}</summary><div class="card"><ul class="list">${undated.map(it => rowHtml(it, { topic: true })).join('')}</ul></div></details>`;
  return h;
}
function renderHeader() {
  const title = $('#viewTitle'), sub = $('#viewSub');
  $('#btnBack').hidden = ui.view !== 'tema';
  if (ui.view === 'tema') {
    const t = topicOf(ui.topicId), n = pending().filter(it => it.topic === t.id).length;
    title.innerHTML = `<span class="ticon" style="--tc:${esc(t.color)}">${icon(t.icon)}</span><span>${esc(t.name)}</span>`;
    sub.textContent = n ? plural(n, 'pendiente', 'pendientes') : 'Nada pendiente';
    document.title = t.name + ' · Pendientes';
  } else if (ui.view === 'agenda') {
    title.textContent = 'Agenda';
    const n = pending().filter(it => it.date).length;
    sub.textContent = n ? plural(n, 'pendiente con fecha', 'pendientes con fecha') : 'Sin pendientes con fecha';
    document.title = 'Agenda · Pendientes';
  } else {
    const d = new Date();
    title.textContent = 'Hoy';
    sub.textContent = cap(F.wdLong.format(d)) + ' ' + d.getDate() + ' de ' + F.moLong.format(d);
    document.title = 'Pendientes';
  }
  $('#tabInicio').setAttribute('aria-current', ui.view === 'agenda' ? 'false' : 'page');
  $('#tabAgenda').setAttribute('aria-current', ui.view === 'agenda' ? 'page' : 'false');
}
function render() {
  renderHeader();
  $('#main').innerHTML = ui.view === 'agenda' ? viewAgenda() : ui.view === 'tema' ? viewTema(ui.topicId) : viewInicio();
}

/* ---------- navegación (el gesto de volver del iPhone funciona) ---------- */
function parseHash() {
  const h = decodeURIComponent(location.hash.replace(/^#/, ''));
  if (h === 'agenda') return { v: 'agenda', id: null };
  if (h.indexOf('tema-') === 0 && state.topics.some(t => t.id === h.slice(5))) return { v: 'tema', id: h.slice(5) };
  return { v: 'inicio', id: null };
}
function urlFor(v, id) { return v === 'inicio' ? location.pathname + location.search : '#' + (v === 'tema' ? 'tema-' + id : v); }
function go(v, id) {
  id = id || null;
  if (v === ui.view && id === ui.topicId) { window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }); return; }
  ui.view = v; ui.topicId = id; ui.agendaAll = false; ui.depth += 1;
  history.pushState({ v, id, d: ui.depth }, '', urlFor(v, id));
  render(); window.scrollTo(0, 0);
  try { $('#viewTitle').focus({ preventScroll: true }); } catch (e) {}
}
function goBack() {
  if (ui.depth > 0) { history.back(); return; }
  ui.view = 'inicio'; ui.topicId = null;
  history.replaceState({ v: 'inicio', id: null, d: 0 }, '', urlFor('inicio'));
  render(); window.scrollTo(0, 0);
}

/* ---------- hojas ---------- */
function openSheet(dlg) { dlg._opener = document.activeElement; hideToast(); if (!dlg.open) dlg.showModal(); }
function closeSheet(dlg) { if (dlg && dlg.open) dlg.close(); }

/* ---------- ficha de un pendiente ---------- */
let detailId = null;
function calBtn(it) {
  if (ui.apiOk) return `<a class="btn btn--secondary btn--block" href="${esc(links(it).ios)}"${icsAttrs(it)}>${icon('calendar')}Agregar al Calendario</a>`;
  return `<button type="button" class="btn btn--secondary btn--block" data-act="d-ics">${icon('calendar')}Agregar al Calendario</button>`;
}
function inviteHtml(it) {
  const L = links(it);
  const first = navigator.share
    ? `<button type="button" class="btn btn--secondary btn--block" data-act="d-share">${icon('share')}Mandar por WhatsApp o Mail</button>`
    : `<a class="btn btn--secondary btn--block" href="${esc(L.wa)}" target="_blank" rel="noopener">${icon('whatsapp')}WhatsApp</a><a class="btn btn--secondary btn--block" href="${esc(L.mail)}">${icon('mail')}Mail</a>`;
  return first + `<a class="btn btn--secondary btn--block" href="${esc(L.google)}" target="_blank" rel="noopener">${icon('google')}Invitar con Google Calendar</a>` +
    `<button type="button" class="btn btn--secondary btn--block" data-act="d-copy">${icon('copy')}Copiar el texto</button>`;
}
function renderDetail() {
  const it = byId(detailId); if (!it) { closeSheet($('#detailSheet')); return; }
  const t = topicOf(it.topic), info = [];
  if (it.date) info.push(['calendar', (isLate(it) ? '<span class="late-txt">Atrasado</span> · ' : '') + esc(longWhen(it))]);
  else info.push(['calendar', 'Sin fecha']);
  if (it.date) info.push(['bell', it.alert === null || it.alert === undefined ? 'Sin aviso' : 'Aviso: ' + esc(alertLabelFor(it.alert, !it.time).toLowerCase())]);
  if (it.date && it.alert2 !== null && it.alert2 !== undefined) info.push(['bell', 'Segundo aviso: ' + esc(alertLabelFor(it.alert2, !it.time).toLowerCase())]);
  if (it.date && it.repeat && it.repeat !== 'none') info.push(['repeat', esc(repeatLabel(it.repeat))]);
  if (it.invitees && it.invitees.length) info.push(['people', 'Con ' + esc(it.invitees.join(', '))]);
  if (it.location) info.push(['pin', esc(it.location)]);
  if (it.amount !== null && it.amount !== undefined) info.push(['money', esc(fmtMoney(it.amount))]);
  if (it.priority) info.push(['flag', '<span class="imp">Importante</span>']);
  if (it.notes) info.push(['note', esc(it.notes).replace(/\n/g, '<br>')]);
  $('#detailTopic').innerHTML = `<span class="det__topic" style="--tc:${esc(t.color)}"><span class="ticon ticon--sm">${icon(t.icon)}</span>${esc(t.name)}</span>`;
  const open = it.date && !it.done;
  $('#detailBody').innerHTML = `<h2 class="det__title" id="detailTitle" tabindex="-1">${esc(it.title)}</h2>` +
    `<ul class="det__info">${info.map(r => `<li>${icon(r[0])}<span>${r[1]}</span></li>`).join('')}</ul>` +
    `<div class="actions">` +
    `<button type="button" class="btn btn--primary btn--block" data-act="d-done">${icon('check')}${it.done ? 'Volver a pendientes' : 'Marcar como hecho'}</button>` +
    (open ? calBtn(it) : '') +
    (open ? `<button type="button" class="btn btn--secondary btn--block" data-act="d-invite" aria-expanded="false" aria-controls="invitePanel">${icon('people')}Invitar a alguien</button><div class="invite" id="invitePanel" hidden>${inviteHtml(it)}</div>` : '') +
    `<button type="button" class="btn btn--secondary btn--block" data-act="d-edit">${icon('edit')}Editar</button>` +
    `<button type="button" class="btn btn--danger btn--block" data-act="d-delete">${icon('trash')}Eliminar</button></div>`;
}
function openDetail(id) {
  detailId = id; renderDetail();
  const dlg = $('#detailSheet'); openSheet(dlg);
  dlg.querySelector('.sheet__body').scrollTop = 0;
  try { $('#detailTitle').focus({ preventScroll: true }); } catch (e) {}
}

/* ---------- nuevo / editar: una pregunta por vez ---------- */
let draft = null, lastStep = null;
const ORDER = ['que', 'tema', 'cuando', 'hora', 'aviso'];
function newDraft(b) {
  const d = Object.assign({ id: null, title: '', topic: null, topicAuto: false, date: undefined, time: undefined, alert: undefined, alertPending: undefined, alert2: null, duration: null, repeat: 'none', invitees: [], location: '', amount: null, priority: 0, notes: '', kind: 'tarea', step: 'que', custom: null, more: false }, b || {});
  d.invitees = (d.invitees || []).slice();
  if (!d.id) d.step = d.title ? nextStep(d) : 'que';
  return d;
}
function editDraft(it) {
  return {
    id: it.id, title: it.title, topic: it.topic, date: it.date || null, time: it.date ? (it.time || null) : null,
    alert: it.date ? (it.alert === undefined ? null : it.alert) : null, alert2: it.date && it.alert2 !== undefined ? it.alert2 : null,
    duration: it.duration || null, repeat: it.repeat || 'none', invitees: it.invitees || [], location: it.location || '',
    amount: it.amount === undefined ? null : it.amount, priority: it.priority ? 1 : 0, notes: it.notes || '', kind: it.kind || 'tarea', step: 'listo',
    more: !!((it.repeat && it.repeat !== 'none') || (it.invitees && it.invitees.length) || it.location || (it.amount !== null && it.amount !== undefined) || it.priority || it.notes || (it.alert2 !== null && it.alert2 !== undefined))
  };
}
function nextStep(d) {
  if (!d.title) return 'que';
  if (!d.topic) return 'tema';
  if (d.date === undefined) return 'cuando';
  if (typeof d.date === 'string' && d.time === undefined) return 'hora';
  if (typeof d.date === 'string' && d.alert === undefined) return 'aviso';
  return 'listo';
}
function isAnswered(step) {
  const d = draft;
  if (step === 'que') return !!d.title;
  if (step === 'tema') return !!d.topic;
  if (step === 'cuando') return d.date !== undefined;
  if (step === 'hora') return d.time !== undefined;
  return d.alert !== undefined;
}
function suggestTopic(text, p) {
  const ordered = SUGGEST_ORDER.map(id => state.topics.find(t => t.id === id)).filter(Boolean).concat(state.topics.filter(t => SUGGEST_ORDER.indexOf(t.id) < 0));
  const id = Parser.suggestTopic(text, p, ordered);
  return id && id !== 'otros' ? id : null;
}
function setDate(v) {
  const had = typeof draft.date === 'string';
  draft.date = v;
  if (v === null) { draft.time = null; draft.alert = null; draft.alert2 = null; draft.alertPending = undefined; }
  else if (!had) { if (draft.time === null) draft.time = undefined; if (draft.alert === null) draft.alert = undefined; }
}
function resolvePendingAlert() {
  if (draft.alertPending === undefined || draft.time === undefined) return;
  const v = draft.alertPending; draft.alertPending = undefined;
  draft.alert = v === null ? null : typeof draft.time === 'string' ? Math.max(0, v) : toAllDayAlert(v);
}
function setTimeVal(v) {
  const was = typeof draft.time === 'string', now = typeof v === 'string';
  draft.time = v;
  if (draft.alertPending !== undefined) { resolvePendingAlert(); return; }
  if (was !== now && draft.alert !== undefined && draft.alert !== null) draft.alert = undefined; /* cambió el tipo de aviso: se vuelve a preguntar */
  if (draft.alert2 !== null && draft.alert2 !== undefined && !alertValid(draft.alert2, now)) draft.alert2 = null;
}
/* Lee lo escrito: separa el título y aprovecha fecha, hora, tema y demás si los dijiste. */
function commitTitle() {
  const input = $('#f_title'), raw = (input ? input.value : draft.title || '').trim();
  if (!raw) return false;
  if (raw === draft.title) return true;
  const p = Parser.parse(raw, { topics: state.topics });
  draft.title = p.title || raw;
  if (p.topic) { draft.topic = p.topic; draft.topicAuto = false; }
  else if (!draft.topic || draft.topicAuto) { const s = suggestTopic(raw, p); if (s) { draft.topic = s; draft.topicAuto = true; } }
  if (p.date) { setDate(p.date); if (p.time) setTimeVal(p.time); }
  if (p.alert !== undefined) { draft.alertPending = p.alert; resolvePendingAlert(); }
  if (p.alert2 !== undefined && p.alert2 !== null) draft.alert2 = p.alert2;
  if (p.duration) draft.duration = p.duration;
  if (p.repeat) draft.repeat = p.repeat;
  p.invitees.forEach(x => { if (draft.invitees.indexOf(x) < 0) draft.invitees.push(x); });
  if (p.location) draft.location = p.location;
  if (p.amount !== null) draft.amount = p.amount;
  if (p.priority) draft.priority = 1;
  if (p.kind !== 'tarea') draft.kind = p.kind;
  return true;
}
function question(step, isNew) {
  const d = draft, cls = 'q' + (isNew ? ' is-new' : '');
  if (step === 'que') {
    return `<section class="${cls}"><label class="q__label" for="f_title">¿Qué hay que hacer?</label>` +
      `<input class="q__input" id="f_title" type="text" value="${esc(d.title)}" placeholder="Ej.: Llamar a Matías mañana 10 hs" enterkeyhint="next" autocomplete="off" autocapitalize="sentences">` +
      `<div class="understood" id="understood" aria-live="polite"></div></section>`;
  }
  if (step === 'tema') {
    return `<section class="${cls}"><h3 class="q__label" tabindex="-1">¿De qué tema?</h3><div class="opts">` +
      state.topics.filter(t => !t.hidden || t.id === d.topic).map(t => `<button type="button" class="opt opt--topic" data-act="f-topic" data-topic="${esc(t.id)}" aria-pressed="${d.topic === t.id}" style="--tc:${esc(t.color)}"><span class="ticon">${icon(t.icon)}</span><span>${esc(t.name)}</span></button>`).join('') +
      '</div></section>';
  }
  if (step === 'cuando') {
    const t = fromYmd(todayStr()), day = n => addDays(t, n), name = n => cap(F.wdLong.format(day(n))) + ' ' + day(n).getDate(), custom = d.custom === 'fecha';
    const opts = [['Hoy', ymd(t)], ['Mañana', ymd(day(1))], [name(2), ymd(day(2))], [name(3), ymd(day(3))], ['Elegir día', 'custom'], ['Sin fecha', '']];
    return `<section class="${cls}"><h3 class="q__label" tabindex="-1">¿Cuándo?</h3><div class="opts">` +
      opts.map(o => `<button type="button" class="opt" data-act="f-date" data-value="${o[1]}" aria-pressed="${o[1] === 'custom' ? custom : !custom && (o[1] === '' ? d.date === null : d.date === o[1])}">${esc(o[0])}</button>`).join('') + '</div>' +
      (custom ? `<div class="custom"><label class="sr" for="f_date">Día</label><input id="f_date" type="date" value="${typeof d.date === 'string' ? d.date : ''}"><button type="button" class="btn btn--primary" data-act="f-date-ok">Listo</button></div>` : '') + '</section>';
  }
  if (step === 'hora') {
    const custom = d.custom === 'hora';
    return `<section class="${cls}"><h3 class="q__label" tabindex="-1">¿A qué hora?</h3><div class="opts opts--times">` +
      `<button type="button" class="opt opt--wide" data-act="f-time" data-value="" aria-pressed="${!custom && d.time === null}">Todo el día</button>` +
      ASK_TIMES.map(o => `<button type="button" class="opt" data-act="f-time" data-value="${o[0]}" aria-pressed="${o[0] === 'custom' ? custom : !custom && d.time === o[0]}">${o[1]}</button>`).join('') + '</div>' +
      (custom ? `<div class="custom"><label class="sr" for="f_time">Hora</label><input id="f_time" type="time" step="300" value="${typeof d.time === 'string' ? d.time : ''}"><button type="button" class="btn btn--primary" data-act="f-time-ok">Listo</button></div>` : '') + '</section>';
  }
  const timed = typeof d.time === 'string', list = timed ? ASK_ALERT_TIMED : ASK_ALERT_ALLDAY;
  return `<section class="${cls}"><h3 class="q__label" tabindex="-1">¿Te aviso?</h3><div class="opts">` +
    list.map(o => `<button type="button" class="opt" data-act="f-alert" data-value="${o[0]}" aria-pressed="${o[0] === '' ? d.alert === null : String(d.alert) === o[0]}">${o[1]}</button>`).join('') + '</div></section>';
}
function answerRow(step) {
  const d = draft; let k, v, ic;
  if (step === 'que') { k = 'Qué'; v = esc(d.title); ic = icon('check'); }
  else if (step === 'tema') { const t = topicOf(d.topic); k = 'Tema'; v = esc(t.name); ic = `<span class="ticon ticon--sm" style="--tc:${esc(t.color)}">${icon(t.icon)}</span>`; }
  else if (step === 'cuando') { k = 'Cuándo'; v = d.date ? esc(dateLong(d.date)) : 'Sin fecha'; ic = icon('calendar'); }
  else if (step === 'hora') { k = 'Hora'; v = d.time ? esc(d.time) : 'Todo el día'; ic = icon('clock'); }
  else { k = 'Aviso'; v = d.alert === null ? 'No avisar' : esc(alertLabelFor(d.alert, typeof d.time !== 'string')); ic = icon('bell'); }
  return `<div class="ans"><span class="ans__ic">${ic}</span><span class="ans__txt"><span class="ans__k">${k}</span><span class="ans__v">${v}</span></span>` +
    `<button type="button" class="ans__edit" data-act="f-change" data-step="${step}" aria-label="Cambiar ${k.toLowerCase()}">Cambiar</button></div>`;
}
const fieldText = (id, label, value, attrs) => `<label class="field" for="${id}"><span class="field__l">${label}</span><input id="${id}" type="text" value="${esc(value)}" ${attrs || ''}></label>`;
const fieldSelect = (id, label, pairs, value) => `<label class="field" for="${id}"><span class="field__l">${label}</span><select id="${id}">${pairs.map(p => `<option value="${esc(p[0])}"${String(value) === p[0] ? ' selected' : ''}>${esc(p[1])}</option>`).join('')}</select></label>`;
function moreHtml() {
  const d = draft, dated = typeof d.date === 'string', timed = dated && typeof d.time === 'string', sum = [];
  if (dated && d.repeat !== 'none') sum.push(repeatLabel(d.repeat));
  if (d.invitees.length) sum.push('Con ' + d.invitees.join(', '));
  if (d.location) sum.push(d.location);
  if (d.amount !== null) sum.push(fmtMoney(d.amount));
  if (d.priority) sum.push('Importante');
  if (d.notes) sum.push('Notas');
  return `<button type="button" class="more-toggle" data-act="f-more" aria-expanded="${d.more}" aria-controls="moreBox"><span>Más opciones${sum.length && !d.more ? `<small>${esc(sum.join(' · '))}</small>` : ''}</span>${icon('chevD')}</button>` +
    `<div class="more" id="moreBox"${d.more ? '' : ' hidden'}>` +
    (dated ? fieldSelect('f_repeat', 'Repetir', REPEATS, d.repeat || 'none') : '') +
    fieldText('f_invitees', 'Con quién', d.invitees.join(', '), 'list="dl_people" placeholder="Nombres o mails, separados por coma" autocomplete="off"') +
    fieldText('f_location', 'Dónde', d.location, 'list="dl_places" autocomplete="off"') +
    fieldText('f_amount', 'Monto', d.amount !== null ? String(d.amount).replace('.', ',') : '', 'inputmode="decimal" placeholder="$ 0"') +
    (timed ? fieldSelect('f_duration', 'Duración', DURATIONS.map(m => [String(m), durLabel(m)]), String(d.duration || (d.kind === 'reunion' || d.invitees.length ? state.settings.meetingDuration : 60))) : '') +
    (dated ? fieldSelect('f_alert2', 'Segundo aviso', timed ? ALERTS_TIMED : ALERTS_ALLDAY, d.alert2 === null || d.alert2 === undefined ? '' : String(d.alert2)) : '') +
    `<label class="switch" for="f_priority"><span>Importante</span><input id="f_priority" type="checkbox"${d.priority ? ' checked' : ''}></label>` +
    `<label class="field" for="f_notes"><span class="field__l">Notas</span><textarea id="f_notes" rows="3">${esc(d.notes)}</textarea></label></div>`;
}
function renderForm() {
  const d = draft, parts = [];
  $('#formTitle').textContent = d.id ? 'Editar' : 'Nuevo pendiente';
  ORDER.forEach(step => {
    if ((step === 'hora' || step === 'aviso') && typeof d.date !== 'string') return;
    if (d.step === step) parts.push(question(step, lastStep !== step && !reduced()));
    else if (isAnswered(step)) parts.push(answerRow(step));
  });
  if (d.step === 'listo') parts.push(moreHtml());
  $('#formBody').innerHTML = parts.join('');
  lastStep = d.step;
  $('#formErr').textContent = '';
  $('#btnSave').textContent = d.step === 'que' ? 'Siguiente' : 'Guardar';
  updateTitleUi();
}
function updateTitleUi() {
  const input = $('#f_title'), v = input ? input.value.trim() : draft.title;
  $('#btnSave').disabled = !v;
  const el = $('#understood'); if (!el) return;
  if (!v || v === draft.title) { el.innerHTML = ''; return; }
  const p = Parser.parse(v, { topics: state.topics }), chips = [];
  const tid = p.topic || (!draft.topic || draft.topicAuto ? suggestTopic(v, p) : null);
  if (tid) { const t = topicOf(tid); chips.push(`<span class="chip" style="--tc:${esc(t.color)}"><span class="ticon ticon--xs">${icon(t.icon)}</span>${esc(t.name)}</span>`); }
  if (p.date) chips.push(`<span class="chip">${icon(p.time ? 'clock' : 'calendar')}${esc(whenLabel({ date: p.date, time: p.time }))}</span>`);
  if (p.alert !== undefined) chips.push(`<span class="chip">${icon('bell')}${p.alert === null ? 'Sin aviso' : esc(alertLabelFor(p.alert, false))}</span>`);
  if (p.repeat) chips.push(`<span class="chip">${icon('repeat')}${esc(repeatLabel(p.repeat))}</span>`);
  if (p.invitees.length) chips.push(`<span class="chip">${icon('people')}${esc(p.invitees.join(', '))}</span>`);
  if (p.location) chips.push(`<span class="chip">${icon('pin')}${esc(p.location)}</span>`);
  if (p.amount !== null) chips.push(`<span class="chip">${icon('money')}${esc(fmtMoney(p.amount))}</span>`);
  if (p.priority) chips.push(`<span class="chip">${icon('flag')}Importante</span>`);
  el.innerHTML = chips.length ? `<span class="understood__k">Entendí</span>${chips.join('')}` : '';
}
function formError(msg) { $('#formErr').textContent = msg; }
function advance() {
  draft.step = nextStep(draft); draft.custom = null;
  renderForm();
  const active = document.activeElement; if (active && active.blur && active.id === 'f_title') active.blur();
  const target = draft.step === 'listo' ? $('#btnSave') : $('#formBody .q .q__label');
  if (target) {
    try { target.focus({ preventScroll: true }); } catch (e) {}
    const box = $('#formBody .q') || $('#formBody .more-toggle');
    if (box) box.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
  }
}
function openForm(base) {
  draft = newDraft(base); lastStep = null;
  $('#dl_people').innerHTML = state.people.map(p => `<option value="${esc(p)}">`).join('');
  $('#dl_places').innerHTML = state.places.map(p => `<option value="${esc(p)}">`).join('');
  renderForm();
  const dlg = $('#formSheet'); openSheet(dlg);
  dlg.querySelector('.sheet__body').scrollTop = 0;
  const input = $('#f_title');
  if (draft.step === 'que' && input) input.focus(); else { try { $('#formTitle').focus({ preventScroll: true }); } catch (e) {} }
}
function saveForm() {
  const d = draft;
  if (d.step === 'que' && !commitTitle()) { formError('Escribí qué hay que hacer'); const i = $('#f_title'); if (i) i.focus(); return; }
  if (d.alertPending !== undefined) { if (d.time === undefined) d.time = null; resolvePendingAlert(); }
  const date = typeof d.date === 'string' ? d.date : null;
  const time = date && typeof d.time === 'string' ? d.time : null;
  const topic = d.topic || suggestTopic(d.title, { amount: d.amount }) || 'otros';
  const kind = d.invitees.length ? 'reunion' : (d.kind || 'tarea');
  let alert = date ? (d.alert === undefined ? defaultAlertFor(date, time) : d.alert) : null;
  if (date && !alertValid(alert, !!time)) alert = defaultAlertFor(date, time);
  const alert2 = date && d.alert2 !== null && d.alert2 !== undefined && alertValid(d.alert2, !!time) ? d.alert2 : null;
  const data = {
    title: d.title, topic, kind, date, time,
    duration: time ? (d.duration || (kind === 'reunion' ? Number(state.settings.meetingDuration) : 60)) : null,
    alert, alert2, repeat: date ? (d.repeat || 'none') : 'none', invitees: d.invitees.slice(), location: d.location || '',
    amount: d.amount, priority: d.priority ? 1 : 0, notes: (d.notes || '').trim()
  };
  let it = d.id ? byId(d.id) : null;
  if (it) Object.assign(it, data, { updatedAt: Date.now() });
  else { it = Object.assign({ id: uid(), done: false, doneAt: null, createdAt: Date.now(), updatedAt: Date.now() }, data); state.items.unshift(it); }
  rememberPeople(it); save();
  closeSheet($('#formSheet')); render();
  if (!$('#detailSheet').open && detailId === it.id) detailId = null;
  toast((d.id ? 'Guardado' : 'Anotado') + (it.date ? ' · ' + whenLabel(it) : ''), it.date && !it.done ? [{ label: 'Al Calendario', cal: it }] : []);
}

/* ---------- ajustes ---------- */
function renderTopicEditor() {
  const box = $('#topicEditor'); if (!box) return;
  box.innerHTML = state.topics.map(t => `<div class="trow${t.hidden ? ' is-hidden' : ''}" data-id="${esc(t.id)}">` +
    `<input type="color" value="${esc(t.color)}" data-f="color" aria-label="Color de ${esc(t.name)}">` +
    `<input type="text" value="${esc(t.name)}" data-f="name" aria-label="Nombre del tema" maxlength="40">` +
    `<button type="button" class="icon-btn" data-act="t-hide" aria-label="${t.hidden ? 'Mostrar' : 'Ocultar'} ${esc(t.name)}" aria-pressed="${!!t.hidden}">${icon(t.hidden ? 'eyeOff' : 'eye')}</button>` +
    (t.id === 'otros' ? '<span></span>' : `<button type="button" class="icon-btn" data-act="t-del" aria-label="Eliminar ${esc(t.name)}">${icon('trash')}</button>`) +
    `<select data-f="icon" aria-label="Ícono de ${esc(t.name)}">${TOPIC_ICONS.map(i => `<option value="${i}"${i === t.icon ? ' selected' : ''}>${ICON_LABELS[i] || i}</option>`).join('')}</select>` +
    '</div>').join('');
}
function renderSettings() {
  const s = state.settings, sel = (id, pairs, v) => `<select id="${id}">${pairs.map(p => `<option value="${esc(p[0])}"${String(v) === p[0] ? ' selected' : ''}>${esc(p[1])}</option>`).join('')}</select>`;
  $('#settingsBody').innerHTML =
    `<details class="set"><summary>Tu nombre y mail ${icon('chevR')}</summary><div class="set__body">` +
      `<p class="set__note">Aparecen en las invitaciones que mandás.</p>` +
      `<label class="field" for="s_name"><span class="field__l">Nombre</span><input id="s_name" type="text" autocomplete="name" value="${esc(s.name)}"></label>` +
      `<label class="field" for="s_email"><span class="field__l">Mail</span><input id="s_email" type="email" autocomplete="email" value="${esc(s.email)}"></label></div></details>` +
    `<details class="set"><summary>Avisos ${icon('chevR')}</summary><div class="set__body">` +
      `<label class="field" for="s_alertTimed"><span class="field__l">Si tiene hora</span>${sel('s_alertTimed', ALERTS_TIMED.slice(1), s.alertTimed)}</label>` +
      `<label class="field" for="s_alertAllDay"><span class="field__l">Si es todo el día</span>${sel('s_alertAllDay', ALERTS_ALLDAY.slice(1), s.alertAllDay)}</label>` +
      `<label class="field" for="s_meetingDuration"><span class="field__l">Duración de las reuniones</span>${sel('s_meetingDuration', DURATIONS.map(m => [String(m), durLabel(m)]), s.meetingDuration)}</label></div></details>` +
    `<details class="set"><summary>Temas ${icon('chevR')}</summary><div class="set__body"><div class="tedit" id="topicEditor"></div>` +
      `<button type="button" class="btn btn--secondary btn--block" data-act="s-add-topic">${icon('plus')}Agregar tema</button></div></details>` +
    `<details class="set"><summary>Copia de seguridad ${icon('chevR')}</summary><div class="set__body">` +
      `<p class="set__note">Tus pendientes se guardan solo en este teléfono. Bajá una copia cada tanto.</p>` +
      `<button type="button" class="btn btn--secondary btn--block" data-act="s-backup">Bajar copia</button>` +
      `<button type="button" class="btn btn--secondary btn--block" data-act="s-restore">Restaurar una copia</button></div></details>` +
    `<div class="set set--row"><span id="themeLabel">Apariencia</span><div class="seg3" role="radiogroup" aria-labelledby="themeLabel">` +
      [['auto', 'Auto'], ['light', 'Clara'], ['dark', 'Oscura']].map(o => `<button type="button" role="radio" aria-checked="${(s.theme || 'auto') === o[0]}" data-act="s-theme" data-value="${o[0]}">${o[1]}</button>`).join('') + '</div></div>' +
    `<button type="button" class="set set--btn" data-act="s-export">${icon('calendar')}Mandar todo al Calendario</button>` +
    `<button type="button" class="set set--btn set--danger" data-act="s-clear">${icon('trash')}Borrar las hechas</button>` +
    `<details class="set"><summary>Ayuda ${icon('chevR')}</summary><div class="set__body set__note">` +
      `<p>Para tenerlo como app: en Safari tocá Compartir y «Agregar a inicio».</p>` +
      `<p>Al escribir podés decir el día y la hora, por ejemplo «mañana 10 hs» o «el viernes». Lo entiendo solo.</p>` +
      `<p>«Agregar al Calendario» abre el evento en el Calendario del iPhone. Ahí tocá «Añadir».</p></div></details>`;
  renderTopicEditor();
}
function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = 'pendientes-copia-' + todayStr() + '.json'; document.body.appendChild(a); a.click(); a.remove();
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
      save(); applyTheme(); render(); renderSettings();
      toast('Copia restaurada: ' + plural(added, 'nuevo', 'nuevos') + ', ' + plural(updated, 'actualizado', 'actualizados'));
    } catch (e) { toast('Ese archivo no es una copia de Pendientes'); }
  };
  r.readAsText(file);
}
function applyTheme() {
  const t = state.settings.theme || 'auto';
  if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
  const dark = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const meta = $('#metaTheme'); if (meta) meta.content = dark ? '#0F1114' : '#F4F5F7';
}

/* ---------- aviso flotante (queda por encima de las hojas abiertas) ---------- */
const toastEl = $('#toast');
const canPopover = typeof toastEl.showPopover === 'function';
if (canPopover) { toastEl.hidden = false; toastEl.setAttribute('popover', 'manual'); }
let toastTimer = null;
function hideToast() { if (canPopover) { try { toastEl.hidePopover(); } catch (e) {} } else toastEl.hidden = true; }
function toast(msg, actions) {
  actions = actions || [];
  toastEl.innerHTML = `<span class="toast__msg">${esc(msg)}</span>` + (actions.length ? `<span class="toast__acts">${actions.map((a, i) => {
    if (a.cal && ui.apiOk) return `<a href="${esc(links(a.cal).ios)}"${icsAttrs(a.cal)}>${esc(a.label)}</a>`;
    return `<button type="button" data-ti="${i}">${esc(a.label)}</button>`;
  }).join('')}</span>` : '');
  if (canPopover) { try { hideToast(); toastEl.showPopover(); } catch (e) {} } else toastEl.hidden = false;
  toastEl.onclick = e => {
    const b = e.target.closest('[data-ti]');
    if (b) { const a = actions[+b.dataset.ti]; if (a.cal) downloadIcs([a.cal], slug(a.cal.title)); else if (a.fn) a.fn(); }
    if (e.target.closest('a,button')) hideToast();
  };
  clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, actions.length ? 7000 : 3200);
}

/* ---------- eventos ---------- */
function bind() {
  $$('[data-icon]').forEach(el => { el.outerHTML = icon(el.dataset.icon); });

  document.addEventListener('click', e => {
    const goEl = e.target.closest('[data-go]');
    if (goEl) { const v = goEl.dataset.go; go(v, v === 'tema' ? goEl.dataset.topic : null); return; }
    const a = e.target.closest('[data-act]'); if (!a) return;
    const act = a.dataset.act, row = a.closest('.row');
    switch (act) {
      case 'toggle': {
        if (!row || row.classList.contains('is-checking')) return;
        const it = byId(row.dataset.id); if (!it) return;
        if (!it.done && !reduced()) { row.classList.add('is-checking'); setTimeout(() => toggleDone(it.id), 260); } else toggleDone(it.id);
        return;
      }
      case 'open': if (row) openDetail(row.dataset.id); return;
      case 'samples': loadSamples(); return;
      case 'new-in': openForm({ topic: a.dataset.topic }); return;
      case 'agenda-all': ui.agendaAll = true; render(); return;
      /* ficha */
      case 'd-done': { const id = detailId; closeSheet($('#detailSheet')); toggleDone(id); return; }
      case 'd-ics': { const it = byId(detailId); if (it) downloadIcs([it], slug(it.title)); return; }
      case 'd-invite': { const p = $('#invitePanel'), open = p.hidden; p.hidden = !open; a.setAttribute('aria-expanded', String(open)); if (open) p.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }); return; }
      case 'd-share': { const it = byId(detailId); if (it) navigator.share({ title: it.title, text: links(it).text }).catch(() => {}); return; }
      case 'd-copy': { const it = byId(detailId); if (it) copyText(links(it).text); return; }
      case 'd-edit': { const it = byId(detailId); closeSheet($('#detailSheet')); if (it) openForm(editDraft(it)); return; }
      case 'd-delete': { const id = detailId; closeSheet($('#detailSheet')); removeItem(id); return; }
      /* formulario */
      case 'f-topic': draft.topic = a.dataset.topic; draft.topicAuto = false; advance(); return;
      case 'f-date': {
        const v = a.dataset.value;
        if (v === 'custom') { draft.custom = 'fecha'; renderForm(); const i = $('#f_date'); if (i) { i.focus(); try { i.showPicker && i.showPicker(); } catch (er) {} } return; }
        setDate(v || null); advance(); return;
      }
      case 'f-date-ok': { const v = $('#f_date').value; if (!v) { formError('Elegí un día'); return; } setDate(v); advance(); return; }
      case 'f-time': {
        const v = a.dataset.value;
        if (v === 'custom') { draft.custom = 'hora'; renderForm(); const i = $('#f_time'); if (i) { i.focus(); try { i.showPicker && i.showPicker(); } catch (er) {} } return; }
        setTimeVal(v || null); advance(); return;
      }
      case 'f-time-ok': { const v = ($('#f_time').value || '').slice(0, 5); if (!v) { formError('Elegí una hora'); return; } setTimeVal(v); advance(); return; }
      case 'f-alert': draft.alert = a.dataset.value === '' ? null : Number(a.dataset.value); advance(); return;
      case 'f-change': {
        draft.step = a.dataset.step; draft.custom = null; renderForm();
        if (draft.step === 'que') { const i = $('#f_title'); if (i) { i.focus(); i.select(); } }
        else { const l = $('#formBody .q .q__label'); if (l) { try { l.focus({ preventScroll: true }); } catch (er) {} l.scrollIntoView({ block: 'nearest' }); } }
        return;
      }
      case 'f-more': draft.more = !draft.more; renderForm(); if (draft.more) $('#moreBox').scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }); return;
      /* ajustes */
      case 's-theme': state.settings.theme = a.dataset.value; save(); applyTheme(); $$('[data-act="s-theme"]').forEach(b => b.setAttribute('aria-checked', String(b === a))); return;
      case 's-add-topic': {
        const t = { id: 't' + Date.now().toString(36), name: 'Nuevo tema', color: PALETTE[state.topics.length % PALETTE.length], icon: 'tag', aliases: [], keywords: '' };
        state.topics.splice(state.topics.length - 1, 0, t); save(); renderTopicEditor(); render();
        const inp = $(`#topicEditor .trow[data-id="${t.id}"] [data-f="name"]`); if (inp) { inp.focus(); inp.select(); }
        return;
      }
      case 't-hide': { const r = a.closest('.trow'), t = state.topics.find(x => x.id === r.dataset.id); if (t) { t.hidden = !t.hidden; save(); renderTopicEditor(); render(); } return; }
      case 't-del': {
        const r = a.closest('.trow'), t = state.topics.find(x => x.id === r.dataset.id); if (!t) return;
        if (a.dataset.confirm !== '1') { a.dataset.confirm = '1'; a.innerHTML = '<span style="font-size:.8125rem;font-weight:700">¿Seguro?</span>'; setTimeout(() => { if (a.isConnected) { a.dataset.confirm = ''; a.innerHTML = icon('trash'); } }, 3000); return; }
        const n = state.items.filter(it => it.topic === t.id).length;
        state.items.forEach(it => { if (it.topic === t.id) it.topic = 'otros'; });
        state.topics = state.topics.filter(x => x.id !== t.id);
        if (ui.view === 'tema' && ui.topicId === t.id) goBack();
        save(); renderTopicEditor(); render(); toast('Tema eliminado' + (n ? '. Sus pendientes pasaron a Otros' : ''));
        return;
      }
      case 's-backup': exportJson(); return;
      case 's-restore': $('#importFile').click(); return;
      case 's-export': {
        const its = state.items.filter(it => !it.done && it.date);
        if (!its.length) { toast('No hay pendientes con fecha'); return; }
        downloadIcs(its, 'pendientes'); return;
      }
      case 's-clear': {
        const gone = state.items.filter(it => it.done); if (!gone.length) { toast('No hay hechas para borrar'); return; }
        state.items = state.items.filter(it => !it.done); save(); render();
        toast('Borré ' + plural(gone.length, 'hecha', 'hechas'), [{ label: 'Deshacer', fn: () => { state.items = state.items.concat(gone); save(); render(); } }]);
        return;
      }
    }
  });

  $('#btnBack').addEventListener('click', goBack);
  $('#btnSettings').addEventListener('click', () => { renderSettings(); const dlg = $('#settingsSheet'); openSheet(dlg); dlg.querySelector('.sheet__body').scrollTop = 0; });
  $('#btnNew').addEventListener('click', () => openForm(ui.view === 'tema' ? { topic: ui.topicId } : {}));
  window.addEventListener('popstate', e => {
    const s = e.state && e.state.v ? e.state : parseHash();
    ui.view = s.v; ui.topicId = s.id || null; ui.depth = e.state && e.state.d ? e.state.d : 0; ui.agendaAll = false;
    render(); window.scrollTo(0, 0);
  });

  /* hojas: cerrar con la X, tocando afuera o con Escape; el foco vuelve a donde estaba */
  $$('dialog.sheet').forEach(dlg => {
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); if (e.target.closest('[data-close]')) dlg.close(); });
    dlg.addEventListener('close', () => {
      if (dlg.id === 'settingsSheet') render();
      if (!$$('dialog[open]').length && dlg._opener && dlg._opener.isConnected) { try { dlg._opener.focus({ preventScroll: true }); } catch (e) {} }
    });
  });

  /* formulario */
  $('#itemForm').addEventListener('submit', e => {
    e.preventDefault();
    if (draft.step === 'que') { if (!commitTitle()) { formError('Escribí qué hay que hacer'); return; } advance(); return; }
    saveForm();
  });
  $('#formSheet').addEventListener('input', e => {
    const id = e.target.id;
    if (id === 'f_title') { updateTitleUi(); return; }
    if (id === 'f_invitees') draft.invitees = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    else if (id === 'f_location') draft.location = e.target.value.trim();
    else if (id === 'f_amount') { const raw = e.target.value.replace(/[^\d.,]/g, ''), n = raw ? Parser.parseAmount(raw) : null; draft.amount = n === null || isNaN(n) ? null : n; }
    else if (id === 'f_notes') draft.notes = e.target.value;
  });
  $('#formSheet').addEventListener('change', e => {
    const id = e.target.id;
    if (id === 'f_repeat') draft.repeat = e.target.value;
    else if (id === 'f_duration') draft.duration = Number(e.target.value);
    else if (id === 'f_alert2') draft.alert2 = e.target.value === '' ? null : Number(e.target.value);
    else if (id === 'f_priority') draft.priority = e.target.checked ? 1 : 0;
  });
  $('#formSheet').addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const id = e.target.id;
    if (id === 'f_title') { e.preventDefault(); if (!commitTitle()) { formError('Escribí qué hay que hacer'); return; } advance(); }
    else if (id === 'f_date') { e.preventDefault(); $('[data-act="f-date-ok"]').click(); }
    else if (id === 'f_time') { e.preventDefault(); $('[data-act="f-time-ok"]').click(); }
  });

  /* ajustes */
  $('#settingsSheet').addEventListener('change', e => {
    const id = e.target.id, v = e.target.value;
    if (id === 's_name') state.settings.name = v.trim();
    else if (id === 's_email') state.settings.email = v.trim();
    else if (id === 's_alertTimed' || id === 's_alertAllDay' || id === 's_meetingDuration') state.settings[id.slice(2)] = Number(v);
    else return;
    save();
  });
  $('#settingsSheet').addEventListener('input', e => {
    const r = e.target.closest('.trow'); if (!r) return;
    const t = state.topics.find(x => x.id === r.dataset.id), f = e.target.dataset.f; if (!t || !f) return;
    t[f] = f === 'name' ? (e.target.value.trim() || t.name) : e.target.value; save();
  });
  $('#importFile').addEventListener('change', e => { if (e.target.files[0]) importJson(e.target.files[0]); e.target.value = ''; });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

  /* atajos en la compu: N para nuevo */
  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || $$('dialog[open]').length || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'n' || e.key === 'N') { e.preventDefault(); openForm(ui.view === 'tema' ? { topic: ui.topicId } : {}); }
  });

  /* con el teclado abierto en el iPhone, las hojas suben para no quedar tapadas */
  if (window.visualViewport) {
    const vv = window.visualViewport;
    const follow = () => {
      const root = document.documentElement.style, off = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      root.setProperty('--kb', off + 'px'); root.setProperty('--vvt', Math.max(0, Math.round(vv.offsetTop)) + 'px');
    };
    vv.addEventListener('resize', follow); vv.addEventListener('scroll', follow);
  }

  /* el reloj avanza: lo atrasado cambia de color sin recargar */
  setInterval(() => { if (!document.hidden) render(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
}

/* ---------- arranque ---------- */
function init() {
  const s = parseHash();
  ui.view = s.v; ui.topicId = s.id; ui.depth = 0;
  try { history.replaceState({ v: s.v, id: s.id, d: 0 }, '', location.href); } catch (e) {}
  applyTheme(); bind(); render();
  if (/^https?:$/.test(location.protocol)) {
    fetch('/api/ics?ping=1', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(j => { ui.apiOk = !!(j && j.ok); if (ui.apiOk) { render(); if ($('#detailSheet').open) renderDetail(); } }).catch(() => {});
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
init();
})();
