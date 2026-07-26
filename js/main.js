/* ============================================================
   Dr. Uriel Grümberg — interacciones
   ============================================================ */
(function () {
  'use strict';

  /* ---------- CONFIGURACIÓN ----------
     Cambiá el número acá (formato internacional, sin + ni espacios)
     y también en los href="https://wa.me/..." del index.html          */
  var WHATSAPP = '5491132961955';
  var WA_BASE = 'https://wa.me/' + WHATSAPP;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Links de WhatsApp con mensaje pre-escrito ---------- */
  $$('.js-wa').forEach(function (el) {
    var msg = el.getAttribute('data-wa');
    el.href = WA_BASE + (msg ? '?text=' + encodeURIComponent(msg) : '');
  });

  /* ---------- 2. Header al hacer scroll ---------- */
  var header = $('#header');
  var waFloat = $('.wa-float');
  var lastY = -1;

  function onScroll() {
    var y = window.scrollY;
    if (y === lastY) return;
    lastY = y;
    header.classList.toggle('is-stuck', y > 12);
    if (waFloat) waFloat.classList.toggle('is-in', y > 420);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 3. Menú móvil ---------- */
  var burger = $('#burger');
  var drawer = $('#drawer');

  function setDrawer(open) {
    drawer.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  burger.addEventListener('click', function () {
    setDrawer(drawer.hidden);
  });

  $$('a', drawer).forEach(function (a) {
    a.addEventListener('click', function () { setDrawer(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !drawer.hidden) { setDrawer(false); burger.focus(); }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 860 && !drawer.hidden) setDrawer(false);
  });

  /* ---------- 4. Aparición al hacer scroll ---------- */
  var revealables = $$('[data-reveal]');

  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 5. Link activo en el nav ---------- */
  var navLinks = $$('.nav a');
  var sections = navLinks
    .map(function (a) { return document.getElementById(a.hash.slice(1)); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.hash === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 6. Brillo que sigue al cursor en las tarjetas ---------- */
  if (!reduced && window.matchMedia('(hover:hover)').matches) {
    $$('.card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- 7. Comparador antes / después ---------- */
  $$('.compare__box').forEach(function (box) {
    var range = $('.compare__range', box);
    if (!range) return;
    var apply = function () { box.style.setProperty('--pos', range.value + '%'); };
    range.addEventListener('input', apply);

    // Con el teclado conviene un paso más grande que el del arrastre.
    range.addEventListener('keydown', function (e) {
      var delta = e.key === 'ArrowLeft' ? -5 : e.key === 'ArrowRight' ? 5 : 0;
      if (!delta) return;
      e.preventDefault();
      range.value = Math.min(100, Math.max(0, parseFloat(range.value) + delta));
      apply();
    });

    apply();
  });

  /* ---------- 8. Formulario → WhatsApp ---------- */
  var form = $('#form');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var nombre = $('#f-nombre', form);
      var motivo = $('#f-motivo', form).value;
      var extra = $('#f-mensaje', form).value.trim();
      var valor = nombre.value.trim();

      if (!valor) {
        nombre.setAttribute('aria-invalid', 'true');
        nombre.focus();
        return;
      }
      nombre.removeAttribute('aria-invalid');

      var texto = 'Hola Dr. Grümberg, soy ' + valor + '. ' +
        (motivo === 'Consulta general'
          ? 'Quisiera coordinar una consulta.'
          : 'Quisiera consultar por ' + motivo + '.');

      if (extra) texto += '\n\n' + extra;

      // Un <a> temporal abre WhatsApp en otra pestaña sin sacar al visitante de la web.
      var link = document.createElement('a');
      link.href = WA_BASE + '?text=' + encodeURIComponent(texto);
      link.target = '_blank';
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });

    $('#f-nombre', form).addEventListener('input', function () {
      this.removeAttribute('aria-invalid');
    });
  }

  /* ---------- 9. Año en el pie ---------- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
