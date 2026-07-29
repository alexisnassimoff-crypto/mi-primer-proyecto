/* ============================================================
   POST /api/auth
   ------------------------------------------------------------
   Verifica el token que devuelve el botón de Google.

   El navegador recibe de Google un JWT firmado. Ese JWT NO se
   puede creer sin más: cualquiera puede fabricar uno con los datos
   que quiera. Acá se comprueba de verdad:

     1. la firma, contra las claves públicas de Google
     2. que el emisor sea Google
     3. que el destinatario (aud) sea NUESTRO Client ID
     4. que no esté vencido

   Sin dependencias: la verificación RS256 se hace con el módulo
   `crypto` de Node, que desde la v16 sabe importar claves en
   formato JWK directamente.

   Variables de entorno:
     GOOGLE_CLIENT_ID   obligatoria. El mismo que en js/config.js.
   ============================================================ */

const crypto = require('crypto');

const CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const EMISORES = ['accounts.google.com', 'https://accounts.google.com'];

// Las claves de Google rotan cada varias horas: las guardamos en
// memoria mientras la función siga caliente, respetando su cache.
let cacheCerts = { claves: null, vence: 0 };

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'Falta configurar GOOGLE_CLIENT_ID en el servidor.' });
  }

  let cuerpo = req.body;
  if (typeof cuerpo === 'string') {
    try { cuerpo = JSON.parse(cuerpo); } catch (e) { cuerpo = {}; }
  }

  const token = cuerpo && cuerpo.credential;
  if (!token) return res.status(400).json({ error: 'Falta el token.' });

  try {
    const datos = await verificar(token, clientId);
    return res.status(200).json({
      sub: datos.sub,
      nombre: datos.name || datos.given_name || 'Cliente',
      email: datos.email,
      emailVerificado: !!datos.email_verified,
      foto: datos.picture || null
    });
  } catch (err) {
    console.warn('auth: token rechazado —', err.message);
    return res.status(401).json({ error: 'No pudimos verificar tu sesión de Google.' });
  }
};

/* ============================================================
   Verificación
   ============================================================ */
async function verificar(token, clientId) {
  const partes = token.split('.');
  if (partes.length !== 3) throw new Error('El token no tiene formato JWT');

  const [cabeceraB64, cargaB64, firmaB64] = partes;
  const cabecera = leerJson(cabeceraB64);
  const carga = leerJson(cargaB64);

  if (cabecera.alg !== 'RS256') throw new Error(`Algoritmo no soportado: ${cabecera.alg}`);

  /* ---- Firma ---- */
  const claves = await traerClaves();
  const jwk = claves.find((k) => k.kid === cabecera.kid);
  if (!jwk) throw new Error('No encontramos la clave pública (kid desconocido)');

  const clave = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const ok = crypto
    .createVerify('RSA-SHA256')
    .update(`${cabeceraB64}.${cargaB64}`)
    .verify(clave, Buffer.from(firmaB64, 'base64url'));

  if (!ok) throw new Error('Firma inválida');

  /* ---- Contenido ---- */
  if (!EMISORES.includes(carga.iss)) throw new Error(`Emisor inesperado: ${carga.iss}`);
  if (carga.aud !== clientId) throw new Error('El token no fue emitido para este sitio');

  const ahora = Math.floor(Date.now() / 1000);
  if (carga.exp && carga.exp < ahora) throw new Error('El token está vencido');
  // 5 minutos de tolerancia por relojes desincronizados
  if (carga.iat && carga.iat > ahora + 300) throw new Error('El token viene del futuro');

  return carga;
}

function leerJson(b64) {
  return JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
}

async function traerClaves() {
  if (cacheCerts.claves && Date.now() < cacheCerts.vence) return cacheCerts.claves;

  const r = await fetch(CERTS_URL);
  if (!r.ok) throw new Error('No pudimos traer las claves públicas de Google');

  const data = await r.json();

  // Respetamos el max-age que manda Google; si no viene, 1 hora.
  const cc = r.headers.get('cache-control') || '';
  const m = cc.match(/max-age=(\d+)/);
  const segundos = m ? parseInt(m[1], 10) : 3600;

  cacheCerts = { claves: data.keys || [], vence: Date.now() + segundos * 1000 };
  return cacheCerts.claves;
}
