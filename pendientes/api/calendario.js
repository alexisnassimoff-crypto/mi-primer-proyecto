/* ============================================================
   /api/calendario — tus pendientes como calendario suscrito
   El iPhone se suscribe una vez (webcal://…/api/calendario?k=…) y vuelve
   a pedir esta dirección cada tanto: lo nuevo aparece solo y lo hecho
   o borrado desaparece. Cada pendiente con fecha lleva sus avisos.
   Lee lo que está guardado en Airtable (el respaldo de la app).

   GET  /api/calendario?k=LLAVE  -> text/calendar con los pendientes con fecha
   HEAD /api/calendario?k=LLAVE  -> solo confirma que la llave anda
   La llave la entrega GET /api/datos a la app conectada (ver _airtable.js).
   La respuesta queda 10 minutos en la red de Vercel para no gastar llamadas de Airtable
   (el plan gratis tiene un límite por mes y lo comparten todas las bases).
   Cuando lo pide la suscripción (no un navegador), se anota en Ajustes, fila «calendario»:
   así la app sabe que el Calendario está suscripto y deja de ofrecer agregarlo a mano.
   ============================================================ */
'use strict';
const ICS = require('../ics.js');
const Avisos = require('../avisos.js');
const { CAMPOS, TABLAS, esperar, configurado, tokenOk, listar, airtable } = require('./_airtable.js');
const { ZONA, zonaValida, aUtc, hoyEn } = require('./_zona.js');

const P = CAMPOS.pendientes, A = CAMPOS.ajustes;
const REPETIR = { 'todos los dias': 'DAILY', 'todas las semanas': 'WEEKLY', 'todos los meses': 'MONTHLY', 'todos los anos': 'YEARLY' };
const PLATA = [0, 2].map(d => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: d, maximumFractionDigits: d }));

/* Avisos de siempre, zona horaria y hora del resumen, guardados por la app en la tabla Ajustes */
function ajustesDe(filas) {
  const out = { alertTimed: 15, alertAllDay: -540, tz: ZONA, resumen: 8 };
  const row = filas.find(r => r.fields && r.fields[A.key] === 'ajustes');
  let v = null;
  try { v = row ? JSON.parse(row.fields[A.value] || '{}') : null; } catch (e) { v = null; }
  if (v && typeof v === 'object') {
    if (typeof v.alertTimed === 'number' && isFinite(v.alertTimed)) out.alertTimed = v.alertTimed;
    if (typeof v.alertAllDay === 'number' && isFinite(v.alertAllDay)) out.alertAllDay = v.alertAllDay;
    if (typeof v.tz === 'string' && zonaValida(v.tz)) out.tz = v.tz;
    if (typeof v.resumen === 'number' && isFinite(v.resumen)) out.resumen = Math.max(0, Math.min(23, Math.round(v.resumen)));
  }
  return out;
}

/* ---- El resumen de la mañana ----
   Un evento corto a la hora elegida, con aviso en el momento: «Hoy: ABL 12:00, Café 14:30…».
   Se arma para hoy y los próximos días, así está listo aunque el Calendario se actualice tarde.
   Solo los días que tienen algo (hoy también si hay atrasados). */
