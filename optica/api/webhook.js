/* ============================================================
   POST /api/webhook
   ------------------------------------------------------------
   Mercado Pago avisa acá cada vez que cambia el estado de un pago.

   Muy importante: la notificación NO trae el estado del pago, trae
   sólo un id. Hay que ir a preguntarle a la API de Mercado Pago
   cuánto se pagó y si está aprobado — si no, cualquiera podría
   mandar un POST diciendo "está pagado".

   Variables de entorno:
     MP_ACCESS_TOKEN     obligatoria
     MP_WEBHOOK_SECRET   opcional pero MUY recomendada. Se saca en
                         Mercado Pago → Tus integraciones → Webhooks.
                         Sirve para validar la firma de la notificación.

   Mercado Pago reintenta si no respondemos 200 rápido, así que
   siempre devolvemos 200 salvo que el pedido sea ilegítimo.
   ============================================================ */

const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    console.error('webhook: falta MP_ACCESS_TOKEN');
    return res.status(200).json({ ok: true });   // no pedir reintentos infinitos
  }

  let cuerpo = req.body;
  if (typeof cuerpo === 'string') {
    try { cuerpo = JSON.parse(cuerpo); } catch (e) { cuerpo = {}; }
  }
  cuerpo = cuerpo || {};

  /* ---- 1. Validación de la firma ---- */
  const secreto = process.env.MP_WEBHOOK_SECRET;
  if (secreto && !firmaValida(req, secreto)) {
    console.warn('webhook: firma inválida, se descarta la notificación');
    return res.status(401).json({ error: 'Firma inválida' });
  }

  /* ---- 2. Sólo nos interesan los avisos de pago ---- */
  const tipo = cuerpo.type || cuerpo.topic;
  if (tipo !== 'payment') return res.status(200).json({ ok: true, ignorado: tipo });

  const pagoId = (cuerpo.data && cuerpo.data.id) || cuerpo['data.id'] || cuerpo.id;
  if (!pagoId) return res.status(200).json({ ok: true });

  /* ---- 3. Le preguntamos a Mercado Pago, no al que nos llamó ---- */
  try {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(pagoId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!r.ok) {
      console.error('webhook: no pudimos leer el pago', pagoId, r.status);
      return res.status(200).json({ ok: true });
    }

    const pago = await r.json();

    const resumen = {
      pagoId: pago.id,
      pedido: pago.external_reference,
      estado: pago.status,                    // approved · pending · rejected · refunded
      detalle: pago.status_detail,
      monto: pago.transaction_amount,
      medio: pago.payment_method_id,
      cuotas: pago.installments,
      email: pago.payer && pago.payer.email,
      fecha: pago.date_approved || pago.date_created
    };

    console.log('Pago actualizado:', JSON.stringify(resumen));

    /* ============================================================
       ACÁ VA LA PERSISTENCIA
       ------------------------------------------------------------
       Hoy el pedido sólo queda en el navegador del comprador, así
       que esto únicamente deja registro en los logs de Vercel.

       Cuando haya dónde guardarlo, este es el punto donde:
         · se marca el pedido como pagado en la base
         · se descuenta el stock
         · se manda el mail de confirmación
         · se avisa al taller si el pedido lleva cristales de receta

       Enganchar Airtable, Google Sheets o una base de datos acá.
       ============================================================ */

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('webhook: error consultando el pago', err);
    return res.status(200).json({ ok: true });
  }
};

/* ------------------------------------------------------------
   Firma de Mercado Pago
   Header x-signature:  ts=<timestamp>,v1=<hmac sha256>
   El mensaje firmado es:  id:<data.id>;request-id:<x-request-id>;ts:<ts>;
   ------------------------------------------------------------ */
function firmaValida(req, secreto) {
  const firma = req.headers['x-signature'];
  const requestId = req.headers['x-request-id'] || '';
  if (!firma) return false;

  const partes = {};
  String(firma).split(',').forEach((p) => {
    const [k, v] = p.split('=');
    if (k && v) partes[k.trim()] = v.trim();
  });
  if (!partes.ts || !partes.v1) return false;

  const url = new URL(req.url, 'https://local');
  const dataId = url.searchParams.get('data.id') || url.searchParams.get('id') || '';

  const mensaje = `id:${dataId};request-id:${requestId};ts:${partes.ts};`;
  const esperado = crypto.createHmac('sha256', secreto).update(mensaje).digest('hex');

  const a = Buffer.from(esperado, 'utf8');
  const b = Buffer.from(partes.v1, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
