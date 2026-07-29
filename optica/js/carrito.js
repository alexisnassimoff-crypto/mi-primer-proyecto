/* ============================================================
   OJO — Carrito y motor de promociones
   ------------------------------------------------------------
   Cada ítem del carrito es una unidad indivisible: el armazón
   más su configuración de cristales. Dos veces el mismo armazón
   con distinta graduación son dos ítems distintos.

   El motor de promos aplica todo solo y siempre a favor del
   cliente (elige el descuento que más conviene, no el primero
   que encuentra).
   ============================================================ */
(function (global) {
  'use strict';

  var CLAVE = 'ojo.carrito';
  var CLAVE_CUPON = 'ojo.cupon';
  var bus = U.Bus();

  var estado = U.Guardado.leer(CLAVE, []);
  var cupon = U.Guardado.leer(CLAVE_CUPON, null);

  function persistir() {
    U.Guardado.escribir(CLAVE, estado);
    U.Guardado.escribir(CLAVE_CUPON, cupon);
    bus.emit('cambio', estado);
  }

  /* ---------- Operaciones ---------- */
  function items() { return estado.slice(); }

  function unidades() {
    return estado.reduce(function (s, i) { return s + i.cantidad; }, 0);
  }

  function agregar(sku, config, cantidad) {
    var producto = Catalogo.porSku(sku);
    if (!producto) return null;

    cantidad = cantidad || 1;
    var firma = JSON.stringify({ sku: sku, config: config || null });

    // Si ya hay un ítem idéntico (mismo armazón y misma configuración
    // de cristales), sumamos cantidad en vez de duplicar la línea.
    var existente = estado.filter(function (i) {
      return JSON.stringify({ sku: i.sku, config: i.config || null }) === firma;
    })[0];

    if (existente) {
      existente.cantidad = Math.min(10, existente.cantidad + cantidad);
      persistir();
      bus.emit('agregado', { item: existente, producto: producto });
      return existente;
    }

    var item = {
      id: U.uid(),
      sku: sku,
      config: config || null,
      cantidad: Math.min(10, cantidad),
      agregado: Date.now()
    };
    estado.push(item);
    persistir();
    bus.emit('agregado', { item: item, producto: producto });
    return item;
  }

  function quitar(id) {
    estado = estado.filter(function (i) { return i.id !== id; });
    persistir();
  }

  function cantidad(id, n) {
    var item = estado.filter(function (i) { return i.id === id; })[0];
    if (!item) return;
    n = U.clamp(n, 0, 10);
    if (n === 0) return quitar(id);
    item.cantidad = n;
    persistir();
  }

  function vaciar() {
    estado = [];
    cupon = null;
    persistir();
  }

  /* ---------- Cupones ---------- */
  function aplicarCupon(codigo) {
    var c = String(codigo || '').trim().toUpperCase();
    var def = CONFIG.CUPONES[c];
    if (!def) return { ok: false, mensaje: 'Ese cupón no existe o ya venció.' };

    var t = totales({ sinCupon: true });
    if (def.minimo && t.subtotalConPromos < def.minimo) {
      return {
        ok: false,
        mensaje: 'El cupón ' + c + ' es para compras desde ' + U.precio(def.minimo) + '.'
      };
    }

    cupon = c;
    persistir();
    return { ok: true, mensaje: def.titulo + ' aplicado.', cupon: c };
  }

  function quitarCupon() {
    cupon = null;
    persistir();
  }

  function cuponActivo() { return cupon; }

  /* ---------- Desglose por ítem ---------- */
  function detalle(item) {
    var producto = Catalogo.porSku(item.sku);
    if (!producto) return null;
    var calculo = Cristales.calcular(producto, item.config);
    return {
      item: item,
      producto: producto,
      desglose: calculo.lineas,
      bonificado: calculo.bonificado * item.cantidad,
      precioArmazon: producto.precio,
      unitario: calculo.total,
      subtotal: calculo.total * item.cantidad
    };
  }

  /* ---------- Totales ----------
     La matemática de promos y cupones vive en js/promos.js, que es
     el mismo módulo que usa el servidor para revalidar el pedido. */
  function totales(opciones) {
    opciones = opciones || {};

    var detalles = estado.map(detalle).filter(Boolean);
    var bonificadoCristales = detalles.reduce(function (s, d) { return s + d.bonificado; }, 0);

    var r = Promos.aplicar({
      lineas: detalles.map(function (d) {
        return { precioArmazon: d.precioArmazon, cantidad: d.item.cantidad, subtotal: d.subtotal };
      }),
      cupon: opciones.sinCupon ? null : cupon,
      config: CONFIG
    });

    // Si el carrito bajó del mínimo del cupón, se cae solo.
    if (cupon && !opciones.sinCupon && !r.cuponValido) {
      cupon = null;
      U.Guardado.escribir(CLAVE_CUPON, null);
    }

    return {
      detalles: detalles,
      unidades: unidades(),
      bruto: r.bruto,
      bonificadoCristales: bonificadoCristales,
      descuentos: r.descuentos,
      subtotalConPromos: r.subtotalConPromos,
      envio: r.envio,
      total: r.total,
      ahorro: (r.bruto - r.total) + bonificadoCristales,
      cupon: r.cuponValido
    };
  }

  /* ---------- Serialización para el checkout ---------- */
  function paraCheckout() {
    var t = totales();
    return {
      items: t.detalles.map(function (d) {
        return {
          sku: d.producto.sku,
          titulo: Catalogo.nombreCompleto(d.producto),
          variante: d.producto.colorNombre,
          cantidad: d.item.cantidad,
          unitario: d.unitario,
          subtotal: d.subtotal,
          cristales: Cristales.resumen(d.item.config),
          // La configuración cruda va también, porque el servidor
          // recalcula el precio con ella en vez de creerle al cliente.
          config: d.item.config
        };
      }),
      descuentos: t.descuentos,
      envio: t.envio,
      total: t.total,
      cupon: t.cupon
    };
  }

  global.Carrito = {
    items: items,
    unidades: unidades,
    agregar: agregar,
    quitar: quitar,
    cantidad: cantidad,
    vaciar: vaciar,
    detalle: detalle,
    totales: totales,
    paraCheckout: paraCheckout,
    aplicarCupon: aplicarCupon,
    quitarCupon: quitarCupon,
    cuponActivo: cuponActivo,
    on: bus.on
  };
})(window);
