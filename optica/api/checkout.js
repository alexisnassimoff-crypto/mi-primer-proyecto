/* ============================================================
   POST /api/checkout
   ------------------------------------------------------------
   Crea la preferencia de pago en Mercado Pago y devuelve el link
   al que hay que mandar al comprador (Checkout Pro).

   Variables de entorno (Vercel → Settings → Environment Variables):
     MP_ACCESS_TOKEN   obligatoria. Token privado de Mercado Pago.
     SITIO_URL         opcional. Ej: https://ojo.com.ar
                       Si falta, se deduce de los headers del pedido.

   IMPORTANTE: el ACCESS TOKEN nunca se manda al navegador. Los
   precios tampoco se toman del cliente: se recalculan acá contra
   el catálogo, para que nadie pueda pagar $1 editando el fetch.
   ============================================================ */

const { calcularPedido } = require('./_precios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({
      error: 'Falta configurar MP_ACCESS_TOKEN en el servidor.'
    });
  }

  let pedido = req.body;
  if (typeof pedido === 'string') {
    try { pedido = JSON.parse(pedido); } catch (e) {
      return res.status(400).json({ error: 'No pudimos leer el pedido.' });
    }
  }

  if (!pedido || !Array.isArray(pedido.items) || !pedido.items.length) {
    return res.status(400).json({ error: 'El pedido llegó vacío.' });
  }
  if (!pedido.comprador || !pedido.comprador.email) {
    return res.status(400).json({ error: 'Faltan los datos del comprador.' });
  }

  /* ---- Recalculo de precios del lado del servidor ----
     Nunca confiamos en los importes que manda el navegador. */
  let calculado;
  try {
    calculado = calcularPedido(pedido);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  const base = process.env.SITIO_URL || deducirOrigen(req);

  const preferencia = {
    items: calculado.items.map((i) => ({
      id: i.sku,
      title: i.titulo,
      description: (i.cristales || []).join(' · ').slice(0, 250) || undefined,
      quantity: i.cantidad,
      unit_price: i.unitario,
      currency_id: 'ARS'
    })),

    payer: {
      name: pedido.comprador.nombre,
      email: pedido.comprador.email,
      phone: { number: String(pedido.comprador.telefono || '') },
      identification: pedido.comprador.dni
        ? { type: 'DNI', number: String(pedido.comprador.dni) }
        : undefined
    },

    // El envío es sin cargo, así que no se suma ningún costo acá.
    shipments: { cost: 0, mode: 'not_specified' },

    back_urls: {
      success: `${base}/gracias.html`,
      pending: `${base}/gracias.html`,
      failure: `${base}/gracias.html`
    },
    auto_return: 'approved',

    external_reference: pedido.numero || '',
    statement_descriptor: 'OJO OPTICA',
    notification_url: `${base}/api/webhook`,

    payment_methods: {
      installments: Number(process.env.MP_MAX_CUOTAS || 6),
      excluded_payment_types: []
    },

    metadata: {
      numero: pedido.numero,
      entrega: pedido.comprador.entrega,
      total_calculado: calculado.total
    }
  };

  // Descuentos y promos: van como un ítem negativo para que el total
  // que ve el comprador en Mercado Pago coincida con el del carrito.
  if (calculado.descuento > 0) {
    preferencia.items.push({
      id: 'descuentos',
      title: 'Descuentos y promociones',
      quantity: 1,
      unit_price: -calculado.descuento,
      currency_id: 'ARS'
    });
  }

  try {
    const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        // Evita duplicar la preferencia si el navegador reintenta.
        'X-Idempotency-Key': pedido.numero || String(Date.now())
      },
      body: JSON.stringify(preferencia)
    });

    const data = await r.json();

    if (!r.ok) {
      console.error('Mercado Pago rechazó la preferencia:', data);
      return res.status(502).json({
        error: data.message || 'Mercado Pago rechazó la operación.'
      });
    }

    return res.status(200).json({
      preference_id: data.id,
      // sandbox_init_point sirve para probar con credenciales de prueba
      init_point: data.init_point || data.sandbox_init_point,
      total: calculado.total
    });
  } catch (err) {
    console.error('Error hablando con Mercado Pago:', err);
    return res.status(502).json({ error: 'No pudimos conectarnos con Mercado Pago.' });
  }
};

function deducirOrigen(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}