const plata = n => PLATA[Number.isInteger(n) ? 0 : 1].format(n);
const diaMas = (ymd, n) => { const m = ymd.split('-').map(Number); return new Date(Date.UTC(m[0], m[1] - 1, m[2] + n)).toISOString().slice(0, 10); };
const diaCorto = ymd => { const m = ymd.split('-').map(Number); return new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(m[0], m[1] - 1, m[2]))).replace('.', ''); };
function resumenes(pendientes, aj, hoy) {
  if (!aj.resumen) return [];
  const vivos = pendientes.map(r => r.fields || {}).filter(f => !f[P.deleted] && !f[P.done] && String(f[P.title] || '').trim() && /^\d{4}-\d{2}-\d{2}$/.test(String(f[P.date] || '')));
  const hora = f => { const m = /^(\d{1,2})[:.](\d{2})/.exec(String(f[P.time] || '')); return m ? (m[1].length < 2 ? '0' : '') + m[1] + ':' + m[2] : ''; };
  const orden = (a, b) => ((hora(a) || '99') < (hora(b) || '99') ? -1 : (hora(a) || '99') > (hora(b) || '99') ? 1 : 0);
  const linea = f => (hora(f) ? hora(f) + ' ' : '') + String(f[P.title]).trim() + (typeof f[P.amount] === 'number' ? ' (' + plata(f[P.amount]) + ')' : '');
  const corto = f => String(f[P.title]).trim() + (hora(f) ? ' ' + hora(f) : '');
  const atrasados = vivos.filter(f => f[P.date] < hoy).sort((a, b) => (a[P.date] < b[P.date] ? -1 : 1));
  const fin = diaMas(hoy, 6);
  const semana = vivos.filter(f => f[P.date] >= hoy && f[P.date] <= fin && typeof f[P.amount] === 'number' && f[P.amount] > 0).sort((a, b) => (a[P.date] < b[P.date] ? -1 : 1));
  const total = semana.reduce((s, f) => s + f[P.amount], 0);
  const out = [];
  for (let i = 0; i <= 6; i++) {
    const dia = diaMas(hoy, i), delDia = vivos.filter(f => f[P.date] === dia).sort(orden), esHoy = i === 0;
    if (!delDia.length && !(esHoy && atrasados.length)) continue;
    let title = delDia.length ? 'Hoy: ' + delDia.slice(0, 3).map(corto).join(', ') + (delDia.length > 3 ? ' y ' + (delDia.length - 3) + ' más' : '') : 'Hoy: nada anotado';
    if (esHoy && atrasados.length) title += ' · ' + atrasados.length + (atrasados.length === 1 ? ' atrasado' : ' atrasados');
    const desc = [];
    if (delDia.length) desc.push('Hoy:\n' + delDia.map(f => '• ' + linea(f)).join('\n'));
    if (esHoy && atrasados.length) desc.push('Atrasados:\n' + atrasados.slice(0, 8).map(f => '• ' + String(f[P.title]).trim() + ' (' + diaCorto(f[P.date]) + ')').join('\n') + (atrasados.length > 8 ? '\n• y ' + (atrasados.length - 8) + ' más' : ''));
    if (esHoy && semana.length) desc.push('Esta semana vencen ' + plata(total) + ':\n' + semana.slice(0, 8).map(f => '• ' + String(f[P.title]).trim() + ' ' + plata(f[P.amount]) + ' (' + diaCorto(f[P.date]) + ')').join('\n'));
    const m = dia.split('-').map(Number), start = aUtc(m[0], m[1], m[2], aj.resumen, 0, aj.tz);
    out.push({ uid: 'resumen-' + dia.replace(/-/g, '') + '@pendientes', title: title.slice(0, 300), description: desc.join('\n\n').slice(0, 4000),
      start, end: new Date(start.getTime() + 15 * 60000), allDay: false, alarms: [0], transparent: true });
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

/* Quién pidió el calendario: el iPhone, la Mac o Google lo piden solos cada tanto.
   Un navegador (Safari, Chrome) no es la suscripción: es «Agregar todo» o el link abierto a mano. */
function cliente(ua) {
  ua = String(ua || '');
  if (!ua || /Mozilla/i.test(ua)) return '';
  return /iOS|iPhone|iPad/i.test(ua) ? 'iPhone' : /macOS|Mac OS|CalendarAgent/i.test(ua) ? 'Mac' : /Google/i.test(ua) ? 'Google' : 'otro';
}

/* Anota cuándo lo pidió la suscripción. Como mucho una vez cada 30 minutos, para no gastar llamadas. */
async function anotarVisita(filas, quien) {
  const row = filas.find(r => r.fields && r.fields[A.key] === 'calendario');
  if (row && Date.now() - (Date.parse(row.fields[A.updatedAt]) || 0) < 30 * 60000) return;
  const ahora = new Date().toISOString(), fields = {};
  fields[A.key] = 'calendario';
  fields[A.value] = JSON.stringify({ visto: ahora, desde: quien });
  fields[A.updatedAt] = ahora;
  try {
    await airtable(TABLAS.ajustes.id, 'PATCH', row
      ? { typecast: true, records: [{ id: row.rid, fields }] }
      : { typecast: true, performUpsert: { fieldsToMergeOn: [A.key] }, records: [{ fields }] });
  } catch (e) { /* si no se pudo anotar, el calendario se entrega igual */ }
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
    const events = pendientes.map(r => eventoDe(r, aj)).filter(Boolean).concat(resumenes(pendientes, aj, hoyEn(aj.tz))).sort((a, b) => a.start - b.start);
    const quien = 't' in q ? '' : cliente(req.headers && req.headers['user-agent']);
    if (quien) await anotarVisita(ajustes, quien);
    calendario();
    /* la red de Vercel lo guarda 10 minutos (y lo sigue dando mientras lo renueva):
       así el Calendario puede pedirlo seguido sin gastar las llamadas de Airtable */
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    return res.status(200).send(ICS.build({ events, name: 'Pendientes', refresh: 'PT15M', color: '#0E7490' }));
  } catch (e) {
    /* el calendario se queda con lo último que bajó y vuelve a probar más tarde */
    return texto(res, 502, 'No pude leer Airtable. Vuelvo a probar en un rato.');
  }
};

module.exports.eventoDe = eventoDe;
module.exports.resumenes = resumenes;
module.exports.aUtc = aUtc;
