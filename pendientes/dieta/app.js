/* ============================================================
   Dieta — la app
   Cargás cada comida del día y la app te dice si cumple el plan de Ari,
   cuántos «libres» y «con carbo» te quedan en la semana, y te da una
   estrella por cada día cumplido. Ideas dentro del plan, con o sin IA.
   Todo vive en localStorage; con la clave de Pendientes se respalda en
   Airtable por /api/dieta y la IA responde por la misma dirección.
   ============================================================ */
'use strict';

/* ---------- Utilidades ---------- */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const pad = n => (n < 10 ? '0' : '') + n;
const hoy = () => Plan.ymd(new Date());
const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fechaLarga = s => { const d = Plan.deYmd(s); return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()]; };
const fechaCorta = s => { const d = Plan.deYmd(s); return d.getDate() + '/' + (d.getMonth() + 1); };
const fechaDia = s => { const d = Plan.deYmd(s); return cap(DIAS[d.getDay()]) + ' ' + d.getDate() + '/' + (d.getMonth() + 1); };
function fechaRel(s) { const h = hoy(); return s === h ? 'Hoy' : s === Plan.sumarDias(h, -1) ? 'Ayer' : cap(fechaLarga(s)); }
const fmtKg = n => Number(n).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nombreDe = cid => (Plan.comida(cid) || { nombre: cid }).nombre;
const lsGet = k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
const lsSet = (k, v) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) {} };

/* ---------- Íconos ---------- */
const ICONS = {
  home: '<path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  chevL: '<path d="M15 18l-6-6 6-6"/>', chevR: '<path d="M9 18l6-6-6-6"/>', chevD: '<path d="M6 9l6 6 6-6"/>',
  star: '<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  fork: '<path d="M5 2v7a3 3 0 0 0 6 0V2M8 2v20M18 2c-2.5 1-3 5-3 8v4h3v8"/>',
  coffee: '<path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  scale: '<path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9zM12 12l3-4M3 12v6a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-6"/>',
  sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8zM5 2l.6 1.6L7.2 4.2 5.6 4.8 5 6.4 4.4 4.8 2.8 4.2l1.6-.6z"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
  refresh: '<path d="M23 4v6h-6M1 20v-6h6M20.5 9A9 9 0 0 0 5.6 5.6L1 10M23 14l-4.6 4.4A9 9 0 0 1 3.5 15"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5V4.5A2.5 2.5 0 0 1 6.5 2H20v15H6.5A2.5 2.5 0 0 0 4 19.5z"/>',
  msg: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.6-.8L3 21l1.9-5.4A8.4 8.4 0 0 1 3 11.5a8.4 8.4 0 0 1 9-8.4 8.4 8.4 0 0 1 9 8.4z"/>',
  bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V18h6v-1.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z"/>'
};
const icon = n => '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || '') + '</svg>';
const ICONO_COMIDA = { desayuno: 'sun', almuerzo: 'fork', merienda: 'coffee', cena: 'moon', extra: 'alert' };
function hydrateIcons(root) { $$('[data-icon]', root).forEach(s => { s.outerHTML = icon(s.dataset.icon); }); }

/* ---------- Estado ---------- */
const DB_KEY = 'dieta.estado', CLAVE_KEY = 'pendientes.clave', LAST_KEY = 'dieta.ultimaCopia', THEME_KEY = 'dieta.tema';
let state = load();
function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(DB_KEY) || 'null'); } catch (e) { s = null; }
  const base = { comidas: [], pesos: [], tombs: [], pesoTombs: [], ajustes: { objetivo: Plan.OBJETIVO, inicio: hoy(), nombre: 'Ale' }, ajustesAt: 0, ajustesSy: 0 };
  if (!s || typeof s !== 'object') return base;
  const out = Object.assign(base, s);
  out.ajustes = Object.assign({ objetivo: Plan.OBJETIVO, inicio: hoy(), nombre: 'Ale' }, s.ajustes || {});
  ['comidas', 'pesos', 'tombs', 'pesoTombs'].forEach(k => { if (!Array.isArray(out[k])) out[k] = []; });
  return out;
}
function persist() { try { localStorage.setItem(DB_KEY, JSON.stringify(state)); } catch (e) { toast('No se pudo guardar en este navegador'); } }
const byId = id => state.comidas.find(c => c.id === id) || null;
const comidasDe = f => state.comidas.filter(c => c.fecha === f);
const semana = f => Plan.evaluarSemana(state.comidas, Plan.lunesDe(f));
const dia = (f, ev) => Plan.evaluarDia(state.comidas, f, ev || semana(f));
const pesosOrd = () => state.pesos.slice().sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : (a.createdAt || 0) - (b.createdAt || 0)));
const objetivo = () => Number(state.ajustes.objetivo) || Plan.OBJETIVO;
const inicio = () => (/^\d{4}-\d{2}-\d{2}$/.test(state.ajustes.inicio || '') ? state.ajustes.inicio : hoy());
const limite = () => Plan.sumarDias(inicio(), Plan.PLAZO_DIAS);

const ui = { view: 'inicio', dia: null, ia: false, apiOk: false, ideasComida: null, ideasSemilla: 0, ideasIa: null, checkComida: null, checkRes: null, pop: false };

/* ---------- Tema ---------- */
function applyTheme() {
  const t = lsGet(THEME_KEY);
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
  requestAnimationFrame(() => { const m = $('#metaTheme'); if (m) m.content = getComputedStyle(document.body).backgroundColor; });
}

/* ---------- Aviso flotante ---------- */
let toastTimer = null;
function toast(msg, o) {
  o = o || {};
  const t = $('#toast');
  t.className = 'toast' + (o.star ? ' is-star' : '');
  t.innerHTML = '<span class="toast__msg">' + esc(msg) + '</span>' + (o.action ? '<span class="toast__acts"><button type="button" id="toastAct">' + esc(o.action) + '</button></span>' : '');
  const pop = 'showPopover' in t;
  if (pop) { t.setAttribute('popover', 'manual'); t.hidden = false; try { if (!t.matches(':popover-open')) t.showPopover(); } catch (e) {} } else t.hidden = false;
  const hide = () => { if (pop) { try { t.hidePopover(); } catch (e) {} } t.hidden = true; };
  if (o.action) $('#toastAct').onclick = () => { hide(); if (o.onAction) o.onAction(); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hide, o.ms || (o.action ? 6000 : 3200));
}

/* ---------- Navegación y hojas ---------- */
function go(view, extra, replace) {
  const st = { view, dia: extra || null, from: ui.view };
  ui.view = view; ui.dia = extra || null;
  if (replace) history.replaceState(st, ''); else history.pushState(st, '');
  render(); window.scrollTo(0, 0);
}
function openSheet(d) { if (d.open) return; history.pushState({ view: ui.view, dia: ui.dia, sheet: d.id }, ''); d.showModal(); const b = $('.sheet__body', d); if (b) b.scrollTop = 0; const f = $('[tabindex="-1"]', d); if (f) f.focus(); }
function closeSheet(d) { if (!d.open) return; if (history.state && history.state.sheet === d.id) history.back(); else d.close(); }
window.addEventListener('popstate', () => {
  const st = history.state || { view: 'inicio' };
  $$('dialog[open]').forEach(d => { if (st.sheet !== d.id) d.close(); });
  if (st.sheet) { const d = $('#' + st.sheet); if (d && !d.open) { history.back(); return; } }
  ui.view = st.view || 'inicio'; ui.dia = st.dia || null;
  render();
});

