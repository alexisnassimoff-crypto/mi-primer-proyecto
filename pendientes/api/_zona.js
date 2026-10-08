/* ============================================================
   Pendientes — zona horaria en el servidor
   Las funciones de Vercel corren en UTC; acá se pasa de «lo que anotaste»
   (día y hora en tu zona) a un instante exacto, y al revés.
   Empieza con guion bajo: no es una dirección.
   ============================================================ */
'use strict';

const ZONA = 'America/Argentina/Buenos_Aires';

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

/* Un Date «corrido» cuyos getters locales (getHours, getDate…) dan la hora de pared de la zona,
   esté el servidor en UTC o en cualquier otra. Sirve para que el parser entienda «mañana»
   o «en 2 horas» como vos. */
function ahoraEn(tz, ms) {
  ms = ms || Date.now();
  return new Date(ms + (desfase(ms, tz) + new Date(ms).getTimezoneOffset()) * 60000);
}

/* 2026-10-08 (día de pared en la zona) */
function hoyEn(tz, ms) {
  const d = ahoraEn(tz, ms), pad = n => (n < 10 ? '0' : '') + n;
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

module.exports = { ZONA, zonaValida, desfase, aUtc, ahoraEn, hoyEn };
