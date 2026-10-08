/* ============================================================
   /api/datos — respaldo de Pendientes en Airtable
   Función de Vercel sin dependencias. El token de Airtable vive solo
   en las variables de entorno: el navegador nunca lo ve.

   Variables de entorno (Vercel → Settings → Environment Variables):
     AIRTABLE_TOKEN     token personal de Airtable con data.records:read y
                        data.records:write sobre la base «Pendientes»
     PENDIENTES_CLAVE   la clave que se escribe en la app para conectarla
     AIRTABLE_BASE_ID   opcional: otra base con la misma estructura

   GET  /api/datos   header X-Clave → { pendientes, temas, ajustes, calendario }
        (calendario: la llave para suscribirse en /api/calendario)
   POST /api/datos   header X-Clave, cuerpo { pendientes, temas, ajustes }:
        cada fila es { rid?, fields } con los campos por id de campo.
        Con rid actualiza ese registro; sin rid busca por la columna ID
        (Clave en Ajustes) y lo crea si no existe.
   ============================================================ */
'use strict';
const { TABLAS, esperar, configurado, claveOk, tokenCalendario, airtable, fila, listar } = require('./_airtable.js');

const MAX_FILAS = 200;

/* Deja pasar solo campos conocidos y valores simples */
function limpiar(t, entrada) {
  if (!Array.isArray(entrada)) return [];
  const tabla = TABLAS[t], ok = new Set(tabla.campos);
  return entrada.slice(0, MAX_FILAS).map(x => {
    if (!x || typeof x !== 'object' || !x.fields || typeof x.fields !== 'object') return null;
    const fields = {};
    Object.keys(x.fields).forEach(k => {
      if (!ok.has(k)) return;
      const v = x.fields[k];
      if (v === null || typeof v === 'boolean' || (typeof v === 'number' && isFinite(v))) fields[k] = v;
      else if (typeof v === 'string') fields[k] = v.slice(0, 20000);
    });
    const rid = typeof x.rid === 'string' && /^rec[A-Za-z0-9]{14}$/.test(x.rid) ? x.rid : null;
    if (!rid && !fields[tabla.clave]) return null;
    return { rid, fields };
  }).filter(Boolean);
}

async function escribir(t, filas) {
  const tabla = TABLAS[t], salida = [];
  const porClave = async lote => {
    const j = await airtable(tabla.id, 'PATCH', { typecast: true, returnFieldsByFieldId: true, performUpsert: { fieldsToMergeOn: [tabla.clave] }, records: lote.map(f => ({ fields: f.fields })) });
    (j.records || []).forEach(r => salida.push(fila(r)));
  };
  const conRid = filas.filter(f => f.rid), sinRid = filas.filter(f => !f.rid);
  for (let i = 0; i < conRid.length; i += 10) {
    const lote = conRid.slice(i, i + 10);
    try {
      const j = await airtable(tabla.id, 'PATCH', { typecast: true, returnFieldsByFieldId: true, records: lote.map(f => ({ id: f.rid, fields: f.fields })) });
      (j.records || []).forEach(r => salida.push(fila(r)));
    } catch (e) {
      /* si alguno se borró a mano en Airtable, se vuelve a guardar por la columna ID */
      if ((e.status === 404 || e.status === 422) && lote.every(f => f.fields[tabla.clave])) await porClave(lote);
      else throw e;
    }
  }
  for (let i = 0; i < sinRid.length; i += 10) await porClave(sinRid.slice(i, i + 10));
  return salida;
}

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!configurado()) return res.status(503).json({ error: 'sin-configurar' });
  if (!claveOk(req.headers['x-clave'])) { await esperar(700); return res.status(401).json({ error: 'clave' }); }
  try {
    if (req.method === 'GET') {
      const [pendientes, temas, ajustes] = await Promise.all([listar('pendientes'), listar('temas'), listar('ajustes')]);
      return res.status(200).json({ ok: true, pendientes, temas, ajustes, calendario: tokenCalendario(), ahora: Date.now() });
    }
    if (req.method === 'POST') {
      let b = req.body;
      if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
      if (!b || typeof b !== 'object') return res.status(400).json({ error: 'pedido' });
      const out = { ok: true };
      for (const t of ['temas', 'ajustes', 'pendientes']) {
        const filas = limpiar(t, b[t]);
        out[t] = filas.length ? await escribir(t, filas) : [];
      }
      return res.status(200).json(out);
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'metodo' });
  } catch (e) {
    const s = e.status;
    const error = s === 401 || s === 403 ? 'token' : s === 404 ? 'base' : s === 422 ? 'campos' : s === 429 ? 'limite' : 'airtable';
    return res.status(502).json({ error, detalle: e.detalle || '' });
  }
};
