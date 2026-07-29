/* ============================================================
   OJO — Página del carrito
   ============================================================ */
(function () {
  'use strict';

  var $ = U.$, $$ = U.$$, I = UI.I;

  function htmlLinea(d) {
    var p = d.producto;
    var specs = Cristales.resumen(d.item.config);
    var promoAr = d.bonificado > 0;

    return '<div class="tarjeta" data-id="' + U.esc(d.item.id) + '" style="margin-bottom:12px">' +
      '<div class="linea-carrito" style="border:0;padding:0;grid-template-columns:120px 1fr">' +
      '<div>' + UI.medioProducto(p, { sombra: false }) + '</div>' +
      '<div>' +
      '<p class="linea-carrito__marca">' + U.esc((Catalogo.marca(p.marca) || {}).nombre || p.marca) + '</p>' +
      '<h3 class="producto__nombre">' +
      '<a href="producto.html?sku=' + encodeURIComponent(p.sku) + '">' +
      U.esc(p.modelo + (p.variante ? ' ' + p.variante : '')) + '</a></h3>' +
      '<p class="producto__color">' + U.esc(p.colorNombre) + '</p>' +
      '<ul class="linea-carrito__specs">' +
      specs.map(function (s) { return '<li>' + U.esc(s) + '</li>'; }).join('') +
      (promoAr ? '<li style="color:var(--exito)">Antirreflejo bonificado (−' + U.precio(d.bonificado) + ')</li>' : '') +
      '</ul>' +
      '<div class="linea-carrito__pie">' +
      '<div class="cantidad">' +
      '<button data-accion="menos" aria-label="Quitar uno">−</button>' +
      '<span class="cantidad__valor">' + d.item.cantidad + '</span>' +
      '<button data-accion="mas" aria-label="Sumar uno"' + (d.item.cantidad >= 10 ? ' disabled' : '') + '>+</button>' +
      '</div>' +
      '<div style="text-align:right">' +
      '<p class="linea-carrito__precio">' + U.precio(d.subtotal) + '</p>' +
      (d.item.cantidad > 1 ? '<p class="nota">' + U.precio(d.unitario) + ' c/u</p>' : '') +
      '</div>' +
      '</div>' +
      '<button class="linea-carrito__quitar mt-s" data-accion="quitar">Quitar del carrito</button>' +
      '</div></div></div>';
  }

  function htmlResumen(t) {
    var cupon = Carrito.cuponActivo();
    return '<aside class="checkout__resumen">' +
      '<h2 style="font-size:1.5rem">Resumen</h2>' +

      '<div class="cupon">' +
      '<input class="entrada" id="cupon" placeholder="Cupón de descuento" ' +
      'value="' + U.esc(cupon || '') + '" aria-label="Código de cupón"' + (cupon ? ' readonly' : '') + '>' +
      '<button class="btn btn--fantasma" id="btnCupon">' + (cupon ? 'Quitar' : 'Aplicar') + '</button>' +
      '</div>' +
      '<div id="mensajeCupon"></div>' +

      '<div class="totales mt-m">' +
      '<div class="totales__fila"><span>Subtotal</span><span>' + U.precio(t.bruto) + '</span></div>' +
      t.descuentos.map(function (d) {
        return '<div class="totales__fila totales__fila--promo"><span>' + U.esc(d.titulo) + '</span><span>−' + U.precio(d.monto) + '</span></div>';
      }).join('') +
      (t.bonificadoCristales ? '<div class="totales__fila totales__fila--promo"><span>Antirreflejo bonificado</span><span>−' + U.precio(t.bonificadoCristales) + '</span></div>' : '') +
      '<div class="totales__fila totales__fila--promo"><span>Envío a todo el país</span><span>Sin cargo</span></div>' +
      '<div class="totales__fila totales__fila--total"><span>Total</span><span>' + U.precio(t.total) + '</span></div>' +
      '</div>' +

      (t.ahorro > 0 ? '<p class="nota nota--exito mt-s">Estás ahorrando ' + U.precio(t.ahorro) + '</p>' : '') +
      '<p class="nota mt-s">' + CONFIG.PAGOS.cuotasSinInteres + ' cuotas sin interés de ' + U.cuota(t.total) + '</p>' +

      '<a class="btn btn--acento btn--bloque btn--grande mt-m" href="checkout.html">Finalizar compra ' + I.flecha + '</a>' +
      '<a class="btn btn--fantasma btn--bloque mt-s" href="tienda.html">Seguir mirando</a>' +

      '<div class="medios-pago mt-m">' +
      CONFIG.PAGOS.medios.map(function (x) { return '<span class="medio">' + U.esc(x) + '</span>'; }).join('') +
      '</div>' +
      '</aside>';
  }

  function pintar() {
    var t = Carrito.totales();
    var host = $('#contenido');

    if (!t.detalles.length) {
      host.className = '';
      host.innerHTML =
        '<div class="vacio" style="grid-column:1/-1">' +
        '<div class="vacio__icono">' + I.carrito + '</div>' +
        '<h2>Tu carrito está vacío</h2>' +
        '<p class="bajada" style="margin-inline:auto">Todavía no elegiste nada. Arrancá por el catálogo o probate algo con la cámara.</p>' +
        '<div class="fila fila--envuelve fila--centro mt-m">' +
        '<a class="btn btn--acento" href="tienda.html">Ver el catálogo</a>' +
        '<a class="btn btn--fantasma" href="probador.html">Ir al probador</a>' +
        '</div></div>';
      $('#seccionSugeridos').hidden = true;
      return;
    }

    host.className = 'checkout';
    host.innerHTML =
      '<div>' + t.detalles.map(htmlLinea).join('') +
      '<p class="nota mt-m">' + U.esc(CONFIG.ENVIO.leyenda) + '. ' +
      'AMBA en ' + U.esc(CONFIG.ENVIO.plazoAMBA) + ', interior ' + U.esc(CONFIG.ENVIO.plazoInterior) + '. ' +
      U.esc(CONFIG.ENVIO.plazoConReceta) + ' si llevás cristales de receta.</p>' +
      '</div>' +
      htmlResumen(t);

    engancharCupon();
    pintarSugeridos(t);
  }

  function engancharCupon() {
    var btn = $('#btnCupon');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (Carrito.cuponActivo()) {
        Carrito.quitarCupon();
        UI.aviso('Cupón quitado');
        return;
      }
      var r = Carrito.aplicarCupon($('#cupon').value);
      var msg = $('#mensajeCupon');
      if (r.ok) {
        UI.aviso(r.mensaje, 'exito');
      } else {
        msg.innerHTML = '<p class="campo__error">' + U.esc(r.mensaje) + '</p>';
      }
    });

    var input = $('#cupon');
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); $('#btnCupon').click(); }
      });
    }
  }

  /* Sugerencias para aprovechar el 2do par al 50%: se muestran sólo
     cuando falta un armazón para que la promo se active. */
  function pintarSugeridos(t) {
    var seccion = $('#seccionSugeridos');
    if (t.unidades !== 1) { seccion.hidden = true; return; }

    var actual = t.detalles[0].producto;
    var lista = Catalogo.relacionados(actual, 4);
    if (!lista.length) { seccion.hidden = true; return; }

    seccion.hidden = false;
    $('#sugeridos').innerHTML = lista.map(UI.tarjetaProducto).join('');
    UI.revelar($('#sugeridos'));
  }

  /* Delegado una sola vez sobre el contenedor estable. */
  $('#contenido').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-accion]');
    if (!btn) return;
    var tarjeta = btn.closest('[data-id]');
    if (!tarjeta) return;
    var id = tarjeta.getAttribute('data-id');
    var item = Carrito.items().filter(function (i) { return i.id === id; })[0];
    if (!item) return;

    var accion = btn.getAttribute('data-accion');
    if (accion === 'quitar') Carrito.quitar(id);
    else if (accion === 'mas') Carrito.cantidad(id, item.cantidad + 1);
    else if (accion === 'menos') Carrito.cantidad(id, item.cantidad - 1);
  });

  Carrito.on('cambio', pintar);
  pintar();
})();
