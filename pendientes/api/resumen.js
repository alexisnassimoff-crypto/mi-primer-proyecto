/* ============================================================
   /api/resumen — el resumen inteligente del día
   Una vez por día Claude lee la agenda y escribe 2 a 4 líneas: qué hay hoy,
   qué conviene hacer primero y qué pago no se puede pasar. Queda en Ajustes,
   fila «resumen»: la app lo muestra en Inicio y el calendario suscrito lo
   pone en el aviso de la mañana.

   GET /api/resumen            lo arma si todavía no está el de hoy (lo llama el
                               cron de Vercel a las 6 de Argentina, y la app si falta).
                               Sin la clave no devuelve el texto: solo { ok, fecha }.
   GET /api/resumen  X-Clave   igual, y devuelve { texto, at }; con ?forzar=1 lo rehace.
   Como mucho se arma una vez por día (salvo forzar con la clave): no gasta de más.
   ============================================================ */
'use strict';
const { CAMPOS, esperar, configurado, claveOk, listar, escribir } = require('./_airtable.js');
const { ZONA, zonaValida, hoyEn } = require('./_zona.js');
const { hayClave, pedir, calendarioDesde } = require('./_claude.js');

const P = CAMPOS.pendientes, A = CAMPOS.ajustes, G = CAMPOS.pagos;
const plata = n => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);
const diaMas = (ymd, n) => { const m = ymd.split('-').map(Number); return new Date(Date.UTC(m[0], m[1] - 1, m[2] + n)).toISOString().slice(0, 10); };

function filaDe(filas, clave) { return filas.find(r => r.fields && r.fields[A.key] === clave); }
function jsonDe(fila) { try { return fila ? JSON.parse(fila.fields[A.value] || '{}') : null; } catch (e) { return null; } }

/* Lo que Claude necesita saber, en texto corto */
function datosDelDia(pendientes, pagos, hoy) {
  const vivos = pendientes.map(r => r.fields || {}).filter(f => !f[P.deleted] && !f[P.done] && String(f[P.title] || '').trim());
  const fecha = f => (/^\d{4}-\d{2}-\d{2}$/.test(String(f[P.date] || '')) ? f[P.date] : '');
  const linea = f => [String(f[P.title]).trim(), f[P.topic] || '', fecha(f), String(f[P.time] || ''), typeof f[P.amount] === 'number' ? plata(f[P.amount]) : ''].filter(Boolean).join(' | ');
  const fin = diaMas(hoy, 7);
  const hoyL = vivos.filter(f => fecha(f) === hoy), atras = vivos.filter(f => fecha(f) && fecha(f) < hoy), prox = vivos.filter(f => fecha(f) > hoy && fecha(f) <= fin);
  const sinFecha = vivos.filter(f => !fecha(f)).length;
  const mes = hoy.slice(0, 7);
  const pagado = pagos.map(r => r.fields || {}).filter(f => !f[G.deleted] && String(f[G.date] || '').slice(0, 7) === mes).reduce((s, f) => s + (Number(f[G.amount]) || 0), 0);
  const aPagar = vivos.filter(f => fecha(f) && fecha(f) <= fin && typeof f[P.amount] === 'number').reduce((s, f) => s + f[P.amount], 0);
  return {
    vacio: !hoyL.length && !atras.length && !prox.length,
    texto: 'HOY (' + hoy + '):\n' + (hoyL.map(linea).join('\n') || '(nada)') +
      '\n\nATRASADOS:\n' + (atras.slice(0, 20).map(linea).join('\n') || '(ninguno)') +
      '\n\nPRÓXIMOS 7 DÍAS:\n' + (prox.slice(0, 30).map(linea).join('\n') || '(nada)') +
      '\n\nSin fecha: ' + sinFecha + ' pendientes.\nPagado este mes: ' + plata(pagado) + '. A pagar hasta el ' + fin + ' (incluye atrasados): ' + plata(aPagar) + '.'
  };
}

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'metodo' }); }
  if (!configurado()) return res.status(503).json({ error: 'sin-configurar' });
  const conClave = !!(req.headers && req.headers['x-clave']);
  const auth = conClave && claveOk(req.headers['x-clave']);
  if (conClave && !auth) { await esperar(700); return res.status(401).json({ error: 'clave' }); }
  if (!hayClave()) return res.status(503).json({ error: 'sin-ia' });
  const q = req.query || {}, forzar = auth && String(q.forzar || '') === '1';
  try {
    const [ajustes, pendientes, pagos] = await Promise.all([listar('ajustes'), listar('pendientes'), listar('pagos')]);
    const aj = jsonDe(filaDe(ajustes, 'ajustes')) || {};
    const tz = zonaValida(aj.tz) ? aj.tz : ZONA, hoy = hoyEn(tz);
    const fila = filaDe(ajustes, 'resumen'), previo = jsonDe(fila);
    const responder = r => res.status(200).json(Object.assign({ ok: true, fecha: r.fecha }, auth ? { texto: r.texto || '', at: r.at || null } : {}));
    if (previo && previo.fecha === hoy && !forzar) return responder(previo);
    const d = datosDelDia(pendientes, pagos, hoy);
    let texto = '';
    if (!d.vacio) {
      texto = await pedir({
        effort: 'medium', maxTokens: 1024,
        system: 'Sos el asistente de Pendientes, la agenda personal de Ale, en Argentina. Escribís en castellano rioplatense, hablándole de vos.\nDías:\n' + calendarioDesde(hoy, 8),
        content: [{ type: 'text', text: 'La agenda de Ale:\n\n' + d.texto + '\n\n' +
          'Escribí el resumen de la mañana: de 2 a 4 líneas cortas. Qué tiene hoy (con horas), qué conviene hacer primero, ' +
          'qué pago no se le puede pasar (con monto y día) y, si hay atrasados, cuál priorizar. Cálido y directo; un «Buen día» corto está bien. ' +
          'Sin markdown, sin viñetas ni asteriscos, sin inventar nada que no esté en la agenda.' }]
      });
      texto = texto.replace(/\*\*/g, '').trim().slice(0, 1200);
    }
    const nuevo = { fecha: hoy, texto, at: new Date().toISOString() }, f = {};
    f[A.key] = 'resumen'; f[A.value] = JSON.stringify(nuevo); f[A.updatedAt] = nuevo.at;
    await escribir('ajustes', [{ rid: fila ? fila.rid : null, fields: f }]);
    return responder(nuevo);
  } catch (e) {
    return res.status(502).json({ error: e.codigo || 'airtable', detalle: e.detalle || '' });
  }
};

module.exports.datosDelDia = datosDelDia;
