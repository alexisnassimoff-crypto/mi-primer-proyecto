/* ============================================================
   OJO — Post-compra
   ------------------------------------------------------------
   Se llega acá de dos formas:
     · desde el checkout en modo demo (?demo=1)
     · de vuelta desde Mercado Pago, que agrega ?status=…
   ============================================================ */
(function () {
  'use strict';

  var $ = U.$, I = UI.I;
  var p = U.params();

  var numero = p.get('pedido') || p.get('external_reference') || '';
  var estadoMp = p.get('status') || p.get('collection_status');
  var esDemo = p.get('demo') === '1';

  var pedido = U.Guardado.leer('ojo.ultimo-pedido', null);
  if (pedido && numero && pedido.numero !== numero) pedido = null;
  if (pedido && !numero) numero = pedido.numero;

  /* Mercado Pago puede volver con pago rechazado o pendiente:
     no hay que felicitar a nadie en ese caso. */
  var ESTADOS = {
    approved: { ok: true, titulo: '¡Listo! Tu pedido está <em class="ital">confirmado</em>', texto: 'Nos llegó el pago. Ya estamos preparando todo.' },
    pending: { ok: null, titulo: 'Tu pago está <em class="ital">en proceso</em>', texto: 'Cuando se acredite te avisamos por WhatsApp y arrancamos con el pedido. Si pagaste en efectivo, puede demorar hasta 3 días hábiles.' },
    in_process: { ok: null, titulo: 'Tu pago está <em class="ital">en revisión</em>', texto: 'Mercado Pago lo está revisando. Te avisamos apenas se defina.' },
    rejected: { ok: false, titulo: 'El pago fue <em class="ital">rechazado</em>', texto: 'No se hizo ningún cargo. Podés intentar con otro medio de pago.' },
    failure: { ok: false, titulo: 'No pudimos <em class="ital">cobrar</em>', texto: 'No se hizo ningún cargo. Probá de nuevo o escribinos y lo resolvemos juntos.' }
  };

  var estado = esDemo
    ? { ok: true, titulo: 'Pedido de <em class="ital">prueba</em> generado', texto: 'Esto es el modo demo: no se cobró nada. Así va a ver el cliente la pantalla después de pagar.' }
    : (ESTADOS[estadoMp] || ESTADOS.approved);

  function htmlWhatsapp() {
    var msg = 'Hola! Acabo de hacer el pedido ' + (numero || '') + '.';
    return 'https://wa.me/' + CONFIG.MARCA.whatsapp + '?text=' + encodeURIComponent(msg);
  }

  function htmlResumenPedido() {
    if (!pedido) return '';
    return '<div class="tarjeta mt-l" style="text-align:left;width:100%;max-width:520px">' +
      '<div class="tarjeta__cabeza"><h3 style="font-size:1.15rem">Qué pediste</h3>' +
      '<span class="etiqueta etiqueta--suave">' + pedido.items.length + ' artículo' + (pedido.items.length === 1 ? '' : 's') + '</span></div>' +
      pedido.items.map(function (i) {
        return '<div class="totales__fila"><span>' + U.esc(i.titulo) +
          (i.cantidad > 1 ? ' × ' + i.cantidad : '') + '</span><span>' + U.precio(i.subtotal) + '</span></div>';
      }).join('') +
      '<div class="totales__fila totales__fila--promo"><span>Envío</span><span>Sin cargo</span></div>' +
      '<div class="totales__fila totales__fila--total"><span>Total</span><span>' + U.precio(pedido.total) + '</span></div>' +
      (pedido.comprador && pedido.comprador.entrega === 'retiro'
        ? '<p class="nota mt-m">Retirás en ' + U.esc(CONFIG.ENVIO.retiroEnLocal.direccion) + '.</p>'
        : pedido.comprador && pedido.comprador.direccion
          ? '<p class="nota mt-m">Enviamos a ' + U.esc(pedido.comprador.direccion.calle) + ', ' +
          U.esc(pedido.comprador.direccion.ciudad) + ', ' + U.esc(pedido.comprador.direccion.provincia) + '.</p>'
          : '') +
      '</div>';
  }

  function htmlProximosPasos() {
    var conReceta = pedido && pedido.items.some(function (i) {
      return (i.cristales || []).some(function (c) { return /Receta|OD /.test(c); });
    });

    var pasos = [
      'Te mandamos el detalle por email.',
      conReceta
        ? 'Revisamos tu receta y armamos los cristales en taller (' + CONFIG.ENVIO.plazoConReceta.toLowerCase() + ').'
        : 'Preparamos tu pedido en el día.',
      'Te avisamos por WhatsApp con el código de seguimiento cuando salga.'
    ];

    return '<div class="tarjeta mt-m" style="text-align:left;width:100%;max-width:520px">' +
      '<h3 style="font-size:1.15rem">Qué pasa ahora</h3>' +
      '<ol class="columna mt-m">' +
      pasos.map(function (t, i) {
        return '<li class="fila" style="align-items:flex-start;gap:11px">' +
          '<span class="config__num" style="flex:none">' + (i + 1) + '</span>' +
          '<span style="font-size:.88rem;color:var(--tinta-2);line-height:1.5">' + U.esc(t) + '</span></li>';
      }).join('') +
      '</ol></div>';
  }

  function pintar() {
    var marca = estado.ok === false
      ? '<div class="gracias__marca" style="background:var(--error)">' + UI.I.cerrar + '</div>'
      : estado.ok === null
        ? '<div class="gracias__marca" style="background:var(--oro);color:var(--negro)">' + UI.I.info + '</div>'
        : '<div class="gracias__marca">' + UI.I.tildeGrande + '</div>';

    $('#gracias').innerHTML =
      marca +
      '<h1>' + estado.titulo + '</h1>' +
      '<p class="bajada mt-m" style="margin-inline:auto">' + U.esc(estado.texto) + '</p>' +
      (numero ? '<p class="gracias__numero">Pedido ' + U.esc(numero) + '</p>' : '') +

      (estado.ok === false
        ? '<div class="fila fila--envuelve fila--centro mt-l">' +
        '<a class="btn btn--acento" href="carrito.html">Volver a intentar</a>' +
        '<a class="btn btn--fantasma" href="' + htmlWhatsapp() + '" target="_blank" rel="noopener">Escribinos</a>' +
        '</div>'
        : htmlResumenPedido() + htmlProximosPasos() +
        '<div class="fila fila--envuelve fila--centro mt-l">' +
        '<a class="btn btn--acento" href="cuenta.html">Ver mis pedidos</a>' +
        '<a class="btn btn--fantasma" href="tienda.html">Seguir mirando</a>' +
        '</div>' +
        '<p class="nota mt-m">¿Alguna duda? <a class="enlace" href="' + htmlWhatsapp() + '" target="_blank" rel="noopener">Escribinos por WhatsApp</a></p>');

    document.title = (estado.ok === false ? 'Pago rechazado' : '¡Gracias por tu compra!') + ' — ' + CONFIG.MARCA.nombre;
  }

  function pintarSugeridos() {
    var base = pedido && pedido.items.length ? Catalogo.porSku(pedido.items[0].sku) : null;
    var lista = base ? Catalogo.relacionados(base, 4) : Catalogo.destacados(4);
    $('#sugeridos').innerHTML = lista.map(UI.tarjetaProducto).join('');
    UI.revelar($('#sugeridos'));
  }

  /* Si volvemos de Mercado Pago con el pago aprobado, el carrito
     todavía tiene los artículos: hay que vaciarlo acá. */
  if (!esDemo && (estadoMp === 'approved' || estadoMp === 'pending') && Carrito.items().length) {
    Carrito.vaciar();
  }

  pintar();
  pintarSugeridos();
})();
