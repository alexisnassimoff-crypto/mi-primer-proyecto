/* ============================================================
   /api/dieta — la app Dieta (pendientes-ale.vercel.app/dieta)
   Función de Vercel sin dependencias. Pide la misma clave que Pendientes
   (header X-Clave = PENDIENTES_CLAVE) y usa el mismo token de Airtable.

   GET  /api/dieta?ping=1          → { ok, ia }   (si hay clave de IA en Vercel)
   GET  /api/dieta   X-Clave       → { comidas, pesos, ajustes }   el respaldo
   POST /api/dieta   X-Clave  { comidas, pesos, ajustes }  guarda filas
        (cada fila { rid?, fields } con los campos por id; sin rid busca por ID)
   POST /api/dieta   X-Clave  { accion, ... }   la IA (Claude), siempre dentro del plan:
        accion 'sugerir'  { comida, pedido, semana, ultimas, hora } → { sugerencias: [{ titulo, detalle, tipo }], nota }
        accion 'evaluar'  { texto, comida, semana }                 → { tipo, va, veredicto, alternativa }
        accion 'clasificar' { texto, comida }                        → { tipo, nota }   cómo cuenta lo que ya comió
        accion 'preguntar'{ pregunta, datos }                        → { respuesta }
   ============================================================ */
'use strict';
const Plan = require('../dieta/plan.js');
const { esperar, configurado, claveOk, listar, limpiar, escribir, codigoError, CAMPOS } = require('./_airtable.js');
const { ZONA, zonaValida, hoyEn, ahoraEn } = require('./_zona.js');
const { hayClave, pedir } = require('./_claude.js');

const COMIDAS = ['desayuno', 'almuerzo', 'merienda', 'cena'];
const TIPOS_IA = ['plan', 'carbo', 'libre', 'nova'];

/* ---------- Lo que la IA tiene que saber ---------- */
function sistema(hoy) {
  return 'Sos el asistente de Dieta, la app con la que Ale (hombre adulto, Argentina) sigue el plan de alimentación que le armó Ari, su nutricionista. ' +
    'Escribís en castellano rioplatense, tuteando con vos, corto y claro, sin markdown. Hoy es ' + hoy + '.\n\n' +
    'EL PLAN DE ARI (es la única referencia; nunca sugieras nada fuera de él):\n' + Plan.PLAN_TEXTO.map(l => '- ' + l).join('\n') + '\n\n' +
    'Tipos de comida que usa la app:\n' +
    '- plan: cumple el plan (desayuno de huevos; almuerzo o cena de proteína y vegetales; merienda de proteína y vegetales o un pan turco con algo del plan). Proteína y vegetales en cualquier comida es siempre plan.\n' +
    '- carbo: almuerzo o cena con un tercio de carbohidrato (arroz, papa, batata, fideos, pan, legumbres…). Cupo: 1 almuerzo y 1 cena por semana.\n' +
    '- libre: el permitido, cualquier cosa. Cupo: 1 almuerzo y 2 cenas por semana.\n' +
    '- nova: no está en el plan y no entra en ningún cupo (postres, frutas, picoteo, extras; o un libre cuando ya no queda cupo).\n\n' +
    'Lo que dice Ari para la cabeza: alejarse de la comida y anticiparse; practicar «no, gracias»; ponerse feliz cuando comió sano y poco; ' +
    'o se usa el permitido o no se usa, no hay medias tintas; el alimento es droga; los atajos se pagan después; felicitarse cuando cumple.\n' +
    'ALE COME KOSHER, SIEMPRE: nunca sugieras cerdo (jamón, panceta, bondiola, lomo de cerdo, chorizo o salame comunes) ni mariscos (camarones, langostinos, calamar, mejillones, pulpo); pescado solo con escamas (merluza, salmón, atún, lenguado, trucha); y nunca juntes carne o pollo con lácteos en la misma comida (nada de pastrón con queso, milanesa a la napolitana, carne con crema o manteca, pollo con queso). Si Ale te pregunta por algo así, decile que no va por kosher y proponé la versión kosher. ' +
    'Sé concreto con comida argentina y judía de todos los días (pollo, carne, pavita, pescado, huevos, ensaladas, verduras al horno, pastrón, queso, palta). ' +
    'No hables de calorías ni de gramos exactos. Nunca recomiendes saltear comidas, ayunar ni comer menos de lo que el plan indica. ' +
    'No sos médico: si Ale cuenta un síntoma o algo de salud, decile que lo hable con Ari o con su médico.';
}