/* ---------- Cabecera ---------- */
function setHeader(title, sub, back) {
  $('#viewTitle').textContent = title;
  $('#viewSub').textContent = sub || '';
  const b = $('#btnBack'); b.hidden = !back; if (back) $('#btnBackTxt').textContent = back;
  $$('.tab[data-go]').forEach(t => { if (t.dataset.go === ui.view) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current'); });
  $('#btnAsk').hidden = !(ui.ia && sync.on);
}

/* ---------- Render ---------- */
function render() {
  renderSyncUi();
  if (ui.view === 'historial') return renderHistorial();
  if (ui.view === 'dia' && ui.dia) return renderDia(ui.dia);
  if (ui.view === 'peso') return renderPeso();
  return renderInicio();
}

const tag = (t, txt) => '<span class="tag tag--' + t + '">' + esc(txt) + '</span>';
function tipoCorto(c) {
  const t = Plan.tipo(c.comida, c.tipo), n = nombreDe(c.comida);
  if (c.comida === 'extra') return 'Extra';
  if (!t || t.id === 'nova') return n + ': me salí';
  if (t.id === 'plan') return c.comida === 'desayuno' ? 'Huevos' : c.comida === 'merienda' ? 'Pan turco' : n + ' prote y vegetales';
  if (t.id === 'nada') return 'Sin ' + (c.comida === 'desayuno' ? 'desayunar' : c.comida === 'almuerzo' ? 'almorzar' : c.comida === 'merienda' ? 'merendar' : 'cenar');
  return n + ' ' + t.nombre.toLowerCase();
}
function textoDia(d, esHoy) {
  if (d.estrella) return { t: esHoy ? '¡Día cumplido!' : 'Día cumplido', s: esHoy ? 'Una estrella más. Felicitate.' : 'Con estrella.' };
  if (d.fallas.length) {
    const partes = [];
    d.fallas.forEach(f => {
      const n = nombreDe(f.comida).toLowerCase();
      const p = f.comida === 'extra' ? 'un extra' : f.estado === 'excedido' ? 'el ' + (f.tipo === 'libre' ? 'libre' : 'con carbo') + ' de la ' + (f.comida === 'almuerzo' ? 'semana ya estaba usado (almuerzo)' : 'semana ya estaba usado (cena)') : f.estado === 'nada' ? 'sin ' + n : n + ' fuera del plan';
      if (partes.indexOf(p) < 0) partes.push(p);
    });
    return { t: esHoy ? 'Hoy no suma estrella' : 'Sin estrella', s: cap(partes.join(', ')) + '.' + (esHoy ? ' Lo que viene, firme.' : '') };
  }
  if (!d.cargadas) return { t: esHoy ? 'Todavía no cargaste nada' : 'Sin cargar', s: esHoy ? 'Arrancá con el desayuno.' : '' };
  const faltan = d.faltan.map(c => nombreDe(c).toLowerCase());
  if (!faltan.length && !d.porComida.merienda.length) faltan.push('merienda (si merendás)');
  return { t: 'Vas bien: ' + d.cargadas + ' de 4', s: faltan.length ? 'Falta: ' + faltan.join(', ') + '.' : '' };
}
function dayCardHtml(fecha) {
  const ev = semana(fecha), d = dia(fecha, ev), esHoy = fecha === hoy(), tx = textoDia(d, esHoy);
  const starCls = d.estrella ? 'is-on' : d.fallas.length ? 'is-off' : '';
  let h = '<div class="card day"><div class="day__head"><span class="day__star ' + starCls + '" id="dayStar">' + icon(d.estrella ? 'star' : d.fallas.length ? 'x' : 'star') + '</span>' +
    '<div><div class="day__t">' + esc(tx.t) + '</div>' + (tx.s ? '<div class="day__s">' + esc(tx.s) + '</div>' : '') + '</div></div><ul class="meals">';
  Plan.COMIDAS.filter(c => c.id !== 'extra').forEach(c => {
    const filas = d.porComida[c.id];
    if (!filas.length) {
      h += '<li><button type="button" class="meal" data-cargar="' + c.id + '"><span class="meal__ic">' + icon(ICONO_COMIDA[c.id]) + '</span><span class="meal__b"><span class="meal__n">' + esc(c.nombre) + '</span><span class="meal__t is-empty">Cargar</span></span><span class="meal__e">' + icon('chevR') + '</span></button></li>';
      return;
    }
    filas.forEach(f => {
      const st = ev.estados[f.id], t = Plan.tipo(f.comida, f.tipo);
      const cls = st === 'ok' ? 'is-ok' : st === 'excedido' || st === 'nova' || st === 'nada' ? (st === 'nada' && !c.obligatoria ? 'is-ok' : 'is-bad') : '';
      const etiqueta = st === 'ok' ? (f.tipo === 'plan' ? '' : tag(f.tipo, t.nombre)) : st === 'excedido' ? tag('excedido', 'Cupo usado') : st === 'nada' ? (c.obligatoria ? tag('nada', 'No comí') : '') : tag('nova', 'Fuera del plan');
      h += '<li><button type="button" class="meal ' + cls + '" data-editar="' + f.id + '"><span class="meal__ic">' + icon(ICONO_COMIDA[c.id]) + '</span><span class="meal__b"><span class="meal__n">' + esc(c.nombre) + (f.hora ? ' · ' + esc(f.hora) : '') + '</span>' +
        '<span class="meal__t">' + esc(t ? t.nombre : 'Me salí') + '</span>' + (f.que ? '<span class="meal__q">' + esc(f.que) + '</span>' : '') + '</span><span class="meal__e">' + (etiqueta || icon(st === 'ok' ? 'check' : 'chevR')) + '</span></button></li>';
    });
  });
  d.porComida.extra.forEach(f => {
    h += '<li><button type="button" class="meal is-bad" data-editar="' + f.id + '"><span class="meal__ic">' + icon('alert') + '</span><span class="meal__b"><span class="meal__n">Extra' + (f.hora ? ' · ' + esc(f.hora) : '') + '</span><span class="meal__t">' + esc(f.que || 'Postre, fruta o picoteo') + '</span></span><span class="meal__e">' + tag('nova', 'Fuera del plan') + '</span></button></li>';
  });
  h += '</ul><button type="button" class="extrarow" data-cargar="extra">' + icon('plus') + 'Anotar un extra (postre, fruta, picoteo)</button></div>';
  return h;
}
function weekHtml(fecha) {
  const lunes = Plan.lunesDe(fecha), h = hoy();
  let estrellas = 0, out = '<div class="week">';
  for (let i = 0; i < 7; i++) {
    const f = Plan.sumarDias(lunes, i), d = Plan.deYmd(f), futuro = f > h;
    const ev = futuro ? null : dia(f);
    if (ev && ev.estrella) estrellas++;
    const cls = (f === h ? ' is-today' : '') + (futuro ? ' is-future' : ev.estrella ? ' is-star' : ev.fallas.length ? ' is-bad' : ev.cargadas ? ' is-part' : '');
    out += '<button type="button" class="wd' + cls + '" data-dia="' + f + '"' + (futuro ? ' disabled' : '') + ' aria-label="' + esc(cap(fechaLarga(f))) + '"><span class="wd__l">' + 'LMMJVSD'.charAt(i) + '</span><span class="wd__n">' + d.getDate() + '</span><span class="wd__s">' + icon(!futuro && ev.fallas.length && !ev.estrella ? 'x' : 'star') + '</span></button>';
  }
  out += '</div><div class="week__foot"><span><b>' + estrellas + '</b> ' + (estrellas === 1 ? 'estrella' : 'estrellas') + ' esta semana</span><span>' + fechaCorta(lunes) + ' al ' + fechaCorta(Plan.sumarDias(lunes, 6)) + '</span></div>';
  return out;
}
function cuposHtml(fecha) {
  const ev = semana(fecha);
  let h = '<div class="cupos"><div class="cupos__k">Te quedan esta semana</div>';
  ['almuerzo', 'cena'].forEach(cid => {
    h += '<div class="cupo"><span class="cupo__k">' + esc(nombreDe(cid)) + '</span><span class="cupo__v">' + ev.cupos[cid].map(c => {
      const q = Math.max(0, c.cupo - c.usado);
      return '<span class="tag tag--' + c.tipo + (q ? '' : ' is-out') + '">' + esc(c.nombre) + ' ' + (q ? 'quedan ' + q : 'no queda') + '</span>'.replace('quedan 1', 'queda 1');
    }).join('') + '</span></div>';
  });
  return h + '</div>';
}
function renderInicio() {
  const h = hoy();
  setHeader('Hoy', cap(fechaLarga(h)), null);
  const r = Plan.racha(state.comidas, h), tot = Plan.estrellas(state.comidas, inicio() < h ? inicio() : h, h);
  const diasPlan = Plan.diasEntre(inicio(), h) + 1;
  const vacio = !state.comidas.length && !state.pesos.length;
  let html = vacio ? '<div class="card welcome"><h2>Hola, Ale.</h2><p>Acá cargás cada comida con un toque. Si cumplís el plan de Ari, el día gana una estrella. Objetivo: ' + objetivo() + ' kg.</p><button type="button" class="btn btn--secondary btn--block" data-plan>' + icon('book') + 'Ver el plan de Ari</button></div><div style="height:14px"></div>' : '';
  html += '<div class="frase">' + icon('star') + '<div><p class="frase__q">' + esc(Plan.frase(h)) + '</p><span class="frase__k">Ari</span></div></div>';
  html += dayCardHtml(h);
  html += '<section class="section"><div class="section__h"><span>Esta semana</span><span class="section__sub">Lunes a domingo</span></div><div class="card">' + weekHtml(h) + cuposHtml(h) + '</div></section>';
  html += '<section class="section"><div class="stats"><div class="stat"><div class="stat__v">' + icon('star') + r + '</div><div class="stat__k">' + (r === 1 ? 'día seguido' : 'días seguidos') + '</div></div><div class="stat"><div class="stat__v">' + tot + '</div><div class="stat__k">' + (tot === 1 ? 'estrella' : 'estrellas') + ' en ' + diasPlan + (diasPlan === 1 ? ' día' : ' días') + '</div></div></div></section>';
  html += '<section class="section"><div class="card"><button type="button" class="entry" data-ideas>' + icon('bulb') + '<span>¿Qué como?<small>Ideas dentro del plan' + (ui.ia && sync.on ? ', con la IA' : '') + '</small></span>' + icon('chevR') + '</button>' +
    '<button type="button" class="entry" data-check>' + icon('help') + '<span>¿Esto va?<small>Preguntá antes de comer</small></span>' + icon('chevR') + '</button></div></section>';
  const dias = Plan.diasEntre(h, limite());
  html += '<p class="note" style="margin:22px 4px 0;text-align:center">Objetivo <b>' + objetivo() + ' kg</b>. ' + (dias > 0 ? 'En el mes no te pesás: el pesaje es el ' + fechaCorta(limite()) + ', en ' + dias + (dias === 1 ? ' día.' : ' días.') : dias === 0 ? 'Hoy es el día del pesaje.' : 'El plazo del mes ya pasó: cambialo en Ajustes.') + '</p>';
  $('#main').innerHTML = html;
  if (ui.pop) { ui.pop = false; const s = $('#dayStar'); if (s) s.classList.add('is-pop'); }
}
function renderDia(fecha) {
  setHeader(fechaRel(fecha), cap(fechaLarga(fecha)), history.state && history.state.from === 'historial' ? 'Historial' : 'Inicio');
  $('#main').innerHTML = dayCardHtml(fecha) + '<section class="section"><div class="section__h"><span>Esa semana</span><span class="section__sub">Lunes a domingo</span></div><div class="card">' + weekHtml(fecha) + cuposHtml(fecha) + '</div></section>';
}
function renderHistorial() {
  const h = hoy();
  let desde = inicio() < Plan.lunesDe(h) ? inicio() : Plan.lunesDe(h); /* siempre la semana entera */
  state.comidas.forEach(c => { if (c.fecha < desde) desde = c.fecha; });
  if (Plan.diasEntre(desde, h) > 180) desde = Plan.sumarDias(h, -180);
  setHeader('Historial', 'Desde el ' + fechaCorta(desde), null);
  let html = '', f = h, semanaAct = null, cuerpo = '', estrellas = 0, dias = 0;
  const cerrar = () => { if (semanaAct) html += '<section class="section"><div class="section__h"><span>Semana del ' + fechaCorta(semanaAct) + '</span><span class="section__sub">' + estrellas + ' de ' + dias + '</span></div><div class="card">' + cuerpo + '</div></section>'; };
  while (f >= desde) {
    const l = Plan.lunesDe(f);
    if (l !== semanaAct) { cerrar(); semanaAct = l; cuerpo = ''; estrellas = 0; dias = 0; }
    const ev = dia(f); dias++; if (ev.estrella) estrellas++;
    const cls = ev.estrella ? ' is-star' : ev.fallas.length ? ' is-bad' : '';
    const partes = Plan.COMIDAS.map(c => ev.porComida[c.id].map(x => tipoCorto(x)).join(', ')).filter(Boolean);
    cuerpo += '<button type="button" class="hday' + cls + '" data-dia="' + f + '"><span class="hday__s">' + icon(ev.fallas.length && !ev.estrella ? 'x' : 'star') + '</span><span class="hday__b"><span class="hday__d">' + esc(f === h ? 'Hoy' : fechaDia(f)) + '</span><span class="hday__m">' + esc(partes.length ? partes.join(' · ') : 'Sin cargar') + '</span></span>' + icon('chevR') + '</button>';
    f = Plan.sumarDias(f, -1);
  }
  cerrar();
  $('#main').innerHTML = html || '<div class="card empty">Todavía no hay días cargados.</div>';
}
function chartHtml(ps) {
  if (ps.length < 2) return '';
  const W = 320, H = 120, P = { l: 30, r: 10, t: 10, b: 18 }, obj = objetivo();
  const vals = ps.map(p => p.kg).concat([obj]);
  let min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
  if (max - min < 2) { max += 1; min -= 1; }
  const x = i => P.l + (W - P.l - P.r) * (ps.length === 1 ? 0 : i / (ps.length - 1));
  const y = v => P.t + (H - P.t - P.b) * (1 - (v - min) / (max - min));
  const pts = ps.map((p, i) => x(i).toFixed(1) + ',' + y(p.kg).toFixed(1)).join(' ');
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Evolución del peso">' +
    '<line class="goal" x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y(obj).toFixed(1) + '" y2="' + y(obj).toFixed(1) + '"/>' +
    '<text x="0" y="' + (y(obj) + 4).toFixed(1) + '">' + obj + '</text>' +
    '<polyline class="ln" points="' + pts + '"/>' +
    ps.map((p, i) => '<circle class="dot' + (i === ps.length - 1 ? ' is-last' : '') + '" cx="' + x(i).toFixed(1) + '" cy="' + y(p.kg).toFixed(1) + '" r="3.5"/>').join('') +
    '<text x="' + P.l + '" y="' + (H - 4) + '">' + fechaCorta(ps[0].fecha) + '</text><text x="' + (W - P.r) + '" y="' + (H - 4) + '" text-anchor="end">' + fechaCorta(ps[ps.length - 1].fecha) + '</text></svg>';
}
function renderPeso() {
  setHeader('Peso', 'Objetivo ' + objetivo() + ' kg para el ' + fechaCorta(limite()), 'Inicio');
  const ps = pesosOrd(), obj = objetivo();
  let html = '';
  if (!ps.length) {
    html = '<div class="card empty">Todavía no te pesaste. Cargá el primer peso: desde ahí se mide cuánto falta para ' + obj + '.</div>';
  } else {
    const ult = ps[ps.length - 1], pri = ps[0], baj = Math.round((pri.kg - ult.kg) * 10) / 10, falta = Math.round((ult.kg - obj) * 10) / 10;
    const total = pri.kg - obj, prog = total > 0 ? Math.max(0, Math.min(1, (pri.kg - ult.kg) / total)) : 1;
    const dias = Plan.diasEntre(hoy(), limite());
    html = '<div class="card peso"><div class="peso__big"><span class="peso__v">' + fmtKg(ult.kg) + '</span><span class="peso__u">kg</span></div>' +
      '<p class="peso__s">' + (falta > 0 ? 'Faltan <b>' + fmtKg(falta) + ' kg</b> para ' + obj : '<b>¡Llegaste al objetivo!</b>') + (ps.length > 1 ? (baj > 0 ? ' · bajaste ' + fmtKg(baj) + ' desde el ' + fechaCorta(pri.fecha) : baj < 0 ? ' · subiste ' + fmtKg(-baj) + ' desde el ' + fechaCorta(pri.fecha) : ' · igual que el ' + fechaCorta(pri.fecha)) : '') + (dias > 0 ? ' · quedan ' + dias + ' días' : dias === 0 ? ' · hoy vence el plazo' : '') + '</p>' +
      '<div class="bar"><div class="bar__f" style="width:' + Math.round(prog * 100) + '%"></div></div><div class="bar__l"><span>' + fmtKg(pri.kg) + '</span><span>' + Math.round(prog * 100) + '%</span><span>' + obj + '</span></div>' + chartHtml(ps) + '</div>';
  }
  html += '<div class="actions"><button type="button" class="btn btn--primary btn--block" data-pesar>' + icon('scale') + 'Pesarme</button></div>';
  if (ps.length) {
    html += '<section class="section"><div class="section__h"><span>Pesadas</span></div><div class="card"><ul class="list">';
    ps.slice().reverse().forEach((p, i, arr) => {
      const prev = arr[i + 1], dif = prev ? Math.round((p.kg - prev.kg) * 10) / 10 : 0;
      html += '<li class="pay"><span class="pay__d">' + esc(fechaCorta(p.fecha)) + '</span><span class="pay__t">' + fmtKg(p.kg) + ' kg</span><span class="pay__a ' + (dif < 0 ? 'is-down' : dif > 0 ? 'is-up' : '') + '">' + (prev ? (dif > 0 ? '+' : '') + fmtKg(dif) : '') + '</span><button type="button" class="del" data-borrar-peso="' + p.id + '" aria-label="Borrar esta pesada">' + icon('trash') + '</button></li>';
    });
    html += '</ul></div></section>';
  }
  $('#main').innerHTML = html;
}

/* ---------- Cargar / editar una comida ----------
   De un toque: elegís cómo fue y queda guardada. Sin texto ni fecha: la fecha es la del
   día que estás mirando (Hoy, o un día del historial). */
let form = null;
function openForm(o) {
  o = o || {};
  const fecha = o.fecha || (ui.view === 'dia' && ui.dia ? ui.dia : hoy());
  if (o.comida === 'extra' && !o.id) { o.tipo = 'nova'; o.directo = true; }
  if (o.directo && o.comida && o.tipo) { guardarComida({ id: o.id, fecha, comida: o.comida, tipo: o.tipo, que: o.que || '' }); return; }
  form = { id: o.id || null, fecha, comida: o.comida || null, tipo: o.tipo || null, que: o.que || '', chips: !!o.elegir || !o.comida };
  if (form.comida && !form.id) { const ya = comidasDe(fecha).find(x => x.comida === form.comida); if (ya) { form.id = ya.id; form.tipo = ya.tipo; } }
  renderForm(true);
  openSheet($('#formSheet'));
}
function renderForm(primera) {
  const esHoy = form.fecha === hoy();
  $('#formTitle').textContent = form.id && !form.chips ? 'Cambiar ' + nombreDe(form.comida).toLowerCase() + (esHoy ? ' de hoy' : ' del ' + fechaCorta(form.fecha)) : 'Cargar' + (esHoy ? '' : ' el ' + fechaCorta(form.fecha));
  const del = comidasDe(form.fecha);
  let html = '';
  if (form.chips) {
    html += '<div class="q"><label class="q__label">¿Qué comida?</label><div class="opts">' + Plan.COMIDAS.map(c => {
      const ya = c.id !== 'extra' ? del.find(x => x.comida === c.id) : null;
      return '<button type="button" class="opt" data-comida="' + c.id + '" aria-pressed="' + (form.comida === c.id) + '">' + icon(ICONO_COMIDA[c.id]) + '<span>' + esc(c.nombre) + (ya ? '<small>ya cargada</small>' : '') + '</span></button>';
    }).join('') + '</div></div>';
  }
  if (form.comida && form.comida !== 'extra') {
    const otras = state.comidas.filter(c => c.id !== form.id), ev = Plan.evaluarSemana(otras, Plan.lunesDe(form.fecha));
    html += '<div class="q' + (primera ? '' : ' is-new') + '"><label class="q__label">¿Cómo fue?<small>Tocá una y queda guardada.</small></label><div class="opts opts--1">' + Plan.TIPOS[form.comida].map(t => {
      let cupo = '';
      if (t.cupo) {
        const c = ev.cupos[form.comida].find(x => x.tipo === t.id), q = Math.max(0, t.cupo - (c ? c.usado : 0));
        cupo = q ? '<span class="opt__c">' + (q === 1 ? 'Te queda 1 esta semana' : 'Te quedan ' + q + ' esta semana') + '</span>' : '<span class="opt__c is-out">Ya usaste el de esta semana: no sumaría estrella</span>';
      }
      return '<button type="button" class="opt opt--big" data-tipo="' + t.id + '" aria-pressed="' + (form.tipo === t.id) + '"><span class="opt__n">' + esc(t.nombre) + (t.cupo ? tag(t.id, t.cupo + ' por semana') : '') + '</span><span class="opt__d">' + esc(t.detalle) + '</span>' + cupo + '</button>';
    }).join('') + '</div></div>';
  }
  if (form.id) html += '<div class="actions"><button type="button" class="btn btn--danger btn--block" data-borrar>' + icon('trash') + 'Borrar esta comida</button></div>';
  $('#formBody').innerHTML = html;
}
function guardarComida(o) {
  const now = Date.now(), antes = dia(o.fecha), antesEst = semana(o.fecha).estados;
  let c = o.id ? byId(o.id) : null;
  if (!c && o.comida !== 'extra') c = comidasDe(o.fecha).find(x => x.comida === o.comida) || null; /* una por comida y día */
  if (c) Object.assign(c, { fecha: o.fecha, comida: o.comida, tipo: o.tipo, que: o.que || c.que || '', updatedAt: now });
  else {
    const d = new Date();
    c = { id: uid(), fecha: o.fecha, comida: o.comida, tipo: o.tipo, que: o.que || '', hora: o.fecha === hoy() ? pad(d.getHours()) + ':' + pad(d.getMinutes()) : '', createdAt: now, updatedAt: now };
    state.comidas.push(c);
  }
  persist();
  $$('dialog[open]').forEach(d => closeSheet(d));
  const despuesEst = semana(c.fecha).estados, despues = dia(c.fecha), estado = despuesEst[c.id];
  const otraExcedida = Object.keys(despuesEst).find(id => id !== c.id && despuesEst[id] === 'excedido' && antesEst[id] !== 'excedido');
  if (despues.estrella && !antes.estrella) { ui.pop = true; }
  render();
  const POS = ['Bien ahí.', 'Una más cumplida.', 'Así se hace.', 'Firme.', 'Eso es comer bien.'];
  if (despues.estrella && !antes.estrella) toast('⭐ ¡Día cumplido! Una estrella más.', { star: true, ms: 4500 });
  else if (c.comida === 'extra') toast('Anotado. Lo importante es que lo cargaste. Ahora: no, gracias.');
  else if (otraExcedida) { const o2 = byId(otraExcedida); toast('Anotado. Con esta, ' + (o2.tipo === 'libre' ? 'el libre' : 'el con carbo') + ' que cargaste ' + (o2.fecha === hoy() ? 'hoy' : 'el ' + fechaDia(o2.fecha).toLowerCase()) + ' queda sin cupo: ese día no suma estrella.', { ms: 5500 }); }
  else if (estado === 'ok') toast(c.tipo === 'nada' ? 'Listo.' : POS[Math.floor(Math.random() * POS.length)]);
  else if (estado === 'excedido') toast('Anotado. Ese cupo ya estaba usado esta semana: hoy no suma estrella.', { ms: 4500 });
  else if (estado === 'nada') toast('Anotado. Ari pide las 4 comidas.');
  else toast('Anotado. Mañana se arranca firme otra vez.');
  queueSync();
}
function borrarComida(id) {
  const c = byId(id); if (!c) return;
  state.comidas = state.comidas.filter(x => x.id !== id);
  if (c._sy || c._rid) state.tombs.push({ id, rid: c._rid, at: Date.now() });
  persist(); render(); queueSync();
  toast('Comida borrada', { action: 'Deshacer', onAction: () => {
    state.tombs = state.tombs.filter(t => t.id !== id);
    c.updatedAt = Date.now(); c._sy = 0; state.comidas.push(c);
    persist(); render(); queueSync();
  } });
}

/* ---------- Pesarme ---------- */
function openPeso() {
  const ps = pesosOrd(), ult = ps[ps.length - 1];
  $('#pesoErr').textContent = '';
  $('#pesoBody').innerHTML = '<div class="q"><div class="field field--big"><label class="field__l" for="p_kg">Kilos</label><input id="p_kg" type="text" inputmode="decimal" placeholder="' + (ult ? fmtKg(ult.kg) : '84,0') + '" enterkeyhint="done" autocomplete="off"></div>' +
    '<div class="field" style="margin-top:14px"><label class="field__l" for="p_fecha">Fecha</label><input id="p_fecha" type="date" value="' + hoy() + '" max="' + hoy() + '"></div>' +
    (ult ? '<p class="note" style="margin-top:14px">Última pesada: <b>' + fmtKg(ult.kg) + ' kg</b> el ' + fechaCorta(ult.fecha) + '.</p>' : '') + '</div>';
  openSheet($('#pesoSheet'));
  setTimeout(() => { const i = $('#p_kg'); if (i) i.focus(); }, 350);
}
function guardarPeso() {
  const kg = Math.round(parseFloat(String($('#p_kg').value).replace(',', '.')) * 10) / 10, fecha = $('#p_fecha').value;
  if (!(kg >= 30 && kg <= 300)) { $('#pesoErr').textContent = 'Poné los kilos, por ejemplo 84,5.'; return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha > hoy()) { $('#pesoErr').textContent = 'Revisá la fecha.'; return; }
  const ps = pesosOrd(), ant = ps.filter(p => p.fecha < fecha).pop(), now = Date.now();
  let p = state.pesos.find(x => x.fecha === fecha);
  if (p) Object.assign(p, { kg, updatedAt: now }); else { p = { id: uid(), fecha, kg, createdAt: now, updatedAt: now }; state.pesos.push(p); }
  persist(); closeSheet($('#pesoSheet')); render(); queueSync();
  const obj = objetivo(), falta = Math.round((kg - obj) * 10) / 10;
  if (falta <= 0) toast('⭐ ' + fmtKg(kg) + ' kg. ¡Llegaste al objetivo!', { star: true, ms: 5000 });
  else if (ant && kg < ant.kg) toast('Bajaste ' + fmtKg(ant.kg - kg) + ' kg. Faltan ' + fmtKg(falta) + ' para ' + obj + '.', { ms: 4500 });
  else toast('Anotado: ' + fmtKg(kg) + ' kg. Faltan ' + fmtKg(falta) + ' para ' + obj + '.', { ms: 4500 });
}
function borrarPeso(id) {
  const p = state.pesos.find(x => x.id === id); if (!p) return;
  state.pesos = state.pesos.filter(x => x.id !== id);
  if (p._sy || p._rid) state.pesoTombs.push({ id, rid: p._rid, at: Date.now() });
  persist(); render(); queueSync();
  toast('Pesada borrada', { action: 'Deshacer', onAction: () => { state.pesoTombs = state.pesoTombs.filter(t => t.id !== id); p.updatedAt = Date.now(); p._sy = 0; state.pesos.push(p); persist(); render(); queueSync(); } });
}

/* ---------- IA ---------- */
const IA_MSG = {
  'sin-ia': 'Falta la clave de IA en Vercel.', 'ia-clave': 'La clave de IA no anda. Revisala en Vercel.', 'ia-ocupada': 'La IA está ocupada. Probá en un ratito.',
  'ia-red': 'Sin conexión.', 'red': 'Sin conexión.', 'ia': 'La IA no pudo responder. Probá de nuevo.', 'clave': 'Conectá el respaldo en Ajustes para usar esto.',
  'sin-configurar': 'Falta configurar el respaldo en Vercel.', 'sin-api': 'La IA no está disponible acá.', 'pedido': 'No entendí el pedido.'
};
const iaOn = () => ui.ia && sync.on;
const localTz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } };
async function ia(body) {
  let r, j = null;
  try {
    r = await fetch('/api/dieta', { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'X-Clave': encodeURIComponent(lsGet(CLAVE_KEY)) }, body: JSON.stringify(Object.assign({ tz: localTz() }, body)) });
  } catch (e) { const er = new Error('red'); er.code = 'red'; throw er; }
  try { j = await r.json(); } catch (e) { j = null; }
  if (!r.ok || !j || !j.ok) { const er = new Error('ia'); er.code = (j && j.error) || (r.status === 404 ? 'sin-api' : 'ia'); throw er; }
  return j;
}
const iaMsg = e => IA_MSG[e && e.code] || IA_MSG.ia;
function ultimasTexto(dias) {
  const out = [];
  for (let i = 0; i < (dias || 5); i++) {
    const f = Plan.sumarDias(hoy(), -i), cs = comidasDe(f);
    if (!cs.length) continue;
    out.push(fechaRel(f) + ': ' + cs.map(c => nombreDe(c.comida).toLowerCase() + ' ' + (c.que ? '«' + c.que + '»' : '') + ' (' + tipoCorto(c).toLowerCase() + ')').join('; '));
  }
  return out.join('\n');
}
function datosTexto() {
  const h = hoy(), ps = pesosOrd(), L = [];
  L.push('Objetivo: ' + objetivo() + ' kg. Inicio del plan: ' + fechaCorta(inicio()) + '. Plazo: hasta el ' + fechaCorta(limite()) + ' (quedan ' + Plan.diasEntre(h, limite()) + ' días).');
  L.push('Pesos: ' + (ps.length ? ps.map(p => fechaCorta(p.fecha) + ' ' + fmtKg(p.kg) + ' kg').join(', ') : 'todavía no se pesó') + '.');
  L.push('Racha: ' + Plan.racha(state.comidas, h) + ' días seguidos con estrella. Estrellas desde el inicio: ' + Plan.estrellas(state.comidas, inicio() < h ? inicio() : h, h) + '.');
  const ev = semana(h);
  L.push('Cupos de esta semana (desde el lunes ' + fechaCorta(ev.lunes) + '): ' + ['almuerzo', 'cena'].map(cid => nombreDe(cid) + ' ' + ev.cupos[cid].map(c => c.nombre.toLowerCase() + ' ' + c.usado + ' de ' + c.cupo + ' usados').join(', ')).join('; ') + '.');
  L.push('Comidas de los últimos 21 días:');
  for (let i = 0; i < 21; i++) {
    const f = Plan.sumarDias(h, -i), d = dia(f), cs = comidasDe(f);
    if (!cs.length && f !== h) continue;
    L.push('- ' + fechaDia(f) + ': ' + (cs.length ? cs.map(c => nombreDe(c.comida).toLowerCase() + (c.que ? ' «' + c.que + '»' : '') + ' [' + tipoCorto(c).toLowerCase() + (semana(f).estados[c.id] === 'excedido' ? ', cupo ya usado' : '') + ']').join('; ') : 'sin cargar') + (d.estrella ? ' → estrella' : d.fallas.length ? ' → sin estrella' : ''));
  }
  return L.join('\n');
}

