/* ============================================================
   /api/anotar — anotar un pendiente sin abrir la app
   Lo usa el atajo de Siri («Oye Siri, anotar pendiente») y la hoja de
   compartir del iPhone (un mensaje de WhatsApp → Anotar en Pendientes).
   Entiende la frase igual que la app (parser.js), la guarda en Airtable
   y contesta en texto para que Siri lo lea: «Anotado: …».

   POST /api/anotar?k=LLAVE   cuerpo formulario o JSON: texto=…
   GET  /api/anotar?k=LLAVE&texto=…
   La llave la entrega GET /api/datos a la app conectada (ver _airtable.js);
   solo sirve para anotar: no lee ni borra nada.
   ============================================================ */
'use strict';
const crypto = require('crypto');
const Parser = require('../parser.js');
const Avisos = require('../avisos.js');
const Temas = require('../temas.js');
const { CAMPOS, esperar, configurado, claveOk, tokenAnotarOk, listar, escribir } = require('./_airtable.js');
const { ZONA, zonaValida, ahoraEn, hoyEn } = require('./_zona.js');

const P = CAMPOS.pendientes, T = CAMPOS.temas, A = CAMPOS.ajustes;
/* igual que en app.js: así la app lo lee de vuelta sin cambios */
const REPETIR = { daily: 'Todos los días', weekly: 'Todas las semanas', monthly: 'Todos los meses', yearly: 'Todos los años' };
const TIPO = { tarea: 'Tarea', reunion: 'Reunión', recordatorio: 'Recordatorio' };
const pad = n => (n < 10 ? '0' : '') + n;

function texto(res, status, msg) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.status(status).send(msg);
}

/* Lo que llegó por GET, por formulario (atajo) o por JSON */
function textoPedido(req) {
  const q = req.query || {};
  let b = req.body;
  if (typeof b === 'string') {
    try { b = JSON.parse(b); } catch (e) { try { b = Object.fromEntries(new URLSearchParams(b)); } catch (e2) { b = {}; } }
  }
  b = b && typeof b === 'object' ? b : {};
  const v = b.texto !== undefined ? b.texto : (b.text !== undefined ? b.text : q.texto);
  return String(Array.isArray(v) ? v[0] : (v || '')).replace(/\s+/g, ' ').trim().slice(0, 500);
}

/* Temas de la app: los de fábrica (con alias y palabras clave) más los que creaste en Airtable */
function temasDe(filas) {
  const base = Temas.DEFAULT_TOPICS.map(t => Object.assign({}, t));
  filas.filter(r => r.fields && r.fields[T.id] && !r.fields[T.deleted]).forEach(r => {
    const id = r.fields[T.id], name = String(r.fields[T.name] || '').trim();
    const t = base.find(x => x.id === id);
    if (t) { if (name) t.name = name; }
    else if (name) base.push({ id, name, aliases: [], keywords: '' });
  });
  return base;
}

function ajustesDe(filas) {
  const out = { alertTimed: 15, alertAllDay: -540, meetingDuration: 60, tz: ZONA };
  const row = filas.find(r => r.fields && r.fields[A.key] === 'ajustes');
  let v = null;
  try { v = row ? JSON.parse(row.fields[A.value] || '{}') : null; } catch (e) { v = null; }
  if (v && typeof v === 'object') {
    ['alertTimed', 'alertAllDay', 'meetingDuration'].forEach(k => { if (typeof v[k] === 'number' && isFinite(v[k])) out[k] = v[k]; });
    if (typeof v.tz === 'string' && zonaValida(v.tz)) out.tz = v.tz;
  }
  return out;
}

/* La frase → el pendiente, con las mismas reglas que el formulario de la app */
function entender(frase, temas, aj, ahora) {
  const p = Parser.parse(frase, { topics: temas, now: ahora });
  const title = p.title || frase;
  const ordenados = Temas.SUGGEST_ORDER.map(id => temas.find(t => t.id === id)).filter(Boolean).concat(temas.filter(t => Temas.SUGGEST_ORDER.indexOf(t.id) < 0));
  let topic = p.topic || Parser.suggestTopic(frase, p, ordenados) || 'otros';
  if (!temas.some(t => t.id === topic)) topic = 'otros';
  const date = p.date || null, time = date ? (p.time || null) : null, timed = !!time;
  const kind = p.invitees.length ? 'reunion' : (p.kind || 'tarea');
  let alert = null;
  if (date) {
    if (p.alert === undefined) alert = timed ? aj.alertTimed : aj.alertAllDay;
    else if (p.alert === null) alert = null;
    else alert = timed ? Math.max(0, p.alert) : Avisos.toAllDayAlert(p.alert);
  }
  let alert2 = date && p.alert2 !== undefined && p.alert2 !== null ? (timed ? Math.max(0, p.alert2) : Avisos.toAllDayAlert(p.alert2)) : null;
  if (alert2 !== null && !timed && !Avisos.ALERTS_ALLDAY.some(o => o[0] === String(alert2))) alert2 = null;
  return {
    id: crypto.randomUUID(), title, topic, kind, date, time,
    duration: timed ? (p.duration || (kind === 'reunion' ? aj.meetingDuration : 60)) : null,
    alert, alert2, repeat: date ? (p.repeat || 'none') : 'none',
    invitees: p.invitees.slice(0, 30), location: p.location || '', amount: p.amount, priority: p.priority ? 1 : 0
  };
}