function semanaTexto(s) {
  if (!s || typeof s !== 'object') return '';
  const nombre = t => (t === 'carbo' ? 'con carbo' : t === 'libre' ? 'libre' : String(t || '').slice(0, 20));
  const f = (cid, titulo) => {
    const l = Array.isArray(s[cid]) ? s[cid] : [];
    if (!l.length) return '';
    return titulo + ': ' + l.map(c => {
      const q = typeof c.quedan === 'number' ? Math.max(0, c.quedan) : Math.max(0, (Number(c.cupo) || 0) - (Number(c.usado) || 0));
      const fijos = (Array.isArray(c.fijos) ? c.fijos : []).map(x => String(x).slice(0, 30));
      return nombre(c.tipo) + ' ' + (q ? 'quedan ' + q + ' para cualquier día' : 'no queda para cualquier día') + (fijos.length ? ' (reservado: ' + fijos.join(', ') + ')' : '');
    }).join(', ');
  };
  const dia = typeof s.hoy === 'string' ? 'Hoy es ' + s.hoy.slice(0, 12) + '. ' : '';
  return dia + [f('almuerzo', 'Almuerzos'), f('cena', 'Cenas')].filter(Boolean).join('. ');
}

function limpiarTexto(v, n) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n || 300); }

async function sugerir(b, hoy, hora) {
  const cid = COMIDAS.indexOf(b.comida) >= 0 ? b.comida : Plan.comidaAhora(hora);
  const pedido = limpiarTexto(b.pedido, 300), ultimas = String(b.ultimas || '').slice(0, 2500), semana = semanaTexto(b.semana);
  const nombre = Plan.comida(cid).nombre.toLowerCase();
  const d = await pedir({
    system: sistema(hoy), effort: 'low', maxTokens: 2048,
    schema: {
      type: 'object',
      properties: {
        sugerencias: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              titulo: { type: 'string', description: 'el plato, corto: «Pollo al horno con calabaza y ensalada»' },
              detalle: { type: 'string', description: 'una línea: cómo armarlo o qué cuidar (porciones por mitades o tercios, sin pan, sin postre)' },
              tipo: { type: 'string', enum: ['plan', 'carbo', 'libre'] }
            },
            required: ['titulo', 'detalle', 'tipo'], additionalProperties: false
          }
        },
        nota: { type: 'string', description: 'una frase corta y amable para Ale, o vacío' }
      },
      required: ['sugerencias', 'nota'], additionalProperties: false
    },
    content: [{ type: 'text', text: 'Ale quiere ideas para ' + (cid === 'desayuno' ? 'el desayuno' : cid === 'almuerzo' ? 'el almuerzo' : cid === 'merienda' ? 'la merienda' : 'la cena') + ' de hoy.\n' +
      (semana ? 'Cupos de esta semana (lunes a domingo): ' + semana + '.\n' : '') +
      (ultimas ? 'Lo que comió en los últimos días (para no repetir):\n' + ultimas + '\n' : '') +
      (pedido ? 'Lo que pide o tiene a mano: «' + pedido + '».\n' : '') +
      'Dame 3 o 4 opciones. La mayoría de tipo plan (' + (cid === 'desayuno' ? 'huevos y claras' : cid === 'merienda' ? 'sobre todo proteína sin pan (huevo, salmón ahumado, atún, pastrón con tomate); a lo sumo una con pan turco' : 'proteína y vegetales, mitad y mitad') + '). ' +
      (cid === 'almuerzo' || cid === 'cena' ? 'Podés sumar una de tipo carbo solo si queda cupo esta semana, y una libre solo si queda cupo y Ale lo pide o es claramente una ocasión (salida, cumpleaños). ' : '') +
      'Si Ale pide algo que no entra en el plan, no lo armes: proponé la versión que sí entra (la misma idea, sin lo que no va) y explicalo en la nota. ' +
      'Si lo que tiene a mano es algo concreto, usalo. Nada de postres ni frutas. Todo kosher: sin cerdo ni mariscos, y sin mezclar carne con lácteos.' }]
  });
  const sugerencias = (Array.isArray(d && d.sugerencias) ? d.sugerencias : []).map(x => ({
    titulo: limpiarTexto(x && x.titulo, 120), detalle: limpiarTexto(x && x.detalle, 220), tipo: ['plan', 'carbo', 'libre'].indexOf(x && x.tipo) >= 0 ? x.tipo : 'plan'
  })).filter(x => x.titulo).slice(0, 5);
  return { status: 200, body: { ok: true, comida: cid, sugerencias, nota: limpiarTexto(d && d.nota, 300) } };
}

