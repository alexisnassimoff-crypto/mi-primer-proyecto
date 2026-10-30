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
        accion 'regla'    { texto }                                  → { resumen, cambios }  entender algo que dijo Ari
        accion 'informe'  { datos }                                  → { para_ari, para_ale: [...] }  el informe y tus patrones
   Todas reciben además { reglas: [{ texto, cambios }] }: lo que le dijo Ari, que vale más que el plan base.
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
/* las reglas que manda la app (o las de siempre si no manda nada) y la configuración que resulta */
function contexto(b) {
  const reglas = (Array.isArray(b.reglas) ? b.reglas.slice(0, 40).map(Plan.limpiarRegla).filter(Boolean) : null) || Plan.REGLAS_BASE;
  Plan.usar(Plan.config(reglas));
  const cfg = Plan.configTexto();
  Plan.usar(null);
  return { reglas, cfg };
}
function sistema(hoy, b) {
  const ctx = b && b._ctx ? b._ctx : contexto({});
  return 'Sos el asistente de Dieta, la app con la que Ale (hombre adulto, Argentina) sigue el plan de alimentación que le armó Ari, su nutricionista. ' +
    'Escribís en castellano rioplatense, tuteando con vos, corto y claro, sin markdown. Hoy es ' + hoy + '.\n\n' +
    'EL PLAN DE ARI (es la única referencia; nunca sugieras nada fuera de él):\n' + Plan.PLAN_TEXTO.map(l => '- ' + l).join('\n') + '\n\n' +
    'LO QUE LE DIJO ARI DESPUÉS (vale más que el plan de arriba si se contradicen; respetalo siempre, en ideas, evaluaciones y respuestas):\n' + ctx.reglas.map(r => '- ' + r.texto).join('\n') + '\n' +
    'Con eso, la semana queda así: ' + ctx.cfg + '\n\n' +
    'Tipos de comida que usa la app:\n' +
    '- plan: cumple el plan (desayuno de huevos; almuerzo o cena de proteína y vegetales; merienda de proteína y vegetales o un pan turco con algo del plan). Proteína y vegetales en cualquier comida es siempre plan.\n' +
    '- carbo: almuerzo o cena con un tercio de carbohidrato (arroz, papa, batata, fideos, pan, legumbres…). Tiene cupo semanal.\n' +
    '- libre: el permitido, cualquier cosa. Tiene cupo semanal.\n' +
    '- nova: no está en el plan y no entra en ningún cupo (postres, frutas, picoteo, extras; o un libre cuando ya no queda cupo).\n\n' +
    'Lo que dice Ari para la cabeza: alejarse de la comida y anticiparse; practicar «no, gracias»; ponerse feliz cuando comió sano y poco; ' +
    'o se usa el permitido o no se usa, no hay medias tintas; el alimento es droga; los atajos se pagan después; felicitarse cuando cumple.\n' +
    'Si algo va contra una regla de Ari (por ejemplo, si come kosher y algo no lo es), decilo y proponé la versión que sí va. ' +
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
    system: sistema(hoy, b), effort: 'low', maxTokens: 2048,
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
      'Si lo que tiene a mano es algo concreto, usalo. Nada de postres ni frutas. Respetá todas las reglas de Ari.' }]
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
    system: sistema(hoy, b), effort: 'low', maxTokens: 1024,
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
      'Si va contra una regla de Ari, es nova aunque parezca del plan: decilo y proponé la versión que sí va. Si una regla de Ari dice que algo vale, vale. ' +
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
    system: sistema(hoy, b), effort: 'low', maxTokens: 512,
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
      'Si lo que comió va contra una regla de Ari, es nova y la nota lo dice en pocas palabras. Si una regla de Ari dice que algo vale, vale.' }]
  });
  return { status: 200, body: { ok: true, comida: cid, tipo: tipos.indexOf(d && d.tipo) >= 0 ? d.tipo : 'nova', nota: limpiarTexto(d && d.nota, 120) } };
}

async function preguntar(b, hoy) {
  const pregunta = limpiarTexto(b.pregunta, 300);
  const datos = String(b.datos || '').slice(0, 40000);
  if (!pregunta) return { status: 400, body: { error: 'pedido' } };
  const respuesta = await pedir({
    system: sistema(hoy, b), effort: 'medium', maxTokens: 1500,
    content: [{ type: 'text', text: 'Estos son los datos de Ale en la app (comidas cargadas, cupos, estrellas, pesos):\n\n' + datos + '\n\n' +
      'Pregunta de Ale: «' + pregunta + '»\n\n' +
      'Respondé corto y claro (de 1 a 6 líneas), usando los datos y el plan. Si pide consejo, que sea dentro del plan. ' +
      'Sin markdown, sin asteriscos ni numerales; si es una lista, una cosa por línea empezando con «• ».' }]
  });
  return { status: 200, body: { ok: true, respuesta: respuesta.replace(/\*\*/g, '').slice(0, 3000) } };
}

