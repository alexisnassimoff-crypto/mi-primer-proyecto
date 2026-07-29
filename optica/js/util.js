/* ============================================================
   OJO — Utilidades compartidas
   Se carga antes que todo lo demás.
   ============================================================ */
(function (global) {
  'use strict';

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  var reducido = global.matchMedia
    ? global.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  /* ---------- Plata ---------- */
  var fmtMoneda = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  function precio(n) {
    return fmtMoneda.format(Math.round(n || 0));
  }

  /* Cuota sin interés, redondeada para arriba al peso. */
  function cuota(total, n) {
    n = n || (global.CONFIG && CONFIG.PAGOS.cuotasSinInteres) || 6;
    return precio(Math.ceil((total || 0) / n));
  }

  /* ---------- Texto ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ̀-ͯ = marcas diacríticas combinantes; al normalizar con NFD
  // los acentos se separan de la letra y este rango los borra.
  var DIACRITICOS = /[̀-ͯ]/g;

  function slug(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(DIACRITICOS, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  /* ---------- Varios ---------- */
  function uid() {
    return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms || 200);
    };
  }

  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

  /* ---------- localStorage a prueba de modo incógnito ---------- */
  var Guardado = {
    leer: function (clave, porDefecto) {
      try {
        var raw = global.localStorage.getItem(clave);
        return raw ? JSON.parse(raw) : porDefecto;
      } catch (e) { return porDefecto; }
    },
    escribir: function (clave, valor) {
      try { global.localStorage.setItem(clave, JSON.stringify(valor)); return true; }
      catch (e) { return false; }
    },
    borrar: function (clave) {
      try { global.localStorage.removeItem(clave); } catch (e) { /* nada */ }
    }
  };

  /* ---------- Bus de eventos mínimo ---------- */
  function Bus() {
    var subs = {};
    return {
      on: function (ev, fn) {
        (subs[ev] = subs[ev] || []).push(fn);
        return function () { subs[ev] = subs[ev].filter(function (f) { return f !== fn; }); };
      },
      emit: function (ev, datos) {
        (subs[ev] || []).forEach(function (fn) {
          try { fn(datos); } catch (e) { console.error(e); }
        });
      }
    };
  }

  /* ---------- Parámetros de URL ---------- */
  function params() {
    return new URLSearchParams(global.location.search);
  }

  function setParams(obj, reemplazar) {
    var p = new URLSearchParams();
    Object.keys(obj).forEach(function (k) {
      var v = obj[k];
      if (v == null || v === '' || (Array.isArray(v) && !v.length)) return;
      p.set(k, Array.isArray(v) ? v.join(',') : v);
    });
    var url = global.location.pathname + (p.toString() ? '?' + p.toString() : '');
    global.history[reemplazar ? 'replaceState' : 'pushState']({}, '', url);
  }

  /* ---------- Fechas en castellano ---------- */
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
    'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function fecha(d, formato) {
    if (formato === 'corta') return d.getDate() + ' ' + MESES[d.getMonth()].slice(0, 3);
    if (formato === 'iso') {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()];
  }

  global.U = {
    $: $, $$: $$,
    reducido: reducido,
    precio: precio,
    cuota: cuota,
    esc: esc,
    slug: slug,
    uid: uid,
    debounce: debounce,
    clamp: clamp,
    Guardado: Guardado,
    Bus: Bus,
    params: params,
    setParams: setParams,
    fecha: fecha,
    DIAS: DIAS,
    MESES: MESES
  };
})(window);