/* ¿Qué como? */
function openIdeas(cid) {
  ui.ideasComida = cid || Plan.comidaAhora(new Date().getHours());
  if (ui.ideasComida === 'extra') ui.ideasComida = 'cena';
  ui.ideasSemilla = Math.floor(Math.random() * 100000); ui.ideasIa = null;
  renderIdeas(); openSheet($('#ideasSheet'));
}
function segHtml(actual, attr) {
  return '<div class="seg" role="radiogroup" aria-label="Comida">' + Plan.COMIDAS.filter(c => c.id !== 'extra').map(c => '<button type="button" role="radio" aria-checked="' + (actual === c.id) + '" data-' + attr + '="' + c.id + '">' + esc(c.nombre) + '</button>').join('') + '</div>';
}
function cupolineHtml(cid) {
  if (cid !== 'almuerzo' && cid !== 'cena') return '';
  const ev = semana(hoy());
  return '<p class="cupoline">Esta semana te quedan: ' + ev.cupos[cid].map(c => { const q = Math.max(0, c.cupo - c.usado); return '<b>' + esc(c.nombre.toLowerCase()) + ' ' + q + '</b>'; }).join(' · ') + '.</p>';
}
function ideaHtml(x, cid) {
  return '<li class="idea"><span class="idea__t">' + esc(cap(x.titulo)) + '</span><span class="idea__d">' + esc(x.detalle) + '</span><span class="idea__a">' + tag(x.tipo, x.tipo === 'plan' ? 'Plan' : x.tipo === 'carbo' ? 'Con carbo' : 'Libre') + '<button type="button" class="chip--btn" data-cargar-idea data-tipo="' + x.tipo + '" data-que="' + esc(cap(x.titulo)) + '" data-comida="' + cid + '">Cargar</button></span></li>';
}
function renderIdeas(busy) {
  const cid = ui.ideasComida;
  const lista = ui.ideasIa ? ui.ideasIa.sugerencias : Plan.ideas(cid, ui.ideasSemilla);
  let html = segHtml(cid, 'ideas-comida') + cupolineHtml(cid);
  html += '<ul class="ideas">' + lista.map(x => ideaHtml(x, cid)).join('') + '</ul>';
  if (ui.ideasIa && ui.ideasIa.nota) html += '<p class="ai__nota" style="margin-top:10px">' + esc(ui.ideasIa.nota) + '</p>';
  html += '<div class="chips chips--acts">' + (ui.ideasIa ? '<button type="button" class="chip--btn" data-ideas-local>Volver a las ideas de siempre</button>' : '<button type="button" class="chip--btn" data-otras-ideas>Otras ideas</button>') + '</div>';
  html += '<div class="ai"><div class="ai__k">' + icon('sparkles') + 'Pedirle ideas a la IA</div>';
  if (iaOn()) {
    html += '<input class="q__input" id="i_pedido" type="text" placeholder="¿Tenés algo en la heladera o ganas de algo?" autocapitalize="sentences" enterkeyhint="send" maxlength="300" value="' + esc(ui.ideasPedido || '') + '">' +
      '<button type="button" class="btn btn--secondary btn--block" data-ideas-ia' + (busy ? ' disabled' : '') + '>' + icon('sparkles') + (busy ? 'Pensando…' : 'Dame ideas') + '</button>' +
      '<p class="note">Siempre dentro del plan de Ari, mirando lo que comiste estos días y los cupos que te quedan.</p>';
  } else {
    html += '<p class="note">' + (sync.on ? 'La IA no está disponible ahora.' : 'Conectá el respaldo en Ajustes (la misma clave que usás en Pendientes) y vas a poder pedirle ideas a la IA con lo que tengas en la heladera.') + '</p>';
  }
  html += '</div>';
  $('#ideasBody').innerHTML = html;
}
async function pedirIdeas() {
  const inp = $('#i_pedido'); ui.ideasPedido = inp ? inp.value.trim() : '';
  renderIdeas(true);
  try {
    const r = await ia({ accion: 'sugerir', comida: ui.ideasComida, pedido: ui.ideasPedido, semana: semana(hoy()).cupos, ultimas: ultimasTexto(5) });
    if (!r.sugerencias || !r.sugerencias.length) throw new Error('ia');
    ui.ideasIa = r;
  } catch (e) { toast(iaMsg(e)); }
  renderIdeas(false);
}

