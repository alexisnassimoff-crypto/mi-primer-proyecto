/* ============================================================
   OJO — Mi cuenta
   ------------------------------------------------------------
   Pedidos, recetas guardadas y turnos. Los datos salen de
   Auth.Cuenta, que hoy guarda en localStorage por usuario.
   ============================================================ */
(function () {
  'use strict';

  var $ = U.$, $$ = U.$$, I = UI.I;
  var tabActual = 'pedidos';

  /* ============================================================
     Pedidos
     ============================================================ */
  var ESTADOS = {
    demo: { texto: 'De prueba', clase: 'etiqueta--suave' },
    pendiente: { texto: 'Pago pendiente', clase: 'etiqueta--oro' },
    pagado: { texto: 'Pagado', clase: 'etiqueta--salvia' },
    enviado: { texto: 'En camino', clase: 'etiqueta--acento' },
    entregado: { texto: 'Entregado', clase: 'etiqueta--suave' }
  };

  function htmlPedidos() {
    var lista = Auth.Cuenta.pedidos();
    if (!lista.length) {
      return vacio('Todavía no hiciste ningún pedido',
        'Cuando compres algo va a aparecer acá, con su estado y su seguimiento.',
        'tienda.html', 'Ver el catálogo');
    }

    return lista.map(function (p) {
      var e = ESTADOS[p.estado] || ESTADOS.pendiente;
      var fecha = new Date(p.fecha);
      return '<div class="tarjeta">' +
        '<div class="tarjeta__cabeza">' +
        '<div><h3 style="font-size:1.1rem">Pedido ' + U.esc(p.numero) + '</h3>' +
        '<p class="nota">' + U.esc(U.fecha(fecha)) + '</p></div>' +
        '<span class="etiqueta ' + e.clase + '">' + U.esc(e.texto) + '</span>' +
        '</div>' +
        p.items.map(function (i) {
          return '<div class="totales__fila">' +
            '<span>' + U.esc(i.titulo) + (i.cantidad > 1 ? ' × ' + i.cantidad : '') +
            (i.cristales && i.cristales.length
              ? '<br><span class="nota">' + U.esc(i.cristales.join(' · ')) + '</span>'
              : '') +
            '</span><span>' + U.precio(i.subtotal) + '</span></div>';
        }).join('') +
        '<div class="totales__fila totales__fila--total"><span>Total</span><span>' + U.precio(p.total) + '</span></div>' +
        (p.comprador && p.comprador.entrega === 'retiro'
          ? '<p class="nota mt-m">Retiro en ' + U.esc(CONFIG.ENVIO.retiroEnLocal.direccion) + '</p>'
          : p.comprador && p.comprador.direccion
            ? '<p class="nota mt-m">Envío a ' + U.esc(p.comprador.direccion.calle) + ', ' +
            U.esc(p.comprador.direccion.ciudad) + '</p>'
            : '') +
        '<div class="fila fila--envuelve mt-m">' +
        '<a class="enlace" href="https://wa.me/' + CONFIG.MARCA.whatsapp + '?text=' +
        encodeURIComponent('Hola! Consulto por el pedido ' + p.numero) +
        '" target="_blank" rel="noopener">Consultar por este pedido ' + I.flecha + '</a>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  /* ============================================================
     Recetas
     ============================================================ */
  function celdaOjo(etiqueta, o) {
    return '<div class="receta-guardada__celda">' +
      '<p class="receta-guardada__ojo">' + etiqueta + '</p>' +
      '<p class="receta-guardada__valor">' + Cristales.fmtValor(o.esf) +
      (Cristales.num(o.cil) ? ' ' + Cristales.fmtValor(o.cil) + ' × ' + U.esc(o.eje || '—') : '') +
      '</p>' +
      (Cristales.num(o.adicion) ? '<p class="nota">Adición ' + Cristales.fmtValor(o.adicion) + '</p>' : '') +
      '</div>';
  }

  function htmlRecetas() {
    var lista = Auth.Cuenta.recetas();
    if (!lista.length) {
      return vacio('No tenés recetas guardadas',
        'Cuando compres anteojos con graduación, guardamos la receta acá para que no tengas que cargarla de nuevo.',
        'tienda.html?tipo=receta', 'Comprar con receta');
    }

    return lista.map(function (r) {
      return '<div class="tarjeta" data-receta="' + U.esc(r.id) + '">' +
        '<div class="tarjeta__cabeza">' +
        '<div><h3 style="font-size:1.1rem">' + U.esc(r.etiqueta) + '</h3>' +
        '<p class="nota">Guardada el ' + U.esc(U.fecha(new Date(r.fecha))) + '</p></div>' +
        '<button class="linea-carrito__quitar" data-accion="borrar-receta">Borrar</button>' +
        '</div>' +
        '<div class="receta-guardada">' +
        celdaOjo('Ojo derecho', r.receta.od || {}) +
        celdaOjo('Ojo izquierdo', r.receta.oi || {}) +
        (r.receta.dp
          ? '<div class="receta-guardada__celda"><p class="receta-guardada__ojo">Distancia pupilar</p>' +
          '<p class="receta-guardada__valor">' + U.esc(r.receta.dp) + ' mm</p></div>'
          : '') +
        '</div>' +
        '<p class="nota mt-m">' + U.esc(CONFIG.LEGAL.recetaVigencia) + '</p>' +
        '</div>';
    }).join('');
  }

  /* ============================================================
     Turnos
     ============================================================ */
  function htmlTurnos() {
    var lista = Auth.Cuenta.turnos();
    if (!lista.length) {
      return vacio('No tenés turnos reservados',
        'Reservá un control de visión: es sin cargo si comprás los anteojos con nosotros.',
        'turnos.html', 'Reservar turno');
    }

    var ahora = new Date();
    return lista.map(function (t) {
      var fecha = new Date(t.fecha);
      var pasado = fecha < ahora;
      return '<div class="tarjeta">' +
        '<div class="tarjeta__cabeza">' +
        '<div><h3 style="font-size:1.1rem">' + U.esc(t.tipoNombre) + '</h3>' +
        '<p class="nota">Turno ' + U.esc(t.numero) + '</p></div>' +
        '<span class="etiqueta ' + (pasado ? 'etiqueta--suave' : 'etiqueta--salvia') + '">' +
        (pasado ? 'Ya pasó' : 'Próximo') + '</span>' +
        '</div>' +
        '<div class="totales__fila"><span>Día</span><span>' + U.esc(t.fechaTexto || U.fecha(fecha)) + '</span></div>' +
        '<div class="totales__fila"><span>Hora</span><span>' + U.esc(t.hora) + '</span></div>' +
        '<div class="totales__fila"><span>Sede</span><span>' + U.esc(t.sedeNombre) + '</span></div>' +
        '<div class="totales__fila"><span>Profesional</span><span>' + U.esc(t.profesional) + '</span></div>' +
        (pasado ? '' :
          '<div class="fila fila--envuelve mt-m">' +
          '<a class="enlace" href="https://wa.me/' + CONFIG.MARCA.whatsapp + '?text=' +
          encodeURIComponent('Hola! Necesito reprogramar el turno ' + t.numero) +
          '" target="_blank" rel="noopener">Reprogramar o cancelar ' + I.flecha + '</a></div>') +
        '</div>';
    }).join('');
  }

  /* ============================================================
     Vacíos
     ============================================================ */
  function vacio(titulo, texto, href, cta) {
    return '<div class="vacio">' +
      '<h3>' + U.esc(titulo) + '</h3>' +
      '<p class="bajada" style="margin-inline:auto">' + U.esc(texto) + '</p>' +
      '<a class="btn btn--acento mt-m" href="' + href + '">' + U.esc(cta) + '</a>' +
      '</div>';
  }

  /* ============================================================
     Render
     ============================================================ */
  function pintarPerfil() {
    var u = Auth.usuario();
    if (!u) return;
    $('#perfil').innerHTML =
      (u.foto ? '<img class="avatar" src="' + U.esc(u.foto) + '" alt="">'
        : '<span class="avatar avatar--letra">' + U.esc((u.nombre || '?').charAt(0).toUpperCase()) + '</span>') +
      '<div><p class="cuenta__nombre">' + U.esc(u.nombre) + '</p>' +
      '<p class="cuenta__mail">' + U.esc(u.email || '') + '</p></div>';
  }

  function pintarContenido() {
    var html = tabActual === 'recetas' ? htmlRecetas()
      : tabActual === 'turnos' ? htmlTurnos()
        : htmlPedidos();
    $('#contenido').innerHTML = html;

    $$('.cuenta__tab').forEach(function (b) {
      b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === tabActual));
    });
  }

  function pintar() {
    var logueado = Auth.logueado();
    $('#anonimo').hidden = logueado;
    $('#panel').hidden = !logueado;

    if (!logueado) {
      Auth.montarBoton($('#zonaGoogleCuenta'), { texto: 'signin_with', oneTap: true });
      return;
    }
    pintarPerfil();
    pintarContenido();
  }

  /* ============================================================
     Eventos
     ============================================================ */
  $$('.cuenta__tab').forEach(function (b) {
    b.addEventListener('click', function () {
      tabActual = b.getAttribute('data-tab');
      pintarContenido();
    });
  });

  $('#contenido').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-accion="borrar-receta"]');
    if (!btn) return;
    var tarjeta = btn.closest('[data-receta]');
    if (!tarjeta) return;
    Auth.Cuenta.borrarReceta(tarjeta.getAttribute('data-receta'));
    pintarContenido();
    UI.aviso('Receta borrada');
  });

  $('#salir').addEventListener('click', function () {
    Auth.salir();
    UI.aviso('Cerraste sesión');
  });

  Auth.on('cambio', pintar);
  pintar();
})();