function campos(it, temas) {
  const tema = temas.find(t => t.id === it.topic), ahora = new Date().toISOString(), timed = !!it.time, f = {};
  f[P.title] = it.title;
  f[P.topic] = tema ? tema.name : 'Otros';
  f[P.date] = it.date;
  f[P.time] = timed ? it.time : '';
  f[P.alert] = it.date ? Avisos.alertLabelFor(it.alert, !timed) : '';
  f[P.alert2] = it.date && it.alert2 !== null ? Avisos.alertLabelFor(it.alert2, !timed) : '';
  f[P.done] = false;
  f[P.priority] = !!it.priority;
  f[P.invitees] = it.invitees.join(', ');
  f[P.location] = it.location;
  f[P.amount] = typeof it.amount === 'number' && isFinite(it.amount) ? it.amount : null;
  f[P.repeat] = REPETIR[it.repeat] || null;
  f[P.duration] = timed && it.duration ? Number(it.duration) : null;
  f[P.kind] = TIPO[it.kind] || 'Tarea';
  f[P.notes] = '';
  f[P.deleted] = false;
  f[P.id] = it.id;
  f[P.createdAt] = ahora;
  f[P.updatedAt] = ahora;
  return f;
}

/* «Anotado en Gastos de la casa: Pagar ABL, el viernes 10 a las 12:00. Aviso 15 min antes.» */
function respuesta(it, temas, tz) {
  const tema = temas.find(t => t.id === it.topic);
  let s = 'Anotado' + (tema && tema.id !== 'otros' ? ' en ' + tema.name : '') + ': ' + it.title;
  if (it.date) {
    const hoy = hoyEn(tz), m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(it.date);
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    const manana = hoyEn(tz, Date.now() + 86400000);
    let cuando = it.date === hoy ? 'hoy' : it.date === manana ? 'mañana'
      : 'el ' + new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(d).replace(',', '');
    if (it.time) cuando += ' a las ' + it.time;
    s += ', ' + cuando;
  }
  s += '.';
  if (it.date && it.alert !== null) s += ' Aviso ' + Avisos.alertLabelFor(it.alert, !it.time).toLowerCase() + '.';
  if (it.amount !== null && it.amount !== undefined) s += ' ' + new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: Number.isInteger(it.amount) ? 0 : 2 }).format(it.amount) + '.';
  if (it.repeat && it.repeat !== 'none') s += ' ' + REPETIR[it.repeat] + '.';
  return s;
}

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET' && req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return texto(res, 405, 'Método no permitido'); }
  if (!configurado()) return texto(res, 503, 'Falta terminar la configuración de Pendientes en Vercel.');
  const q = req.query || {}, k = Array.isArray(q.k) ? q.k[0] : q.k;
  if (!tokenAnotarOk(k) && !claveOk(req.headers && req.headers['x-clave'])) { await esperar(700); return texto(res, 401, 'Este atajo no anda. Copiá el link de nuevo desde Pendientes, en Ajustes.'); }
  const frase = textoPedido(req);
  if (!frase) return texto(res, 400, 'No escuché qué anotar. Probá de nuevo.');
  try {
    const [temasFilas, ajustes] = await Promise.all([listar('temas'), listar('ajustes')]);
    const temas = temasDe(temasFilas), aj = ajustesDe(ajustes);
    const it = entender(frase, temas, aj, ahoraEn(aj.tz));
    await escribir('pendientes', [{ rid: null, fields: campos(it, temas) }]);
    return texto(res, 200, respuesta(it, temas, aj.tz));
  } catch (e) {
    return texto(res, 502, 'No pude guardar en Airtable. Probá de nuevo en un rato.');
  }
};

module.exports.entender = entender;
module.exports.respuesta = respuesta;
