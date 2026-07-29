/* ============================================================
   OJO — Configuración central del sitio
   ------------------------------------------------------------
   Este es el ÚNICO archivo que hay que tocar para cambiar marca,
   contacto, promociones, envíos, medios de pago y credenciales.
   Todo lo demás lee de acá.
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- 1. Marca ----------
     Para renombrar la marca completa (HTML incluido):
       ./herramientas/renombrar-marca.sh "NUEVONOMBRE"                */
  var MARCA = {
    nombre: 'OJO',
    nombreLargo: 'OJO — Óptica',
    tagline: 'Anteojos que se ven',
    bajada: 'Multimarca. Sol, receta y cristales de altísima calidad.',
    dominio: 'ojo.com.ar',
    // El paraguas vende varias marcas; ésta es la casa.
    marcaPropia: 'Central Eyewear',
    instagram: 'https://instagram.com/',
    whatsapp: '5491100000000',        // formato internacional, sin + ni espacios
    email: 'hola@ojo.com.ar',
    direccion: 'CABA, Argentina',
    cuit: '',                          // completar antes de publicar
    razonSocial: ''                    // completar antes de publicar
  };

  /* ---------- 2. Envíos ---------- */
  var ENVIO = {
    gratisSiempre: true,               // envío sin cargo a todo el país
    leyenda: 'Envío sin cargo a todo el país',
    plazoAMBA: '24 a 48 hs hábiles',
    plazoInterior: '3 a 6 días hábiles',
    plazoConReceta: 'Sumale 3 a 5 días hábiles de taller para el armado de cristales',
    retiroEnLocal: {
      activo: true,
      nombre: 'Retiro en showroom',
      direccion: 'CABA — coordinamos por WhatsApp',
      plazo: 'A partir de las 48 hs'
    }
  };

  /* ---------- 3. Pagos ---------- */
  var PAGOS = {
    pasarela: 'mercadopago',
    moneda: 'ARS',
    localeMoneda: 'es-AR',
    cuotasSinInteres: 6,
    // La public key es pública por diseño. El ACCESS TOKEN vive sólo en
    // el servidor, como variable de entorno MP_ACCESS_TOKEN (ver README).
    mercadoPagoPublicKey: 'APP_USR-REEMPLAZAR-PUBLIC-KEY',
    endpointCheckout: '/api/checkout',
    // Con `simulado: true` el checkout no llama a Mercado Pago: genera una
    // orden local y salta a /gracias. Sirve para probar el flujo sin
    // credenciales. Poner en false cuando estén cargadas las de producción.
    simulado: true,
    medios: ['Tarjetas de crédito y débito', 'Dinero en cuenta de Mercado Pago', 'Efectivo (Pago Fácil / Rapipago)', 'Transferencia']
  };

  /* ---------- 4. Login con Google ----------
     Sacar el Client ID en console.cloud.google.com → Credenciales →
     ID de cliente de OAuth 2.0 → Aplicación web. Agregar el dominio en
     "Orígenes autorizados de JavaScript". Instrucciones en el README.     */
  var AUTH = {
    googleClientId: 'REEMPLAZAR.apps.googleusercontent.com',
    endpointVerificacion: '/api/auth',
    // Con `simulado: true` el botón de Google crea una sesión local de prueba
    // sin llamar a Google. Poner en false cuando el Client ID sea real.
    simulado: true,
    claveSesion: 'ojo.sesion'
  };

  /* ---------- 5. Promociones ----------
     El motor del carrito (js/carrito.js) las aplica solas y elige
     siempre la mejor combinación para el cliente.                        */
  var PROMOS = [
    {
      id: 'segundo-par',
      titulo: '2do par al 50%',
      detalle: 'Llevando dos armazones o más, el más barato sale a mitad de precio.',
      tipo: 'segundo-par',
      valor: 0.5,
      minUnidades: 2,
      destacada: true
    },
    {
      id: 'antirreflejo',
      titulo: 'Antirreflejo bonificado',
      detalle: 'Todo cristal con receta se va con tratamiento antirreflejo premium sin cargo.',
      tipo: 'tratamiento-gratis',
      valor: 'antirreflejo',
      destacada: true
    },
    {
      id: 'envio',
      titulo: 'Envío sin cargo',
      detalle: 'A todo el país, siempre, sin monto mínimo.',
      tipo: 'envio-gratis',
      destacada: true
    },
    {
      id: 'cuotas',
      titulo: PAGOS.cuotasSinInteres + ' cuotas sin interés',
      detalle: 'Con todas las tarjetas de crédito, vía Mercado Pago.',
      tipo: 'informativa',
      destacada: true
    },
    {
      id: 'bienvenida',
      titulo: '10% en tu primera compra',
      detalle: 'Con el cupón BIENVENIDO10.',
      tipo: 'cupon',
      cupon: 'BIENVENIDO10',
      valor: 0.1,
      destacada: false
    }
  ];

  var CUPONES = {
    BIENVENIDO10: { tipo: 'porcentaje', valor: 0.10, titulo: '10% de bienvenida' },
    OJO15: { tipo: 'porcentaje', valor: 0.15, titulo: '15% de descuento', minimo: 250000 },
    SINCARGO: { tipo: 'monto', valor: 20000, titulo: '$20.000 de descuento', minimo: 200000 }
  };

  /* ---------- 6. Turnos con oftalmólogo ---------- */
  var TURNOS = {
    endpoint: '/api/turnos',
    simulado: true,                    // sin backend, confirma y ofrece WhatsApp + .ics
    duracionMin: 30,
    diasAnticipacion: 45,
    // 0 = domingo … 6 = sábado
    diasHabiles: [1, 2, 3, 4, 5, 6],
    horarios: {
      semana: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'],
      sabado: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00']
    },
    sedes: [
      { id: 'palermo', nombre: 'Showroom Palermo', direccion: 'Palermo, CABA', profesional: 'Dra. Laura Benítez', matricula: 'MN 000000' },
      { id: 'centro', nombre: 'Showroom Centro', direccion: 'Microcentro, CABA', profesional: 'Dr. Martín Ferrari', matricula: 'MN 000000' }
    ],
    tipos: [
      { id: 'control', nombre: 'Control de visión completo', detalle: 'Agudeza visual, refracción y receta. 30 minutos.', precio: 0, leyenda: 'Sin cargo comprando anteojos' },
      { id: 'receta', nombre: 'Renovación de receta', detalle: 'Si ya tenés una receta vencida y necesitás actualizarla.', precio: 0, leyenda: 'Sin cargo comprando anteojos' },
      { id: 'fondo', nombre: 'Control con fondo de ojo', detalle: 'Incluye dilatación pupilar. Vení acompañado. 45 minutos.', precio: 0, leyenda: 'Sin cargo comprando anteojos' },
      { id: 'lentes-contacto', nombre: 'Adaptación de lentes de contacto', detalle: 'Medición, prueba y enseñanza de colocación.', precio: 0, leyenda: 'Sin cargo comprando anteojos' }
    ]
  };

  /* ---------- 7. Textos legales / operativos ---------- */
  var LEGAL = {
    cambios: '30 días corridos para cambio o devolución sin uso. Los cristales con receta, por ser a medida, no tienen cambio salvo error de fabricación.',
    garantia: '12 meses de garantía sobre el armazón por defecto de fabricación.',
    recetaVigencia: 'Aceptamos recetas de hasta 12 meses de antigüedad.',
    adaptacionProgresivos: 'Si no te adaptás a los progresivos, en los primeros 60 días te los rehacemos sin cargo.'
  };

  global.CONFIG = {
    MARCA: MARCA,
    ENVIO: ENVIO,
    PAGOS: PAGOS,
    AUTH: AUTH,
    PROMOS: PROMOS,
    CUPONES: CUPONES,
    TURNOS: TURNOS,
    LEGAL: LEGAL
  };

  // También se carga desde Node (las funciones de /api recalculan
  // precios contra esta misma configuración, sin duplicarla).
  if (typeof module !== 'undefined' && module.exports) module.exports = global.CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);
