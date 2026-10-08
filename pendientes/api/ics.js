/* ============================================================
   /api/ics — sirve un evento como archivo iCalendar (.ics)
   Función serverless de Vercel (zero-config, sin dependencias).
   El dashboard es su propio proyecto en Vercel con Root Directory = pendientes,
   por eso esta carpeta api/ vive adentro de pendientes/.

   En iPhone, Safari abre un text/calendar servido "inline" con la
   vista nativa de Calendario y el botón "Añadir": un toque y listo.

   GET  /api/ics?t=Título&s=20261008T130000Z&e=20261008T140000Z&a=15&l=Lugar...
        (parámetros: ver paramsFromEvent en pendientes/ics.js)
   GET  /api/ics?z=1&lote=…        -> muchos eventos juntos: Calendario ofrece «Añadir todo».
        lote = lista JSON de esos mismos parámetros, comprimida (z=1, deflate)
        y en base64url. Va todo en el link: anda sin Airtable y sin guardar nada.
   GET  /api/ics?ping=1            -> {"ok":true}  (la app detecta que el API existe)
   POST /api/ics  (form: ics=<texto .ics>, f=<nombre>) -> devuelve ese .ics inline
        (versiones viejas de la app; el iPhone no abre bien un POST)
   ============================================================ */
var zlib = require('zlib');
var ICS = require('../ics.js');

var MAX_LOTE = 500;

/* base64url (+ deflate) -> lista de eventos en formato de parámetros, o null */
function leerLote(texto, comprimido) {
  try {
    var buf = Buffer.from(String(texto || ''), 'base64');
    if (comprimido) buf = zlib.inflateSync(buf, { maxOutputLength: 4 * 1024 * 1024 });
    var lista = JSON.parse(buf.toString('utf8'));
    return Array.isArray(lista) ? lista : null;
  } catch (e) { return null; }
}

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

  var uno = function (v) { return Array.isArray(v) ? v[0] : v; };
  if (q.lote) {
    var lista = leerLote(uno(q.lote), uno(q.z) === '1') || [];
    var evs = lista.slice(0, MAX_LOTE).map(function (x) { return x && typeof x === 'object' ? ICS.eventFromParams(x) : null; }).filter(Boolean);
    if (!evs.length) {
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(400).send('No llegaron los pendientes. Volvé a la app y probá de nuevo.');
    }
    return sendCalendar(res, ICS.build({ events: evs, name: 'Pendientes' }), 'pendientes');
  }

  var ev = ICS.eventFromParams(q);
  if (!ev) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(400).send('Faltan datos: t (título) y s (inicio, 20261008T130000Z o 20261008).');
  }
  return sendCalendar(res, ICS.build({ events: [ev] }), ev.title);
};