/* ¿Esto va? */
function openCheck(cid) {
  ui.checkComida = cid || Plan.comidaAhora(new Date().getHours());
  if (ui.checkComida === 'extra') ui.checkComida = 'cena';
  ui.checkRes = null; ui.checkTexto = '';
  renderCheck(); openSheet($('#checkSheet'));
}
function renderCheck(busy) {
  const cid = ui.checkComida;
  let html = segHtml(cid, 'check-comida') + cupolineHtml(cid);
  if (iaOn()) {
    html += '<div class="q"><label class="q__label" for="c_texto">¿Qué querés comer?<small>Decilo como sea: «milanesa con puré», «sushi», «una tostada con queso».</small></label>' +
      '<input class="q__input" id="c_texto" type="text" value="' + esc(ui.checkTexto || '') + '" placeholder="Milanesa con puré" autocapitalize="sentences" enterkeyhint="send" maxlength="400"></div>' +
      '<div class="actions" style="margin-top:14px"><button type="button" class="btn btn--primary btn--block" data-check-ia' + (busy ? ' disabled' : '') + '>' + (busy ? 'Pensando…' : 'Preguntar') + '</button></div>';
    const r = ui.checkRes;
    if (r) {
      html += '<div class="verdict ' + (r.va ? 'is-ok' : 'is-no') + '"><div class="verdict__h">' + icon(r.va ? 'check' : 'x') + '<span>' + (r.va ? 'Va' : 'No va') + '</span>' + tag(r.tipo, r.tipo === 'plan' ? 'Plan' : r.tipo === 'carbo' ? 'Con carbo' : r.tipo === 'libre' ? 'Libre' : 'Fuera del plan') + '</div>' +
        '<p class="verdict__t">' + esc(r.veredicto) + '</p>' + (r.alternativa ? '<p class="verdict__alt"><b>Mejor así:</b> ' + esc(r.alternativa) + '</p>' : '') +
        '<div class="chips chips--acts" style="margin-top:4px">' + (r.va ? '<button type="button" class="chip--btn" data-cargar-idea data-comida="' + cid + '" data-tipo="' + r.tipo + '" data-que="' + esc(ui.checkTexto) + '">Cargarlo así</button>' : '') +
        (r.alternativa ? '<button type="button" class="chip--btn" data-cargar-idea data-comida="' + cid + '" data-tipo="plan" data-que="' + esc(r.alternativa) + '">Cargar la alternativa</button>' : '') + '</div></div>';
    }
  } else {
    html += '<p class="note" style="margin-top:16px">' + (sync.on ? 'La IA no está disponible ahora. Mientras tanto, la regla: proteína y vegetales va siempre; con carbo y libre solo si queda cupo; postres, frutas y extras no van.' : 'Para preguntar hace falta la IA: conectá el respaldo en Ajustes con la misma clave que usás en Pendientes.') + '</p>';
  }
  $('#checkBody').innerHTML = html;
}
async function preguntarCheck() {
  const inp = $('#c_texto'); ui.checkTexto = inp ? inp.value.trim() : '';
  if (!ui.checkTexto) { toast('Escribí qué querés comer.'); return; }
  renderCheck(true);
  try { ui.checkRes = await ia({ accion: 'evaluar', comida: ui.checkComida, texto: ui.checkTexto, semana: semana(hoy()).cupos }); }
  catch (e) { toast(iaMsg(e)); }
  renderCheck(false);
}

