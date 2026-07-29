/* ============================================================
   OJO — Generador de marcos en SVG
   ------------------------------------------------------------
   Dibuja un par de anteojos vectorial a partir de la ficha del
   producto (forma + material + colores + tinte del cristal).

   Se usa en tres lugares y siempre con la MISMA geometría:
     · las tarjetas del catálogo
     · la ficha de producto
     · el probador virtual (que alinea PUPILAS con los ojos reales)

   Sistema de coordenadas — viewBox 0 0 260 108:
     lente izquierdo  x 16→112   centro (64, 52)
     puente           x 112→148
     lente derecho    x 148→244  centro (196, 52)
   ============================================================ */
(function (global) {
  'use strict';

  var VB = { w: 260, h: 108 };

  /* Centro óptico de cada lente. El probador hace coincidir estos dos
     puntos con las pupilas de la persona, y de ahí saca escala y ángulo. */
  var PUPILAS = {
    izq: { x: 64, y: 52 },
    der: { x: 196, y: 52 },
    separacion: 132            // px de viewBox entre pupilas
  };

  /* ---------- Contorno del lente izquierdo, por forma ----------
     El derecho es siempre el espejo respecto de x = 130.          */
  var FORMAS = {
    redondo:
      'M28,52 A36,36 0 0 1 100,52 A36,36 0 0 1 28,52 Z',

    ovalado:
      'M20,52 A44,32 0 0 1 108,52 A44,32 0 0 1 20,52 Z',

    panto:
      'M24,38 C30,22 46,15 66,16 C90,17 108,29 110,46 C112,64 96,84 70,87 C44,90 24,76 20,58 C18,50 20,44 24,38 Z',

    cuadrado:
      'M32,16 H96 A16,16 0 0 1 112,32 V62 A26,26 0 0 1 86,88 H42 A26,26 0 0 1 16,62 V32 A16,16 0 0 1 32,16 Z',

    rectangular:
      'M28,24 H100 A12,12 0 0 1 112,36 V62 A18,18 0 0 1 94,80 H34 A18,18 0 0 1 16,62 V36 A12,12 0 0 1 28,24 Z',

    octagonal:
      'M16,36 L34,18 H94 L112,36 V64 L94,86 H34 L16,64 Z',

    hexagonal:
      'M16,52 L36,18 H92 L112,52 L92,86 H36 Z',

    cateye:
      'M14,18 C40,16 76,16 102,24 C109,26 112,32 111,41 C108,63 91,83 65,86 C41,89 24,73 18,49 C16,39 13,26 14,18 Z',

    mariposa:
      'M12,22 C38,12 80,12 104,22 C111,25 113,32 111,42 C107,66 88,86 62,87 C36,88 20,70 14,44 C11,34 10,26 12,22 Z',

    aviador:
      'M20,20 C20,17 23,15 28,15 H100 C107,15 111,19 110,26 C106,48 94,70 76,82 C64,90 46,89 37,78 C26,64 20,42 20,20 Z',

    browline:
      'M18,34 H110 V62 A20,20 0 0 1 90,82 H38 A20,20 0 0 1 18,62 Z'
  };

  /* ---------- Grosor del aro según el material ---------- */
  var GROSOR = {
    acetato: 9,
    inyectado: 8,
    tr90: 7,
    mixto: 5.5,
    metal: 3.5,
    titanio: 3,
    'acero': 3.5
  };

  /* ---------- Paleta de materiales ----------
     `havana` y `cristal` no son colores planos: se resuelven con
     degradés para que se lean como acetato real y no como plástico. */
  var COLORES = {
    negro: { base: '#14100E', alto: '#3A322C' },
    'negro-mate': { base: '#100D0B', alto: '#241E1A' },
    havana: { base: '#8A5424', alto: '#D9A05B', tortoise: true },
    'havana-oscuro': { base: '#4E2E14', alto: '#9A6531', tortoise: true },
    'havana-azul': { base: '#2C4152', alto: '#7FA0B4', tortoise: true },
    'havana-verde': { base: '#3B4A2C', alto: '#8C9B63', tortoise: true },
    cristal: { base: '#D8D2CA', alto: '#FFFFFF', translucido: true },
    'cristal-rosa': { base: '#E6C7BC', alto: '#FBEBE4', translucido: true },
    'cristal-gris': { base: '#BFBAB4', alto: '#EDEAE6', translucido: true },
    'cristal-azul': { base: '#A8C2D6', alto: '#E2EEF6', translucido: true },
    'cristal-verde': { base: '#A9BE9A', alto: '#E0EBD8', translucido: true },
    champagne: { base: '#B79A6E', alto: '#E9D5B0' },
    'oro-rosa': { base: '#B97F63', alto: '#EAB79C' },
    dorado: { base: '#A98844', alto: '#E3C57E' },
    plateado: { base: '#9A9DA1', alto: '#E4E7EA' },
    gunmetal: { base: '#4A4E52', alto: '#8D9298' },
    'azul-petroleo': { base: '#1E3A45', alto: '#4C7A8B' },
    terracota: { base: '#A8451F', alto: '#DD7A4B' },
    vino: { base: '#5E1F2A', alto: '#9B4453' },
    nude: { base: '#C09B8A', alto: '#EBD2C6' },
    oliva: { base: '#4E5738', alto: '#8E9A6B' },
    blanco: { base: '#E8E4DC', alto: '#FFFFFF' },
    marron: { base: '#5A3A25', alto: '#9B6C4A' }
  };

  /* ---------- Tintes de cristal ---------- */
  var TINTES = {
    transparente: { color: '#BFD4DC', op: 0.14, brillo: 0.5 },   // óptico con antirreflejo
    gris: { color: '#2A2A2C', op: 0.62, brillo: 0.28 },
    negro: { color: '#141416', op: 0.74, brillo: 0.24 },
    marron: { color: '#4A2E18', op: 0.62, brillo: 0.28 },
    verde: { color: '#1F3A2A', op: 0.62, brillo: 0.26 },
    degrade: { color: '#22252B', op: 0.60, brillo: 0.3, degrade: true },
    espejado: { color: '#3E6E86', op: 0.58, brillo: 0.72, espejo: true },
    'espejado-oro': { color: '#8A6A2A', op: 0.56, brillo: 0.7, espejo: true },
    azul: { color: '#1B3350', op: 0.6, brillo: 0.34 },
    rosa: { color: '#5E2A38', op: 0.5, brillo: 0.34 }
  };

  var seq = 0;

  function color(nombre) {
    return COLORES[nombre] || COLORES.negro;
  }

  function tinte(nombre) {
    return TINTES[nombre] || TINTES.transparente;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- Degradé del aro ----------
     El havana se arma con muchas paradas alternadas para imitar el
     veteado del acetato; el resto es un degradé simple de dos tonos. */
  function defAro(id, c) {
    var stops;
    if (c.tortoise) {
      stops =
        '<stop offset="0%" stop-color="' + c.alto + '"/>' +
        '<stop offset="14%" stop-color="' + c.base + '"/>' +
        '<stop offset="27%" stop-color="' + c.alto + '"/>' +
        '<stop offset="41%" stop-color="' + c.base + '"/>' +
        '<stop offset="56%" stop-color="' + c.alto + '"/>' +
        '<stop offset="70%" stop-color="' + c.base + '"/>' +
        '<stop offset="84%" stop-color="' + c.alto + '"/>' +
        '<stop offset="100%" stop-color="' + c.base + '"/>';
    } else {
      stops =
        '<stop offset="0%" stop-color="' + c.alto + '"/>' +
        '<stop offset="46%" stop-color="' + c.base + '"/>' +
        '<stop offset="100%" stop-color="' + c.alto + '"/>';
    }
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0.85" y2="1">' + stops + '</linearGradient>';
  }

  function defCristal(id, t) {
    if (t.degrade) {
      return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="' + t.color + '" stop-opacity="' + t.op + '"/>' +
        '<stop offset="100%" stop-color="' + t.color + '" stop-opacity="' + (t.op * 0.28).toFixed(3) + '"/>' +
        '</linearGradient>';
    }
    if (t.espejo) {
      return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#FFFFFF" stop-opacity="' + (t.op * 0.55).toFixed(3) + '"/>' +
        '<stop offset="38%" stop-color="' + t.color + '" stop-opacity="' + t.op + '"/>' +
        '<stop offset="100%" stop-color="' + t.color + '" stop-opacity="' + (t.op * 0.85).toFixed(3) + '"/>' +
        '</linearGradient>';
    }
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0.6" y2="1">' +
      '<stop offset="0%" stop-color="' + t.color + '" stop-opacity="' + Math.min(1, t.op * 1.1).toFixed(3) + '"/>' +
      '<stop offset="100%" stop-color="' + t.color + '" stop-opacity="' + (t.op * 0.82).toFixed(3) + '"/>' +
      '</linearGradient>';
  }

  /* ---------- Puente ---------- */
  function puente(tipo) {
    if (tipo === 'doble') {
      return '<path d="M112,30 H148" /><path d="M112,46 H148" />';
    }
    if (tipo === 'curvo') {
      return '<path d="M112,36 C120,26 140,26 148,36" />';
    }
    if (tipo === 'alto') {
      return '<path d="M112,26 H148" />';
    }
    return '<path d="M112,38 H148" />';
  }

  /* ---------- Terminales y varillas (vista frontal, escorzo) ---------- */
  function varillas(y) {
    return '<path d="M16,' + y + ' C8,' + y + ' 4,' + (y + 2) + ' 2,' + (y + 7) + '" />' +
      '<path d="M244,' + y + ' C252,' + y + ' 256,' + (y + 2) + ' 258,' + (y + 7) + '" />';
  }

  /* ============================================================
     svg(producto, opciones) → string con el <svg> completo
     ------------------------------------------------------------
     producto  { forma, material, color, tinte, puente }
     opciones  { ancho, alto, clase, tinte (pisa el del producto),
                 fondo (color de la placa), sombra, id }
     ============================================================ */
  function svg(p, o) {
    p = p || {};
    o = o || {};

    var forma = FORMAS[p.forma] ? p.forma : 'cuadrado';
    var d = FORMAS[forma];
    var c = color(p.color);
    var t = tinte(o.tinte || p.tinte);
    var grosor = GROSOR[p.material] || GROSOR.acetato;

    var uid = 'm' + (++seq);
    var idAro = uid + 'a';
    var idCristal = uid + 'c';
    var idBrillo = uid + 'b';
    var idSombra = uid + 's';

    // El browline lleva una ceja gruesa que domina el frente.
    var esBrowline = forma === 'browline';
    // Los aviadores llevan barra superior además del doble puente.
    var esAviador = forma === 'aviador';
    var tipoPuente = p.puente || (esAviador ? 'doble' : 'recto');

    var defs =
      '<defs>' +
      defAro(idAro, c) +
      defCristal(idCristal, t) +
      '<linearGradient id="' + idBrillo + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#FFFFFF" stop-opacity="' + (t.brillo * 0.85).toFixed(3) + '"/>' +
      '<stop offset="42%" stop-color="#FFFFFF" stop-opacity="0"/>' +
      '</linearGradient>' +
      (o.sombra === false ? '' :
        '<filter id="' + idSombra + '" x="-12%" y="-12%" width="124%" height="140%">' +
        '<feDropShadow dx="0" dy="3" stdDeviation="3.2" flood-color="#2A1D12" flood-opacity="0.28"/>' +
        '</filter>') +
      '</defs>';

    // Un lente = cristal + brillo. Se dibuja dos veces (el derecho espejado).
    function lente(mirror) {
      var tr = mirror ? ' transform="translate(260,0) scale(-1,1)"' : '';
      return '<g' + tr + '>' +
        '<path d="' + d + '" fill="url(#' + idCristal + ')"/>' +
        '<path d="' + d + '" fill="url(#' + idBrillo + ')"/>' +
        '</g>';
    }

    function aro(mirror) {
      var tr = mirror ? ' transform="translate(260,0) scale(-1,1)"' : '';
      return '<path d="' + d + '"' + tr + '/>';
    }

    var trazo =
      '<g fill="none" stroke="url(#' + idAro + ')" stroke-width="' + grosor + '" ' +
      'stroke-linecap="round" stroke-linejoin="round"' +
      (c.translucido ? ' opacity="0.92"' : '') + '>' +
      aro(false) + aro(true) +
      puente(tipoPuente) +
      (esAviador ? '<path d="M22,17 C70,9 190,9 238,17" stroke-width="' + (grosor * 0.8).toFixed(1) + '"/>' : '') +
      varillas(esBrowline ? 34 : (forma === 'cateye' || forma === 'mariposa' ? 22 : 30)) +
      '</g>';

    // Ceja del browline: pieza maciza, no un aro.
    var ceja = esBrowline
      ? '<g fill="url(#' + idAro + ')">' +
      '<path d="M14,20 C60,13 200,13 246,20 C248,20.4 249,22 248.6,24 L246,34 C244,35 240,35 236,34 L200,30 L60,30 L24,34 C20,35 16,35 14,34 L11.4,24 C11,22 12,20.4 14,20 Z"/>' +
      '</g>'
      : '';

    var estiloFondo = o.fondo ? 'background:' + o.fondo + ';' : '';

    // Sólo se emite `height` si vino un valor explícito: con viewBox y un
    // ancho, el alto lo deduce el navegador por relación de aspecto.
    // (height="auto" no es un largo válido en SVG y tira error de parseo.)
    var medidas = 'width="' + esc(o.ancho || '100%') + '"' +
      (o.alto ? ' height="' + esc(o.alto) + '"' : '');

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + VB.w + ' ' + VB.h + '" ' +
      medidas + ' ' +
      'class="' + esc(o.clase || 'marco') + '" ' +
      'style="' + estiloFondo + 'overflow:visible" ' +
      'role="img" aria-label="' + esc(o.alt || 'Anteojos ' + forma) + '">' +
      defs +
      '<g' + (o.sombra === false ? '' : ' filter="url(#' + idSombra + ')"') + '>' +
      lente(false) + lente(true) +
      ceja +
      trazo +
      '</g>' +
      '</svg>';
  }

  /* ---------- Versión data-URI, para <img>, canvas y CSS ---------- */
  function dataUri(p, o) {
    o = o || {};
    var s = svg(p, o);
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  }

  /* ---------- Imagen lista para dibujar en canvas (probador) ---------- */
  function imagen(p, o) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = dataUri(p, o);
    });
  }

  global.Marcos = {
    svg: svg,
    dataUri: dataUri,
    imagen: imagen,
    FORMAS: FORMAS,
    COLORES: COLORES,
    TINTES: TINTES,
    PUPILAS: PUPILAS,
    VIEWBOX: VB
  };
})(window);
