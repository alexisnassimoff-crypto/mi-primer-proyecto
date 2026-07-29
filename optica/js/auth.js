/* ============================================================
   OJO — Login con Google + datos de la cuenta
   ------------------------------------------------------------
   Usa Google Identity Services (el botón oficial + One Tap).
   El flujo real es:

     1. Google devuelve un JWT firmado (`credential`) en el cliente.
     2. Se lo mandamos a /api/auth, que lo VERIFICA contra los
        certificados de Google. Nunca confiamos en el JWT sin verificar.
     3. El servidor responde con los datos del usuario y ahí sí
        creamos la sesión.

   Con CONFIG.AUTH.simulado = true se saltea Google entero y se crea
   una sesión de prueba local, para poder recorrer el sitio sin tener
   que dar de alta un Client ID.
   ============================================================ */
(function (global) {
  'use strict';

  var bus = U.Bus();
  var CLAVE = (global.CONFIG && CONFIG.AUTH.claveSesion) || 'ojo.sesion';
  var sesion = U.Guardado.leer(CLAVE, null);
  var scriptPedido = false;

  function usuario() { return sesion; }
  function logueado() { return !!sesion; }

  function guardar(u) {
    sesion = u;
    U.Guardado.escribir(CLAVE, u);
    bus.emit('cambio', u);
  }

  function salir() {
    if (global.google && google.accounts && google.accounts.id) {
      try { google.accounts.id.disableAutoSelect(); } catch (e) { /* nada */ }
    }
    sesion = null;
    U.Guardado.borrar(CLAVE);
    bus.emit('cambio', null);
  }

  /* ---------- Lectura del payload del JWT ----------
     Sólo para mostrar el nombre y la foto mientras el servidor
     verifica. NO es una validación: la de verdad la hace /api/auth. */
  function leerJwt(token) {
    try {
      var payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      var json = decodeURIComponent(atob(payload).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(json);
    } catch (e) { return null; }
  }

  /* ---------- Callback de Google ---------- */
  function alRecibirCredencial(respuesta) {
    var datos = leerJwt(respuesta.credential);
    if (!datos) { bus.emit('error', 'No pudimos leer la respuesta de Google.'); return; }

    // Sesión optimista para que la UI reaccione al instante...
    guardar({
      sub: datos.sub,
      nombre: datos.name || datos.given_name || 'Cliente',
      email: datos.email,
      foto: datos.picture,
      verificado: false
    });

    // ...y verificación real contra el servidor.
    fetch(CONFIG.AUTH.endpointVerificacion, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: respuesta.credential })
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('verificacion')); })
      .then(function (u) {
        guardar({
          sub: u.sub, nombre: u.nombre, email: u.email, foto: u.foto, verificado: true
        });
      })
      .catch(function () {
        // El front sigue andando, pero dejamos la sesión marcada como
        // no verificada: el checkout la vuelve a validar server-side.
        bus.emit('aviso', 'Entraste, pero no pudimos verificar la sesión con el servidor.');
      });
  }

  /* ---------- Carga del SDK de Google ---------- */
  function cargarSdk() {
    if (scriptPedido) return Promise.resolve();
    scriptPedido = true;
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('No se pudo cargar Google Identity Services.')); };
      document.head.appendChild(s);
    });
  }

  /* ---------- Botón ----------
     `contenedor` es el elemento donde se dibuja el botón de Google.  */
  function montarBoton(contenedor, opciones) {
    opciones = opciones || {};
    if (!contenedor) return;

    if (CONFIG.AUTH.simulado) {
      contenedor.innerHTML =
        '<button type="button" class="btn btn--google js-google-demo">' +
        iconoGoogle() +
        '<span>Continuar con Google</span>' +
        '</button>' +
        '<p class="nota nota--sutil">Modo demo: no se conecta con Google. Cargá el Client ID en <code>js/config.js</code>.</p>';
      contenedor.querySelector('.js-google-demo').addEventListener('click', function () {
        guardar({
          sub: 'demo-' + U.uid(),
          nombre: 'Cliente de prueba',
          email: 'demo@' + CONFIG.MARCA.dominio,
          foto: null,
          verificado: false,
          demo: true
        });
      });
      return;
    }

    cargarSdk().then(function () {
      google.accounts.id.initialize({
        client_id: CONFIG.AUTH.googleClientId,
        callback: alRecibirCredencial,
        auto_select: false,
        cancel_on_tap_outside: true
      });
      google.accounts.id.renderButton(contenedor, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: opciones.texto || 'continue_with',
        locale: 'es-419',
        width: opciones.ancho || 320
      });
      if (opciones.oneTap && !logueado()) google.accounts.id.prompt();
    }).catch(function (e) {
      contenedor.innerHTML = '<p class="nota nota--error">' + U.esc(e.message) + '</p>';
    });
  }

  function iconoGoogle() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' +
      '<path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.6-5.2 3.6-8.8z"/>' +
      '<path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/>' +
      '<path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z"/>' +
      '<path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-5 6.7-5z"/>' +
      '</svg>';
  }

  /* ============================================================
     Datos de la cuenta
     ------------------------------------------------------------
     Recetas guardadas, pedidos y turnos. Hoy viven en localStorage
     por usuario. Cuando haya base de datos, estas cuatro funciones
     son las únicas que hay que reapuntar.
     ============================================================ */
  function claveDe(que) {
    return 'ojo.' + que + '.' + (sesion ? sesion.sub : 'invitado');
  }

  var Cuenta = {
    recetas: function () { return U.Guardado.leer(claveDe('recetas'), []); },

    guardarReceta: function (receta, etiqueta) {
      var lista = Cuenta.recetas();
      var r = {
        id: U.uid(),
        etiqueta: etiqueta || 'Mi receta',
        receta: receta,
        fecha: new Date().toISOString()
      };
      lista.unshift(r);
      U.Guardado.escribir(claveDe('recetas'), lista.slice(0, 10));
      bus.emit('recetas', lista);
      return r;
    },

    borrarReceta: function (id) {
      var lista = Cuenta.recetas().filter(function (r) { return r.id !== id; });
      U.Guardado.escribir(claveDe('recetas'), lista);
      bus.emit('recetas', lista);
    },

    pedidos: function () { return U.Guardado.leer(claveDe('pedidos'), []); },

    guardarPedido: function (pedido) {
      var lista = Cuenta.pedidos();
      lista.unshift(pedido);
      U.Guardado.escribir(claveDe('pedidos'), lista.slice(0, 50));
      return pedido;
    },

    turnos: function () { return U.Guardado.leer(claveDe('turnos'), []); },

    guardarTurno: function (turno) {
      var lista = Cuenta.turnos();
      lista.unshift(turno);
      U.Guardado.escribir(claveDe('turnos'), lista.slice(0, 50));
      return turno;
    }
  };

  global.Auth = {
    usuario: usuario,
    logueado: logueado,
    montarBoton: montarBoton,
    salir: salir,
    iconoGoogle: iconoGoogle,
    Cuenta: Cuenta,
    on: bus.on
  };
})(window);
