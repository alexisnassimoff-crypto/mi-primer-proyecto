/* ============================================================
   Dr. Uriel Grümberg — interacciones
   ============================================================ */
(function () {
  'use strict';

  /* ---------- CONFIGURACIÓN ----------
     Cambiá el número acá (formato internacional, sin + ni espacios)
     y también en los href="https://wa.me/..." del index.html          */
  var WHATSAPP = '5493413168083';
  var WA_BASE = 'https://wa.me/' + WHATSAPP;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Links de WhatsApp con mensaje pre-escrito ---------- */
  $$('.js-wa').forEach(function (el) {
    var msg = el.getAttribute('data-wa');
    el.href = WA_BASE + (msg ? '?text=' + encodeURIComponent(msg) : '');
  });

  /* ---------- 2. Header y CTA fija al hacer scroll ---------- */
  var header = $('#header');
  var waFloat = $('.wa-float');
  var ctaBar = $('#ctaBar');
  var contacto = $('#contacto');
  var contactoVisible = false;
  var lastY = -1;

  function onScroll() {
    var y = window.scrollY;
    if (y === lastY) return;
    lastY = y;
    header.classList.toggle('is-stuck', y > 12);
    // La CTA fija aparece pasado el hero y se esconde sobre el formulario,
    // para no duplicar el mismo botón dos veces en pantalla.
    var show = y > 380 && !contactoVisible;
    if (waFloat) waFloat.classList.toggle('is-in', show);
    if (ctaBar) ctaBar.classList.toggle('is-in', show);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  if (contacto && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      contactoVisible = entries[0].isIntersecting;
      lastY = -1;
      onScroll();
    }, { threshold: 0.2 }).observe(contacto);
  }
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

  burger.addEventListener('click', function () { setDrawer(drawer.hidden); });

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

  /* ---------- 7. Paralaje del fondo del hero ---------- */
  var hero = $('.hero');

  if (hero && !reduced && window.matchMedia('(hover:hover)').matches) {
    var orbes = $$('.orb', hero);
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      orbes.forEach(function (o, i) {
        var f = (i + 1) * 18;
        o.style.setProperty('--px', (x * f).toFixed(1) + 'px');
        o.style.setProperty('--py', (y * f).toFixed(1) + 'px');
      });
    });
  }

  /* ---------- 8. Caso: cambio de vista ---------- */
  var caso = $('#case');

  if (caso) {
    var vistas = $$('button', caso);
    vistas.forEach(function (b) {
      b.addEventListener('click', function () {
        caso.setAttribute('data-view', b.dataset.view);
        vistas.forEach(function (o) {
          o.setAttribute('aria-pressed', String(o === b));
        });
      });
    });
  }

  /* ---------- 9. Formulario → WhatsApp ---------- */
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

  /* ---------- 10. Año en el pie ---------- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