/* Algo que dijo Ari, en palabras de Ale -> el texto de la regla y los cambios que mueven las estrellas */
async function regla(b, hoy) {
  const texto = limpiarTexto(b.texto, 400);
  if (!texto) return { status: 400, body: { error: 'pedido' } };
  const d = await pedir({
    system: sistema(hoy, b), effort: 'medium', maxTokens: 1500,
    schema: {
      type: 'object',
      properties: {
        texto: { type: 'string', description: 'la regla, clara y en primera persona como la diría Ale («Los domingos no meriendo»), en una o dos líneas' },
        resumen: { type: 'string', description: 'qué cambia en la app, en una línea y hablándole de vos («Desde ahora el domingo la merienda no hace falta»)' },
        cambios: {
          type: 'array',
          description: 'solo si la regla cambia cupos, libres fijos o qué comidas hacen falta; si es una regla de qué comer o cómo clasificar, vacío (la IA la va a leer igual)',
          items: {
            type: 'object',
            properties: {
              tipo: { type: 'string', enum: ['cupo', 'libre_fijo', 'quitar_libre_fijo', 'opcional', 'obligatoria'] },
              comida: { type: 'string', enum: COMIDAS },
              clase: { type: 'string', enum: ['carbo', 'libre', 'ninguna'], description: 'solo para cupo; si no, ninguna' },
              cantidad: { type: 'integer', description: 'solo para cupo: cuántas por semana; si no, 0' },
              dia: { type: 'integer', description: '0 domingo, 1 lunes … 6 sábado; -1 todos los días' }
            },
            required: ['tipo', 'comida', 'clase', 'cantidad', 'dia'], additionalProperties: false
          }
        },
        duda: { type: 'string', description: 'si no se entiende bien qué cambia, una pregunta corta para Ale; si se entiende, vacío' }
      },
      required: ['texto', 'resumen', 'cambios', 'duda'], additionalProperties: false
    },
    content: [{ type: 'text', text: 'Ale escribió algo que le dijo Ari (o una regla suya) para que la app lo tenga en cuenta: «' + texto + '».\n' +
      'Convertilo en una regla. Cambios posibles: cupo (cuántos con carbo o libres por semana en almuerzo o cena), libre_fijo / quitar_libre_fijo (un libre reservado para un día y comida), ' +
      'opcional / obligatoria (una comida que ese día no hace falta, o que sí hace falta). Si la regla reemplaza a una de las que ya están (por ejemplo, mueve un libre fijo), incluí también el cambio que deshace lo anterior. ' +
      'Si es sobre qué comer, qué cuenta como plan o cómo sugerir, no hace falta ningún cambio: con el texto alcanza.' }]
  });
  const cambios = (Array.isArray(d && d.cambios) ? d.cambios : []).map(c => Plan.limpiarCambio(c)).filter(Boolean).slice(0, 10);
  return { status: 200, body: { ok: true, texto: limpiarTexto(d && d.texto, 400) || texto, resumen: limpiarTexto(d && d.resumen, 300), cambios, cambiosTexto: cambios.map(Plan.cambioTexto), duda: limpiarTexto(d && d.duda, 300) } };
}

/* Mira todo el historial: un resumen para Ari (la nutricionista) y consejos concretos para Ale */
async function informe(b, hoy) {
  const datos = String(b.datos || '').slice(0, 60000);
  if (!datos.trim()) return { status: 400, body: { error: 'pedido' } };
  const d = await pedir({
    system: sistema(hoy, b), effort: 'medium', maxTokens: 2500,
    schema: {
      type: 'object',
      properties: {
        para_ari: { type: 'string', description: 'resumen para la nutricionista, en tercera persona («Ale cumplió…»), de 4 a 7 oraciones: constancia, cómo usó los cupos, dónde aflojó y patrones, sin juicios ni adornos; sin markdown' },
        para_ale: { type: 'array', items: { type: 'string' }, description: 'de 2 a 4 consejos concretos para Ale, uno por patrón que veas en los datos, hablándole de vos, cada uno en una o dos oraciones, dentro del plan y las reglas de Ari' }
      },
      required: ['para_ari', 'para_ale'], additionalProperties: false
    },
    content: [{ type: 'text', text: 'Estos son los datos de Ale desde que arrancó el plan (días, comidas, cupos, patrones que ya calculó la app):\n\n' + datos + '\n\n' +
      'Escribí dos cosas. Para Ari: un resumen honesto y útil para la sesión, basado solo en los datos. Para Ale: consejos concretos para lo que viene, mirando los patrones ' +
      '(qué día, qué comida, qué horario o situación se le complica, qué le funciona). Nada genérico: cada consejo tiene que salir de algo que se ve en los datos. ' +
      'Si los datos son pocos, decilo en el resumen para Ari.' }]
  });
  return { status: 200, body: { ok: true, para_ari: limpiarTexto(d && d.para_ari, 1500), para_ale: (Array.isArray(d && d.para_ale) ? d.para_ale : []).map(x => limpiarTexto(x, 300)).filter(Boolean).slice(0, 4) } };
}

const ACCIONES = { sugerir, evaluar, clasificar, regla, informe, preguntar };

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
      b._ctx = contexto(b);
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
