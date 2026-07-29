/* ============================================================
   OJO — Checkout
   ------------------------------------------------------------
   El front arma el pedido y se lo manda a /api/checkout, que es
   quien habla con Mercado Pago. El ACCESS TOKEN nunca baja al
   navegador: vive como variable de entorno en el servidor.

   Con CONFIG.PAGOS.simulado = true no se llama a nadie: se genera
   una orden local y se salta a gracias.html, para poder probar
   todo el recorrido sin credenciales.
   ============================================================ */
(function () {
  'use strict';

  var $ = U.$, $$ = U.$$, I = UI.I;

  var PROVINCIAS = ['Ciudad Autónoma de Buenos Aires', 'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut',
    'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza',
    'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
    'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'];

  var CLAVE_DATOS = 'ojo.datos-envio';

  /* ---------- Carrito vacío ---------- */
  if (!Carrito.items().length) {
    $('#formulario').hidden = true;
    $('#vacio').hidden = false;
    return;
  }

  /* ============================================================
     Textos que salen de la config
     ============================================================ */
  function pintarTextos() {
    $('#ayudaEntrega').textContent = CONFIG.ENVIO.leyenda + ', sin monto mínimo.';
    $('#detalleEnvio').textContent =
      'AMBA en ' + CONFIG.ENVIO.plazoAMBA + ' · Interior en ' + CONFIG.ENVIO.plazoInterior + '.';
    $('#detalleRetiro').textContent =
      CONFIG.ENVIO.retiroEnLocal.direccion + '. ' + CONFIG.ENVIO.retiroEnLocal.plazo + '.';

    $('#ayudaPago').textContent =
      'Te llevamos a Mercado Pago para completar el pago de forma segura. ' +
      'Hasta ' + CONFIG.PAGOS.cuotasSinInteres + ' cuotas sin interés.';

    $('#mediosPago').innerHTML = CONFIG.PAGOS.medios.map(function (m) {
      return '<span class="medio">' + U.esc(m) + '</span>';
    }).join('');

    if (CONFIG.PAGOS.simulado) {
      $('#avisoSimulado').innerHTML =
        '<div class="recomendacion mt-m">' +
        '<span class="recomendacion__icono">' + I.info + '</span>' +
        '<span><strong>Modo demo.</strong> No se cobra nada: se genera un pedido de prueba. ' +
        'Para activar los pagos reales hay que cargar <code>MP_ACCESS_TOKEN</code> en Vercel y poner ' +
        '<code>simulado: false</code> en <code>js/config.js</code>.</span></div>';
    }

    var sel = $('#provincia');
    sel.innerHTML = '<option value="">Elegí una provincia</option>' +
      PROVINCIAS.map(function (p) { return '<option>' + U.esc(p) + '</option>'; }).join('');

    if (!CONFIG.ENVIO.retiroEnLocal.activo) {
      var op = $('input[name="entrega"][value="retiro"]');
      if (op) op.closest('.opcion').remove();
    }
  }

  /* ============================================================
     Sesión con Google
     ============================================================ */
  function pintarIdentidad() {
    var u = Auth.usuario();
    var zonaG = $('#zonaGoogle'), zonaU = $('#zonaUsuario');

    if (u) {
      zonaG.hidden = true;
      zonaU.hidden = false;
      zonaU.innerHTML =
        '<div class="tarjeta"><div class="fila">' +
        (u.foto ? '<img class="avatar" src="' + U.esc(u.foto) + '" alt="">'
          : '<span class="avatar avatar--letra">' + U.esc((u.nombre || '?').charAt(0).toUpperCase()) + '</span>') +
        '<div class="crece"><p class="cuenta__nombre">' + U.esc(u.nombre) + '</p>' +
        '<p class="cuenta__mail">' + U.esc(u.email || '') + '</p></div>' +
        '<button type="button" class="enlace" id="salir">Salir</button>' +
        '</div></div>';
      $('#salir').addEventListener('click', function () { Auth.salir(); });

      if (!$('#nombre').value) $('#nombre').value = u.nombre || '';
      if (!$('#email').value) $('#email').value = u.email || '';
    } else {
      zonaU.hidden = true;
      zonaG.hidden = false;
      Auth.montarBoton(zonaG, { texto: 'continue_with' });
    }
  }

  /* ============================================================
     Resumen
     ============================================================ */
  function pintarResumen() {
    var t = Carrito.totales();

    $('#resumen').innerHTML =
      '<h2 style="font-size:1.4rem">Tu pedido</h2>' +
      '<div class="checkout__items mt-m">' +
      t.detalles.map(function (d) {
        var specs = Cristales.resumen(d.item.config);
        return '<div class="linea-carrito">' +
          '<div>' + UI.medioProducto(d.producto, { sombra: false }) + '</div>' +
          '<div><p class="linea-carrito__nombre">' +
          U.esc(Catalogo.nombreCompleto(d.producto)) +
          (d.item.cantidad > 1 ? ' × ' + d.item.cantidad : '') + '</p>' +
          '<p class="linea-carrito__marca" style="margin-top:3px">' + U.esc(d.producto.colorNombre) + '</p>' +
          '<ul class="linea-carrito__specs">' +
          specs.map(function (s) { return '<li>' + U.esc(s) + '</li>'; }).join('') +
          '</ul>' +
          '<p class="linea-carrito__precio mt-s">' + U.precio(d.subtotal) + '</p>' +
          '</div></div>';
      }).join('') +
      '</div>' +

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

      '<button class="btn btn--acento btn--bloque btn--grande mt-m" type="submit" id="pagar">' +
      'Ir a pagar ' + I.flecha + '</button>' +
      '<a class="btn btn--fantasma btn--bloque mt-s" href="carrito.html">Volver al carrito</a>' +
      '<p class="nota mt-m">Al confirmar aceptás nuestra política de cambios: ' +
      U.esc(CONFIG.LEGAL.cambios) + '</p>';
  }

  /* ============================================================
     Entrega
     ============================================================ */
  function alternarEntrega() {
    var retiro = $('input[name="entrega"]:checked').value === 'retiro';
    $('#camposEnvio').hidden = retiro;
  }

  /* ============================================================
     Validación
     ============================================================ */
  var OBLIGATORIOS_BASE = ['nombre', 'email', 'telefono', 'dni'];
  var OBLIGATORIOS_ENVIO = ['calle', 'cp', 'ciudad', 'provincia'];

  function validar() {
    var errores = [];
    var retiro = $('input[name="entrega"]:checked').value === 'retiro';
    var campos = OBLIGATORIOS_BASE.concat(retiro ? [] : OBLIGATORIOS_ENVIO);

    $$('.entrada, .select').forEach(function (el) { el.removeAttribute('aria-invalid'); });

    campos.forEach(function (id) {
      var el = $('#' + id);
      if (!el || el.value.trim()) return;
      el.setAttribute('aria-invalid', 'true');
      var label = $('label[for="' + id + '"]');
      errores.push('Falta completar ' + (label ? label.textContent.replace('*', '').trim().toLowerCase() : id) + '.');
    });

    var email = $('#email').value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      $('#email').setAttribute('aria-invalid', 'true');
      errores.push('Ese email no parece válido.');
    }

    var tel = $('#telefono').value.replace(/\D/g, '');
    if (tel && tel.length < 8) {
      $('#telefono').setAttribute('aria-invalid', 'true');
      errores.push('El WhatsApp parece incompleto.');
    }

    var dni = $('#dni').value.replace(/\D/g, '');
    if (dni && (dni.length < 7 || dni.length > 8)) {
      $('#dni').setAttribute('aria-invalid', 'true');
      errores.push('El DNI tiene que tener 7 u 8 dígitos.');
    }

    return errores;
  }

  function mostrarErrores(errores) {
    var host = $('#errores');
    if (!errores.length) { host.innerHTML = ''; return; }
    host.innerHTML = '<div class="campo__error" style="padding:14px 0">' +
      errores.map(function (e) { return '<p>· ' + U.esc(e) + '</p>'; }).join('') + '</div>';
    var primero = $('[aria-invalid="true"]');
    if (primero) {
      primero.focus();
      primero.scrollIntoView({ behavior: U.reducido ? 'auto' : 'smooth', block: 'center' });
    }
  }

  /* ============================================================
     Datos del comprador
     ============================================================ */
  function leerFormulario() {
    var retiro = $('input[name="entrega"]:checked').value === 'retiro';
    return {
      nombre: $('#nombre').value.trim(),
      email: $('#email').value.trim(),
      telefono: $('#telefono').value.trim(),
      dni: $('#dni').value.replace(/\D/g, ''),
      entrega: retiro ? 'retiro' : 'envio',
      direccion: retiro ? null : {
        calle: $('#calle').value.trim(),
        piso: $('#piso').value.trim(),
        cp: $('#cp').value.trim(),
        ciudad: $('#ciudad').value.trim(),
        provincia: $('#provincia').value,
        notas: $('#notas').value.trim()
      }
    };
  }

  function precargarDatos() {
    var guardado = U.Guardado.leer(CLAVE_DATOS, null);
    if (!guardado) return;
    ['nombre', 'email', 'telefono', 'dni'].forEach(function (k) {
      if (guardado[k]) $('#' + k).value = guardado[k];
    });
    if (guardado.direccion) {
      ['calle', 'piso', 'cp', 'ciudad', 'notas'].forEach(function (k) {
        if (guardado.direccion[k]) $('#' + k).value = guardado.direccion[k];
      });
      if (guardado.direccion.provincia) $('#provincia').value = guardado.direccion.provincia;
    }
  }

  /* ============================================================
     Envío del pedido
     ============================================================ */
  function numeroDePedido() {
    var n = new Date();
    return 'OJO-' + String(n.getFullYear()).slice(2) +
      String(n.getMonth() + 1).padStart(2, '0') +
      String(n.getDate()).padStart(2, '0') + '-' +
      Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function pagar(e) {
    e.preventDefault();

    var errores = validar();
    if (errores.length) return mostrarErrores(errores);
    mostrarErrores([]);

    var comprador = leerFormulario();
    U.Guardado.escribir(CLAVE_DATOS, comprador);

    var pedido = Carrito.paraCheckout();
    pedido.comprador = comprador;
    pedido.numero = numeroDePedido();

    var btn = $('#pagar');
    btn.disabled = true;
    btn.textContent = 'Generando el pago…';

    /* ---- Modo demo: no se llama a nadie ---- */
    if (CONFIG.PAGOS.simulado) {
      finalizar(pedido, 'demo');
      return;
    }

    /* ---- Real: el servidor arma la preference ---- */
    fetch(CONFIG.PAGOS.endpointCheckout, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido)
    })
      .then(function (r) {
        if (!r.ok) return r.json().then(function (j) { throw new Error(j.error || 'Error del servidor'); });
        return r.json();
      })
      .then(function (data) {
        if (!data.init_point) throw new Error('Mercado Pago no devolvió un link de pago.');
        guardarPedido(pedido, data.preference_id, 'pendiente');
        location.href = data.init_point;
      })
      .catch(function (err) {
        btn.disabled = false;
        btn.innerHTML = 'Ir a pagar ' + I.flecha;
        mostrarErrores(['No pudimos generar el pago: ' + err.message + '. Probá de nuevo o escribinos por WhatsApp.']);
        UI.aviso('No pudimos generar el pago', 'error', 5000);
      });
  }

  function guardarPedido(pedido, referencia, estado) {
    var registro = {
      numero: pedido.numero,
      fecha: new Date().toISOString(),
      items: pedido.items,
      total: pedido.total,
      descuentos: pedido.descuentos,
      comprador: pedido.comprador,
      referencia: referencia || null,
      estado: estado || 'pendiente'
    };
    Auth.Cuenta.guardarPedido(registro);
    U.Guardado.escribir('ojo.ultimo-pedido', registro);
    return registro;
  }

  function finalizar(pedido, referencia) {
    guardarPedido(pedido, referencia, 'demo');
    Carrito.vaciar();
    location.href = 'gracias.html?pedido=' + encodeURIComponent(pedido.numero) + '&demo=1';
  }

  /* ============================================================
     Arranque
     ============================================================ */
  pintarTextos();
  pintarIdentidad();
  pintarResumen();
  precargarDatos();
  alternarEntrega();

  Auth.on('cambio', pintarIdentidad);
  Carrito.on('cambio', function () {
    if (!Carrito.items().length) location.href = 'carrito.html';
    else pintarResumen();
  });

  $$('input[name="entrega"]').forEach(function (r) {
    r.addEventListener('change', alternarEntrega);
  });

  $('#formulario').addEventListener('submit', pagar);
})();
