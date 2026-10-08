/* ============================================================
   /api/calendario — tus pendientes como calendario suscrito
   El iPhone se suscribe una vez (webcal://…/api/calendario?k=…) y vuelve
   a pedir esta dirección cada tanto: lo nuevo aparece solo y lo hecho
   o borrado desaparece. Cada pendiente con fecha lleva sus avisos.
   Lee lo que está guardado en Airtable (el respaldo de la app).

   GET  /api/calendario?k=LLAVE  -> text/calendar con los pendientes con fecha
   HEAD /api/calendario?k=LLAVE  -> solo confirma que la llave anda
   La llave la entrega GET /api/datos a la app conectada (ver _airtable.js).
   ============================================================ */
'use strict';
const ICS = require('../ics.js');
const Avisos = require('../avisos.js');
const { CAMPOS, esperar, configurado, tokenOk, listar } = require('./_airtable.js');

const P = CAMPOS.pendientes, A = CAMPOS.ajustes;
const ZONA = 'America/Argentina/Buenos_Aires';
const REPETIR = { 'todos los dias': 'DAILY', 'todas las semanas': 'WEEKLY', 'todos los meses': 'MONTHLY', 'todos los anos': 'YEARLY' };
const PLATA = [0, 2].map(d => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: d, maximumFractionDigits: d }));

function zonaValida(tz) {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return !!tz; } catch (e) { return false; }
}

/* Minutos que la zona está corrida de UTC en ese instante (Argentina: -180) */
function desfase(ms, tz) {
  const p = {};
  new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
    .formatToParts(new Date(ms)).forEach(x => { p[x.type] = +x.value; });
  return Math.round((Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second) - ms) / 60000);
}

/* Día y hora como los anotaste (en tu zona) -> instante exacto */
function aUtc(y, mo, d, h, mi, tz) {
  const pared = Date.UTC(y, mo - 1, d, h, mi);
  let t = pared;
  for (let i = 0; i < 2; i++) t = pared - desfase(t, tz) * 60000;
  return new Date(t);
}

/* Avisos de siempre y zona horaria, guardados por la app en la tabla Ajustes */
function ajustesDe(filas) {
  const out = { alertTimed: 15, alertAllDay: -540, tz: ZONA };
  const row = filas.find(r => r.fields && r.fields[A.key] === 'ajustes');
  let v = null;
  try { v = row ? JSON.parse(row.fields[A.value] || '{}') : null; } catch (e) { v = null; }
  if (v && typeof v === 'object') {
    if (typeof v.alertTimed === 'number' && isFinite(v.alertTimed)) out.alertTimed = v.alertTimed;
    if (typeof v.alertAllDay === 'number' && isFinite(v.alertAllDay)) out.alertAllDay = v.alertAllDay;
    if (typeof v.tz === 'string' && zonaValida(v.tz)) out.tz = v.tz;
  }
  return out;
}

/* Un registro de Airtable -> evento (o null si no va al calendario) */
function eventoDe(r, aj) {
  const f = r.fields || {};
  if (f[P.deleted] || f[P.done]) return null;
  const titulo = String(f[P.title] || '').trim();
  const fm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(f[P.date] || ''));
  if (!titulo || !fm) return null;
  const y = +fm[1], mo = +fm[2], d = +fm[3];
  const hm = /^(\d{1,2})[:.](\d{2})/.exec(String(f[P.time] || '').trim());
  const conHora = !!(hm && +hm[1] < 24 && +hm[2] < 60);
  let start, end;
  if (conHora) {
    start = aUtc(y, mo, d, +hm[1], +hm[2], aj.tz);
    end = new Date(start.getTime() + (Number(f[P.duration]) > 0 ? Number(f[P.duration]) : 60) * 60000);
  } else {
    start = new Date(y, mo - 1, d);
    end = new Date(y, mo - 1, d + 1);
  }
  let aviso = Avisos.parseAlertText(f[P.alert], conHora);
  if (aviso === undefined) aviso = conHora ? aj.alertTimed : aj.alertAllDay;
  const alarms = [aviso, Avisos.parseAlertText(f[P.alert2], conHora)]
    .filter((v, i, all) => typeof v === 'number' && isFinite(v) && all.indexOf(v) === i);
  const monto = typeof f[P.amount] === 'number' && isFinite(f[P.amount]) ? f[P.amount] : null;
  const desc = [
    String(f[P.notes] || '').trim(),
    monto !== null ? 'Monto: ' + PLATA[Number.isInteger(monto) ? 0 : 1].format(monto) : '',
    f[P.topic] ? 'Tema: ' + f[P.topic] : '',
    f[P.invitees] ? 'Con: ' + f[P.invitees] : ''
  ].filter(Boolean).join('\n');
  const freq = REPETIR[Avisos.plain(f[P.repeat]).trim()];
  const cambio = Date.parse(f[P.updatedAt]);
  return {
    uid: String(f[P.id] || r.rid).replace(/[^\w.-]/g, '').slice(0, 100) + '@pendientes',
    title: titulo.slice(0, 300), description: desc.slice(0, 4000), location: String(f[P.location] || '').trim().slice(0, 300),
    start, end, allDay: !conHora, alarms, rrule: freq ? 'FREQ=' + freq : '',
    priority: f[P.priority] ? 1 : 0, stamp: cambio ? new Date(cambio) : undefined
  };
}

function texto(res, status, msg) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.status(status).send(msg);
}

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow', 'GET, HEAD'); return texto(res, 405, 'Método no permitido'); }
  if (!configurado()) return texto(res, 503, 'Falta terminar la configuración de Pendientes en Vercel.');
  const q = req.query || {}, k = Array.isArray(q.k) ? q.k[0] : q.k;
  if (!tokenOk(k)) { await esperar(700); return texto(res, 401, 'Este link de calendario no anda. Copialo de nuevo desde Pendientes, en Ajustes.'); }
  const calendario = () => {
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="pendientes.ics"');
  };
  if (req.method === 'HEAD') { calendario(); return res.status(200).end(); }
  try {
    const [pendientes, ajustes] = await Promise.all([listar('pendientes'), listar('ajustes')]);
    const aj = ajustesDe(ajustes);
    const events = pendientes.map(r => eventoDe(r, aj)).filter(Boolean).sort((a, b) => a.start - b.start);
    calendario();
    return res.status(200).send(ICS.build({ events, name: 'Pendientes', refresh: 'PT15M', color: '#0E7490' }));
  } catch (e) {
    /* el calendario se queda con lo último que bajó y vuelve a probar más tarde */
    return texto(res, 502, 'No pude leer Airtable. Vuelvo a probar en un rato.');
  }
};

module.exports.eventoDe = eventoDe;
module.exports.aUtc = aUtc;