/* Preguntale a la dieta */
const PREGUNTAS = ['¿Cómo vengo esta semana?', '¿Qué me conviene cenar hoy?', '¿Cuánto bajé desde que arranqué?', '¿Qué me queda de permitidos?'];
function openAsk() {
  $('#askAnswer').innerHTML = '';
  $('#askChips').innerHTML = PREGUNTAS.map(q => '<button type="button" class="chip--btn" data-q="' + esc(q) + '">' + esc(q) + '</button>').join('');
  openSheet($('#askSheet'));
}
async function preguntar(q) {
  q = (q || $('#askInput').value).trim();
  if (!q) return;
  $('#askInput').value = q;
  $('#askAnswer').innerHTML = '<div class="ask__q">' + esc(q) + '</div><div class="ask__a is-busy">Pensando…</div>';
  try { const r = await ia({ accion: 'preguntar', pregunta: q, datos: datosTexto() }); $('#askAnswer').innerHTML = '<div class="ask__q">' + esc(q) + '</div><div class="ask__a">' + esc(r.respuesta) + '</div>'; }
  catch (e) { $('#askAnswer').innerHTML = '<div class="ask__q">' + esc(q) + '</div><div class="ask__a is-err">' + esc(iaMsg(e)) + '</div>'; }
}

/* ---------- El plan de Ari ---------- */
function openPlan() {
  $('#planBody').innerHTML = '<div class="plan"><h3>La alimentación</h3><ul>' + Plan.PLAN_TEXTO.map(l => '<li>' + esc(l) + '</li>').join('') + '</ul>' +
    '<h3>Para la cabeza</h3><ul class="frases">' + Plan.FRASES.map(f => '<li>' + esc(f) + '</li>').join('') + '</ul>' +
    '<h3>Las estrellas</h3><p>Un día gana la estrella cuando el desayuno, el almuerzo y la cena están cargados y dentro del plan, la merienda (si la cargaste) también, y no hubo extras. Los «con carbo» y los «libres» cuentan por semana, de lunes a domingo; si ya usaste el cupo, el siguiente no suma.</p></div>';
  openSheet($('#planSheet'));
}

