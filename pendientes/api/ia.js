/* ============================================================
   /api/ia — lo que hace Claude en Pendientes
   Pide la clave de la app (X-Clave) y ANTHROPIC_API_KEY en Vercel.

   POST /api/ia  JSON { accion, tz, temas: [{ id, nombre }], ... }
     accion 'armar'     { texto }            → { pendientes: [...] }   varias cosas dichas de una
     accion 'leer'      { archivo, tipo }    → { resumen, pendientes }  foto, captura o PDF
     accion 'preguntar' { pregunta, datos }  → { respuesta }            preguntas sobre tu agenda
     accion 'mensaje'   { pendiente, indicaciones, nombre } → { mensaje }  WhatsApp listo
   GET  /api/ia?ping=1 → { ok, ia }  (si está la clave de IA)

   Cada pendiente: { titulo, tema, fecha (AAAA-MM-DD|null), hora (HH:MM|null), duracion_min,
   monto, aviso (texto como «1 hora antes» o ''), repetir, con: [], lugar, notas }
   ============================================================ */
'use strict';
const Temas = require('../temas.js');
const { esperar, configurado, claveOk } = require('./_airtable.js');
const { ZONA, zonaValida, hoyEn } = require('./_zona.js');
const { hayClave, pedir, calendarioDesde } = require('./_claude.js');

const TIPOS = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/;
const MAX_ARCHIVO = 4.4 * 1024 * 1024; /* base64; Vercel recibe hasta 4,5 MB */
const REPETIR = ['no', 'diario', 'semanal', 'mensual', 'anual'];

/* Los temas que manda la app, con pistas para los de fábrica («Harper: la hija», palabras clave) */
function temasDe(lista) {
  const out = [];
  (Array.isArray(lista) ? lista : []).slice(0, 40).forEach(t => {
    const id = String(t && t.id || ''), nombre = String(t && (t.nombre || t.name) || '').trim().slice(0, 40);
    if (/^[\w-]{1,40}$/.test(id) && nombre && !out.some(x => x.id === id)) out.push({ id, nombre });
  });
  if (!out.length) Temas.DEFAULT_TOPICS.forEach(t => out.push({ id: t.id, nombre: t.name }));
  if (!out.some(t => t.id === 'otros')) out.push({ id: 'otros', nombre: 'Otros' });
  return out;
}
function temasTexto(temas) {
  return temas.map(t => {
    const d = Temas.DEFAULT_TOPICS.find(x => x.id === t.id);
    const pistas = d && d.keywords ? d.keywords.split('|').slice(0, 14).join(', ') : '';
    return '- ' + t.id + ': ' + t.nombre + (pistas ? ' (por ejemplo: ' + pistas + ')' : '');
  }).join('\n');
}

const esquemaPendiente = ids => ({
  type: 'object',
  properties: {
    titulo: { type: 'string', description: 'corto, con mayúscula, sin la fecha, la hora ni el monto: «Llamar a Matías», «Pagar el ABL»' },
    tema: { type: 'string', enum: ids },
    fecha: { anyOf: [{ type: 'string', format: 'date' }, { type: 'null' }], description: 'AAAA-MM-DD, o null si no dice cuándo' },
    hora: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'HH:MM en 24 horas, o null si es todo el día o no dice' },
    duracion_min: { anyOf: [{ type: 'integer' }, { type: 'null' }], description: 'si dice «de 10 a 11:30», 90; si no, null' },
    monto: { anyOf: [{ type: 'number' }, { type: 'null' }], description: 'en pesos: «35 mil» = 35000, «5 lucas» = 5000; null si no hay' },
    aviso: { type: 'string', description: 'solo si pide un aviso: «1 hora antes», «1 día antes», «Dos días antes a las 9»; si no, vacío' },
    repetir: { type: 'string', enum: REPETIR },
    con: { type: 'array', items: { type: 'string' }, description: 'personas con quien es, solo el nombre' },
    lugar: { type: 'string' },
    notas: { type: 'string', description: 'detalles útiles que no entran en el título; vacío si no hay' }
  },
  required: ['titulo', 'tema', 'fecha', 'hora', 'duracion_min', 'monto', 'aviso', 'repetir', 'con', 'lugar', 'notas'],
  additionalProperties: false
});

