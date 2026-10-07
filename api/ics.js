/* ============================================================
   /api/ics — sirve un evento como archivo iCalendar (.ics)
   Función serverless de Vercel (zero-config, sin dependencias).

   En iPhone, Safari abre un text/calendar servido "inline" con la
   vista nativa de Calendario y el botón "Añadir": un toque y listo.

   GET  /api/ics?t=Título&s=20261008T130000Z&e=20261008T140000Z&a=15&l=Lugar...
        (parámetros: ver paramsFromEvent en pendientes/ics.js)
   GET  /api/ics?ping=1            -> {"ok":true}  (la app detecta que el API existe)
   POST /api/ics  (form: ics=<texto .ics>, f=<nombre>) -> devuelve ese .ics inline
        (lo usa "Exportar agenda" para importar muchos eventos de una vez)
   ============================================================ */
var ICS = require('../pendientes/ics.js');

function safeName(s) {
  return String(s || 'evento').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'evento';
}

function sendCalendar(res, text, name) {
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="' + safeName(name) + '.ics"');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.status(200).send(text);
}

module.exports = function (req, res) {
  var q = req.query || {};

  if (req.method === 'POST') {
    var body = req.body || {};
    if (typeof body === 'string') { try { body = Object.fromEntries(new URLSearchParams(body)); } catch (e) { body = {}; } }
    var text = String(body.ics || '');
    if (!/^BEGIN:VCALENDAR/.test(text.trim()) || text.length > 2000000) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(400).send('Falta el contenido .ics');
    }
    return sendCalendar(res, text, body.f || 'pendientes');
  }

  if ('ping' in q) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok: true, service: 'pendientes-ics' });
  }

  var ev = ICS.eventFromParams(q);
  if (!ev) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).send('Faltan datos: t (título) y s (inicio, 20261008T130000Z o 20261008).');
  }
  return sendCalendar(res, ICS.build({ events: [ev] }), ev.title);
};
