/* ============================================================
   Dieta — el plan de Ari (la nutricionista) en reglas
   Lo comparten la app (dieta/app.js) y el servidor (api/dieta.js):
   qué comidas hay, qué tipos vale cada una, cuántos «libres» y
   «con carbo» entran por semana, cuándo un día gana la estrella,
   ideas para cada comida y las frases de Ari.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Plan = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const OBJETIVO = 78;       /* kg, para la próxima sesión con Ari */
  const META = [70, 74];     /* kg, la meta final de Ari: bajar grasa manteniendo el músculo */
  const PLAZO_DIAS = 30;     /* «en un mes»: no hay que pesarse en el medio, se pesa al final */

  /* Las comidas del día. «desde/hasta» son las horas para proponer cuál cargar. */
  const COMIDAS = [
    { id: 'desayuno', nombre: 'Desayuno', desde: 4, hasta: 11, obligatoria: true },
    { id: 'almuerzo', nombre: 'Almuerzo', desde: 11, hasta: 16, obligatoria: true },
    { id: 'merienda', nombre: 'Merienda', desde: 16, hasta: 20, obligatoria: false },
    { id: 'cena', nombre: 'Cena', desde: 20, hasta: 4, obligatoria: true },
    { id: 'extra', nombre: 'Extra', obligatoria: false }
  ];

  /* Tipos por comida. ok: cumple el plan. cupo: cuántas veces por semana (lunes a domingo).
     Los «plan» no tienen tope: comer bien nunca está de más. */
  const TIPOS = {
    desayuno: [
      { id: 'plan', nombre: 'Huevos', detalle: '2 huevos y 2 claras, o 4 enteros (las claras son solo por el colesterol)', ok: true },
      { id: 'nova', nombre: 'Otra cosa', detalle: 'Algo que no está en el plan', ok: false },
      { id: 'nada', nombre: 'No desayuné', detalle: 'El plan pide desayunar los 7 días', ok: false }
    ],
    almuerzo: [
      { id: 'plan', nombre: 'Proteína y vegetales', detalle: 'Mitad y mitad', ok: true },
      { id: 'carbo', nombre: 'Con carbo', detalle: 'Un tercio carbo, un tercio proteína, un tercio vegetales', ok: true, cupo: 1 },
      { id: 'libre', nombre: 'Libre', detalle: 'El permitido de la semana', ok: true, cupo: 1 },
      { id: 'nova', nombre: 'Me salí', detalle: 'No fue según el plan', ok: false },
      { id: 'nada', nombre: 'No almorcé', detalle: 'El plan pide las 4 comidas', ok: false }
    ],
    merienda: [
      { id: 'plan', nombre: 'Pan turco', detalle: 'Con pastrón (hasta 4 fetas), o queso y tomate, o palta, o huevo', ok: true },
      { id: 'nada', nombre: 'No merendé', detalle: 'Está bien, la merienda es chica', ok: true },
      { id: 'nova', nombre: 'Me salí', detalle: 'Más que un pan turco, o algo que no va', ok: false }
    ],
    cena: [
      { id: 'plan', nombre: 'Proteína y vegetales', detalle: 'La cena perfecta', ok: true },
      { id: 'carbo', nombre: 'Con carbo', detalle: 'Un tercio carbo, un tercio proteína, un tercio vegetales', ok: true, cupo: 1 },
      { id: 'libre', nombre: 'Libre', detalle: 'Uno de los dos permitidos de la semana', ok: true, cupo: 2 },
      { id: 'nova', nombre: 'Me salí', detalle: 'No fue según el plan', ok: false },
      { id: 'nada', nombre: 'No cené', detalle: 'El plan pide las 4 comidas', ok: false }
    ],
    extra: [
      { id: 'nova', nombre: 'Postre, fruta o picoteo', detalle: 'Fuera del plan: no hay postres, frutas ni extras', ok: false }
    ]
  };

  /* Cómo se guardan en Airtable (columna Tipo) */
  const TIPO_AT = { plan: 'Como el plan', carbo: 'Con carbo', libre: 'Libre', nova: 'Me salí', nada: 'No comí' };
  const COMIDA_AT = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', merienda: 'Merienda', cena: 'Cena', extra: 'Extra' };

  const comida = id => COMIDAS.find(c => c.id === id) || null;
  const tipo = (c, t) => (TIPOS[c] || []).find(x => x.id === t) || null;

  /* ---------- Fechas (AAAA-MM-DD, sin zonas horarias) ---------- */
  const pad = n => (n < 10 ? '0' : '') + n;
  const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const deYmd = s => { const m = String(s || '').split('-').map(Number); return new Date(m[0], m[1] - 1, m[2]); };
  const sumarDias = (s, n) => { const d = deYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
  /* lunes de la semana de esa fecha */
  function lunesDe(s) { const d = deYmd(s), dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return ymd(d); }
  const diasEntre = (a, b) => Math.round((deYmd(b) - deYmd(a)) / 86400000);

  /* ---------- Qué comida toca ahora ---------- */
  function comidaAhora(hora) {
    if (hora >= 4 && hora < 11) return 'desayuno';
    if (hora >= 11 && hora < 16) return 'almuerzo';
    if (hora >= 16 && hora < 20) return 'merienda';
    return 'cena';
  }

  /* ---------- Evaluar la semana ----------
     Devuelve cada comida (solo las que no son extra) con su estado:
       ok        cumple el plan
       excedido  era carbo o libre, pero ya se había usado el cupo de la semana
       nova      se salió
       nada      no comió (y la comida era obligatoria)
     y los cupos usados por comida y tipo. El orden para repartir el cupo es por fecha y
     después por el momento de carga, así el primero que se cargó es el que vale. */
  function evaluarSemana(comidas, lunes) {
    const fin = sumarDias(lunes, 6);
    const dentro = comidas.filter(c => c.fecha >= lunes && c.fecha <= fin && c.comida !== 'extra')
      .slice().sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : (a.createdAt || 0) - (b.createdAt || 0)));
    const usados = {}, estados = {};
    dentro.forEach(c => {
      const t = tipo(c.comida, c.tipo);
      if (!t) { estados[c.id] = 'nova'; return; }
      if (!t.ok) { estados[c.id] = t.id === 'nada' ? 'nada' : 'nova'; return; }
      if (!t.cupo) { estados[c.id] = 'ok'; return; }
      usados[c.comida] = usados[c.comida] || {};
      usados[c.comida][t.id] = (usados[c.comida][t.id] || 0) + 1;
      estados[c.id] = usados[c.comida][t.id] <= t.cupo ? 'ok' : 'excedido';
    });
    const cupos = {};
    ['almuerzo', 'cena'].forEach(cid => {
      cupos[cid] = TIPOS[cid].filter(t => t.cupo).map(t => ({ tipo: t.id, nombre: t.nombre, cupo: t.cupo, usado: (usados[cid] && usados[cid][t.id]) || 0 }));
    });
    return { lunes, fin, estados, cupos };
  }

  /* Cuántos quedan de un tipo con cupo en la semana de esa fecha */
  function quedan(comidas, fecha, cid, tid) {
    const ev = evaluarSemana(comidas, lunesDe(fecha));
    const c = (ev.cupos[cid] || []).find(x => x.tipo === tid);
    return c ? Math.max(0, c.cupo - c.usado) : 0;
  }

  /* ---------- Evaluar un día ----------
     estrella: desayuno, almuerzo y cena cargados y bien, la merienda (si se cargó) bien y ningún extra. */
  function evaluarDia(comidas, fecha, ev) {
    ev = ev || evaluarSemana(comidas, lunesDe(fecha));
    const del = comidas.filter(c => c.fecha === fecha);
    const porComida = {};
    COMIDAS.forEach(c => { porComida[c.id] = del.filter(x => x.comida === c.id); });
    const faltan = [], fallas = [];
    let cargadas = 0;
    COMIDAS.filter(c => c.id !== 'extra').forEach(c => {
      const filas = porComida[c.id];
      if (!filas.length) { if (c.obligatoria) faltan.push(c.id); return; }
      cargadas++;
      filas.forEach(f => { if (ev.estados[f.id] !== 'ok') fallas.push({ comida: c.id, estado: ev.estados[f.id], tipo: f.tipo }); });
    });
    porComida.extra.forEach(() => fallas.push({ comida: 'extra', estado: 'nova', tipo: 'nova' }));
    const completo = !faltan.length;
    return { fecha, cargadas, faltan, fallas, completo, estrella: completo && !fallas.length, extras: porComida.extra.length, porComida };
  }

  /* Días seguidos con estrella, contando desde ayer hacia atrás (y hoy si ya la ganó) */
  function racha(comidas, hoy) {
    let n = 0, f = hoy;
    const deHoy = evaluarDia(comidas, hoy);
    if (deHoy.estrella) { n++; }
    else if (deHoy.fallas.length) return 0;  /* hoy ya se cortó */
    f = sumarDias(hoy, -1);
    for (let i = 0; i < 400; i++) {
      const d = evaluarDia(comidas, f);
      if (!d.estrella) break;
      n++; f = sumarDias(f, -1);
    }
    return n;
  }

  /* Total de estrellas desde que arrancó */
  function estrellas(comidas, desde, hasta) {
    let n = 0, f = desde;
    while (f <= hasta) { if (evaluarDia(comidas, f).estrella) n++; f = sumarDias(f, 1); }
    return n;
  }

  /* ---------- Ideas para cada comida (sin IA) ---------- */
  /* Ale come kosher: sin cerdo ni mariscos, pescado con escamas, y nunca carne con lácteos */
  const PROTE = ['pollo a la plancha', 'bife de carne magra', 'pescado al horno', 'atún al natural', 'tortilla de claras con un huevo', 'milanesa de pollo al horno (sin pan rallado)', 'pavita a la plancha', 'merluza a la plancha', 'pechuga al limón', 'carne al horno', 'salmón', 'hamburguesa casera sin pan', 'pastrón con ensalada'];
  const VEGE = ['ensalada de lechuga, tomate y zanahoria', 'brócoli al vapor', 'zapallitos salteados', 'calabaza al horno', 'chauchas', 'espinaca salteada', 'ensalada de rúcula y tomate', 'coliflor al horno', 'berenjenas grilladas', 'verduras al wok', 'repollo y zanahoria rallados', 'tomates con albahaca', 'morrones asados'];
  const CARBO = ['un poco de arroz', 'una papa chica al horno', 'batata asada', 'un puñado de fideos', 'un pan', 'quinoa', 'lentejas'];
  const MERIENDA = ['pan turco con 4 fetas de pastrón y tomate', 'pan turco con 2 fetas de queso y tomate', 'pan turco con palta', 'pan turco con un huevo revuelto', 'pan turco con pastrón y palta', 'pan turco con huevo duro y tomate'];
  const elegir = (arr, semilla) => arr[Math.abs(semilla) % arr.length];
  function ideas(cid, semilla) {
    semilla = typeof semilla === 'number' ? semilla : Math.floor(Math.random() * 10000);
    const out = [];
    if (cid === 'desayuno') return [{ tipo: 'plan', titulo: '2 huevos y 2 claras', detalle: 'Revueltos, duros o a la plancha. Con café o té sin azúcar.' }, { tipo: 'plan', titulo: 'Omelette de 2 huevos y 2 claras', detalle: 'Con espinaca o tomate adentro, sin pan.' }, { tipo: 'plan', titulo: '4 huevos enteros', detalle: 'Vale igual. Las claras son solo por el colesterol.' }];
    if (cid === 'merienda') return [0, 1, 2].map(i => ({ tipo: 'plan', titulo: elegir(MERIENDA, semilla + i * 7), detalle: 'Poquito no hay problema. Sin manteca ni dulces.' }));
    if (cid === 'almuerzo' || cid === 'cena') {
      for (let i = 0; i < 3; i++) out.push({ tipo: 'plan', titulo: elegir(PROTE, semilla + i * 5) + ' con ' + elegir(VEGE, semilla + i * 3), detalle: 'Mitad proteína, mitad vegetales. Sin pan ni postre.' });
      out.push({ tipo: 'carbo', titulo: elegir(PROTE, semilla + 11) + ', ' + elegir(VEGE, semilla + 13) + ' y ' + elegir(CARBO, semilla + 17), detalle: 'Un tercio de cada cosa. Usa el «con carbo» de la semana.' });
      return out;
    }
    return out;
  }

  /* ---------- Las frases de Ari ---------- */
  const FRASES = [
    'Alejate de la comida. Anticipate.',
    'Practicá: «No, gracias. No, gracias».',
    'Ponete feliz cuando comiste sano y poco.',
    'O usás el permitido o no lo usás. No hay medias tintas.',
    'Si comés un chocolate y cediste, empezás a ceder.',
    'Hay que estar firme y convencido con la decisión.',
    'El alimento es droga y hay que tomarlo como tal.',
    'Los atajos se pagan después.',
    'Si jugás al fútbol, no podés ir a trabar la pelota con el pie flojo.',
    'El sobrepeso con la edad lesiona y desgasta el cuerpo.',
    'Felicitate cuando cumplís. Un día bien comido es una estrella.',
    'Bajar grasa, mantener músculo. Primero 78; la meta, entre 70 y 74.'
  ];
  function frase(fecha) {
    const n = diasEntre('2026-01-05', fecha);
    return FRASES[((n % FRASES.length) + FRASES.length) % FRASES.length];
  }

  /* El plan en texto, para la IA y para la pantalla «El plan» */
  const PLAN_TEXTO = [
    'Objetivo para la próxima sesión con Ari (en un mes): 78 kg. Meta final: quedar entre 70 y 74 kg, bajando grasa y manteniendo la masa muscular.',
    'Desayuno: 2 huevos enteros y 2 claras, los 7 días de la semana (4 huevos enteros también cuenta como cumplido; las claras son solo por el colesterol).',
    'Almuerzo: 5 veces por semana mitad proteína y mitad vegetales; 1 vez por semana carbohidrato, proteína y vegetales (un tercio cada uno); 1 vez por semana libre (el permitido).',
    'Merienda: 1 pan turco con lo que quieras: hasta 4 fetas de pastrón, o 2 fetas de queso con tomate, o palta, o huevo. Poquito no hay problema.',
    'Cena: 4 veces por semana proteína y vegetales (perfecta); 1 vez por semana con carbohidrato (un tercio cada uno); 2 veces por semana libre.',
    'No postres. No frutas. No extras.',
    'Ale come kosher: nada de cerdo ni mariscos; pescado solo con escamas (merluza, salmón, atún, lenguado); y nunca carne o pollo junto con lácteos en la misma comida (pastrón con queso, carne con crema o con manteca, no van). Toda idea o sugerencia tiene que respetarlo.',
    'La semana va de lunes a domingo: los libres y los «con carbo» que no se usan no se acumulan.'
  ];

  return { OBJETIVO, META, PLAZO_DIAS, COMIDAS, TIPOS, TIPO_AT, COMIDA_AT, FRASES, PLAN_TEXTO, comida, tipo, ymd, deYmd, sumarDias, lunesDe, diasEntre, comidaAhora, evaluarSemana, quedan, evaluarDia, racha, estrellas, ideas, frase };
}));