/* ---------- Ajustes ---------- */
function syncBoxHtml() {
  if (sync.on) {
    const hace = sync.last ? Math.round((Date.now() - sync.last) / 60000) : null;
    const est = sync.busy ? 'Guardando…' : sync.err ? ({ red: 'Sin conexión. Se guarda acá y sube cuando vuelva.', token: 'El token de Airtable no anda. Revisalo en Vercel.', base: 'No encuentro la base en Airtable.', campos: 'Airtable no aceptó los datos.', limite: 'Airtable está ocupado. Vuelve a probar solo.', 'sin-api': 'Acá no hay respaldo (no es Vercel).', 'sin-configurar': 'Falta configurar el respaldo en Vercel.' }[sync.err] || 'No se pudo guardar en Airtable.') : 'Conectado' + (hace !== null ? ' · última copia ' + (hace < 1 ? 'recién' : hace < 60 ? 'hace ' + hace + ' min' : 'hace ' + Math.round(hace / 60) + ' h') : '');
    return '<div class="sync-status ' + (sync.err ? 'is-err' : 'is-ok') + '">' + icon(sync.err ? 'alert' : 'check') + '<span>' + esc(est) + '</span></div>' +
      '<div class="actions" style="margin-top:4px"><button type="button" class="btn btn--secondary btn--block" data-sync-now>' + icon('refresh') + 'Sincronizar ahora</button><button type="button" class="btn btn--danger btn--block" data-sync-off>Desconectar</button></div>' +
      '<p class="set__note">Tus comidas y pesadas quedan en la base «Pendientes» de Airtable (tablas Comidas y Peso), y la IA de ideas se activa con esta clave.</p>';
  }
  return '<p class="set__note">Con la misma clave que usás en Pendientes, lo que cargás se guarda en Airtable y se activa la IA (ideas y «¿Esto va?»). Sin clave, la app anda igual, solo en este teléfono.</p>' +
    '<label class="field" for="s_clave"><span class="field__l">Clave</span><input id="s_clave" type="password" autocomplete="current-password" enterkeyhint="go"></label>' +
    '<button type="button" class="btn btn--primary btn--block" data-sync-on>Conectar</button>' + (sync.err === 'clave' ? '<p class="form-err">La clave no coincide.</p>' : '');
}
function renderSettings() {
  const t = lsGet(THEME_KEY) || 'auto';
  $('#settingsBody').innerHTML =
    '<details class="set" open><summary>Respaldo e IA ' + icon('chevR') + '</summary><div class="set__body" id="syncBox">' + syncBoxHtml() + '</div></details>' +
    '<details class="set"><summary>Objetivo y fechas ' + icon('chevR') + '</summary><div class="set__body">' +
    '<label class="field"><span class="field__l">Objetivo (kg)</span><input id="s_obj" type="text" inputmode="decimal" value="' + String(objetivo()).replace('.', ',') + '" autocomplete="off"></label>' +
    '<label class="field"><span class="field__l">Empezaste el plan el</span><input id="s_inicio" type="date" value="' + inicio() + '" max="' + hoy() + '"></label>' +
    '<p class="set__note">El plazo es un mes desde ese día: el pesaje es el ' + fechaCorta(limite()) + '.</p></div></details>' +
    '<button type="button" class="set set--btn" data-plan>' + icon('book') + 'El plan de Ari</button>' +
    '<button type="button" class="set set--btn" data-go-peso>' + icon('scale') + 'Peso (para el pesaje de fin de mes)</button>' +
    '<div class="set set--row"><span>Aspecto</span><div class="seg3" role="radiogroup" aria-label="Aspecto"><button type="button" role="radio" aria-checked="' + (t === 'auto') + '" data-theme="auto">Auto</button><button type="button" role="radio" aria-checked="' + (t === 'light') + '" data-theme="light">Claro</button><button type="button" role="radio" aria-checked="' + (t === 'dark') + '" data-theme="dark">Oscuro</button></div></div>' +
    '<button type="button" class="set set--btn" data-export>' + icon('download') + 'Guardar una copia (.json)</button>' +
    '<button type="button" class="set set--btn" data-import>' + icon('upload') + 'Restaurar una copia</button>' +
    '<button type="button" class="set set--btn set--danger" data-wipe>' + icon('trash') + 'Borrar todo</button>' +
    '<p class="set__note" style="padding-top:14px">Para tenerla como app en el iPhone: en Safari, Compartir → «Agregar a inicio».</p>';
}
function renderSyncBox() { const b = $('#syncBox'); if (b && !(document.activeElement && document.activeElement.id === 's_clave')) b.innerHTML = syncBoxHtml(); }
async function connectSync() {
  const inp = $('#s_clave'), v = inp ? inp.value.trim() : '';
  if (!v) { toast('Escribí la clave.'); return; }
  lsSet(CLAVE_KEY, v); sync.on = true; sync.err = null;
  state.comidas.forEach(c => { c._sy = 0; delete c._rid; }); state.pesos.forEach(p => { p._sy = 0; delete p._rid; }); state.ajustesSy = 0; state.ajustesAt = state.ajustesAt || Date.now();
  persist(); renderSyncBox(); renderSyncUi();
  await runSync(true);
  if (sync.on) { toast('Respaldo conectado.'); pingIa(); } 
  renderSyncBox(); render();
}
function disconnectSync() {
  sync.on = false; sync.err = null; lsSet(CLAVE_KEY, ''); lsSet(LAST_KEY, ''); sync.last = 0; ui.ia = false;
  renderSyncBox(); renderSyncUi(); render();
}
function exportar() {
  const blob = new Blob([JSON.stringify({ app: 'dieta', version: 1, exportado: new Date().toISOString(), comidas: state.comidas, pesos: state.pesos, ajustes: state.ajustes }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'dieta-' + hoy() + '.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function importar(file) {
  const rd = new FileReader();
  rd.onload = () => {
    let j = null; try { j = JSON.parse(rd.result); } catch (e) { j = null; }
    if (!j || !Array.isArray(j.comidas)) { toast('Ese archivo no es una copia de Dieta.'); return; }
    const now = Date.now();
    j.comidas.forEach(c => { if (!c || !c.id || !c.fecha || !c.comida) return; const l = byId(c.id); const n = { id: c.id, fecha: c.fecha, comida: c.comida, tipo: c.tipo, que: String(c.que || ''), hora: String(c.hora || ''), createdAt: c.createdAt || now, updatedAt: now }; if (l) Object.assign(l, n, { _sy: 0 }); else state.comidas.push(n); });
    (j.pesos || []).forEach(p => { if (!p || !p.id || !p.fecha || !(p.kg > 0)) return; const l = state.pesos.find(x => x.id === p.id); const n = { id: p.id, fecha: p.fecha, kg: Number(p.kg), createdAt: p.createdAt || now, updatedAt: now }; if (l) Object.assign(l, n, { _sy: 0 }); else state.pesos.push(n); });
    if (j.ajustes && typeof j.ajustes === 'object') { state.ajustes = Object.assign(state.ajustes, j.ajustes); state.ajustesAt = now; }
    persist(); render(); queueSync(); toast('Copia restaurada.');
  };
  rd.readAsText(file);
}
function wipe() {
  if (!confirm('¿Borrar todas las comidas y pesadas de este teléfono' + (sync.on ? ' y del respaldo' : '') + '? No se puede deshacer.')) return;
  const now = Date.now();
  state.comidas.forEach(c => { if (c._rid || c._sy) state.tombs.push({ id: c.id, rid: c._rid, at: now }); });
  state.pesos.forEach(p => { if (p._rid || p._sy) state.pesoTombs.push({ id: p.id, rid: p._rid, at: now }); });
  state.comidas = []; state.pesos = [];
  persist(); render(); queueSync(); toast('Todo borrado.');
}

/* ---------- Respaldo en Airtable ---------- */
const AT = {
  C: { que: 'flddTZbEV9Td45abs', fecha: 'fldN05RuxFWnmqbRc', comida: 'fld0pmDejT8PLBBsj', tipo: 'fldkXAvUuAeOdnbAk', hora: 'fldxnIUPrkH27sRfP', notas: 'fldpF2lGNvZE9p17p', deleted: 'fldppPmHxiO1xQXVf', id: 'fld5odv4a76csI2xZ', createdAt: 'fldsuws5mjzlZr8jQ', updatedAt: 'fldUwG4k2PY7XgD3j' },
  W: { fecha: 'fldplC5JDCk9Ufe5d', kg: 'fldNobmS2DvCJ69Jr', notas: 'fldfG7DKjI1Q9oHkB', deleted: 'fldJ0GpJPb9jC7QOI', id: 'fldCSK0bbgVun6Kw5', createdAt: 'flduXz5taz4SGq18x', updatedAt: 'fldi6R3mP1wSOIgVq' },
  A: { key: 'fldstgTm03EQOalcw', value: 'fldxCu4LteLCoAW1W', updatedAt: 'fldDu7pTNb9iNeThq' }
};
const invertir = o => { const r = {}; Object.keys(o).forEach(k => { r[o[k]] = k; }); return r; };
const TIPO_DE = invertir(Plan.TIPO_AT), COMIDA_DE = invertir(Plan.COMIDA_AT);
const sync = { on: !!lsGet(CLAVE_KEY), busy: false, again: null, last: Number(lsGet(LAST_KEY)) || 0, pulled: 0, err: null, timer: null };
const iso = ms => (ms ? new Date(ms).toISOString() : null);
const dirty = x => !x._sy || (x.updatedAt || 0) > x._sy;
const cHash = f => [AT.C.que, AT.C.fecha, AT.C.comida, AT.C.tipo, AT.C.hora].map(k => (f[k] == null ? '' : String(f[k]))).join('\u0001');
const wHash = f => [AT.W.fecha, AT.W.kg].map(k => (f[k] == null ? '' : String(f[k]))).join('\u0001');
function comidaFields(c) {
  const C = AT.C, f = {}, t = Plan.tipo(c.comida, c.tipo);
  f[C.que] = c.que || (t ? t.nombre : ''); f[C.fecha] = c.fecha; f[C.comida] = Plan.COMIDA_AT[c.comida] || 'Extra'; f[C.tipo] = Plan.TIPO_AT[c.tipo] || 'Me salí'; f[C.hora] = c.hora || '';
  f[C.deleted] = false; f[C.id] = c.id; f[C.createdAt] = iso(c.createdAt || Date.now()); f[C.updatedAt] = iso(c.updatedAt || Date.now());
  return f;
}
function comidaFromRecord(r, base) {
  const C = AT.C, f = r.fields || {};
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(String(f[C.fecha] || '')) ? f[C.fecha] : null;
  const comida = COMIDA_DE[String(f[C.comida] || '').trim()];
  if (!fecha || !comida) return null;
  let tipo = TIPO_DE[String(f[C.tipo] || '').trim()];
  if (comida === 'extra') tipo = 'nova';
  if (!Plan.tipo(comida, tipo)) tipo = 'nova';
  const t = Plan.tipo(comida, tipo);
  let que = String(f[C.que] || '').trim();
  if (t && que === t.nombre) que = '';
  const hm = /^(\d{1,2}):(\d{2})/.exec(String(f[C.hora] || '').trim());
  return Object.assign({}, base || {}, {
    id: f[C.id] || (base && base.id) || uid(), fecha, comida, tipo, que: que.slice(0, 200), hora: hm ? pad(+hm[1]) + ':' + hm[2] : '',
    createdAt: Date.parse(f[C.createdAt]) || Date.parse(r.creado) || (base && base.createdAt) || Date.now(),
    updatedAt: Date.parse(f[C.updatedAt]) || (base && base.updatedAt) || 0, _rid: r.rid
  });
}
function pesoFields(p) {
  const W = AT.W, f = {};
  f[W.fecha] = p.fecha; f[W.kg] = Number(p.kg); f[W.deleted] = false; f[W.id] = p.id; f[W.createdAt] = iso(p.createdAt || Date.now()); f[W.updatedAt] = iso(p.updatedAt || Date.now());
  return f;
}
function pesoFromRecord(r, base) {
  const W = AT.W, f = r.fields || {};
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(String(f[W.fecha] || '')) ? f[W.fecha] : null, kg = Number(f[W.kg]);
  if (!fecha || !(kg >= 30 && kg <= 300)) return null;
  return Object.assign({}, base || {}, { id: f[W.id] || (base && base.id) || uid(), fecha, kg: Math.round(kg * 10) / 10,
    createdAt: Date.parse(f[W.createdAt]) || Date.parse(r.creado) || (base && base.createdAt) || Date.now(), updatedAt: Date.parse(f[W.updatedAt]) || (base && base.updatedAt) || 0, _rid: r.rid });
}
/* mezcla genérica: lo de allá entra si acá no hay cambios sin subir; lo borrado allá se borra acá */
function mergeLista(rows, lista, tombs, K, desde, hash, setHash) {
  const seen = new Set(), tombIds = new Set(tombs.map(t => t.id));
  let changed = false;
  rows.forEach(r => {
    const f = r.fields || {}, id = f[K.id], h = hash(f), deleted = !!f[K.deleted], rAt = Date.parse(f[K.updatedAt]) || 0;
    if (!id) {
      if (deleted) return;
      const it = desde(r); if (!it) return;
      it.updatedAt = Date.now(); it._sy = 0; setHash(it, h); lista.push(it); seen.add(it.id); changed = true;
      return;
    }
    seen.add(id);
    if (tombIds.has(id)) return;
    const local = lista.find(x => x.id === id);
    if (!local) {
      if (deleted) return;
      const it = desde(r); if (!it) return;
      it._sy = it.updatedAt; setHash(it, h); lista.push(it); changed = true;
      return;
    }
    local._rid = r.rid;
    const d = dirty(local);
    if (deleted) { if (!d || rAt >= (local.updatedAt || 0)) { lista.splice(lista.indexOf(local), 1); changed = true; } return; }
    if (h === local._h) return;
    if (!d || rAt > (local.updatedAt || 0)) {
      const it = desde(r, local); if (!it) return;
      it.updatedAt = Math.max(rAt, local.updatedAt || 0); it._sy = it.updatedAt; setHash(it, h);
      lista[lista.indexOf(local)] = it; changed = true;
    }
  });
  lista.slice().forEach(it => {
    if (!it._sy || seen.has(it.id)) return;
    if (dirty(it)) { delete it._rid; it._sy = 0; } else { lista.splice(lista.indexOf(it), 1); changed = true; }
  });
  return changed;
}
function mergeAjustes(rows) {
  const A = AT.A, row = (rows || []).find(r => r.fields && r.fields[A.key] === 'dieta');
  if (!row) { if ((state.ajustesAt || 0) <= (state.ajustesSy || 0)) state.ajustesAt = Math.max(Date.now(), (state.ajustesSy || 0) + 1); return false; }
  state._ajustesRid = row.rid;
  const at = Date.parse(row.fields[A.updatedAt]) || 0;
  let v = null; try { v = JSON.parse(row.fields[A.value] || '{}'); } catch (e) { v = null; }
  if (!v || typeof v !== 'object') return false;
  const localDirty = (state.ajustesAt || 0) > (state.ajustesSy || 0) && state.ajustesSy;
  if (localDirty || at <= (state.ajustesSy || 0)) return false;
  if (typeof v.objetivo === 'number' && v.objetivo > 0) state.ajustes.objetivo = v.objetivo;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v.inicio || '')) state.ajustes.inicio = v.inicio;
  if (typeof v.nombre === 'string') state.ajustes.nombre = v.nombre;
  state.ajustesAt = state.ajustesSy = at;
  return true;
}
function mergeRemote(data) {
  const setH = (it, h) => { it._h = h; };
  let changed = mergeLista(data.comidas || [], state.comidas, state.tombs, AT.C, comidaFromRecord, cHash, setH);
  changed = mergeLista(data.pesos || [], state.pesos, state.pesoTombs, AT.W, pesoFromRecord, wHash, setH) || changed;
  changed = mergeAjustes(data.ajustes || []) || changed;
  return changed;
}
async function api(method, body, keepalive) {
  let r, j = null;
  const payload = body ? JSON.stringify(body) : undefined;
  try {
    r = await fetch('/api/dieta', { method, cache: 'no-store', keepalive: !!(keepalive && payload && payload.length < 60000), headers: { 'Content-Type': 'application/json', 'X-Clave': encodeURIComponent(lsGet(CLAVE_KEY)) }, body: payload });
  } catch (e) { const er = new Error('red'); er.code = 'red'; throw er; }
  try { j = await r.json(); } catch (e) { j = null; }
  if (!r.ok || !j) { const er = new Error('api'); er.code = (j && j.error) || (r.status === 404 ? 'sin-api' : 'red'); throw er; }
  return j;
}
async function pushDirty(keepalive) {
  const C = AT.C, W = AT.W, A = AT.A;
  const comidas = state.comidas.filter(dirty), pesos = state.pesos.filter(dirty);
  const ajustesDirty = (state.ajustesAt || 0) > (state.ajustesSy || 0);
  if (!comidas.length && !pesos.length && !state.tombs.length && !state.pesoTombs.length && !ajustesDirty) return false;
  const sentC = {}, sentW = {};
  const filasC = comidas.map(c => { sentC[c.id] = c.updatedAt || 0; return { rid: c._rid || undefined, fields: comidaFields(c) }; })
    .concat(state.tombs.map(t => { const f = {}; f[C.id] = t.id; f[C.deleted] = true; f[C.updatedAt] = iso(t.at); return { rid: t.rid || undefined, fields: f }; }));
  const filasW = pesos.map(p => { sentW[p.id] = p.updatedAt || 0; return { rid: p._rid || undefined, fields: pesoFields(p) }; })
    .concat(state.pesoTombs.map(t => { const f = {}; f[W.id] = t.id; f[W.deleted] = true; f[W.updatedAt] = iso(t.at); return { rid: t.rid || undefined, fields: f }; }));
  const ajustes = [];
  const ajustesAt = state.ajustesAt || 0;
  if (ajustesDirty) { const f = {}; f[A.key] = 'dieta'; f[A.value] = JSON.stringify({ objetivo: objetivo(), inicio: inicio(), nombre: state.ajustes.nombre || 'Ale', tz: localTz() }); f[A.updatedAt] = iso(ajustesAt); ajustes.push({ rid: state._ajustesRid, fields: f }); }
  const CHUNK = 150;
  const n = Math.max(1, Math.ceil(Math.max(filasC.length, filasW.length) / CHUNK));
  for (let i = 0; i < n; i++) {
    const res = await api('POST', { comidas: filasC.slice(i * CHUNK, (i + 1) * CHUNK), pesos: filasW.slice(i * CHUNK, (i + 1) * CHUNK), ajustes: i === 0 ? ajustes : [] }, keepalive);
    (res.comidas || []).forEach(r => {
      const f = r.fields || {}, id = f[C.id]; if (!id) return;
      if (f[C.deleted]) { state.tombs = state.tombs.filter(t => t.id !== id); return; }
      const c = byId(id); if (!c) return;
      c._rid = r.rid; c._h = cHash(f); if (sentC[id] !== undefined) c._sy = Math.max(c._sy || 0, sentC[id]);
    });
    (res.pesos || []).forEach(r => {
      const f = r.fields || {}, id = f[W.id]; if (!id) return;
      if (f[W.deleted]) { state.pesoTombs = state.pesoTombs.filter(t => t.id !== id); return; }
      const p = state.pesos.find(x => x.id === id); if (!p) return;
      p._rid = r.rid; p._h = wHash(f); if (sentW[id] !== undefined) p._sy = Math.max(p._sy || 0, sentW[id]);
    });
    if (i === 0 && ajustesDirty) { state.ajustesSy = ajustesAt; const r = (res.ajustes || [])[0]; if (r) state._ajustesRid = r.rid; }
    persist();
  }
  return true;
}
async function runSync(full, keepalive) {
  if (!sync.on) return;
  if (sync.busy) { if (full || !sync.again) sync.again = full ? 'full' : 'push'; return; }
  sync.busy = true; renderSyncUi();
  try {
    if (full) {
      const data = await api('GET');
      sync.pulled = Date.now();
      if (mergeRemote(data)) { persist(); render(); }
    }
    await pushDirty(keepalive);
    sync.last = Date.now(); lsSet(LAST_KEY, String(sync.last)); sync.err = null;
  } catch (e) {
    sync.err = e && e.code ? e.code : 'red';
    if (sync.err === 'clave') { sync.on = false; lsSet(CLAVE_KEY, ''); ui.ia = false; render(); }
  } finally {
    sync.busy = false; renderSyncUi(); renderSyncBox();
    const again = sync.again; sync.again = null;
    if (again && sync.on) setTimeout(() => runSync(again === 'full'), 400);
  }
}
function queueSync() { if (!sync.on) return; clearTimeout(sync.timer); sync.timer = setTimeout(() => runSync(false), 800); }
function renderSyncUi() {
  const b = $('#btnSync'); if (!b) return;
  b.hidden = !sync.on;
  b.className = 'icon-btn sync-btn' + (sync.busy ? ' is-busy' : sync.err ? ' is-err' : ' is-ok');
  b.innerHTML = icon(sync.err && !sync.busy ? 'alert' : 'cloud');
  b.setAttribute('aria-label', sync.busy ? 'Guardando en Airtable' : sync.err ? 'Problema con el respaldo' : 'Respaldo al día');
}
function pingIa() {
  fetch('/api/dieta?ping=1', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(j => { ui.apiOk = !!(j && j.ok); ui.ia = !!(j && j.ia); render(); }).catch(() => {});
}

/* ---------- Eventos ---------- */
function init() {
  applyTheme();
  hydrateIcons(document);
  history.replaceState({ view: 'inicio' }, '');
  render();

  /* teclado del iPhone: las hojas se acomodan */
  if (window.visualViewport) {
    const vv = window.visualViewport, f = () => { document.documentElement.style.setProperty('--kb', Math.max(0, window.innerHeight - vv.height - vv.offsetTop) + 'px'); document.documentElement.style.setProperty('--vvt', vv.offsetTop + 'px'); };
    vv.addEventListener('resize', f); vv.addEventListener('scroll', f); f();
  }

  $$('dialog').forEach(d => {
    d.addEventListener('cancel', e => { e.preventDefault(); closeSheet(d); });
    d.addEventListener('click', e => { if (e.target === d) closeSheet(d); else if (e.target.closest('[data-close]')) closeSheet(d); });
  });

  $('#btnBack').addEventListener('click', () => history.back());
  $('#btnSettings').addEventListener('click', () => { renderSettings(); openSheet($('#settingsSheet')); });
  $('#btnAsk').addEventListener('click', openAsk);
  $('#btnSync').addEventListener('click', () => { runSync(true); toast(sync.err ? 'Reintentando…' : 'Sincronizando…'); });
  $('#btnNew').addEventListener('click', () => openForm({ fecha: ui.view === 'dia' && ui.dia ? ui.dia : hoy(), comida: ui.view === 'dia' ? null : Plan.comidaAhora(new Date().getHours()), elegir: true }));
  $$('.tab[data-go]').forEach(t => t.addEventListener('click', () => { if (ui.view !== t.dataset.go) go(t.dataset.go, null, true); else window.scrollTo({ top: 0, behavior: 'smooth' }); }));

  $('#main').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.cargar) openForm({ fecha: ui.view === 'dia' && ui.dia ? ui.dia : hoy(), comida: b.dataset.cargar });
    else if (b.dataset.editar) { const c = byId(b.dataset.editar); if (c) openForm(c); }
    else if (b.dataset.dia) go('dia', b.dataset.dia);
    else if (b.dataset.go) go(b.dataset.go);
    else if (b.hasAttribute('data-ideas')) openIdeas();
    else if (b.hasAttribute('data-check')) openCheck();
    else if (b.hasAttribute('data-plan')) openPlan();
    else if (b.hasAttribute('data-pesar')) openPeso();
    else if (b.dataset.borrarPeso) borrarPeso(b.dataset.borrarPeso);
  });

  /* formulario: tocar un tipo guarda */
  $('#formBody').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.comida) {
      const cid = b.dataset.comida;
      if (cid === 'extra') { guardarComida({ fecha: form.fecha, comida: 'extra', tipo: 'nova' }); return; }
      const ya = comidasDe(form.fecha).find(x => x.comida === cid);
      form.comida = cid; form.id = ya ? ya.id : null; form.tipo = ya ? ya.tipo : null;
      renderForm(false);
    } else if (b.dataset.tipo) guardarComida({ id: form.id, fecha: form.fecha, comida: form.comida, tipo: b.dataset.tipo });
    else if (b.hasAttribute('data-borrar')) { const id = form.id; closeSheet($('#formSheet')); borrarComida(id); }
  });
  $('#comidaForm').addEventListener('submit', e => e.preventDefault());

  /* peso */
  $('#pesoForm').addEventListener('submit', e => { e.preventDefault(); guardarPeso(); });

  /* ideas */
  $('#ideasBody').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.ideasComida) { ui.ideasComida = b.dataset.ideasComida; ui.ideasIa = null; renderIdeas(); }
    else if (b.hasAttribute('data-otras-ideas')) { ui.ideasSemilla = Math.floor(Math.random() * 100000); renderIdeas(); }
    else if (b.hasAttribute('data-ideas-local')) { ui.ideasIa = null; renderIdeas(); }
    else if (b.hasAttribute('data-ideas-ia')) pedirIdeas();
    else if (b.hasAttribute('data-cargar-idea')) openForm({ comida: b.dataset.comida, tipo: b.dataset.tipo, que: b.dataset.que, directo: true });
  });
  $('#ideasBody').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'i_pedido') { e.preventDefault(); pedirIdeas(); } });

  /* ¿esto va? */
  $('#checkBody').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.checkComida) { ui.checkComida = b.dataset.checkComida; ui.checkRes = null; renderCheck(); }
    else if (b.hasAttribute('data-check-ia')) preguntarCheck();
    else if (b.hasAttribute('data-cargar-idea')) openForm({ comida: b.dataset.comida, tipo: b.dataset.tipo, que: b.dataset.que, directo: true });
  });
  $('#checkBody').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'c_texto') { e.preventDefault(); preguntarCheck(); } });
  $('#checkBody').addEventListener('input', e => { if (e.target.id === 'c_texto') ui.checkTexto = e.target.value; });

  /* preguntar */
  $('#askForm').addEventListener('submit', e => { e.preventDefault(); preguntar(); });
  $('#askChips').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) preguntar(b.dataset.q); });

  /* ajustes */
  $('#settingsBody').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-sync-on')) connectSync();
    else if (b.hasAttribute('data-sync-off')) disconnectSync();
    else if (b.hasAttribute('data-sync-now')) { runSync(true); renderSyncBox(); }
    else if (b.hasAttribute('data-plan')) openPlan();
    else if (b.hasAttribute('data-go-peso')) { closeSheet($('#settingsSheet')); setTimeout(() => go('peso'), 50); }
    else if (b.dataset.theme) { lsSet(THEME_KEY, b.dataset.theme === 'auto' ? '' : b.dataset.theme); applyTheme(); renderSettings(); }
    else if (b.hasAttribute('data-export')) exportar();
    else if (b.hasAttribute('data-import')) $('#importFile').click();
    else if (b.hasAttribute('data-wipe')) wipe();
  });
  $('#settingsBody').addEventListener('change', e => {
    if (e.target.id === 's_obj') { const v = Math.round(parseFloat(String(e.target.value).replace(',', '.')) * 2) / 2; if (v >= 30 && v <= 300) { state.ajustes.objetivo = v; state.ajustesAt = Date.now(); persist(); queueSync(); render(); } }
    if (e.target.id === 's_inicio') { const v = e.target.value; if (/^\d{4}-\d{2}-\d{2}$/.test(v) && v <= hoy()) { state.ajustes.inicio = v; state.ajustesAt = Date.now(); persist(); queueSync(); renderSettings(); render(); } }
  });
  $('#settingsSheet').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 's_clave') { e.preventDefault(); connectSync(); } });
  $('#importFile').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (f) importar(f); e.target.value = ''; });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { render(); if (sync.on && Date.now() - sync.pulled > 60000) runSync(true); }
    else if (sync.on) runSync(false, true);
  });
  window.addEventListener('online', () => { if (sync.on) runSync(true); });
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

  if (location.protocol.indexOf('http') === 0) {
    pingIa();
    if (sync.on) runSync(true);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
document.addEventListener('DOMContentLoaded', init);
