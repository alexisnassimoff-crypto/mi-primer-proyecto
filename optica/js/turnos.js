/* ============================================================
   OJO — Reserva de turno con oftalmólogo
   ------------------------------------------------------------
   Los días y horarios salen de CONFIG.TURNOS, así que cambiar la
   agenda no es tocar código: es editar config.js.

   Con TURNOS.simulado = true la reserva se confirma localmente y
   se ofrece el .ics + WhatsApp. Con false, hace POST a /api/turnos.
   ============================================================ */
(function () {
  'use strict';

  var $ = U.$, $$ = U.$$, I = UI.I;
  var T = CONFIG.TURNOS;

  var estado = {
    sede: T.sedes[0].id,
    tipo: T.tipos[0].id,
    fecha: null,       // Date
    hora: null,
    mes: new Date()
  };
  estado.mes.setDate(1);

  /* ============================================================
     Disponibilidad
     ------------------------------------------------------------
     Sin backend no hay agenda real. Generamos una ocupación
     estable y verosímil a partir de la fecha + sede, para que el
     calendario no muestre todo libre siempre (y para que no
     cambie en cada repintado).
     ============================================================ */
  function semilla(txt) {
    var h = 0;
    for (var i = 0; i < txt.length; i++) h = (h * 31 + txt.charCodeAt(i)) >>> 0;
    return h;
  }

  function horariosDe(fecha) {
    if (!fecha) return [];
    var dia = fecha.getDay();
    if (T.diasHabiles.indexOf(dia) === -1) return [];
    var base = dia === 6 ? T.horarios.sabado : T.horarios.semana;
    var s = semilla(U.fecha(fecha, 'iso') + estado.sede);

    return base.map(function (h, i) {
      // ~35% ocupados, determinístico
      var ocupado = ((s >> (i % 24)) & 7) < 3;
      return { hora: h, libre: !ocupado };
    });
  }

  function hayLugar(fecha) {
    return horariosDe(fecha).some(function (h) { return h.libre; });
  }

  function esReservable(fecha) {
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    var limite = new Date(hoy);
    limite.setDate(limite.getDate() + T.diasAnticipacion);
    if (fecha < hoy || fecha > limite) return false;
    if (T.diasHabiles.indexOf(fecha.getDay()) === -1) return false;
    return hayLugar(fecha);
  }

  /* ============================================================
     Sedes y tipos
     ============================================================ */
  function pintarSedes() {
    $('#sedes').innerHTML = T.sedes.map(function (s) {
      return '<label class="opcion">' +
        '<input type="radio" name="sede" value="' + U.esc(s.id) + '"' + (estado.sede === s.id ? ' checked' : '') + '>' +
        '<span class="opcion__tilde" aria-hidden="true">' + I.tilde + '</span>' +
        '<span class="opcion__cabeza"><span class="opcion__nombre">' + U.esc(s.nombre) + '</span></span>' +
        '<span class="opcion__detalle">' + U.esc(s.direccion) + ' · ' + U.esc(s.profesional) + '</span>' +
        '</label>';
    }).join('');
  }

  function pintarTipos() {
    $('#tipos').innerHTML = T.tipos.map(function (t) {
      return '<label class="opcion">' +
        '<input type="radio" name="tipo" value="' + U.esc(t.id) + '"' + (estado.tipo === t.id ? ' checked' : '') + '>' +
        '<span class="opcion__tilde" aria-hidden="true">' + I.tilde + '</span>' +
        '<span class="opcion__cabeza">' +
        '<span class="opcion__nombre">' + U.esc(t.nombre) + '</span>' +
        '<span class="opcion__precio opcion__precio--gratis">' + U.esc(t.leyenda || 'Sin cargo') + '</span>' +
        '</span>' +
        '<span class="opcion__detalle">' + U.esc(t.detalle) + '</span>' +
        '</label>';
    }).join('');
  }

  /* ============================================================
     Calendario
     ============================================================ */
  function pintarCalendario() {
    var anio = estado.mes.getFullYear(), mes = estado.mes.getMonth();
    $('#nombreMes').textContent = U.MESES[mes] + ' ' + anio;

    var primero = new Date(anio, mes, 1);
    var dias = new Date(anio, mes + 1, 0).getDate();
    // Lunes primero: el getDay() de JS arranca en domingo.
    var offset = (primero.getDay() + 6) % 7;

    var html = ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'].map(function (d) {
      return '<span class="calendario__dia-nombre">' + d + '</span>';
    }).join('');

    for (var i = 0; i < offset; i++) html += '<span></span>';

    for (var d = 1; d <= dias; d++) {
      var fecha = new Date(anio, mes, d);
      var ok = esReservable(fecha);
      var elegido = estado.fecha && U.fecha(estado.fecha, 'iso') === U.fecha(fecha, 'iso');
      html += '<button type="button" class="calendario__dia" data-fecha="' + U.fecha(fecha, 'iso') + '"' +
        (ok ? '' : ' disabled') + ' aria-pressed="' + !!elegido + '"' +
        ' aria-label="' + U.fecha(fecha) + (ok ? '' : ' — sin turnos') + '">' +
        d + (ok ? '<span class="calendario__punto"></span>' : '') +
        '</button>';
    }

    $('#calendario').innerHTML = html;

    // No dejamos navegar antes del mes actual ni más allá del límite.
    var hoy = new Date();
    $('#mesAnterior').disabled = anio === hoy.getFullYear() && mes === hoy.getMonth();
    var limite = new Date(); limite.setDate(limite.getDate() + T.diasAnticipacion);
    $('#mesSiguiente').disabled = anio === limite.getFullYear() && mes === limite.getMonth();
  }

  function pintarHorarios() {
    var zona = $('#zonaHorarios');
    if (!estado.fecha) { zona.hidden = true; return; }

    zona.hidden = false;
    $('#tituloHorarios').textContent = 'Horarios del ' + U.fecha(estado.fecha);

    var lista = horariosDe(estado.fecha);
    $('#horarios').innerHTML = lista.map(function (h) {
      return '<button type="button" class="horario" data-hora="' + h.hora + '"' +
        (h.libre ? '' : ' disabled') + ' aria-pressed="' + (estado.hora === h.hora) + '">' +
        h.hora + '</button>';
    }).join('');
  }

  /* ============================================================
     Resumen
     ============================================================ */
  function sedeActual() {
    return T.sedes.filter(function (s) { return s.id === estado.sede; })[0];
  }
  function tipoActual() {
    return T.tipos.filter(function (t) { return t.id === estado.tipo; })[0];
  }

  function pintarResumen() {
    var s = sedeActual(), t = tipoActual();
    var listo = !!(estado.fecha && estado.hora);

    $('#resumen').innerHTML =
      '<h3 style="font-size:1.35rem">Tu turno</h3>' +
      '<dl class="mt-m">' +
      '<div class="resumen-turno__fila"><dt>Sede</dt><dd>' + U.esc(s.nombre) + '</dd></div>' +
      '<div class="resumen-turno__fila"><dt>Profesional</dt><dd>' + U.esc(s.profesional) + '</dd></div>' +
      '<div class="resumen-turno__fila"><dt>Consulta</dt><dd>' + U.esc(t.nombre) + '</dd></div>' +
      '<div class="resumen-turno__fila"><dt>Día</dt><dd>' +
      (estado.fecha ? U.esc(U.fecha(estado.fecha)) : '—') + '</dd></div>' +
      '<div class="resumen-turno__fila"><dt>Hora</dt><dd>' + (estado.hora || '—') + '</dd></div>' +
      '<div class="resumen-turno__fila"><dt>Costo</dt><dd>' + U.esc(t.leyenda || 'Sin cargo') + '</dd></div>' +
      '</dl>' +
      '<button class="btn btn--claro btn--bloque btn--grande mt-l" type="submit" id="reservar"' +
      (listo ? '' : ' disabled') + '>' +
      (listo ? 'Confirmar turno' : 'Elegí día y horario') + '</button>' +
      '<p class="nota mt-m" style="color:var(--sobre-negro-2)">' +
      'Si no podés venir, avisanos por WhatsApp así le damos el lugar a otra persona.</p>';
  }

  /* ============================================================
     Archivo .ics para el calendario del cliente
     ============================================================ */
  function generarIcs(turno) {
    function fmt(d) {
      return d.getUTCFullYear() +
        String(d.getUTCMonth() + 1).padStart(2, '0') +
        String(d.getUTCDate()).padStart(2, '0') + 'T' +
        String(d.getUTCHours()).padStart(2, '0') +
        String(d.getUTCMinutes()).padStart(2, '0') + '00Z';
    }
    var partes = turno.hora.split(':');
    var inicio = new Date(turno.fecha);
    inicio.setHours(+partes[0], +partes[1], 0, 0);
    var fin = new Date(inicio.getTime() + T.duracionMin * 60000);

    // Las líneas del formato iCalendar se separan con CRLF.
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//' + CONFIG.MARCA.nombre + '//Turnos//ES',
      'BEGIN:VEVENT',
      'UID:' + turno.numero + '@' + CONFIG.MARCA.dominio,
      'DTSTAMP:' + fmt(new Date()),
      'DTSTART:' + fmt(inicio),
      'DTEND:' + fmt(fin),
      'SUMMARY:' + turno.tipoNombre + ' — ' + CONFIG.MARCA.nombre,
      'DESCRIPTION:' + turno.profesional + '. Turno ' + turno.numero + '.',
      'LOCATION:' + turno.sedeNombre + ', ' + turno.direccion,
      'BEGIN:VALARM',
      'TRIGGER:-PT2H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Recordatorio de turno',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  function descargarIcs(turno) {
    var blob = new Blob([generarIcs(turno)], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'turno-' + turno.numero + '.ics';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ============================================================
     Validación y envío
     ============================================================ */
  function validar() {
    var errores = [];
    $$('.entrada').forEach(function (el) { el.removeAttribute('aria-invalid'); });

    if (!estado.fecha || !estado.hora) errores.push('Elegí un día y un horario.');

    [['nombre', 'tu nombre'], ['telefono', 'tu WhatsApp'], ['email', 'tu email']].forEach(function (par) {
      var el = $('#' + par[0]);
      if (!el.value.trim()) {
        el.setAttribute('aria-invalid', 'true');
        errores.push('Falta ' + par[1] + '.');
      }
    });

    var email = $('#email').value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      $('#email').setAttribute('aria-invalid', 'true');
      errores.push('Ese email no parece válido.');
    }

    return errores;
  }

  function numeroDeTurno() {
    return 'T-' + Date.now().toString(36).slice(-5).toUpperCase();
  }

  function reservar(e) {
    e.preventDefault();

    var errores = validar();
    if (errores.length) {
      $('#errores').innerHTML = '<div class="campo__error" style="padding:14px 0">' +
        errores.map(function (x) { return '<p>· ' + U.esc(x) + '</p>'; }).join('') + '</div>';
      var primero = $('[aria-invalid="true"]');
      if (primero) primero.focus();
      UI.aviso(errores[0], 'error');
      return;
    }
    $('#errores').innerHTML = '';

    var s = sedeActual(), t = tipoActual();
    var turno = {
      numero: numeroDeTurno(),
      sede: estado.sede,
      sedeNombre: s.nombre,
      direccion: s.direccion,
      profesional: s.profesional,
      tipo: estado.tipo,
      tipoNombre: t.nombre,
      fecha: estado.fecha.toISOString(),
      fechaTexto: U.fecha(estado.fecha),
      hora: estado.hora,
      nombre: $('#nombre').value.trim(),
      telefono: $('#telefono').value.trim(),
      email: $('#email').value.trim(),
      comentario: $('#comentario').value.trim()
    };

    var btn = $('#reservar');
    btn.disabled = true;
    btn.textContent = 'Reservando…';

    if (T.simulado) return confirmar(turno);

    fetch(T.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(turno)
    })
      .then(function (r) {
        if (!r.ok) return r.json().then(function (j) { throw new Error(j.error || 'Error del servidor'); });
        return r.json();
      })
      .then(function (data) {
        if (data.numero) turno.numero = data.numero;
        confirmar(turno);
      })
      .catch(function (err) {
        btn.disabled = false;
        btn.textContent = 'Confirmar turno';
        $('#errores').innerHTML = '<div class="campo__error" style="padding:14px 0"><p>· ' +
          U.esc('No pudimos guardar el turno: ' + err.message + '. Probá de nuevo o escribinos por WhatsApp.') +
          '</p></div>';
      });
  }

  function confirmar(turno) {
    // Guardamos el objeto Date real para el .ics, que se perdería en el JSON.
    turno.fecha = estado.fecha;
    Auth.Cuenta.guardarTurno(Object.assign({}, turno, { fecha: estado.fecha.toISOString() }));

    var msg = 'Hola! Reservé el turno ' + turno.numero + ' para el ' + turno.fechaTexto +
      ' a las ' + turno.hora + ' en ' + turno.sedeNombre + '.';

    $('#formulario').hidden = true;
    var host = $('#confirmado');
    host.hidden = false;
    host.innerHTML =
      '<div class="gracias" style="padding-block:20px 40px">' +
      '<div class="gracias__marca">' + I.tildeGrande + '</div>' +
      '<h2>Turno <em class="ital">confirmado</em></h2>' +
      '<p class="bajada mt-m" style="margin-inline:auto">' +
      'Te esperamos el <strong>' + U.esc(turno.fechaTexto) + ' a las ' + U.esc(turno.hora) + '</strong> ' +
      'en ' + U.esc(turno.sedeNombre) + ' (' + U.esc(turno.direccion) + ').</p>' +
      '<p class="gracias__numero">Turno ' + U.esc(turno.numero) + '</p>' +
      (T.simulado
        ? '<p class="nota mt-m">Modo demo: el turno no se guardó en ninguna agenda real. ' +
        'Para activarlo, poné <code>simulado: false</code> en <code>js/config.js</code> y conectá <code>/api/turnos</code>.</p>'
        : '') +
      '<div class="fila fila--envuelve fila--centro mt-l">' +
      '<button class="btn btn--acento" id="btnIcs">' + I.calendario + ' Agendarlo</button>' +
      '<a class="btn btn--fantasma" href="https://wa.me/' + CONFIG.MARCA.whatsapp + '?text=' +
      encodeURIComponent(msg) + '" target="_blank" rel="noopener">Confirmar por WhatsApp</a>' +
      '</div>' +
      '<p class="nota mt-l">Traé tu receta anterior si tenés, y los anteojos que usás hoy.</p>' +
      '<div class="fila fila--envuelve fila--centro mt-m">' +
      '<a class="enlace" href="tienda.html">Mirar el catálogo mientras tanto ' + I.flecha + '</a>' +
      '</div></div>';

    $('#btnIcs').addEventListener('click', function () { descargarIcs(turno); });
    host.scrollIntoView({ behavior: U.reducido ? 'auto' : 'smooth', block: 'start' });
  }

  /* ============================================================
     Identidad
     ============================================================ */
  function pintarIdentidad() {
    var u = Auth.usuario();
    var zona = $('#zonaGoogleTurno');
    if (u) {
      zona.innerHTML = '<p class="nota">Reservando como <strong>' + U.esc(u.nombre) + '</strong>.</p>';
      if (!$('#nombre').value) $('#nombre').value = u.nombre || '';
      if (!$('#email').value) $('#email').value = u.email || '';
    } else {
      Auth.montarBoton(zona, { texto: 'continue_with' });
    }
  }

  /* ============================================================
     Eventos
     ============================================================ */
  $('#sedes').addEventListener('change', function (e) {
    if (e.target.name !== 'sede') return;
    estado.sede = e.target.value;
    estado.hora = null;
    pintarCalendario();
    pintarHorarios();
    pintarResumen();
  });

  $('#tipos').addEventListener('change', function (e) {
    if (e.target.name !== 'tipo') return;
    estado.tipo = e.target.value;
    pintarResumen();
  });

  $('#calendario').addEventListener('click', function (e) {
    var btn = e.target.closest('.calendario__dia');
    if (!btn || btn.disabled) return;
    var partes = btn.getAttribute('data-fecha').split('-');
    estado.fecha = new Date(+partes[0], +partes[1] - 1, +partes[2]);
    estado.hora = null;
    pintarCalendario();
    pintarHorarios();
    pintarResumen();
  });

  $('#horarios').addEventListener('click', function (e) {
    var btn = e.target.closest('.horario');
    if (!btn || btn.disabled) return;
    estado.hora = btn.getAttribute('data-hora');
    pintarHorarios();
    pintarResumen();
  });

  $('#mesAnterior').addEventListener('click', function () {
    estado.mes.setMonth(estado.mes.getMonth() - 1);
    pintarCalendario();
  });

  $('#mesSiguiente').addEventListener('click', function () {
    estado.mes.setMonth(estado.mes.getMonth() + 1);
    pintarCalendario();
  });

  $('#formulario').addEventListener('submit', reservar);
  Auth.on('cambio', pintarIdentidad);

  /* ---------- Arranque ---------- */
  pintarSedes();
  pintarTipos();
  pintarCalendario();
  pintarResumen();
  pintarIdentidad();
})();
