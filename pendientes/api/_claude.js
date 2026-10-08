/* ============================================================
   Pendientes — pedido a Claude compartido por las funciones de IA
   (/api/ia, /api/resumen, /api/factura). Empieza con guion bajo: no es
   una dirección. Va con fetch directo a la API, sin el SDK: estas
   funciones no tienen dependencias (no hay package.json).

   Variable de entorno: ANTHROPIC_API_KEY (console.anthropic.com).
   ============================================================ */
'use strict';

const MODELO = 'claude-opus-5-5';
const hayClave = () => !!process.env.ANTHROPIC_API_KEY;

/* Un error con código corto que la app sabe explicar */
function falla(codigo, detalle) {
  const e = new Error(codigo);
  e.codigo = codigo;
  e.detalle = detalle || '';
  return e;
}

/* Pide una respuesta a Claude.
   o = { system, content (bloques del mensaje), schema (JSON Schema → devuelve el objeto),
         effort ('low'|'medium'|'high'), maxTokens }
   Devuelve el objeto (con schema) o el texto. Si algo sale mal, tira falla(código). */
async function pedir(o) {
  if (!hayClave()) throw falla('sin-ia');
  const output = { effort: o.effort || 'medium' };
  if (o.schema) output.format = { type: 'json_schema', schema: o.schema };
  const cuerpo = {
    model: MODELO,
    max_tokens: o.maxTokens || 2048,
    output_config: output,
    messages: [{ role: 'user', content: o.content }]
  };
  if (o.system) cuerpo.system = o.system;

  const llamar = async conRespaldo => {
    const headers = { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' };
    let body = cuerpo;
    /* si Claude no quiere responder algo, la API prueba sola con otro modelo */
    if (conRespaldo) { headers['anthropic-beta'] = 'server-side-fallback-2026-07-01'; body = Object.assign({ fallbacks: 'default' }, cuerpo); }
    let r, j = null;
    try { r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify(body) }); }
    catch (e) { throw falla('ia-red'); }
    try { j = await r.json(); } catch (e) { j = null; }
    return { r, j };
  };

  let { r, j } = await llamar(true);
  /* por si la cuenta no tiene el respaldo habilitado: se vuelve a pedir sin él */
  if (r.status === 400 && j && j.error && /fallback/i.test(String(j.error.message || ''))) ({ r, j } = await llamar(false));
  if (!r.ok || !j) {
    const codigo = r.status === 401 || r.status === 403 ? 'ia-clave' : r.status === 429 || r.status === 529 ? 'ia-ocupada' : 'ia';
    throw falla(codigo, j && j.error ? String(j.error.message || j.error.type || '') : '');
  }
  if (j.stop_reason === 'refusal') throw falla('ia');
  if (j.stop_reason === 'max_tokens') throw falla('ia');
  const texto = (j.content || []).filter(c => c && c.type === 'text').map(c => c.text).join('').trim();
  if (!o.schema) { if (!texto) throw falla('ia'); return texto; }
  try { return JSON.parse(texto); } catch (e) { throw falla('ia'); }
}

/* «jueves 8/10/2026 (hoy), viernes 9/10/2026 (mañana), …»: con esto Claude no se equivoca de día */
function calendarioDesde(hoy, dias) {
  const m = hoy.split('-').map(Number), out = [];
  const fmt = new Intl.DateTimeFormat('es-AR', { weekday: 'long', timeZone: 'UTC' });
  for (let i = 0; i < (dias || 21); i++) {
    const d = new Date(Date.UTC(m[0], m[1] - 1, m[2] + i));
    out.push(fmt.format(d) + ' ' + d.toISOString().slice(0, 10) + (i === 0 ? ' (hoy)' : i === 1 ? ' (mañana)' : ''));
  }
  return out.join('\n');
}

module.exports = { MODELO, hayClave, falla, pedir, calendarioDesde };
