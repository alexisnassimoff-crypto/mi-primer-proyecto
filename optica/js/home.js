/* ============================================================
   OJO — Portada
   ============================================================ */
(function () {
  'use strict';

  var $ = U.$, $$ = U.$$;

  /* ---------- Anteojo grande de la portada ----------
     Se elige uno con carácter: cat-eye negro si está, y si no,
     el primer destacado del catálogo.                            */
  function pintarPieza() {
    var host = $('#piezaPortada');
    if (!host) return;

    var p = Catalogo.porSku('CE-ARCANE-C5') || Catalogo.destacados(1)[0];
    if (!p) return;

    var svg = Marcos.svg(p, {
      alt: Catalogo.nombreCompleto(p) + ' — ' + p.colorNombre,
      clase: 'marco'
    });
    host.insertAdjacentHTML('afterbegin', svg);

    var nombre = $('#piezaNombre');
    if (nombre) nombre.textContent = Catalogo.nombreCompleto(p) + ' · ' + p.colorNombre;

    host.style.cursor = 'pointer';
    host.addEventListener('click', function () {
      location.href = 'producto.html?sku=' + encodeURIComponent(p.sku);
    });
  }

  /* ---------- Grillas de producto ---------- */
  function pintarGrilla(selector, lista) {
    var host = $(selector);
    if (!host) return;
    host.innerHTML = lista.map(UI.tarjetaProducto).join('');
    UI.revelar(host);
  }

  /* ---------- Marcas del paraguas ---------- */
  function pintarMarcas() {
    var host = $('#grillaMarcas');
    if (!host) return;

    host.innerHTML = Catalogo.MARCAS.map(function (m, i) {
      var cuantos = Catalogo.filtrar({ marca: [m.id] }).length;
      return '<a class="marca-tira revelar" data-retraso="' + (i % 5) + '" href="tienda.html?marca=' + encodeURIComponent(m.id) + '">' +
        '<span class="marca-tira__nombre">' + U.esc(m.nombre) + '</span>' +
        (m.destacada ? '<span class="etiqueta etiqueta--suave marca-tira__casa">Marca de la casa</span>' : '') +
        '<span class="marca-tira__relato">' + U.esc(m.relato) + '</span>' +
        '<span class="nota mt-s">' + cuantos + ' modelo' + (cuantos === 1 ? '' : 's') + '</span>' +
        '</a>';
    }).join('');
    UI.revelar(host);
  }

  /* ---------- Conteos, para que no queden números a mano ---------- */
  function pintarConteos() {
    var valores = {
      modelos: Catalogo.todos().length,
      marcas: Catalogo.MARCAS.length,
      sol: Catalogo.filtrar({ tipo: 'sol' }).length,
      receta: Catalogo.filtrar({ tipo: 'receta' }).length
    };
    $$('[data-conteo]').forEach(function (el) {
      var k = el.getAttribute('data-conteo');
      if (valores[k] != null) el.textContent = valores[k];
    });
  }

  /* ---------- Íconos declarados con data-icono ---------- */
  function pintarIconos() {
    $$('[data-icono]').forEach(function (el) {
      var nombre = el.getAttribute('data-icono');
      if (UI.I[nombre]) el.innerHTML = UI.I[nombre];
    });
  }

  /* ---------- Barras de espesor ----------
     Necesitan la clase .visible para animarse; el observador de UI
     sólo la pone en elementos .revelar, y el bloque la tiene.      */
  function observarEspesor() {
    var el = $('#espesor');
    if (!el) return;
    if (U.reducido || !('IntersectionObserver' in window)) { el.classList.add('visible'); return; }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      });
    }, { threshold: .3 });
    obs.observe(el);
  }

  pintarPieza();
  pintarIconos();
  pintarConteos();
  pintarGrilla('#grillaDestacados', Catalogo.destacados(8));
  pintarGrilla('#grillaNovedades', Catalogo.ordenar(Catalogo.novedades(8), 'relevancia'));
  pintarMarcas();
  observarEspesor();
})();