function limpiarPendiente(x, temas) {
  if (!x || typeof x !== 'object') return null;
  const titulo = String(x.titulo || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  if (!titulo) return null;
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(String(x.fecha || '')) ? x.fecha : null;
  const hm = /^(\d{1,2}):(\d{2})$/.exec(String(x.hora || ''));
  const hora = fecha && hm && +hm[1] < 24 && +hm[2] < 60 ? (hm[1].length < 2 ? '0' : '') + hm[1] + ':' + hm[2] : null;
  const dur = Number(x.duracion_min);
  return {
    titulo: titulo.charAt(0).toUpperCase() + titulo.slice(1),
    tema: temas.some(t => t.id === x.tema) ? x.tema : 'otros',
    fecha, hora,
    duracion_min: hora && dur > 0 && dur <= 1440 ? Math.round(dur) : null,
    monto: typeof x.monto === 'number' && isFinite(x.monto) && x.monto > 0 ? Math.round(x.monto * 100) / 100 : null,
    aviso: String(x.aviso || '').trim().slice(0, 60),
    repetir: REPETIR.indexOf(x.repetir) >= 0 ? x.repetir : 'no',
    con: (Array.isArray(x.con) ? x.con : []).map(s => String(s).trim().slice(0, 60)).filter(Boolean).slice(0, 20),
    lugar: String(x.lugar || '').trim().slice(0, 120),
    notas: String(x.notas || '').trim().slice(0, 1000)
  };
}

function sistema(hoy, temas) {
  return 'Sos el asistente de Pendientes, la agenda personal de Ale, en Argentina. Escribís en castellano rioplatense.\n' +
    'Días (para resolver «mañana», «el viernes», «el 15»):\n' + calendarioDesde(hoy, 21) + '\n' +
    'Temas posibles (usá el id):\n' + temasTexto(temas);
}

const REGLAS = 'Reglas para cada pendiente: el título corto y claro, en infinitivo o como lo dijo, sin la fecha, la hora ni el monto. ' +
  'Fechas relativas a hoy; si no dice cuándo, fecha null. «A la mañana/tarde/noche» sin hora: hora null. «A las 3 de la tarde» = 15:00. ' +
  'Montos en pesos argentinos («35 mil» = 35000, «5 lucas» = 5000). No inventes fechas, horas ni montos que no estén. ' +
  'Harper es la hija de Ale y Juli es su pareja: lo de ellas va en su tema.';

async function armar(b, temas, hoy) {
  const texto = String(b.texto || '').replace(/\s+/g, ' ').trim().slice(0, 1000);
  if (!texto) return { status: 400, body: { error: 'pedido' } };
  const ids = temas.map(t => t.id);
  const d = await pedir({
    system: sistema(hoy, temas), effort: 'low', maxTokens: 4096,
    schema: { type: 'object', properties: { pendientes: { type: 'array', items: esquemaPendiente(ids) } }, required: ['pendientes'], additionalProperties: false },
    content: [{ type: 'text', text: 'Convertí lo que dijo Ale en pendientes. Si son varias cosas, separalas: una por pendiente; si es una sola, devolvé una.\n' + REGLAS + '\n\nLo que dijo: «' + texto + '»' }]
  });
  const pendientes = (Array.isArray(d && d.pendientes) ? d.pendientes : []).map(x => limpiarPendiente(x, temas)).filter(Boolean).slice(0, 20);
  return { status: 200, body: { ok: true, pendientes } };
}

async function leer(b, temas, hoy) {
  const tipo = String(b.tipo || '');
  const archivo = String(b.archivo || '').replace(/^data:[^,]*,/, '').replace(/\s/g, '');
  if (!archivo || !TIPOS.test(tipo)) return { status: 400, body: { error: 'pedido' } };
  if (archivo.length > MAX_ARCHIVO) return { status: 413, body: { error: 'grande' } };
  const ids = temas.map(t => t.id);
  const bloque = tipo === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: archivo } }
    : { type: 'image', source: { type: 'base64', media_type: tipo, data: archivo } };
  const d = await pedir({
    system: sistema(hoy, temas), effort: 'medium', maxTokens: 4096,
    schema: {
      type: 'object',
      properties: {
        resumen: { type: 'string', description: 'una frase corta de qué es: «Factura de Edenor de octubre», «Circular del colegio con 3 fechas», «Captura de WhatsApp: cena el jueves»' },
        pendientes: { type: 'array', items: esquemaPendiente(ids) }
      },
      required: ['resumen', 'pendientes'], additionalProperties: false
    },
    content: [bloque, { type: 'text', text: 'Esto es una foto, captura o PDF que mandó Ale: puede ser una factura o boleta, una captura de WhatsApp, una circular del colegio, un turno médico, una invitación… Armá los pendientes que salen de ahí.\n' +
      'Si es una factura o boleta: un pendiente «Pagar <quién cobra> <período>» con el total a pagar (si hay varios vencimientos, el primero), la fecha de vencimiento, hora null, el tema de gastos y aviso «Dos días antes a las 9». ' +
      'Si son eventos (reuniones, turnos, actos, entregas, salidas): un pendiente por cada fecha, con hora y lugar si están. ' +
      'Si no hay nada para agendar, la lista vacía.\n' + REGLAS }]
  });
  const pendientes = (Array.isArray(d && d.pendientes) ? d.pendientes : []).map(x => limpiarPendiente(x, temas)).filter(Boolean).slice(0, 30);
  return { status: 200, body: { ok: true, resumen: String(d && d.resumen || '').trim().slice(0, 200), pendientes } };
}

