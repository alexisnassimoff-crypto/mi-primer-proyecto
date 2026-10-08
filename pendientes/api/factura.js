/* ============================================================
   /api/factura — leer una factura con una foto
   La app manda la foto (chica, en JPEG) y acá se la pedimos a Claude:
   quién cobra, qué es, cuánto y cuándo vence. Con eso la app arma
   «Pagar Edenor $35.420, vence el 15» con su aviso.

   Variables de entorno (Vercel → Settings → Environment Variables):
     ANTHROPIC_API_KEY   clave de la API de Claude (console.anthropic.com)
   Pide la clave de Pendientes (header X-Clave): solo tu equipo conectado
   puede usar tu clave de IA.

   POST /api/factura   header X-Clave, JSON { imagen: base64, tipo: 'image/jpeg' }
        → { ok, esFactura, empresa, concepto, monto, vencimiento (AAAA-MM-DD), periodo }
   GET  /api/factura?ping=1 → { ok, ia: true|false }  (si está la clave de IA)

   Va con fetch directo a la API de Claude, sin el SDK: estas funciones no
   tienen dependencias (no hay package.json) y así se publican sin build.
   ============================================================ */
'use strict';
const { esperar, configurado, claveOk } = require('./_airtable.js');
const { ZONA, zonaValida, hoyEn } = require('./_zona.js');

const MODELO = 'claude-opus-5-5';
const MAX_IMAGEN = 5 * 1024 * 1024; /* base64 (la app manda ~300 KB) */

const ESQUEMA = {
  type: 'object',
  properties: {
    es_factura: { type: 'boolean', description: 'true si la imagen es una factura, boleta, resumen o aviso de pago' },
    empresa: { type: 'string', description: 'quién cobra, corto: «Edenor», «Metrogas», «Expensas», «OSDE», «Colegio San Juan». Vacío si no se ve.' },
    concepto: { type: 'string', description: 'qué se paga, corto: «luz», «gas», «expensas», «prepaga», «cuota del colegio». Vacío si no se sabe.' },
    monto: { anyOf: [{ type: 'number' }, { type: 'null' }], description: 'el total a pagar (si hay primer vencimiento, ese importe), en pesos, como número. null si no se ve.' },
    vencimiento: { anyOf: [{ type: 'string' }, { type: 'null' }], description: 'fecha de vencimiento (si hay primer vencimiento, esa) en formato AAAA-MM-DD. null si no se ve.' },
    periodo: { type: 'string', description: 'período que cubre, corto: «octubre 2026», «09/2026». Vacío si no se ve.' }
  },
  required: ['es_factura', 'empresa', 'concepto', 'monto', 'vencimiento', 'periodo'],
  additionalProperties: false
};

function instrucciones(hoy) {
  return 'Esta es la foto de una factura, boleta o aviso de pago de Argentina. Leela y devolvé los datos para agendar el pago. ' +
    'Hoy es ' + hoy + ': si el vencimiento no trae el año, es el próximo que corresponde. Los montos en Argentina usan punto de miles y coma decimal («$ 35.420,50» es 35420.5). ' +
    'Si hay varios vencimientos, usá el primero. Si no es una factura ni un aviso de pago, es_factura es false.';
}

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const q = req.query || {};
  if (req.method === 'GET' && 'ping' in q) return res.status(200).json({ ok: true, ia: !!process.env.ANTHROPIC_API_KEY });
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'metodo' }); }
  if (!configurado()) return res.status(503).json({ error: 'sin-configurar' });
  if (!claveOk(req.headers && req.headers['x-clave'])) { await esperar(700); return res.status(401).json({ error: 'clave' }); }
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'sin-ia' });
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object' || typeof b.imagen !== 'string' || !b.imagen) return res.status(400).json({ error: 'pedido' });
  const tipo = /^image\/(jpeg|png|webp|gif)$/.test(String(b.tipo || '')) ? b.tipo : 'image/jpeg';
  const imagen = b.imagen.replace(/^data:[^,]*,/, '').replace(/\s/g, '');
  if (imagen.length > MAX_IMAGEN) return res.status(413).json({ error: 'grande' });
  const tz = zonaValida(b.tz) ? b.tz : ZONA;

  let r, j = null;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'server-side-fallback-2026-07-01'
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 1024,
        fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: ESQUEMA } },
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: tipo, data: imagen } },
          { type: 'text', text: instrucciones(hoyEn(tz)) }
        ] }]
      })
    });
    try { j = await r.json(); } catch (e) { j = null; }
  } catch (e) {
    return res.status(502).json({ error: 'ia-red' });
  }
  if (!r.ok || !j) {
    const error = r.status === 401 || r.status === 403 ? 'ia-clave' : r.status === 429 || r.status === 529 ? 'ia-ocupada' : 'ia';
    return res.status(502).json({ error, detalle: j && j.error ? String(j.error.message || j.error.type || '') : '' });
  }
  if (j.stop_reason === 'refusal' || j.stop_reason === 'max_tokens') return res.status(502).json({ error: 'ia' });
  const texto = (j.content || []).filter(c => c && c.type === 'text').map(c => c.text).join('');
  let d = null;
  try { d = JSON.parse(texto); } catch (e) { d = null; }
  if (!d || typeof d !== 'object') return res.status(502).json({ error: 'ia' });
  const venc = typeof d.vencimiento === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.vencimiento) ? d.vencimiento : null;
  const monto = typeof d.monto === 'number' && isFinite(d.monto) && d.monto > 0 ? Math.round(d.monto * 100) / 100 : null;
  return res.status(200).json({
    ok: true, esFactura: !!d.es_factura,
    empresa: String(d.empresa || '').trim().slice(0, 60), concepto: String(d.concepto || '').trim().slice(0, 60),
    monto, vencimiento: venc, periodo: String(d.periodo || '').trim().slice(0, 30)
  });
};
