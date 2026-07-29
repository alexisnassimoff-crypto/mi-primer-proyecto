/* ============================================================
   Recálculo de precios del lado del servidor
   ------------------------------------------------------------
   Regla de oro del e-commerce: nunca cobrar el importe que manda
   el navegador. Acá se reconstruye el pedido desde cero usando
   únicamente el SKU, la cantidad y la configuración de cristales,
   y se recalcula todo contra el catálogo real.

   Reusa exactamente los mismos módulos que el front
   (js/catalogo.js, js/cristales.js, js/promos.js), así no hay dos
   tablas de precios que se puedan desincronizar.
   ============================================================ */

const CONFIG = require('../js/config.js');
const Catalogo = require('../js/catalogo.js');
const Cristales = require('../js/cristales.js');
const Promos = require('../js/promos.js');

const MAX_UNIDADES_POR_ITEM = 10;
const MAX_ITEMS = 20;

function calcularPedido(pedido) {
  if (!Array.isArray(pedido.items) || !pedido.items.length) {
    throw new Error('El pedido no tiene artículos.');
  }
  if (pedido.items.length > MAX_ITEMS) {
    throw new Error('El pedido tiene demasiados artículos.');
  }

  const lineas = pedido.items.map((entrada) => {
    const producto = Catalogo.porSku(entrada.sku);
    if (!producto) throw new Error(`El producto ${entrada.sku} ya no está disponible.`);

    const cantidad = Math.floor(Number(entrada.cantidad) || 0);
    if (cantidad < 1 || cantidad > MAX_UNIDADES_POR_ITEM) {
      throw new Error(`Cantidad inválida para ${producto.modelo}.`);
    }
    if (producto.stock != null && cantidad > producto.stock) {
      throw new Error(`Nos queda${producto.stock === 1 ? '' : 'n'} ${producto.stock} de ${producto.modelo}.`);
    }

    // El precio sale del catálogo del servidor, no del pedido.
    const calculo = Cristales.calcular(producto, entrada.config || null);

    return {
      sku: producto.sku,
      titulo: Catalogo.nombreCompleto(producto),
      cristales: Cristales.resumen(entrada.config || null),
      cantidad,
      precioArmazon: producto.precio,
      unitario: calculo.total,
      subtotal: calculo.total * cantidad
    };
  });

  const r = Promos.aplicar({
    lineas,
    cupon: pedido.cupon ? String(pedido.cupon).toUpperCase() : null,
    config: CONFIG
  });

  return {
    items: lineas,
    bruto: r.bruto,
    descuentos: r.descuentos,
    descuento: r.bruto - r.total,
    envio: r.envio,
    total: r.total,
    cupon: r.cuponValido
  };
}

module.exports = { calcularPedido };
