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
  ajustes: { key: 'fldstgTm03EQOalcw', value: 'fldxCu4LteLCoAW1W', updatedAt: 'fldDu7pTNb9iNeThq' },
  pagos: {
    title: 'fldNXxWuCDPirF2xn', amount: 'fld3ziTYrZXECGTeo', date: 'fldmDxclvVuzJOpeK', topic: 'fldGrAHGgN4RVW2kg', item: 'fldb9Rv4p47lo8QER',
    deleted: 'fldS5NFh9rQ6o04L7', id: 'fld8lEN7zS5AKXZ8T', createdAt: 'flduKjByy3tEZKoQC'
  }
};
const TABLAS = {
  pendientes: { id: 'tblpKK8NsolmgeL26', clave: CAMPOS.pendientes.id, campos: Object.values(CAMPOS.pendientes) },
  temas: { id: 'tblI0Sur9eZPbk8L1', clave: CAMPOS.temas.id, campos: Object.values(CAMPOS.temas) },
  ajustes: { id: 'tblQeyD9jJ3QW2TSM', clave: CAMPOS.ajustes.key, campos: Object.values(CAMPOS.ajustes) },
  pagos: { id: 'tblj3fTk6OAALp1CD', clave: CAMPOS.pagos.id, campos: Object.values(CAMPOS.pagos) }
};
const MAX_FILAS = 200;

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
function derivada(uso) {
  const clave = claveGuardada();
  return clave ? crypto.createHmac('sha256', clave).update('pendientes/' + uso).digest('base64url').slice(0, 32) : '';
}
const tokenCalendario = () => derivada('calendario');
const tokenOk = dado => iguales(String(dado || ''), tokenCalendario());
/* La llave del atajo de Siri (/api/anotar): solo sirve para anotar, no para leer ni borrar */
const tokenAnotar = () => derivada('anotar');
const tokenAnotarOk = dado => iguales(String(dado || ''), tokenAnotar());

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

/* Guarda filas: con rid actualiza ese registro; sin rid busca por la columna ID y lo crea si no existe */
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

/* Código de error corto para la app a partir de lo que contestó Airtable */
function codigoError(e) {
  const s = e && e.status;
  return s === 401 || s === 403 ? 'token' : s === 404 ? 'base' : s === 422 ? 'campos' : s === 429 ? 'limite' : 'airtable';
}

module.exports = { BASE, CAMPOS, TABLAS, MAX_FILAS, esperar, configurado, claveOk, tokenCalendario, tokenOk, tokenAnotar, tokenAnotarOk, airtable, fila, listar, limpiar, escribir, codigoError };
