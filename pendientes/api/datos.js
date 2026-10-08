/* ============================================================
   /api/datos — respaldo de Pendientes en Airtable
   Función de Vercel sin dependencias. El token de Airtable vive solo
   en las variables de entorno: el navegador nunca lo ve.

   Variables de entorno (Vercel → Settings → Environment Variables):
     AIRTABLE_TOKEN     token personal de Airtable con data.records:read y
                        data.records:write sobre la base «Pendientes»
     PENDIENTES_CLAVE   la clave que se escribe en la app para conectarla
     AIRTABLE_BASE_ID   opcional: otra base con la misma estructura

   GET  /api/datos   header X-Clave → { pendientes, temas, ajustes, pagos, calendario, anotar }
        (calendario: la llave para suscribirse en /api/calendario;
         anotar: la llave del atajo de Siri, /api/anotar)
   POST /api/datos   header X-Clave, cuerpo { pendientes, temas, ajustes, pagos }:
        cada fila es { rid?, fields } con los campos por id de campo.
        Con rid actualiza ese registro; sin rid busca por la columna ID
        (Clave en Ajustes) y lo crea si no existe.
   ============================================================ */
'use strict';
const { esperar, configurado, claveOk, tokenCalendario, tokenAnotar, listar, limpiar, escribir, codigoError } = require('./_airtable.js');

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!configurado()) return res.status(503).json({ error: 'sin-configurar' });
  if (!claveOk(req.headers['x-clave'])) { await esperar(700); return res.status(401).json({ error: 'clave' }); }
  try {
    if (req.method === 'GET') {
      const [pendientes, temas, ajustes, pagos] = await Promise.all([listar('pendientes'), listar('temas'), listar('ajustes'), listar('pagos')]);
      return res.status(200).json({ ok: true, pendientes, temas, ajustes, pagos, calendario: tokenCalendario(), anotar: tokenAnotar(), ahora: Date.now() });
    }
    if (req.method === 'POST') {
      let b = req.body;
      if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
      if (!b || typeof b !== 'object') return res.status(400).json({ error: 'pedido' });
      const out = { ok: true };
      for (const t of ['temas', 'ajustes', 'pendientes', 'pagos']) {
        const filas = limpiar(t, b[t]);
        out[t] = filas.length ? await escribir(t, filas) : [];
      }
      return res.status(200).json(out);
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'metodo' });
  } catch (e) {
    return res.status(502).json({ error: codigoError(e), detalle: e.detalle || '' });
  }
};
