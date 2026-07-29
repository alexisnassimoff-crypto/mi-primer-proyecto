/* ============================================================
   OJO — Motor de promociones
   ------------------------------------------------------------
   Matemática pura, sin DOM ni localStorage, a propósito: este
   mismo archivo lo usan el carrito del navegador (js/carrito.js)
   y la función de servidor que recalcula el pedido antes de
   cobrarlo (api/_precios.js).

   Tener una sola implementación es lo que garantiza que el total
   que ve el cliente sea exactamente el que se le cobra.
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- 2do par al 50% ----------
     Se ordenan los armazones de menor a mayor precio y se bonifica
     el más barato de cada par. Con 4 armazones se bonifican 2.     */
  function segundoPar(lineas, promo) {
    var precios = [];
    lineas.forEach(function (l) {
      for (var i = 0; i < l.cantidad; i++) precios.push(l.precioArmazon);
    });
    if (precios.length < (promo.minUnidades || 2)) return null;

    precios.sort(function (a, b) { return a - b; });
    var pares = Math.floor(precios.length / 2);
    var monto = 0;
    for (var i = 0; i < pares; i++) monto += precios[i * 2] * promo.valor;

    if (monto <= 0) return null;
    return { id: promo.id, titulo: promo.titulo, monto: Math.round(monto) };
  }

  /* ============================================================
     aplicar({ lineas, cupon, config })
     ------------------------------------------------------------
     lineas  [{ precioArmazon, cantidad, subtotal }]
     cupon   código en mayúsculas, o null
     config  CONFIG (se pasa explícito para que el módulo no
             dependa de dónde esté colgado)
     ============================================================ */
  function aplicar(opciones) {
    var lineas = opciones.lineas || [];
    var cupon = opciones.cupon || null;
    var config = opciones.config || global.CONFIG;

    var bruto = lineas.reduce(function (s, l) { return s + l.subtotal; }, 0);
    var descuentos = [];

    (config.PROMOS || []).forEach(function (p) {
      if (p.tipo !== 'segundo-par') return;
      var d = segundoPar(lineas, p);
      if (d) descuentos.push(d);
    });

    var subtotalConPromos = bruto - descuentos.reduce(function (s, d) { return s + d.monto; }, 0);

    /* ---- Cupón: siempre sobre lo que queda después de las promos ---- */
    var cuponValido = null;
    var descuentoCupon = 0;
    var def = cupon ? (config.CUPONES || {})[cupon] : null;

    if (def && (!def.minimo || subtotalConPromos >= def.minimo)) {
      descuentoCupon = def.tipo === 'porcentaje'
        ? Math.round(subtotalConPromos * def.valor)
        : Math.min(def.valor, subtotalConPromos);
      cuponValido = cupon;
      descuentos.push({
        id: 'cupon',
        titulo: def.titulo + ' (' + cupon + ')',
        monto: descuentoCupon,
        esCupon: true
      });
    }

    var envio = (config.ENVIO && config.ENVIO.gratisSiempre) ? 0 : 0;
    var total = Math.max(0, subtotalConPromos - descuentoCupon + envio);

    return {
      bruto: bruto,
      descuentos: descuentos,
      subtotalConPromos: subtotalConPromos,
      descuentoCupon: descuentoCupon,
      cuponValido: cuponValido,
      envio: envio,
      total: total
    };
  }

  global.Promos = { aplicar: aplicar };

  if (typeof module !== 'undefined' && module.exports) module.exports = global.Promos;
})(typeof window !== 'undefined' ? window : globalThis);