async function evaluar(b, hoy, hora) {
  const texto = limpiarTexto(b.texto, 400);
  if (!texto) return { status: 400, body: { error: 'pedido' } };
  const cid = COMIDAS.indexOf(b.comida) >= 0 ? b.comida : Plan.comidaAhora(hora);
  const semana = semanaTexto(b.semana);
  const d = await pedir({
    system: sistema(hoy), effort: 'low', maxTokens: 1024,
    schema: {
      type: 'object',
      properties: {
        tipo: { type: 'string', enum: TIPOS_IA, description: 'cómo cuenta esa comida en el plan' },
        va: { type: 'boolean', description: 'true si entra en el plan (contando los cupos que quedan esta semana)' },
        veredicto: { type: 'string', description: 'una o dos líneas: qué es y por qué cuenta así' },
        alternativa: { type: 'string', description: 'si no va o gasta un cupo: el nombre corto del plato que sí entra como plan, hasta 10 palabras («Pollo a la plancha con ensalada»); si ya está bien, vacío' }
      },
      required: ['tipo', 'va', 'veredicto', 'alternativa'], additionalProperties: false
    },
    content: [{ type: 'text', text: 'Ale pregunta si esto va para ' + (cid === 'desayuno' ? 'el desayuno' : cid === 'almuerzo' ? 'el almuerzo' : cid === 'merienda' ? 'la merienda' : 'la cena') + ': «' + texto + '».\n' +
      (semana ? 'Cupos que quedan esta semana: ' + semana + '.\n' : '') +
      'Decidí el tipo según el plan. Si es carbo o libre y no queda cupo para hoy, entonces tipo nova y va=false: decile que ya usó el cupo, o que ese libre está reservado para el viernes a la noche o el sábado al mediodía (si hoy es justo ese día y comida, el libre va). ' +
      'Si el desayuno no es huevos y claras, o la merienda no es un pan turco con algo del plan, es nova. Postre, fruta o picoteo: nova. ' +
      'Si no es kosher (cerdo, mariscos, carne con lácteos), es nova aunque sea proteína y vegetales: decilo y proponé la versión kosher. ' +
      'Regla general de Ari: proteína y vegetales es siempre plan, en cualquier comida, aunque el plan permita pan o hidrato ahí (es mejor todavía). Nunca le propongas agregar pan o hidrato a algo que ya es proteína y vegetales. ' +
      'La alternativa, si hace falta, es solo el nombre corto del plato (hasta 10 palabras), sin explicaciones. ' +
      'Sé firme y amable; no lo retes. Ante la duda, proponé la alternativa que sí entra.' }]
  });
  return { status: 200, body: { ok: true, comida: cid, tipo: TIPOS_IA.indexOf(d && d.tipo) >= 0 ? d.tipo : 'nova', va: !!(d && d.va), veredicto: limpiarTexto(d && d.veredicto, 400), alternativa: limpiarTexto(d && d.alternativa, 300) } };
}

/* Lo que Ale ya comió: cómo cuenta en el plan. Devuelve el tipo crudo (si es libre o carbo, la app
   mira sola si queda cupo). */
async function clasificar(b, hoy, hora) {
  const texto = limpiarTexto(b.texto, 300);
  if (!texto) return { status: 400, body: { error: 'pedido' } };
  const cid = COMIDAS.indexOf(b.comida) >= 0 ? b.comida : Plan.comidaAhora(hora);
  const tipos = Plan.TIPOS[cid].map(t => t.id);
  const d = await pedir({
    system: sistema(hoy), effort: 'low', maxTokens: 512,
    schema: {
      type: 'object',
      properties: {
        tipo: { type: 'string', enum: tipos },
        nota: { type: 'string', description: 'muy corta (hasta 12 palabras): por qué cuenta así, o vacío si es obvio' }
      },
      required: ['tipo', 'nota'], additionalProperties: false
    },
    content: [{ type: 'text', text: 'Ale cargó esto como ' + (cid === 'desayuno' ? 'desayuno' : cid === 'almuerzo' ? 'almuerzo' : cid === 'merienda' ? 'merienda' : 'cena') + ': «' + texto + '». Clasificalo según el plan.\n' +
      'Tipos posibles: ' + tipos.join(', ') + '. ' +
      (cid === 'desayuno' ? 'plan = huevos (2 y 2 claras, o hasta 4 enteros), solos o con proteína o vegetales (salmón ahumado, tomate) y café o té; tostadas, cereales, medialunas o fruta = nova. ' :
        cid === 'merienda' ? 'plan = proteína y/o vegetales sin pan (huevo, salmón o trucha ahumados, atún, pastrón, pavita, ensalada: es lo mejor), o un pan turco con pastrón, queso y tomate, palta o huevo; nada = no merendó; dulces, facturas, galletitas, fruta u otra cosa = nova. ' :
        'plan = proteína y vegetales sin carbohidrato; carbo = con una porción chica de arroz, papa, batata, fideos, pan, legumbres, choclo o masa; libre = cualquier comida que no entra en las otras (pizza, hamburguesa con pan, pastas con salsa, asado con pan, sushi, comida de restaurante); nova = postre, fruta, dulces, picoteo o algo que claramente no es una comida del plan. ') +
      'Si dice que no comió, nada. Ante la duda entre plan y carbo, mirá si nombra un carbohidrato. No seas estricto con las cantidades ni con el aceite o los condimentos. ' +
      'Si lo que comió no es kosher (cerdo, mariscos, o carne con lácteos), es nova y la nota lo dice en pocas palabras.' }]
  });
  return { status: 200, body: { ok: true, comida: cid, tipo: tipos.indexOf(d && d.tipo) >= 0 ? d.tipo : 'nova', nota: limpiarTexto(d && d.nota, 120) } };
}

