/* ============================================================
   OJO — Probador virtual + medidor de distancia pupilar
   ------------------------------------------------------------
   Todo pasa en el navegador: no se sube ninguna imagen a ningún
   lado. Cámara → <canvas> → composición local.

   Cómo se ubica el anteojo:
     La persona marca sus dos pupilas. Con esos dos puntos salen
     las tres cosas que hacen falta y no hay que adivinar ninguna:
       · posición → punto medio entre las pupilas
       · escala   → distancia entre pupilas ÷ Marcos.PUPILAS.separacion
       · rotación → ángulo de la recta que las une
     Por eso no hace falta ninguna librería de detección facial.
   ============================================================ */
(function () {
  'use strict';

  var $ = U.$, $$ = U.$$, I = UI.I;
  var ANCHO_TARJETA_MM = 85.6;   // ISO/IEC 7810 ID-1 — toda tarjeta de crédito

  /* ============================================================
     Utilidades de escena
     ============================================================ */

  /* Escala y márgenes con los que el canvas se está mostrando.
     Va con object-fit:contain (ver css/paginas.css), así que la
     escala es la MENOR de las dos y sobran bandas a los costados
     o arriba y abajo, según la proporción de la imagen.           */
  function encuadre(lienzo) {
    var r = lienzo.getBoundingClientRect();
    var escala = Math.min(r.width / lienzo.width, r.height / lienzo.height);
    return {
      rect: r,
      escala: escala,
      offX: (r.width - lienzo.width * escala) / 2,
      offY: (r.height - lienzo.height * escala) / 2
    };
  }

  /* Evento de puntero → coordenadas del canvas. */
  function puntoEnLienzo(lienzo, e) {
    var q = encuadre(lienzo);
    return {
      x: (e.clientX - q.rect.left - q.offX) / q.escala,
      y: (e.clientY - q.rect.top - q.offY) / q.escala
    };
  }

  function distancia(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  /* Ajusta el tamaño del canvas al de la fuente, manteniendo su
     relación de aspecto, para no deformar la imagen. */
  function ajustarLienzo(lienzo, ancho, alto) {
    if (lienzo.width !== ancho || lienzo.height !== alto) {
      lienzo.width = ancho;
      lienzo.height = alto;
    }
  }

  /* ============================================================
     PROBADOR
     ============================================================ */
  var Probador = (function () {
    var lienzo = $('#lienzo');
    if (!lienzo) return null;
    var ctx = lienzo.getContext('2d');

    var video = null;
    var stream = null;
    var imagen = null;          // foto subida o cuadro congelado
    var espejar = false;        // la cámara frontal se muestra en espejo
    var animando = false;

    var ojos = [];              // [{x,y}, {x,y}] en coordenadas del lienzo
    var marcando = false;
    var marcoImg = null;
    var producto = null;

    var ajuste = { escala: 1, alto: 0, tinte: 0.5 };
    var arrastre = null;

    /* ---------- Fuente de imagen ---------- */
    function pararCamara() {
      if (stream) {
        stream.getTracks().forEach(function (t) { t.stop(); });
        stream = null;
      }
      animando = false;
      video = null;
    }

    function usarCamara() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        UI.aviso('Tu navegador no permite usar la cámara. Probá subiendo una foto.', 'error', 5000);
        return;
      }
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false
      }).then(function (s) {
        stream = s;
        imagen = null;
        espejar = true;
        video = document.createElement('video');
        video.srcObject = s;
        video.playsInline = true;
        video.muted = true;
        return video.play().then(function () {
          ajustarLienzo(lienzo, video.videoWidth || 1280, video.videoHeight || 960);
          arrancarEscena();
          animando = true;
          bucle();
        });
      }).catch(function (err) {
        var msg = err && err.name === 'NotAllowedError'
          ? 'No nos diste permiso para la cámara. Podés subir una foto en su lugar.'
          : 'No pudimos abrir la cámara. Probá subiendo una foto.';
        UI.aviso(msg, 'error', 5000);
      });
    }

    function usarArchivo(file) {
      if (!file) return;
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        pararCamara();
        imagen = img;
        espejar = false;
        ajustarLienzo(lienzo, img.naturalWidth, img.naturalHeight);
        arrancarEscena();
        dibujar();
        URL.revokeObjectURL(url);
      };
      img.onerror = function () {
        UI.aviso('No pudimos leer esa imagen.', 'error');
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }

    function arrancarEscena() {
      $('#inicio').hidden = true;
      $('#herramientas').hidden = false;
      ojos = [];
      pedirOjos();
    }

    /* ---------- Marcado de ojos ---------- */
    function pedirOjos() {
      marcando = true;
      ojos = [];
      $('#ajustes').hidden = true;
      $('#pistaArrastre').hidden = true;
      limpiarMarcas();
      mostrarInstruccion('Tocá tu <b>ojo derecho</b> (el que ves a la izquierda)');
    }

    function mostrarInstruccion(html) {
      var el = $('#instruccion');
      el.innerHTML = html;
      el.hidden = false;
    }

    function ocultarInstruccion() {
      $('#instruccion').hidden = true;
    }

    function limpiarMarcas() {
      $$('.escena__marca-ojo').forEach(function (m) { m.remove(); });
    }

    /* Las marcas son elementos posicionados sobre la escena, no
       píxeles dibujados: así no ensucian la foto que se descarga. */
    function pintarMarca(p) {
      var q = encuadre(lienzo);
      var m = document.createElement('span');
      m.className = 'escena__marca-ojo';
      m.style.left = (p.x * q.escala + q.offX) + 'px';
      m.style.top = (p.y * q.escala + q.offY) + 'px';
      $('#escena').appendChild(m);
    }

    function alTocar(e) {
      if (!marcando) return;
      var p = puntoEnLienzo(lienzo, e);
      ojos.push(p);
      pintarMarca(p);

      if (ojos.length === 1) {
        mostrarInstruccion('Ahora tocá tu <b>ojo izquierdo</b>');
        return;
      }

      marcando = false;
      ocultarInstruccion();
      limpiarMarcas();
      $('#ajustes').hidden = false;
      $('#pistaArrastre').hidden = false;
      dibujar();
    }

    /* ---------- Dibujo ---------- */
    function dibujarFondo() {
      ctx.save();
      if (espejar) {
        ctx.translate(lienzo.width, 0);
        ctx.scale(-1, 1);
      }
      if (video) ctx.drawImage(video, 0, 0, lienzo.width, lienzo.height);
      else if (imagen) ctx.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
      ctx.restore();
    }

    function dibujarMarco() {
      if (!marcoImg || ojos.length < 2) return;

      var a = ojos[0], b = ojos[1];
      var medio = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      var separacionPx = distancia(a, b);
      var angulo = Math.atan2(b.y - a.y, b.x - a.x);

      // El SVG mide 260 de ancho y sus pupilas están a 132 de distancia:
      // llevamos esa separación a la separación real medida en la foto.
      var escala = (separacionPx / Marcos.PUPILAS.separacion) * ajuste.escala;

      var anclaX = (Marcos.PUPILAS.izq.x + Marcos.PUPILAS.der.x) / 2;  // 130
      var anclaY = Marcos.PUPILAS.izq.y;                               // 52

      ctx.save();
      ctx.translate(medio.x, medio.y + ajuste.alto * (separacionPx / 100));
      ctx.rotate(angulo);
      ctx.drawImage(
        marcoImg,
        -anclaX * escala,
        -anclaY * escala,
        Marcos.VIEWBOX.w * escala,
        Marcos.VIEWBOX.h * escala
      );
      ctx.restore();
    }

    function dibujar() {
      if (!lienzo.width) return;
      ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      dibujarFondo();
      dibujarMarco();
    }

    function bucle() {
      if (!animando) return;
      dibujar();
      requestAnimationFrame(bucle);
    }

    /* ---------- Modelo elegido ---------- */
    function tinteSegun(p) {
      if (p.tipo !== 'sol') return 'transparente';
      var t = ajuste.tinte;
      if (t < 0.22) return 'transparente';
      if (t < 0.45) return 'degrade';
      if (t < 0.75) return p.tinte || 'gris';
      return 'negro';
    }

    function elegir(p) {
      producto = p;
      Marcos.imagen(p, { tinte: tinteSegun(p), sombra: false, ancho: 1040 })
        .then(function (img) {
          marcoImg = img;
          if (!animando) dibujar();
          pintarFichaElegido();
        })
        .catch(function () { UI.aviso('No pudimos dibujar ese modelo.', 'error'); });

      $$('#listaModelos .probador__opcion').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-sku') === p.sku));
      });
    }

    function pintarFichaElegido() {
      if (!producto) return;
      $('#fichaElegido').innerHTML =
        '<div class="tarjeta">' +
        '<p class="producto__marca">' + U.esc((Catalogo.marca(producto.marca) || {}).nombre || '') + '</p>' +
        '<h3 class="producto__nombre mt-s">' + U.esc(producto.modelo + ' ' + (producto.variante || '')) + '</h3>' +
        '<p class="producto__color">' + U.esc(producto.colorNombre) + ' · ' +
        U.esc(Catalogo.FORMAS_NOMBRE[producto.forma]) + '</p>' +
        '<p class="producto__precios"><span class="producto__precio">' + U.precio(producto.precio) + '</span></p>' +
        '<div class="columna mt-m">' +
        '<a class="btn btn--acento btn--bloque" href="producto.html?sku=' + encodeURIComponent(producto.sku) + '">Ver la ficha completa</a>' +
        '<button class="btn btn--fantasma btn--bloque" id="agregarProbador">Agregar al carrito</button>' +
        '</div></div>';

      $('#agregarProbador').addEventListener('click', function () {
        Carrito.agregar(producto.sku, null, 1);
      });
    }

    /* ---------- Lista de modelos ---------- */
    var filtroTipo = 'todos';

    function pintarFiltros() {
      var tipos = [{ id: 'todos', t: 'Todos' }, { id: 'sol', t: 'Sol' }, { id: 'receta', t: 'Receta' }];
      $('#filtroTipo').innerHTML = tipos.map(function (x) {
        return '<button class="chip" data-tipo="' + x.id + '" aria-pressed="' + (filtroTipo === x.id) + '">' + x.t + '</button>';
      }).join('');
      $$('#filtroTipo [data-tipo]').forEach(function (b) {
        b.addEventListener('click', function () {
          filtroTipo = b.getAttribute('data-tipo');
          pintarFiltros();
          pintarLista();
        });
      });
    }

    function pintarLista() {
      var lista = Catalogo.filtrar({ tipo: filtroTipo });
      $('#listaModelos').innerHTML = lista.map(function (p) {
        return '<button class="probador__opcion" data-sku="' + U.esc(p.sku) + '" ' +
          'aria-pressed="' + (producto && producto.sku === p.sku) + '">' +
          '<span class="placa ' + UI.placaDe(p) + '">' + Marcos.svg(p, { sombra: false, alt: '' }) + '</span>' +
          '<span class="probador__opcion-nombre">' + U.esc(p.modelo + ' ' + (p.variante || '')) + '</span>' +
          '</button>';
      }).join('');

      $$('#listaModelos .probador__opcion').forEach(function (b) {
        b.addEventListener('click', function () {
          elegir(Catalogo.porSku(b.getAttribute('data-sku')));
        });
      });
    }

    /* ---------- Arrastre del anteojo ---------- */
    function montarArrastre() {
      lienzo.addEventListener('pointerdown', function (e) {
        if (marcando || ojos.length < 2) return;
        lienzo.setPointerCapture(e.pointerId);
        arrastre = { ini: puntoEnLienzo(lienzo, e), ojos: ojos.map(function (o) { return { x: o.x, y: o.y }; }) };
        lienzo.classList.add('arrastrando');
      });

      lienzo.addEventListener('pointermove', function (e) {
        if (!arrastre) return;
        var p = puntoEnLienzo(lienzo, e);
        var dx = p.x - arrastre.ini.x, dy = p.y - arrastre.ini.y;
        ojos = arrastre.ojos.map(function (o) { return { x: o.x + dx, y: o.y + dy }; });
        if (!animando) dibujar();
      });

      function soltar(e) {
        if (!arrastre) return;
        arrastre = null;
        lienzo.classList.remove('arrastrando');
        if (e && e.pointerId != null && lienzo.hasPointerCapture(e.pointerId)) {
          lienzo.releasePointerCapture(e.pointerId);
        }
      }
      lienzo.addEventListener('pointerup', soltar);
      lienzo.addEventListener('pointercancel', soltar);
    }

    /* ---------- Sacar foto ---------- */
    function sacarFoto() {
      if (ojos.length < 2) { UI.aviso('Marcá primero tus dos ojos.', 'error'); return; }
      dibujar();
      lienzo.toBlob(function (blob) {
        if (!blob) { UI.aviso('No pudimos generar la foto.', 'error'); return; }
        var archivo = new File([blob], 'probador-ojo.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
          navigator.share({ files: [archivo], title: 'Me probé unos ' + CONFIG.MARCA.nombre })
            .catch(function () { /* el usuario canceló */ });
          return;
        }
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'probador-ojo.png';
        a.click();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        UI.aviso('Foto descargada', 'exito');
      }, 'image/png');
    }

    /* ---------- Arranque ---------- */
    function iniciar() {
      $('#iconoInicio').innerHTML = I.camara;

      $('#btnCamara').addEventListener('click', usarCamara);
      $('#btnSubir').addEventListener('click', function () { $('#archivo').click(); });
      $('#btnCambiar').addEventListener('click', function () {
        pararCamara();
        imagen = null;
        ojos = [];
        ctx.clearRect(0, 0, lienzo.width, lienzo.height);
        $('#inicio').hidden = false;
        $('#herramientas').hidden = true;
        $('#ajustes').hidden = true;
        $('#pistaArrastre').hidden = true;
        ocultarInstruccion();
        limpiarMarcas();
      });
      $('#btnRecalibrar').addEventListener('click', pedirOjos);
      $('#btnFoto').addEventListener('click', sacarFoto);

      $('#archivo').addEventListener('change', function (e) {
        usarArchivo(e.target.files && e.target.files[0]);
        e.target.value = '';
      });

      lienzo.addEventListener('click', alTocar);

      $('#escala').addEventListener('input', function (e) {
        ajuste.escala = +e.target.value / 100;
        $('#valEscala').textContent = e.target.value + '%';
        if (!animando) dibujar();
      });
      $('#alto').addEventListener('input', function (e) {
        ajuste.alto = +e.target.value;
        $('#valAlto').textContent = e.target.value;
        if (!animando) dibujar();
      });
      $('#tinte').addEventListener('input', function (e) {
        ajuste.tinte = +e.target.value / 100;
        var v = +e.target.value;
        $('#valTinte').textContent = v < 22 ? 'Transparente' : v < 45 ? 'Suave' : v < 75 ? 'Normal' : 'Oscuro';
        if (producto) elegir(producto);
      });

      montarArrastre();
      pintarFiltros();
      pintarLista();

      // Si venís desde una ficha, arranca con ese modelo puesto.
      var sku = U.params().get('sku');
      elegir(Catalogo.porSku(sku) || Catalogo.destacados(1)[0]);

      window.addEventListener('beforeunload', pararCamara);
    }

    return { iniciar: iniciar };
  })();

  /* ============================================================
     MEDIDOR DE DISTANCIA PUPILAR
     ============================================================ */
  var MedidorDp = (function () {
    var lienzo = $('#lienzoDp');
    if (!lienzo) return null;
    var ctx = lienzo.getContext('2d');

    var video = null, stream = null, imagen = null, animando = false, espejar = false;
    var puntos = [];   // 0-1: bordes de la tarjeta · 2-3: pupilas

    var PASOS = [
      'Tocá el <b>borde izquierdo</b> de la tarjeta',
      'Ahora el <b>borde derecho</b> de la tarjeta',
      'Tocá tu <b>pupila derecha</b> (la que ves a la izquierda)',
      'Y por último tu <b>pupila izquierda</b>'
    ];

    function pararCamara() {
      if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
      animando = false;
      video = null;
    }

    function usarCamara() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        UI.aviso('Tu navegador no permite usar la cámara. Subí una foto.', 'error', 5000);
        return;
      }
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false
      }).then(function (s) {
        stream = s;
        imagen = null;
        espejar = true;
        video = document.createElement('video');
        video.srcObject = s;
        video.playsInline = true;
        video.muted = true;
        return video.play().then(function () {
          ajustarLienzo(lienzo, video.videoWidth || 1280, video.videoHeight || 960);
          $('#inicioDp').hidden = true;
          $('#herramientasDp').hidden = false;
          $('#btnCapturarDp').hidden = false;
          instruir('Acomodate y tocá <b>Congelar la imagen</b>');
          animando = true;
          bucle();
        });
      }).catch(function () {
        UI.aviso('No pudimos abrir la cámara. Probá subiendo una foto.', 'error', 5000);
      });
    }

    function usarArchivo(file) {
      if (!file) return;
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        pararCamara();
        imagen = img;
        espejar = false;
        ajustarLienzo(lienzo, img.naturalWidth, img.naturalHeight);
        $('#inicioDp').hidden = true;
        $('#herramientasDp').hidden = false;
        $('#btnCapturarDp').hidden = true;
        empezarAMarcar();
        URL.revokeObjectURL(url);
      };
      img.onerror = function () {
        UI.aviso('No pudimos leer esa imagen.', 'error');
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }

    /* Congela el cuadro actual de la cámara en una imagen fija:
       marcar puntos sobre video en vivo sería imposible. */
    function congelar() {
      if (!video) return;
      var tmp = document.createElement('canvas');
      tmp.width = lienzo.width;
      tmp.height = lienzo.height;
      var tctx = tmp.getContext('2d');
      tctx.save();
      if (espejar) { tctx.translate(tmp.width, 0); tctx.scale(-1, 1); }
      tctx.drawImage(video, 0, 0, tmp.width, tmp.height);
      tctx.restore();

      var img = new Image();
      img.onload = function () {
        pararCamara();
        imagen = img;
        espejar = false;
        $('#btnCapturarDp').hidden = true;
        empezarAMarcar();
      };
      img.src = tmp.toDataURL('image/png');
    }

    function empezarAMarcar() {
      puntos = [];
      instruir(PASOS[0]);
      dibujar();
    }

    function instruir(html) {
      var el = $('#instruccionDp');
      el.innerHTML = html;
      el.hidden = false;
    }

    function dibujarFondo() {
      ctx.save();
      if (espejar) { ctx.translate(lienzo.width, 0); ctx.scale(-1, 1); }
      if (video) ctx.drawImage(video, 0, 0, lienzo.width, lienzo.height);
      else if (imagen) ctx.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
      ctx.restore();
    }

    function dibujar() {
      ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      dibujarFondo();

      var r = Math.max(6, lienzo.width * 0.006);
      puntos.forEach(function (p, i) {
        var esTarjeta = i < 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = esTarjeta ? 'rgba(126,140,106,.9)' : 'rgba(224,107,60,.9)';
        ctx.fill();
        ctx.lineWidth = Math.max(2, r * 0.34);
        ctx.strokeStyle = '#fff';
        ctx.stroke();
      });

      // Línea de la tarjeta y línea entre pupilas
      function linea(a, b, color) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(2, r * 0.4);
        ctx.setLineDash([r * 1.6, r * 1.2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (puntos.length >= 2) linea(puntos[0], puntos[1], 'rgba(126,140,106,.85)');
      if (puntos.length === 4) linea(puntos[2], puntos[3], 'rgba(224,107,60,.85)');
    }

    function bucle() {
      if (!animando) return;
      dibujar();
      requestAnimationFrame(bucle);
    }

    function alTocar(e) {
      if (!imagen || puntos.length >= 4) return;
      puntos.push(puntoEnLienzo(lienzo, e));
      dibujar();

      if (puntos.length < 4) {
        instruir(PASOS[puntos.length]);
        return;
      }
      $('#instruccionDp').hidden = true;
      calcular();
    }

    function calcular() {
      var anchoTarjetaPx = distancia(puntos[0], puntos[1]);
      var dpPx = distancia(puntos[2], puntos[3]);

      if (anchoTarjetaPx < 20) {
        UI.aviso('Los bordes de la tarjeta quedaron muy juntos. Probá de nuevo.', 'error', 5000);
        return reiniciar();
      }

      var mmPorPx = ANCHO_TARJETA_MM / anchoTarjetaPx;
      var dp = dpPx * mmPorPx;
      var redondeada = Math.round(dp * 2) / 2;   // al medio milímetro

      var rango = Cristales.RANGOS.dp;
      if (redondeada < rango.min || redondeada > rango.max) {
        $('#resultadoDp').innerHTML = '?<small>mm</small>';
        $('#detalleDp').innerHTML =
          'Nos dio <strong>' + redondeada.toFixed(1).replace('.', ',') + ' mm</strong>, y eso queda fuera ' +
          'de lo esperable (' + rango.min + ' a ' + rango.max + ' mm). Suele pasar cuando la tarjeta ' +
          'no está bien horizontal o quedó a distinta profundidad que los ojos. Probá de nuevo.';
        $('#accionesDp').hidden = false;
        $('#btnUsarDp').hidden = true;
        return;
      }

      $('#resultadoDp').innerHTML = String(redondeada).replace('.', ',') + '<small>mm</small>';
      $('#detalleDp').innerHTML =
        'Medida con la tarjeta como referencia (85,6 mm). ' +
        'Podés usarla al configurar tus cristales.';
      $('#accionesDp').hidden = false;
      $('#btnUsarDp').hidden = false;
      $('#btnUsarDp').setAttribute('data-dp', String(redondeada));
      U.Guardado.escribir('ojo.dp', redondeada);
    }

    function reiniciar() {
      puntos = [];
      $('#accionesDp').hidden = true;
      $('#resultadoDp').innerHTML = '—<small>mm</small>';
      $('#detalleDp').textContent = 'Todavía no medimos nada.';
      if (imagen) { instruir(PASOS[0]); dibujar(); }
    }

    function iniciar() {
      $('#iconoDp').innerHTML = I.regla;

      $('#btnCamaraDp').addEventListener('click', usarCamara);
      $('#btnSubirDp').addEventListener('click', function () { $('#archivoDp').click(); });
      $('#archivoDp').addEventListener('change', function (e) {
        usarArchivo(e.target.files && e.target.files[0]);
        e.target.value = '';
      });
      $('#btnCapturarDp').addEventListener('click', congelar);
      $('#btnReiniciarDp').addEventListener('click', function () {
        pararCamara();
        imagen = null;
        puntos = [];
        ctx.clearRect(0, 0, lienzo.width, lienzo.height);
        $('#inicioDp').hidden = false;
        $('#herramientasDp').hidden = true;
        $('#instruccionDp').hidden = true;
        reiniciar();
      });
      $('#btnRepetirDp').addEventListener('click', reiniciar);

      $('#btnUsarDp').addEventListener('click', function () {
        var dp = $('#btnUsarDp').getAttribute('data-dp');
        var sku = U.params().get('sku');
        if (sku) {
          location.href = 'producto.html?sku=' + encodeURIComponent(sku) + '&dp=' + encodeURIComponent(dp);
        } else {
          UI.aviso('Guardamos tu DP: ' + dp + ' mm. Se va a completar sola al configurar los cristales.', 'exito', 5000);
          location.href = 'tienda.html?tipo=receta';
        }
      });

      lienzo.addEventListener('click', alTocar);
      window.addEventListener('beforeunload', pararCamara);
    }

    return { iniciar: iniciar };
  })();

  if (Probador) Probador.iniciar();
  if (MedidorDp) MedidorDp.iniciar();
})();