async function preguntar(b, temas, hoy) {
  const pregunta = String(b.pregunta || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  const datos = String(b.datos || '').slice(0, 60000);
  if (!pregunta) return { status: 400, body: { error: 'pedido' } };
  const respuesta = await pedir({
    system: sistema(hoy, temas), effort: 'medium', maxTokens: 2048,
    content: [{ type: 'text', text: 'Estos son los datos de la agenda de Ale (pendientes, hechos y pagos):\n\n' + datos + '\n\n' +
      'Pregunta de Ale: «' + pregunta + '»\n\n' +
      'Respondé corto y claro (de 1 a 6 líneas), en castellano rioplatense, hablándole de vos, usando solo estos datos. ' +
      'Si hay plata, con formato $ 35.420. Si nombrás pendientes, con su día y hora. Si los datos no alcanzan para responder, decilo. ' +
      'Sin markdown, sin asteriscos ni numerales; si es una lista, una cosa por línea empezando con «• ».' }]
  });
  return { status: 200, body: { ok: true, respuesta: respuesta.replace(/\*\*/g, '').slice(0, 3000) } };
}

async function mensaje(b, temas, hoy) {
  const p = b.pendiente && typeof b.pendiente === 'object' ? b.pendiente : null;
  if (!p || !String(p.titulo || '').trim()) return { status: 400, body: { error: 'pedido' } };
  const campo = (k, n) => String(p[k] == null ? '' : p[k]).trim().slice(0, n || 200);
  const detalle = ['Qué: ' + campo('titulo'), campo('cuando') && 'Cuándo: ' + campo('cuando'), campo('lugar') && 'Dónde: ' + campo('lugar'),
    campo('con') && 'Con: ' + campo('con'), campo('monto', 40) && 'Monto: ' + campo('monto', 40), campo('notas', 600) && 'Notas: ' + campo('notas', 600)].filter(Boolean).join('\n');
  const indicaciones = String(b.indicaciones || '').trim().slice(0, 300), nombre = String(b.nombre || '').trim().slice(0, 60);
  const texto = await pedir({
    system: sistema(hoy, temas), effort: 'low', maxTokens: 1024,
    content: [{ type: 'text', text: 'Escribí un mensaje de WhatsApp de Ale sobre este pendiente:\n' + detalle + '\n' +
      (indicaciones ? 'Lo que quiere decir Ale: «' + indicaciones + '»\n' : '') +
      'Si es una reunión, salida o encuentro, que sea una invitación; si es algo que tiene que hacer otra persona, un recordatorio amable. ' +
      'Corto (hasta 4 líneas), cálido y natural, en castellano rioplatense, tuteando con vos. Incluí el día y la hora si están. ' +
      (nombre ? 'Si suena natural, firmá como ' + nombre + '. ' : '') +
      'Podés usar un emoji. Sin markdown, sin comillas alrededor, solo el mensaje.' }]
  });
  return { status: 200, body: { ok: true, mensaje: texto.replace(/^[«"]|[»"]$/g, '').trim().slice(0, 1500) } };
}

const ACCIONES = { armar, leer, preguntar, mensaje };

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const q = req.query || {};
  if (req.method === 'GET' && 'ping' in q) return res.status(200).json({ ok: true, ia: hayClave() });
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'metodo' }); }
  if (!configurado()) return res.status(503).json({ error: 'sin-configurar' });
  if (!claveOk(req.headers && req.headers['x-clave'])) { await esperar(700); return res.status(401).json({ error: 'clave' }); }
  if (!hayClave()) return res.status(503).json({ error: 'sin-ia' });
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object' || !ACCIONES[b.accion]) return res.status(400).json({ error: 'pedido' });
  const tz = zonaValida(b.tz) ? b.tz : ZONA;
  try {
    const r = await ACCIONES[b.accion](b, temasDe(b.temas), hoyEn(tz));
    return res.status(r.status).json(r.body);
  } catch (e) {
    return res.status(e.codigo === 'sin-ia' ? 503 : 502).json({ error: e.codigo || 'ia', detalle: e.detalle || '' });
  }
};

module.exports.limpiarPendiente = limpiarPendiente;
