/* ============================================================
   Pendientes — acceso a Airtable compartido por las funciones de Vercel
   (/api/datos y /api/calendario). Empieza con guion bajo para que Vercel
   no lo publique como una dirección propia.
   El token de Airtable vive solo en las variables de entorno.
   ============================================================ */
'use strict';
const crypto = require('crypto');

const BASE = process.env.AIRTABLE_BASE_ID || 'applYsT94l8k9pbu4';

/* Campos por id: si cambiás el nombre de una columna en Airtable, sigue andando */
const CAMPOS = {
  pendientes: {
    title: 'fldVqlQXUIo36pwsU', topic: 'flds27Xib9Jbp7dkU', date: 'fldRngZ81kaRtQKbG', time: 'fldHSu8o5XCImjjcK', alert: 'flduyt78y4M9AbxiI',
    done: 'fldfOXlWFqvpWhikD', priority: 'fldPjnQxvnBFlxTXM', invitees: 'fldmlYSz5CcdNSr8z', location: 'fldFoBIyvvMgp1xwj', amount: 'fldvptWi7fY15llDM',
    repeat: 'fldiCbBIA4OqVyWPE', alert2: 'fldYGiyBaNtcRsQzx', duration: 'fldv4jtCFzWcoIBC8', kind: 'fldCoQgl4RQLh0vPK', notes: 'fldFF42PIs7dskId2',
    doneAt: 'fldAsjiJoqruDIYSR', deleted: 'fldDxv1f2ywstDGBF', id: 'fldnfppQNHeaSDQBV', createdAt: 'fldCfbOGQLxyHCzAI', updatedAt: 'fldK4xIXixg7WKSKM'
  },
  temas: {
    name: 'fldqaHlO4Mr9JRzFp', color: 'fldWEsqfWfJqYwxzQ', icon: 'fldUCZN31ZBKBzAzI', order: 'fldUkwzJBobHikxlD', hidden: 'fldJyJI023qSEBWn0',
    deleted: 'fldZwU0l5YdPmDSnn', id: 'fldX75YeraK8JBpdR', updatedAt: 'fldQi2sW6mD3EJlZx'
  },
  ajustes: { key: 'fldstgTm03EQOalcw', value: 'fldxCu4LteLCoAW1W', updatedAt: 'fldDu7pTNb9iNeThq' }
};
const TABLAS = {
  pendientes: { id: 'tblpKK8NsolmgeL26', clave: CAMPOS.pendientes.id, campos: Object.values(CAMPOS.pendientes) },
  temas: { id: 'tblI0Sur9eZPbk8L1', clave: CAMPOS.temas.id, campos: Object.values(CAMPOS.temas) },
  ajustes: { id: 'tblQeyD9jJ3QW2TSM', clave: CAMPOS.ajustes.key, campos: Object.values(CAMPOS.ajustes) }
};

const esperar = ms => new Promise(r => setTimeout(r, ms));
const configurado = () => !!(process.env.AIRTABLE_TOKEN && process.env.PENDIENTES_CLAVE);
const claveGuardada = () => String(process.env.PENDIENTES_CLAVE || '').trim();

function iguales(dado, esperado) {
  const a = Buffer.from(dado), b = Buffer.from(esperado);
  if (!a.length || a.length !== b.length) { crypto.timingSafeEqual(b, b); return false; }
  return crypto.timingSafeEqual(a, b);
}

function claveOk(dada) {
  let d = String(dada || '');
  try { d = decodeURIComponent(d); } catch (e) { /* llegó sin codificar */ }
  return iguales(d.trim(), claveGuardada());
}

/* La dirección del calendario lleva una llave propia que sale de la clave:
   sirve solo para leer el calendario y no deja adivinar la clave.
   Si cambiás PENDIENTES_CLAVE, la suscripción vieja deja de andar. */
function tokenCalendario() {
  const clave = claveGuardada();
  return clave ? crypto.createHmac('sha256', clave).update('pendientes/calendario').digest('base64url').slice(0, 32) : '';
}
const tokenOk = dado => iguales(String(dado || ''), tokenCalendario());

async function airtable(ruta, metodo, cuerpo, intento) {
  intento = intento || 0;
  const r = await fetch('https://api.airtable.com/v0/' + BASE + '/' + ruta, {
    method: metodo || 'GET',
    headers: { Authorization: 'Bearer ' + process.env.AIRTABLE_TOKEN, 'Content-Type': 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  if ((r.status === 429 || r.status >= 500) && intento < 4) { await esperar(500 * Math.pow(2, intento)); return airtable(ruta, metodo, cuerpo, intento + 1); }
  let j = {};
  try { j = await r.json(); } catch (e) { j = {}; }
  if (!r.ok) {
    const err = new Error('Airtable ' + r.status);
    err.status = r.status;
    err.detalle = j && j.error ? (j.error.message || j.error.type || String(j.error)) : '';
    throw err;
  }
  return j;
}

const fila = r => ({ rid: r.id, creado: r.createdTime, fields: r.fields || {} });

async function listar(t) {
  const filas = [];
  let offset = '';
  do {
    const q = 'pageSize=100&returnFieldsByFieldId=true' + (offset ? '&offset=' + encodeURIComponent(offset) : '');
    const j = await airtable(TABLAS[t].id + '?' + q);
    (j.records || []).forEach(r => filas.push(fila(r)));
    offset = j.offset || '';
  } while (offset);
  return filas;
}

module.exports = { BASE, CAMPOS, TABLAS, esperar, configurado, claveOk, tokenCalendario, tokenOk, airtable, fila, listar };
