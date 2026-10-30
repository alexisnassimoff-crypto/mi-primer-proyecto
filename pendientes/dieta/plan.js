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
      { id: 'nada', nombre: 'No desayuné', detalle: 'El plan pide desayunar todos los días', ok: false }
    ],
    almuerzo: [
      { id: 'plan', nombre: 'Proteína y vegetales', detalle: 'Mitad y mitad', ok: true },
      { id: 'carbo', nombre: 'Con carbo', detalle: 'Un tercio carbo, un tercio proteína, un tercio vegetales', ok: true, cupo: 1 },
      { id: 'libre', nombre: 'Libre', detalle: 'El permitido de la semana', ok: true, cupo: 1 },
      { id: 'nova', nombre: 'Me salí', detalle: 'No fue según el plan', ok: false },
      { id: 'nada', nombre: 'No almorcé', detalle: 'El plan pide las 4 comidas', ok: false }
    ],
    merienda: [
      { id: 'plan', nombre: 'Proteína o pan turco', detalle: 'Proteína y vegetales sin pan (mejor todavía), o pan turco con pastrón, queso y tomate, palta o huevo', ok: true },
      { id: 'nada', nombre: 'No merendé', detalle: 'Está bien, la merienda es chica', ok: true },
      { id: 'nova', nombre: 'Me salí', detalle: 'Más que un pan turco, o algo que no va', ok: false }
    ],
    cena: [
      { id: 'plan', nombre: 'Proteína y vegetales', detalle: 'La cena perfecta', ok: true },
      { id: 'carbo', nombre: 'Con carbo', detalle: 'Un tercio carbo, un tercio proteína, un tercio vegetales', ok: true, cupo: 1 },
      { id: 'libre', nombre: 'Libre', detalle: 'Un permitido de la semana', ok: true, cupo: 2 },
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
  const esSabado = s => deYmd(s).getDay() === 6;
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  /* ---------- Lo que me dijo Ari: reglas ----------
     Cada regla tiene el texto (lo lee la IA siempre) y, si hace falta, cambios concretos que
     mueven las estrellas. Ale las agrega desde la app; estas son las que ya venían.
     Cambios posibles (se aplican en orden; la última manda):
       { tipo: 'cupo', comida: 'almuerzo'|'cena', clase: 'carbo'|'libre', cantidad }
       { tipo: 'libre_fijo' | 'quitar_libre_fijo', comida: 'almuerzo'|'cena', dia: 0-6 }
       { tipo: 'opcional' | 'obligatoria', comida, dia: 0-6 o -1 (todos los días) } */
  const REGLAS_BASE = [
    { id: 'kosher', base: true, texto: 'Como kosher: nada de cerdo ni mariscos, pescado solo con escamas (merluza, salmón, atún, lenguado, trucha) y nunca carne o pollo con lácteos en la misma comida (pastrón con queso, carne con crema o manteca, no van).', cambios: [] },
    { id: 'proteina', base: true, texto: 'Proteína y vegetales es siempre plan, en cualquier comida, aunque ahí el plan permita pan o hidrato: es mejor todavía. Nunca sugerirme agregar pan o hidrato.', cambios: [] },
    { id: 'huevos', base: true, texto: 'En el desayuno, 4 huevos enteros también vale: las claras son solo por el colesterol.', cambios: [] },
    { id: 'shabat', base: true, texto: 'Los sábados (Shabat) rezo a la mañana y no desayuno: está bien, no es salirme del plan.', cambios: [{ tipo: 'opcional', comida: 'desayuno', dia: 6 }] },
    { id: 'libres', base: true, texto: 'Mis libres fijos son la cena del viernes (Shabat) y el almuerzo del sábado. En la semana no hay que gastarlos.', cambios: [{ tipo: 'libre_fijo', comida: 'cena', dia: 5 }, { tipo: 'libre_fijo', comida: 'almuerzo', dia: 6 }] }
  ];
  const COMIDAS_REGLA = ['desayuno', 'almuerzo', 'merienda', 'cena'];
  /* deja pasar solo cambios bien armados */
  function limpiarCambio(c) {
    if (!c || typeof c !== 'object') return null;
    const dia = Number(c.dia), cant = Number(c.cantidad);
    if (c.tipo === 'cupo' && (c.comida === 'almuerzo' || c.comida === 'cena') && (c.clase === 'carbo' || c.clase === 'libre') && cant >= 0 && cant <= 7)
      return { tipo: 'cupo', comida: c.comida, clase: c.clase, cantidad: Math.round(cant) };
    if ((c.tipo === 'libre_fijo' || c.tipo === 'quitar_libre_fijo') && (c.comida === 'almuerzo' || c.comida === 'cena') && dia >= 0 && dia <= 6)
      return { tipo: c.tipo, comida: c.comida, dia: Math.round(dia) };
    if ((c.tipo === 'opcional' || c.tipo === 'obligatoria') && COMIDAS_REGLA.indexOf(c.comida) >= 0 && dia >= -1 && dia <= 6)
      return { tipo: c.tipo, comida: c.comida, dia: Math.round(dia) };
    return null;
  }
  function limpiarRegla(r) {
    if (!r || typeof r !== 'object') return null;
    const texto = String(r.texto || '').replace(/\s+/g, ' ').trim().slice(0, 400);
    if (!texto) return null;
    return { id: String(r.id || '').slice(0, 40) || ('r' + Date.now().toString(36)), texto, resumen: String(r.resumen || '').trim().slice(0, 300),
      cambios: (Array.isArray(r.cambios) ? r.cambios : []).map(limpiarCambio).filter(Boolean).slice(0, 10), base: !!r.base, at: Number(r.at) || 0 };
  }
  const nombreFijo = (comida, dia) => DIAS[dia] + (comida === 'cena' ? ' a la noche' : ' al mediodía');
  /* las reglas -> la configuración que usan las estrellas */
  function config(reglas) {
    const cfg = { cupos: { almuerzo: { carbo: 1, libre: 1 }, cena: { carbo: 1, libre: 2 } }, reservas: [], dias: {} };
    (Array.isArray(reglas) ? reglas : REGLAS_BASE).forEach(r => (r && Array.isArray(r.cambios) ? r.cambios : []).forEach(c0 => {
      const c = limpiarCambio(c0); if (!c) return;
      if (c.tipo === 'cupo') cfg.cupos[c.comida][c.clase] = c.cantidad;
      else if (c.tipo === 'libre_fijo') { if (!cfg.reservas.some(x => x.comida === c.comida && x.dia === c.dia)) cfg.reservas.push({ dia: c.dia, comida: c.comida, tipo: 'libre', nombre: nombreFijo(c.comida, c.dia) }); }
      else if (c.tipo === 'quitar_libre_fijo') cfg.reservas = cfg.reservas.filter(x => !(x.comida === c.comida && x.dia === c.dia));
      else {
        const dias = c.dia === -1 ? [0, 1, 2, 3, 4, 5, 6] : [c.dia];
        dias.forEach(d => { cfg.dias[c.comida + d] = c.tipo === 'obligatoria'; });
      }
    }));
    return cfg;
  }
  let CFG = config(REGLAS_BASE);
  const usar = cfg => { CFG = cfg && cfg.cupos ? cfg : config(REGLAS_BASE); };
  const cupoDe = (cid, tid) => ((CFG.cupos[cid] || {})[tid]) || 0;
  /* ¿esa comida hace falta ese día? (regla de Ari, o lo de siempre) */
  function obligatoria(cid, fecha) {
    const k = cid + deYmd(fecha).getDay();
    if (k in CFG.dias) return CFG.dias[k];
    const c = comida(cid); return !!(c && c.obligatoria);
  }
  /* los cambios en palabras: «Libre fijo: viernes a la noche» */
  function cambioTexto(c) {
    const n = { desayuno: 'desayuno', almuerzo: 'almuerzo', merienda: 'merienda', cena: 'cena' }[c.comida] || c.comida;
    const cuando = c.dia === -1 ? 'todos los días' : 'los ' + (DIAS[c.dia] === 'sábado' || DIAS[c.dia] === 'domingo' ? DIAS[c.dia] + 's' : DIAS[c.dia]);
    if (c.tipo === 'cupo') return n.charAt(0).toUpperCase() + n.slice(1) + ' ' + (c.clase === 'carbo' ? 'con carbo' : 'libre') + ': ' + c.cantidad + ' por semana';
    if (c.tipo === 'libre_fijo') return 'Libre fijo: ' + nombreFijo(c.comida, c.dia);
    if (c.tipo === 'quitar_libre_fijo') return 'Ya no es libre fijo: ' + nombreFijo(c.comida, c.dia);
    if (c.tipo === 'opcional') return n.charAt(0).toUpperCase() + n.slice(1) + ' no hace falta ' + cuando;
    return n.charAt(0).toUpperCase() + n.slice(1) + ' hace falta ' + cuando;
  }
  /* la configuración en palabras, para la IA */
  function configTexto() {
    const L = ['Cupos por semana: almuerzo ' + CFG.cupos.almuerzo.carbo + ' con carbo y ' + CFG.cupos.almuerzo.libre + ' libre; cena ' + CFG.cupos.cena.carbo + ' con carbo y ' + CFG.cupos.cena.libre + (CFG.cupos.cena.libre === 1 ? ' libre.' : ' libres.')];
    if (CFG.reservas.length) L.push('Libres fijos (reservados para ese día): ' + CFG.reservas.map(r => r.nombre).join(', ') + '.');
    return L.join(' ');
  }

  /* ---------- Qué comida toca ahora ---------- */
  function comidaAhora(hora) {
    if (hora >= 4 && hora < 11) return 'desayuno';
    if (hora >= 11 && hora < 16) return 'almuerzo';
    if (hora >= 16 && hora < 20) return 'merienda';
    return 'cena';
  }

  /* ---------- Libres fijos ----------
     Ale usa siempre los mismos permitidos: el viernes a la noche (cena de Shabat) y el sábado al
     mediodía. Quedan reservados: un libre en otro día que se come uno de estos es un error. */
  const fechaReserva = (lunes, r) => sumarDias(lunes, (r.dia + 6) % 7);
  const reservaDe = (fecha, cid, tid) => CFG.reservas.find(r => r.comida === cid && r.tipo === tid && deYmd(fecha).getDay() === r.dia) || null;

  /* ---------- Evaluar la semana ----------
     Devuelve cada comida (solo las que no son extra) con su estado:
       ok        cumple el plan
       excedido  era carbo o libre, pero ya no quedaba cupo (motivo 'reserva' si se comió un libre fijo)
       nova      se salió
       nada      no comió (y la comida era obligatoria)
     Primero se asignan los libres fijos a su día; el resto del cupo se reparte por fecha y orden de
     carga. Un libre fijo que todavía no pasó (o que ya se usó) queda apartado; si su día pasó sin
     usarlo, se libera. «hoy» decide qué está por venir. */
  function evaluarSemana(comidas, lunes, hoy) {
    hoy = hoy || ymd(new Date());
    const fin = sumarDias(lunes, 6);
    const dentro = comidas.filter(c => c.fecha >= lunes && c.fecha <= fin && c.comida !== 'extra')
      .slice().sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : (a.createdAt || 0) - (b.createdAt || 0)));
    const usados = {}, estados = {}, motivos = {}, asignadas = new Set(), apartados = {};
    const suma = (o, cid, tid) => { o[cid] = o[cid] || {}; o[cid][tid] = (o[cid][tid] || 0) + 1; };
    const reservas = CFG.reservas.map(r => {
      const f = fechaReserva(lunes, r);
      const c = dentro.find(x => x.fecha === f && x.comida === r.comida && x.tipo === r.tipo);
      if (c) { asignadas.add(c.id); estados[c.id] = 'ok'; suma(usados, r.comida, r.tipo); }
      const pendiente = !c && f >= hoy;
      if (c || pendiente) suma(apartados, r.comida, r.tipo);
      return Object.assign({}, r, { fecha: f, usada: !!c, pendiente });
    });
    const flex = {};
    dentro.forEach(c => {
      if (asignadas.has(c.id)) return;
      const t = tipo(c.comida, c.tipo);
      if (!t) { estados[c.id] = 'nova'; return; }
      if (!t.ok) { estados[c.id] = t.id === 'nada' ? (obligatoria(c.comida, c.fecha) ? 'nada' : 'ok') : 'nova'; return; }
      if (!t.cupo) { estados[c.id] = 'ok'; return; }
      const tope = cupoDe(c.comida, t.id);
      suma(usados, c.comida, t.id); suma(flex, c.comida, t.id);
      const libres = tope - ((apartados[c.comida] && apartados[c.comida][t.id]) || 0);
      if (flex[c.comida][t.id] <= libres) estados[c.id] = 'ok';
      else { estados[c.id] = 'excedido'; if (libres < tope && flex[c.comida][t.id] <= tope) motivos[c.id] = 'reserva'; }
    });
    const cupos = {};
    ['almuerzo', 'cena'].forEach(cid => {
      cupos[cid] = TIPOS[cid].filter(t => t.cupo).map(t => {
        const ap = (apartados[cid] && apartados[cid][t.id]) || 0, fx = (flex[cid] && flex[cid][t.id]) || 0;
        const tope = cupoDe(cid, t.id);
        return { tipo: t.id, nombre: t.nombre, cupo: tope, usado: (usados[cid] && usados[cid][t.id]) || 0,
          quedan: Math.max(0, tope - ap - fx), reservas: reservas.filter(r => r.comida === cid && r.tipo === t.id) };
      });
    });
    return { lunes, fin, estados, motivos, cupos, reservas };
  }

  /* Para cargar una comida (sin contar la que se está editando): ¿queda ese tipo para ese día? */
  function disponible(comidas, fecha, cid, tid, hoy) {
    const ev = evaluarSemana(comidas, lunesDe(fecha), hoy);
    const c = (ev.cupos[cid] || []).find(x => x.tipo === tid);
    if (!c) return { ok: true };
    const r = reservaDe(fecha, cid, tid);
    if (r) return { ok: !c.reservas.some(x => x.fecha === fecha && x.usada), fijo: r, quedan: c.quedan };
    return { ok: c.quedan > 0, quedan: c.quedan, pendientes: c.reservas.filter(x => x.pendiente) };
  }
  const quedan = (comidas, fecha, cid, tid) => { const d = disponible(comidas, fecha, cid, tid); return d.fijo ? (d.ok ? 1 : 0) : (d.quedan || 0); };

  /* ---------- Evaluar un día ----------
     estrella: desayuno, almuerzo y cena cargados y bien, la merienda (si se cargó) bien y ningún extra. */
  function evaluarDia(comidas, fecha, ev, hoy) {
    ev = ev || evaluarSemana(comidas, lunesDe(fecha), hoy);
    const del = comidas.filter(c => c.fecha === fecha);
    const porComida = {};
    COMIDAS.forEach(c => { porComida[c.id] = del.filter(x => x.comida === c.id); });
    const faltan = [], fallas = [];
    let cargadas = 0;
    COMIDAS.filter(c => c.id !== 'extra').forEach(c => {
      const filas = porComida[c.id];
      if (!filas.length) { if (obligatoria(c.id, fecha)) faltan.push(c.id); return; }
      cargadas++;
      filas.forEach(f => { if (ev.estados[f.id] !== 'ok') fallas.push({ comida: c.id, estado: ev.estados[f.id], tipo: f.tipo, motivo: ev.motivos[f.id] }); });
    });
    porComida.extra.forEach(() => fallas.push({ comida: 'extra', estado: 'nova', tipo: 'nova' }));
    const completo = !faltan.length;
    return { fecha, cargadas, faltan, fallas, completo, estrella: completo && !fallas.length, extras: porComida.extra.length, porComida };
  }

  /* Días seguidos con estrella, contando desde ayer hacia atrás (y hoy si ya la ganó) */
  function racha(comidas, hoy) {
    let n = 0, f = hoy;
    const deHoy = evaluarDia(comidas, hoy, null, hoy);
    if (deHoy.estrella) { n++; }
    else if (deHoy.fallas.length) return 0;  /* hoy ya se cortó */
    f = sumarDias(hoy, -1);
    for (let i = 0; i < 400; i++) {
      const d = evaluarDia(comidas, f, null, hoy);
      if (!d.estrella) break;
      n++; f = sumarDias(f, -1);
    }
    return n;
  }

  /* Total de estrellas desde que arrancó */
  function estrellas(comidas, desde, hasta, hoy) {
    let n = 0, f = desde;
    while (f <= hasta) { if (evaluarDia(comidas, f, null, hoy).estrella) n++; f = sumarDias(f, 1); }
    return n;
  }

  /* ---------- Ideas para cada comida (sin IA) ---------- */
  /* Ale come kosher: sin cerdo ni mariscos, pescado con escamas, y nunca carne con lácteos */
  const PROTE = ['pollo a la plancha', 'bife de carne magra', 'pescado al horno', 'atún al natural', 'tortilla de claras con un huevo', 'milanesa de pollo al horno (sin pan rallado)', 'pavita a la plancha', 'merluza a la plancha', 'pechuga al limón', 'carne al horno', 'salmón', 'hamburguesa casera sin pan', 'pastrón con ensalada'];
  const VEGE = ['ensalada de lechuga, tomate y zanahoria', 'brócoli al vapor', 'zapallitos salteados', 'calabaza al horno', 'chauchas', 'espinaca salteada', 'ensalada de rúcula y tomate', 'coliflor al horno', 'berenjenas grilladas', 'verduras al wok', 'repollo y zanahoria rallados', 'tomates con albahaca', 'morrones asados'];
  const CARBO = ['un poco de arroz', 'una papa chica al horno', 'batata asada', 'un puñado de fideos', 'un pan', 'quinoa', 'lentejas'];
  const MERIENDA_PROTE = ['huevo revuelto con salmón ahumado', '2 huevos duros con tomate', '4 fetas de pastrón con tomate', 'atún al natural con tomate y zanahoria', 'pavita con pepino y tomate', 'trucha ahumada con ensalada'];
  const MERIENDA = ['pan turco con 4 fetas de pastrón y tomate', 'pan turco con 2 fetas de queso y tomate', 'pan turco con palta', 'pan turco con un huevo revuelto', 'pan turco con pastrón y palta', 'pan turco con huevo duro y tomate'];
  const elegir = (arr, semilla) => arr[Math.abs(semilla) % arr.length];
  function ideas(cid, semilla) {
    semilla = typeof semilla === 'number' ? semilla : Math.floor(Math.random() * 10000);
    const out = [];
    if (cid === 'desayuno') return [{ tipo: 'plan', titulo: '2 huevos y 2 claras', detalle: 'Revueltos, duros o a la plancha. Con café o té sin azúcar.' }, { tipo: 'plan', titulo: 'Omelette de 2 huevos y 2 claras', detalle: 'Con espinaca o tomate adentro, sin pan.' }, { tipo: 'plan', titulo: '4 huevos enteros', detalle: 'Vale igual. Las claras son solo por el colesterol.' }];
    if (cid === 'merienda') return [0, 1].map(i => ({ tipo: 'plan', titulo: elegir(MERIENDA_PROTE, semilla + i * 7), detalle: 'Solo proteína, sin pan: mejor todavía.' }))
      .concat([{ tipo: 'plan', titulo: elegir(MERIENDA, semilla), detalle: 'Si querés pan, uno solo. Sin manteca ni dulces.' }]);
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
    'Desayuno: 2 huevos enteros y 2 claras, los 7 días de la semana.',
    'Almuerzo: 5 veces por semana mitad proteína y mitad vegetales; 1 vez por semana carbohidrato, proteína y vegetales (un tercio cada uno); 1 vez por semana libre (el permitido).',
    'Merienda: 1 pan turco con lo que quieras: hasta 4 fetas de pastrón, o 2 fetas de queso con tomate, o palta, o huevo. Poquito no hay problema.',
    'Cena: 4 veces por semana proteína y vegetales (perfecta); 1 vez por semana con carbohidrato (un tercio cada uno); 2 veces por semana libre.',
    'No postres. No frutas. No extras.',
    'La semana va de lunes a domingo: los libres y los «con carbo» que no se usan no se acumulan.'
  ];

  return { OBJETIVO, META, PLAZO_DIAS, COMIDAS, TIPOS, TIPO_AT, COMIDA_AT, FRASES, PLAN_TEXTO, comida, tipo, ymd, deYmd, sumarDias, lunesDe, diasEntre, esSabado, comidaAhora, DIAS, REGLAS_BASE, limpiarRegla, limpiarCambio, config, usar, cupoDe, obligatoria, cambioTexto, configTexto, reservaDe, evaluarSemana, disponible, quedan, evaluarDia, racha, estrellas, ideas, frase };
}));
