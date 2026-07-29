/* ============================================================
   OJO — Interfaz compartida
   ------------------------------------------------------------
   Cabecera, pie, cajón de carrito y avisos se inyectan desde acá
   en vez de estar copiados en las 9 páginas. Así no se
   desincronizan y no hace falta un build system.

   El contenido propio de cada página SÍ vive en su HTML, para
   que Google lo lea sin ejecutar JavaScript.
   ============================================================ */
(function (global) {
  'use strict';

  var $ = U.$, $$ = U.$$;

  /* ============================================================
     Íconos
     ============================================================ */
  var I = {
    carrito: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1 12H7L6 7Z"/><path d="M9 7V5.5a3 3 0 0 1 6 0V7"/></svg>',
    usuario: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.5" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>',
    menu: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 8h16M4 16h16"/></svg>',
    cerrar: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    buscar: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="6"/><path d="m15.5 15.5 3.5 3.5"/></svg>',
    flecha: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="flecha"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    flechaArriba: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>',
    tilde: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg>',
    tildeGrande: '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg>',
    camara: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z"/><circle cx="12" cy="13" r="3.2"/></svg>',
    calendario: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 3v4M16 3v4M4 11h16"/></svg>',
    envio: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h11v9H3V7Z"/><path d="M14 10h4l3 3v3h-7v-6Z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></svg>',
    escudo: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 5 6v6c0 4.2 2.9 7.6 7 8.5 4.1-.9 7-4.3 7-8.5V6l-7-2.5Z"/><path d="m9 12 2 2 4-4"/></svg>',
    tarjeta: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/></svg>',
    cambio: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h11a4 4 0 0 1 0 8h-3"/><path d="m7 6-3 3 3 3"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/></svg>',
    ojo: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/></svg>',
    regla: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M7 8v3M12 8v4M17 8v3"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.7 15L2 22l5.2-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.6 0a6.6 6.6 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.2 0-.4 0-.5L9.5 8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3A3 3 0 0 0 6.8 10a5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4 5.3 5.3 0 0 0 3.3.7 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none"/></svg>',
    logo: '<svg viewBox="0 0 62 26" width="52" height="22" fill="none" class="logo__glifo" aria-hidden="true"><ellipse cx="12" cy="13" rx="10.5" ry="9.5" stroke="currentColor" stroke-width="2.6"/><ellipse cx="50" cy="13" rx="10.5" ry="9.5" stroke="currentColor" stroke-width="2.6"/><path d="M22.5 11.5c3-1.6 14-1.6 17 0" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>'
  };

  /* ============================================================
     Avisos flotantes
     ============================================================ */
  var contenedorAvisos;

  function aviso(mensaje, tipo, ms) {
    if (!contenedorAvisos) {
      contenedorAvisos = document.createElement('div');
      contenedorAvisos.className = 'avisos';
      contenedorAvisos.setAttribute('role', 'status');
      contenedorAvisos.setAttribute('aria-live', 'polite');
      document.body.appendChild(contenedorAvisos);
    }
    var el = document.createElement('div');
    el.className = 'aviso' + (tipo ? ' aviso--' + tipo : '');
    el.innerHTML = '<span>' + U.esc(mensaje) + '</span>' +
      '<button class="aviso__x" aria-label="Cerrar">' + I.cerrar + '</button>';
    contenedorAvisos.appendChild(el);

    var quitar = function () {
      el.classList.add('saliendo');
      setTimeout(function () { el.remove(); }, 300);
    };
    el.querySelector('.aviso__x').addEventListener('click', quitar);
    setTimeout(quitar, ms || 3800);
    return el;
  }

  /* ============================================================
     Tarjeta de producto
     ============================================================ */
  var PLACAS = ['', 'placa--blush', 'placa--salvia', 'placa--negro'];

  function placaDe(p) {
    // Variación determinista: el mismo producto siempre cae en la
    // misma placa, así la grilla se ve variada pero estable.
    var suma = 0;
    for (var i = 0; i < p.sku.length; i++) suma += p.sku.charCodeAt(i);
    if (p.tipo === 'sol' && p.color === 'negro') return 'placa--negro';
    return PLACAS[suma % PLACAS.length];
  }

  function medioProducto(p, opciones) {
    opciones = opciones || {};
    if (p.foto) {
      return '<div class="placa ' + placaDe(p) + '">' +
        '<img src="' + U.esc(p.foto) + '" alt="' + U.esc(Catalogo.nombreCompleto(p)) + '" loading="lazy">' +
        '</div>';
    }
    return '<div class="placa ' + placaDe(p) + '">' +
      Marcos.svg(p, { alt: Catalogo.nombreCompleto(p) + ' ' + p.colorNombre, sombra: opciones.sombra }) +
      '</div>';
  }

  function etiquetasDe(p) {
    var out = [];
    if (p.precioTachado) {
      var off = Math.round((1 - p.precio / p.precioTachado) * 100);
      out.push('<span class="etiqueta etiqueta--acento">−' + off + '%</span>');
    }
    if (p.nuevo) out.push('<span class="etiqueta etiqueta--salvia">Nuevo</span>');
    if ((p.tags || []).indexOf('mas-vendido') !== -1) out.push('<span class="etiqueta etiqueta--oro">Más vendido</span>');
    if ((p.tags || []).indexOf('edicion-limitada') !== -1) out.push('<span class="etiqueta">Últimas unidades</span>');
    return out.join('');
  }

  function tarjetaProducto(p) {
    var nombre = Catalogo.nombreCompleto(p);
    var marca = Catalogo.marca(p.marca);
    var url = 'producto.html?sku=' + encodeURIComponent(p.sku);

    return '<article class="producto revelar" data-sku="' + U.esc(p.sku) + '">' +
      '<div class="producto__media">' +
      '<div class="producto__etiquetas">' + etiquetasDe(p) + '</div>' +
      medioProducto(p) +
      '<div class="producto__probar">' +
      '<a class="btn btn--claro btn--chico" href="probador.html?sku=' + encodeURIComponent(p.sku) + '">Probártelo</a>' +
      '<a class="btn btn--chico" href="' + url + '">Ver</a>' +
      '</div>' +
      '</div>' +
      '<div class="producto__cuerpo">' +
      '<p class="producto__marca">' + U.esc(marca ? marca.nombre : p.marca) + '</p>' +
      '<h3 class="producto__nombre"><a href="' + url + '">' + U.esc(p.modelo + (p.variante ? ' ' + p.variante : '')) + '</a></h3>' +
      '<p class="producto__color">' + U.esc(p.colorNombre) + ' · ' + U.esc(Catalogo.FORMAS_NOMBRE[p.forma] || '') + '</p>' +
      '<div class="producto__precios">' +
      '<span class="producto__precio">' + U.precio(p.precio) + '</span>' +
      (p.precioTachado ? '<span class="tachado">' + U.precio(p.precioTachado) + '</span>' : '') +
      '</div>' +
      (p.stock ? '<p class="producto__cuotas">' + CONFIG.PAGOS.cuotasSinInteres + ' × ' + U.cuota(p.precio) + ' sin interés</p>'
        : '<p class="producto__agotado">Sin stock</p>') +
      '</div>' +
      '</article>';
  }

  /* ============================================================
     Cabecera
     ============================================================ */
  var NAV = [
    { texto: 'Anteojos de sol', href: 'tienda.html?tipo=sol' },
    { texto: 'De receta', href: 'tienda.html?tipo=receta' },
    { texto: 'Probador virtual', href: 'probador.html' },
    { texto: 'Turnos', href: 'turnos.html' }
  ];

  function paginaActual() {
    var p = location.pathname.split('/').pop() || 'index.html';
    return p;
  }

  function htmlLogo(claro) {
    return '<a class="logo" href="index.html" aria-label="' + U.esc(CONFIG.MARCA.nombre) + ' — inicio">' +
      I.logo +
      '<span class="logo__marca">' + U.esc(CONFIG.MARCA.nombre) + '</span>' +
      '</a>';
  }

  function montarCabecera() {
    var host = $('#cabecera');
    if (!host) return;
    var actual = paginaActual();

    host.className = 'cabecera';
    host.innerHTML =
      '<div class="envoltorio cabecera__barra">' +
      htmlLogo() +
      '<nav class="nav" aria-label="Principal">' +
      NAV.map(function (n) {
        var esActual = n.href.split('?')[0] === actual;
        return '<a class="nav__enlace" href="' + n.href + '"' + (esActual ? ' aria-current="page"' : '') + '>' + U.esc(n.texto) + '</a>';
      }).join('') +
      '</nav>' +
      '<div class="cabecera__acciones">' +
      '<a class="btn-icono no-movil" href="tienda.html" aria-label="Buscar">' + I.buscar + '</a>' +
      '<a class="btn-icono" href="cuenta.html" aria-label="Mi cuenta" id="btnCuenta">' + I.usuario + '</a>' +
      '<button class="btn-icono" id="btnCarrito" aria-label="Ver carrito">' + I.carrito +
      '<span class="contador" id="contadorCarrito">0</span></button>' +
      '<button class="btn-icono hamburguesa" id="btnMenu" aria-label="Abrir menú" aria-expanded="false">' + I.menu + '</button>' +
      '</div>' +
      '</div>';

    /* Menú móvil */
    var menu = document.createElement('div');
    menu.className = 'menu-movil';
    menu.id = 'menuMovil';
    menu.innerHTML =
      NAV.map(function (n) {
        return '<a class="menu-movil__enlace" href="' + n.href + '">' + U.esc(n.texto) + I.flecha + '</a>';
      }).join('') +
      '<a class="menu-movil__enlace" href="cuenta.html">Mi cuenta' + I.flecha + '</a>' +
      '<div class="mt-l"><a class="btn btn--acento btn--bloque" href="turnos.html">' + I.calendario + ' Reservar turno</a></div>';
    document.body.appendChild(menu);

    var btnMenu = $('#btnMenu');
    btnMenu.addEventListener('click', function () {
      var abierto = menu.classList.toggle('abierto');
      btnMenu.setAttribute('aria-expanded', String(abierto));
      btnMenu.innerHTML = abierto ? I.cerrar : I.menu;
      document.body.style.overflow = abierto ? 'hidden' : '';
    });

    /* Sombra al scrollear */
    var ultimo = -1;
    function alScrollear() {
      var y = window.scrollY;
      if (y === ultimo) return;
      ultimo = y;
      host.classList.toggle('pegada', y > 8);
    }
    window.addEventListener('scroll', alScrollear, { passive: true });
    alScrollear();

    /* Avatar si hay sesión */
    function pintarCuenta() {
      var u = Auth.usuario();
      var btn = $('#btnCuenta');
      if (!btn) return;
      if (u) {
        btn.innerHTML = u.foto
          ? '<img class="avatar" src="' + U.esc(u.foto) + '" alt="">'
          : '<span class="avatar avatar--letra">' + U.esc((u.nombre || '?').charAt(0).toUpperCase()) + '</span>';
        btn.setAttribute('aria-label', 'Mi cuenta — ' + u.nombre);
      } else {
        btn.innerHTML = I.usuario;
      }
    }
    Auth.on('cambio', pintarCuenta);
    pintarCuenta();
  }

  /* ============================================================
     Marquesina
     ============================================================ */
  function montarMarquesina() {
    $$('.marquesina').forEach(function (m) {
      var pista = m.querySelector('.marquesina__pista');
      if (!pista || pista.children.length > 1) return;
      var grupo = pista.firstElementChild;
      var copia = grupo.cloneNode(true);
      copia.setAttribute('aria-hidden', 'true');
      pista.appendChild(copia);
    });
  }

  /* ============================================================
     Cajón del carrito
     ============================================================ */
  var cajon, telon;

  function montarCajon() {
    telon = document.createElement('div');
    telon.className = 'telon';
    document.body.appendChild(telon);

    cajon = document.createElement('aside');
    cajon.className = 'cajon';
    cajon.id = 'cajonCarrito';
    cajon.setAttribute('role', 'dialog');
    cajon.setAttribute('aria-label', 'Carrito de compras');
    cajon.setAttribute('aria-modal', 'true');
    cajon.hidden = true;
    document.body.appendChild(cajon);

    telon.addEventListener('click', cerrarCarrito);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && cajon.classList.contains('abierto')) cerrarCarrito();
    });

    var btn = $('#btnCarrito');
    if (btn) btn.addEventListener('click', abrirCarrito);

    // Delegado y registrado UNA sola vez: pintarCajon() reemplaza el
    // contenido del cajón pero no el cajón, así que si lo enganchábamos
    // ahí adentro se apilaba un listener por repintado.
    cajon.addEventListener('click', function (e) {
      var accionEl = e.target.closest('[data-accion]');
      if (!accionEl || !cajon.contains(accionEl)) return;
      var linea = accionEl.closest('.linea-carrito');
      if (!linea) return;
      var id = linea.getAttribute('data-id');
      var item = Carrito.items().filter(function (i) { return i.id === id; })[0];
      if (!item) return;
      var accion = accionEl.getAttribute('data-accion');
      if (accion === 'quitar') Carrito.quitar(id);
      else if (accion === 'mas') Carrito.cantidad(id, item.cantidad + 1);
      else if (accion === 'menos') Carrito.cantidad(id, item.cantidad - 1);
    });

    Carrito.on('cambio', function () {
      actualizarContador();
      if (cajon.classList.contains('abierto')) pintarCajon();
    });
    Carrito.on('agregado', function (d) {
      aviso(Catalogo.nombreCompleto(d.producto) + ' agregado al carrito', 'exito');
      abrirCarrito();
    });
    actualizarContador();
  }

  function actualizarContador() {
    var c = $('#contadorCarrito');
    if (!c) return;
    var n = Carrito.unidades();
    c.textContent = n;
    c.classList.toggle('visible', n > 0);
  }

  function lineaCarrito(d) {
    var p = d.producto;
    var specs = Cristales.resumen(d.item.config);
    return '<div class="linea-carrito" data-id="' + U.esc(d.item.id) + '">' +
      '<div>' + medioProducto(p, { sombra: false }) + '</div>' +
      '<div>' +
      '<p class="linea-carrito__marca">' + U.esc((Catalogo.marca(p.marca) || {}).nombre || p.marca) + '</p>' +
      '<p class="linea-carrito__nombre">' + U.esc(p.modelo + (p.variante ? ' ' + p.variante : '')) + ' · ' + U.esc(p.colorNombre) + '</p>' +
      '<ul class="linea-carrito__specs">' +
      specs.map(function (s) { return '<li>' + U.esc(s) + '</li>'; }).join('') +
      '</ul>' +
      '<div class="linea-carrito__pie">' +
      '<div class="cantidad">' +
      '<button data-accion="menos" aria-label="Quitar uno">−</button>' +
      '<span class="cantidad__valor">' + d.item.cantidad + '</span>' +
      '<button data-accion="mas" aria-label="Sumar uno"' + (d.item.cantidad >= 10 ? ' disabled' : '') + '>+</button>' +
      '</div>' +
      '<span class="linea-carrito__precio">' + U.precio(d.subtotal) + '</span>' +
      '</div>' +
      '<button class="linea-carrito__quitar" data-accion="quitar">Quitar</button>' +
      '</div>' +
      '</div>';
  }

  function pintarCajon() {
    var t = Carrito.totales();
    var vacio = !t.detalles.length;

    cajon.innerHTML =
      '<div class="cajon__cabeza">' +
      '<h2 class="cajon__titulo">Tu carrito' + (t.unidades ? ' <span class="mono">(' + t.unidades + ')</span>' : '') + '</h2>' +
      '<button class="btn-icono" id="cerrarCajon" aria-label="Cerrar carrito">' + I.cerrar + '</button>' +
      '</div>' +
      '<div class="cajon__cuerpo">' +
      (vacio
        ? '<div class="vacio"><div class="vacio__icono">' + I.carrito + '</div>' +
        '<p>Todavía no elegiste nada.</p>' +
        '<a class="btn btn--fantasma btn--chico" href="tienda.html">Ver el catálogo</a></div>'
        : t.detalles.map(lineaCarrito).join('')) +
      '</div>' +
      (vacio ? '' :
        '<div class="cajon__pie">' +
        '<div class="totales">' +
        '<div class="totales__fila"><span>Subtotal</span><span>' + U.precio(t.bruto) + '</span></div>' +
        t.descuentos.map(function (d) {
          return '<div class="totales__fila totales__fila--promo"><span>' + U.esc(d.titulo) + '</span><span>−' + U.precio(d.monto) + '</span></div>';
        }).join('') +
        (t.bonificadoCristales ? '<div class="totales__fila totales__fila--promo"><span>Antirreflejo bonificado</span><span>−' + U.precio(t.bonificadoCristales) + '</span></div>' : '') +
        '<div class="totales__fila totales__fila--promo"><span>Envío</span><span>Sin cargo</span></div>' +
        '<div class="totales__fila totales__fila--total"><span>Total</span><span>' + U.precio(t.total) + '</span></div>' +
        '</div>' +
        '<p class="nota mt-s">' + CONFIG.PAGOS.cuotasSinInteres + ' cuotas sin interés de ' + U.cuota(t.total) + '</p>' +
        '<a class="btn btn--acento btn--bloque mt-m" href="checkout.html">Finalizar compra ' + I.flecha + '</a>' +
        '<a class="btn btn--fantasma btn--bloque mt-s" href="carrito.html">Ver el carrito completo</a>' +
        '</div>');

    var cerrar = $('#cerrarCajon');
    if (cerrar) cerrar.addEventListener('click', cerrarCarrito);
  }

  var focoPrevio = null;

  function abrirCarrito() {
    if (!cajon) return;
    focoPrevio = document.activeElement;
    cajon.hidden = false;
    pintarCajon();
    // Un frame para que la transición arranque desde el estado cerrado.
    requestAnimationFrame(function () {
      cajon.classList.add('abierto');
      telon.classList.add('abierto');
    });
    document.body.style.overflow = 'hidden';
    var cerrar = $('#cerrarCajon');
    if (cerrar) cerrar.focus();
  }

  function cerrarCarrito() {
    if (!cajon) return;
    cajon.classList.remove('abierto');
    telon.classList.remove('abierto');
    document.body.style.overflow = '';
    setTimeout(function () { cajon.hidden = true; }, 340);
    if (focoPrevio && focoPrevio.focus) focoPrevio.focus();
  }

  /* ============================================================
     Pie
     ============================================================ */
  function montarPie() {
    var host = $('#pie');
    if (!host) return;
    var m = CONFIG.MARCA;
    var anio = new Date().getFullYear();

    host.className = 'pie';
    host.innerHTML =
      '<div class="envoltorio">' +
      '<div class="pie__grilla">' +
      '<div class="pie__marca">' +
      htmlLogo(true) +
      '<p class="pie__lema">' + U.esc(m.bajada) + ' ' +
      'Vendemos ' + U.esc(m.marcaPropia) + ' y una selección de marcas que elegimos una por una.</p>' +
      '<div class="pie__redes mt-m">' +
      '<a class="btn-icono btn-icono--claro" href="' + U.esc(m.instagram) + '" aria-label="Instagram" target="_blank" rel="noopener">' + I.instagram + '</a>' +
      '<a class="btn-icono btn-icono--claro" href="https://wa.me/' + U.esc(m.whatsapp) + '" aria-label="WhatsApp" target="_blank" rel="noopener">' + I.whatsapp + '</a>' +
      '</div>' +
      '</div>' +
      '<div><p class="pie__titulo">Comprar</p><div class="pie__lista">' +
      '<a href="tienda.html?tipo=sol">Anteojos de sol</a>' +
      '<a href="tienda.html?tipo=receta">Anteojos de receta</a>' +
      '<a href="tienda.html?tags=mas-vendido">Más vendidos</a>' +
      '<a href="tienda.html?tags=nuevo">Novedades</a>' +
      '</div></div>' +
      '<div><p class="pie__titulo">Servicios</p><div class="pie__lista">' +
      '<a href="probador.html">Probador virtual</a>' +
      '<a href="turnos.html">Turno con oftalmólogo</a>' +
      '<a href="probador.html#dp">Medir tu distancia pupilar</a>' +
      '<a href="cuenta.html">Mi cuenta</a>' +
      '</div></div>' +
      '<div><p class="pie__titulo">Ayuda</p><div class="pie__lista">' +
      '<a href="https://wa.me/' + U.esc(m.whatsapp) + '" target="_blank" rel="noopener">Escribinos por WhatsApp</a>' +
      '<a href="mailto:' + U.esc(m.email) + '">' + U.esc(m.email) + '</a>' +
      '<a href="index.html#preguntas">Preguntas frecuentes</a>' +
      '<a href="index.html#preguntas">Cambios y devoluciones</a>' +
      '</div></div>' +
      '</div>' +
      '<div class="pie__abajo">' +
      '<span>© ' + anio + ' ' + U.esc(m.nombre) + '. ' + U.esc(m.direccion) + '.</span>' +
      '<span>' + U.esc(CONFIG.ENVIO.leyenda) + ' · ' + CONFIG.PAGOS.cuotasSinInteres + ' cuotas sin interés</span>' +
      '</div>' +
      '</div>';
  }

  /* ============================================================
     Revelar al scrollear
     ============================================================ */
  var observador;

  function revelar(raiz) {
    var nodos = $$('.revelar:not(.visible)', raiz || document);
    if (!nodos.length) return;

    if (U.reducido || !('IntersectionObserver' in window)) {
      nodos.forEach(function (n) { n.classList.add('visible'); });
      return;
    }

    if (!observador) {
      observador = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('visible');
          observador.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    }
    nodos.forEach(function (n) { observador.observe(n); });
  }

  /* ============================================================
     Acordeón
     ============================================================ */
  function montarAcordeon(raiz) {
    $$('.acordeon__boton', raiz || document).forEach(function (btn) {
      if (btn.dataset.listo) return;
      btn.dataset.listo = '1';
      btn.addEventListener('click', function () {
        var abierto = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!abierto));
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (panel) panel.classList.toggle('abierto', !abierto);
      });
    });
  }

  /* ============================================================
     Arranque
     ============================================================ */
  function iniciar() {
    // Capa de grano de película
    var grano = document.createElement('div');
    grano.className = 'grano';
    grano.setAttribute('aria-hidden', 'true');
    document.body.appendChild(grano);

    montarCabecera();
    montarPie();
    montarCajon();
    montarMarquesina();
    montarAcordeon();
    revelar();
  }

  global.UI = {
    I: I,
    iniciar: iniciar,
    aviso: aviso,
    tarjetaProducto: tarjetaProducto,
    medioProducto: medioProducto,
    etiquetasDe: etiquetasDe,
    placaDe: placaDe,
    revelar: revelar,
    montarAcordeon: montarAcordeon,
    abrirCarrito: abrirCarrito,
    cerrarCarrito: cerrarCarrito
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window);