async function preguntar(b, hoy) {
  const pregunta = limpiarTexto(b.pregunta, 300);
  const datos = String(b.datos || '').slice(0, 40000);
  if (!pregunta) return { status: 400, body: { error: 'pedido' } };
  const respuesta = await pedir({
    system: sistema(hoy), effort: 'medium', maxTokens: 1500,
    content: [{ type: 'text', text: 'Estos son los datos de Ale en la app (comidas cargadas, cupos, estrellas, pesos):\n\n' + datos + '\n\n' +
      'Pregunta de Ale: «' + pregunta + '»\n\n' +
      'Respondé corto y claro (de 1 a 6 líneas), usando los datos y el plan. Si pide consejo, que sea dentro del plan. ' +
      'Sin markdown, sin asteriscos ni numerales; si es una lista, una cosa por línea empezando con «• ».' }]
  });
  return { status: 200, body: { ok: true, respuesta: respuesta.replace(/\*\*/g, '').slice(0, 3000) } };
}

const ACCIONES = { sugerir, evaluar, clasificar, preguntar };

/* en el respaldo solo entra la fila «dieta» de Ajustes */
function soloDieta(filas) {
  const K = CAMPOS.ajustes.key;
  return (filas || []).filter(r => r && r.fields && r.fields[K] === 'dieta');
}

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const q = req.query || {};
  if (req.method === 'GET' && 'ping' in q) return res.status(200).json({ ok: true, ia: hayClave() });
  if (req.method !== 'GET' && req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'metodo' }); }
  if (!configurado()) return res.status(503).json({ error: 'sin-configurar' });
  if (!claveOk(req.headers && req.headers['x-clave'])) { await esperar(700); return res.status(401).json({ error: 'clave' }); }
  try {
    if (req.method === 'GET') {
      const [comidas, pesos, ajustes] = await Promise.all([listar('comidas'), listar('pesos'), listar('ajustes')]);
      return res.status(200).json({ ok: true, comidas, pesos, ajustes: soloDieta(ajustes), ahora: Date.now() });
    }
    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
    if (!b || typeof b !== 'object') return res.status(400).json({ error: 'pedido' });
    if (b.accion) {
      if (!ACCIONES[b.accion]) return res.status(400).json({ error: 'pedido' });
      if (!hayClave()) return res.status(503).json({ error: 'sin-ia' });
      const tz = zonaValida(b.tz) ? b.tz : ZONA;
      try {
        const r = await ACCIONES[b.accion](b, hoyEn(tz), ahoraEn(tz).getHours());
        return res.status(r.status).json(r.body);
      } catch (e) {
        return res.status(e.codigo === 'sin-ia' ? 503 : 502).json({ error: e.codigo || 'ia', detalle: e.detalle || '' });
      }
    }
    const out = { ok: true };
    const ajustes = soloDieta(limpiar('ajustes', b.ajustes));
    out.ajustes = ajustes.length ? await escribir('ajustes', ajustes) : [];
    for (const t of ['comidas', 'pesos']) {
      const filas = limpiar(t, b[t]);
      out[t] = filas.length ? await escribir(t, filas) : [];
    }
    return res.status(200).json(out);
  } catch (e) {
    return res.status(502).json({ error: codigoError(e), detalle: e.detalle || '' });
  }
};
