/* ============================================================
   OJO — Ficha de producto y configurador de cristales
   ------------------------------------------------------------
   Ojo con los re-render: la tabla de receta tiene inputs de texto,
   así que NUNCA se re-dibuja mientras el usuario escribe (perdería
   el foco). Se actualizan sólo los bloques que cambian:
   recomendación de índice, tarjetas de índice y resumen de precio.
   ============================================================ */
(function () {
  'use strict';

  var $ = U.$, $$ = U.$$, I = UI.I;

  var producto = Catalogo.porSku(U.params().get('sku'));
  var config;

  /* ---------- Producto inexistente ---------- */
  if (!producto) {
    $('#ficha').innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:80px 20px">' +
      '<h1>No encontramos ese modelo</h1>' +
      '<p class="bajada mt-m" style="margin-inline:auto">Puede que ya no esté disponible.</p>' +
      '<a class="btn btn--acento mt-l" href="tienda.html">Ver el catálogo</a></div>';
    var bf = $('#barraFija'); if (bf) bf.remove();
    return;
  }

  config = Cristales.configInicial(producto);

  /* Si venís del probador con una DP medida, la traemos ya cargada.
     Puede llegar por la URL o haber quedado guardada de una medición
     anterior en la misma sesión. */
  (function traerDpDelProbador() {
    var dp = U.params().get('dp') || U.Guardado.leer('ojo.dp', null);
    if (dp) config.receta.dp = String(dp);
    if (U.params().get('dp')) config.conCristales = true;
  })();

  document.title = Catalogo.nombreCompleto(producto) + ' — ' + CONFIG.MARCA.nombre;

  /* ============================================================
     Migas
     ============================================================ */
  function pintarMigas() {
    var tipo = producto.tipo === 'sol' ? 'Anteojos de sol' : 'Anteojos de receta';
    $('#migas').innerHTML =
      '<a href="index.html">Inicio</a><span class="migas__sep">/</span>' +
      '<a href="tienda.html?tipo=' + producto.tipo + '">' + tipo + '</a><span class="migas__sep">/</span>' +
      '<span>' + U.esc(Catalogo.nombreCompleto(producto)) + '</span>';
  }

  /* ============================================================
     Variantes de color del mismo modelo
     ============================================================ */
  function variantes() {
    return Catalogo.todos().filter(function (p) {
      return p.marca === producto.marca && p.modelo === producto.modelo;
    });
  }

  /* ============================================================
     Media
     ============================================================ */
  function htmlMedia() {
    var vs = variantes();
    return '<div class="ficha__media">' +
      '<div class="ficha__principal">' + UI.medioProducto(producto) + '</div>' +
      (vs.length > 1
        ? '<div class="ficha__miniaturas">' +
        vs.map(function (v) {
          return '<a class="ficha__mini" href="producto.html?sku=' + encodeURIComponent(v.sku) + '"' +
            (v.sku === producto.sku ? ' aria-pressed="true"' : ' aria-pressed="false"') +
            ' title="' + U.esc(v.colorNombre) + '" aria-label="' + U.esc(v.colorNombre) + '">' +
            UI.medioProducto(v, { sombra: false }) + '</a>';
        }).join('') +
        '</div>'
        : '') +
      '<a class="btn btn--fantasma btn--bloque mt-m" href="probador.html?sku=' + encodeURIComponent(producto.sku) + '">' +
      I.camara + ' Probártelo con la cámara</a>' +
      '</div>';
  }

  /* ============================================================
     Cabezal de la info
     ============================================================ */
  function htmlCabezal() {
    var marca = Catalogo.marca(producto.marca);
    var etiquetas = UI.etiquetasDe(producto);

    return '<p class="ficha__marca">' + U.esc(marca ? marca.nombreLargo : producto.marca) + '</p>' +
      '<h1 class="ficha__nombre">' + U.esc(producto.modelo) +
      (producto.variante ? ' <em class="ital">' + U.esc(producto.variante) + '</em>' : '') + '</h1>' +
      '<p class="producto__color mt-s">' + U.esc(producto.colorNombre) + ' · ' +
      U.esc(Catalogo.FORMAS_NOMBRE[producto.forma]) + ' · ' +
      U.esc(Catalogo.MATERIALES_NOMBRE[producto.material]) + '</p>' +
      (etiquetas ? '<div class="fila fila--envuelve mt-m">' + etiquetas + '</div>' : '') +
      '<p class="ficha__relato">' + U.esc(producto.relato) + '</p>' +

      '<div class="ficha__medidas">' +
      '<div class="medida"><p class="medida__valor">' + producto.calce.lente + '</p><p class="medida__nombre">Lente (mm)</p></div>' +
      '<div class="medida"><p class="medida__valor">' + producto.calce.puente + '</p><p class="medida__nombre">Puente</p></div>' +
      '<div class="medida"><p class="medida__valor">' + producto.calce.varilla + '</p><p class="medida__nombre">Varilla</p></div>' +
      '<div class="medida"><p class="medida__valor" style="text-transform:capitalize">' + U.esc(producto.calceNombre) + '</p><p class="medida__nombre">Calce</p></div>' +
      '</div>';
  }

  /* ============================================================
     Configurador
     ============================================================ */
  function bloque(num, titulo, ayuda, cuerpo, id) {
    return '<div class="config__bloque"' + (id ? ' id="' + id + '"' : '') + '>' +
      '<h2 class="config__titulo"><span class="config__num">' + num + '</span>' + U.esc(titulo) + '</h2>' +
      (ayuda ? '<p class="config__ayuda">' + ayuda + '</p>' : '') +
      cuerpo + '</div>';
  }

  function opcion(nombre, valor, elegido, titulo, detalle, precio, tipo, deshabilitado) {
    return '<label class="opcion">' +
      '<input type="' + (tipo || 'radio') + '" name="' + nombre + '" value="' + U.esc(valor) + '"' +
      (elegido ? ' checked' : '') + (deshabilitado ? ' disabled' : '') + '>' +
      '<span class="opcion__tilde" aria-hidden="true">' + I.tilde + '</span>' +
      '<span class="opcion__cabeza">' +
      '<span class="opcion__nombre">' + U.esc(titulo) + '</span>' +
      (precio != null ? '<span class="opcion__precio' + (precio === 0 ? ' opcion__precio--gratis' : '') + '">' +
        (precio === 0 ? 'Sin cargo' : '+ ' + U.precio(precio)) + '</span>' : '') +
      '</span>' +
      (detalle ? '<span class="opcion__detalle">' + U.esc(detalle) + '</span>' : '') +
      '</label>';
  }

  /* ---- 1. Con o sin cristales ---- */
  function htmlPaso1() {
    var esSol = producto.tipo === 'sol';
    return bloque(1, '¿Cómo lo querés?', null,
      '<div class="config__opciones config__opciones--2">' +
      opcion('modo', 'armazon', !config.conCristales, 'Sólo el armazón',
        esSol ? 'Con los cristales de sol originales.' : 'Le ponés los cristales en tu óptica de confianza.') +
      opcion('modo', 'cristales', config.conCristales,
        esSol ? 'Con mi graduación' : 'Con cristales de receta',
        esSol ? 'Cristales de sol graduados, armados a medida.' : 'Los armamos en taller con tu receta.') +
      '</div>');
  }

  /* ---- 2. Para qué los vas a usar ---- */
  function htmlPaso2() {
    if (!config.conCristales) return '';
    var esSol = producto.tipo === 'sol';
    var usos = Cristales.USOS.filter(function (u) {
      return esSol ? true : u.id !== 'sin-aumento';
    });
    return bloque(2, 'Para qué los vas a usar', null,
      '<div class="config__opciones">' +
      usos.map(function (u) {
        return opcion('uso', u.id, config.uso === u.id, u.nombre, u.detalle, u.recargo || null);
      }).join('') +
      '</div>');
  }

  /* ---- 3. Receta ---- */
  function htmlFilaReceta(ojo, etiqueta, pideAdicion) {
    var o = config.receta[ojo] || {};
    function celda(campo, ph, paso, min, max) {
      return '<td><input class="entrada entrada--mono" type="number" ' +
        'data-ojo="' + ojo + '" data-campo="' + campo + '" ' +
        'value="' + U.esc(o[campo] || '') + '" placeholder="' + ph + '" ' +
        'step="' + paso + '" min="' + min + '" max="' + max + '" ' +
        'inputmode="decimal" aria-label="' + etiqueta + ' — ' + campo + '"></td>';
    }
    return '<tr>' +
      '<td>' + etiqueta + '</td>' +
      celda('esf', '0.00', '0.25', '-20', '20') +
      celda('cil', '0.00', '0.25', '-6', '0') +
      celda('eje', '0', '1', '0', '180') +
      (pideAdicion ? celda('adicion', '+0.00', '0.25', '0.75', '3.5') : '') +
      '</tr>';
  }

  function htmlPaso3() {
    if (!config.conCristales) return '';
    var u = Cristales.uso(config.uso);
    if (u && u.sinReceta) return '';

    var pideAdicion = !!(u && u.requiereAdicion);

    var tabla =
      '<table class="receta">' +
      '<thead><tr><th></th><th>Esfera</th><th>Cilindro</th><th>Eje</th>' +
      (pideAdicion ? '<th>Adición</th>' : '') + '</tr></thead>' +
      '<tbody>' +
      htmlFilaReceta('od', 'OD', pideAdicion) +
      htmlFilaReceta('oi', 'OI', pideAdicion) +
      '</tbody></table>' +

      '<div class="receta__pie">' +
      '<div class="campo" style="max-width:190px">' +
      '<label class="campo__label" for="dp">Distancia pupilar (mm)</label>' +
      '<input class="entrada entrada--mono" type="number" id="dp" value="' + U.esc(config.receta.dp || '') + '" ' +
      'placeholder="63" step="0.5" min="48" max="78" inputmode="decimal">' +
      '</div>' +
      '<div style="align-self:flex-end;padding-bottom:2px">' +
      '<a class="enlace" href="probador.html?sku=' + encodeURIComponent(producto.sku) + '#dp">' + I.regla + ' Medirla con la cámara</a>' +
      '</div>' +
      '</div>' +

      '<p class="nota mt-m">' +
      'Si no la sabés, dejala vacía: la medimos nosotros antes de armar. ' +
      '<button type="button" class="enlace" id="btnTransponer" style="font-size:inherit">Mi receta tiene el cilindro en positivo</button>' +
      '</p>' +
      '<div id="erroresReceta"></div>';

    var modos =
      '<div class="config__opciones config__opciones--2" style="margin-bottom:18px">' +
      opcion('modoReceta', 'cargar', config.modoReceta === 'cargar', 'La cargo ahora', 'Escribís los valores de tu receta.') +
      opcion('modoReceta', 'foto', config.modoReceta === 'foto', 'Subo una foto', 'Sacale una foto a la receta en papel.') +
      opcion('modoReceta', 'despues', config.modoReceta === 'despues', 'Te la mando después', 'Te escribimos por WhatsApp para pedírtela.') +
      '</div>';

    var cuerpo = modos;
    if (config.modoReceta === 'cargar') cuerpo += tabla;
    else if (config.modoReceta === 'foto') {
      cuerpo += '<div class="campo">' +
        '<label class="campo__label" for="archivoReceta">Foto de la receta</label>' +
        '<input class="entrada" type="file" id="archivoReceta" accept="image/*,.pdf">' +
        '<p class="campo__ayuda">' + (config.recetaArchivo
          ? 'Adjuntado: ' + U.esc(config.recetaArchivo)
          : 'Sacá la foto derecha y con buena luz, que se lean los números.') + '</p>' +
        '</div>';
    } else {
      cuerpo += '<p class="nota">Listo. Cuando confirmes el pedido te escribimos al WhatsApp que dejes en el checkout para pedirte la receta. Recién ahí mandamos a taller.</p>';
    }

    return bloque(3, 'Tu receta',
      'Aceptamos recetas de hasta 12 meses. Los valores van en el formato que usa tu óptica: cilindro en negativo.',
      cuerpo, 'bloqueReceta');
  }

  /* ---- 4. Índice ---- */
  function htmlPaso4() {
    if (!config.conCristales) return '';
    var u = Cristales.uso(config.uso);
    if (u && u.sinReceta) return '';

    var rec = Cristales.recomendarIndice(config.receta);

    var cuerpo =
      '<div class="recomendacion">' +
      '<span class="recomendacion__icono">' + I.info + '</span>' +
      '<span>' + (rec.potencia
        ? '<strong>Te recomendamos el ' + rec.indice.id + '.</strong> ' + U.esc(rec.motivo)
        : U.esc(rec.motivo)) + '</span>' +
      '</div>' +
      '<div class="config__opciones">' +
      Cristales.INDICES.map(function (idx) {
        var esRec = idx.id === rec.indice.id && rec.potencia > 0;
        var insuficiente = rec.potencia > idx.hasta;
        return opcion('indice', idx.id, config.indice === idx.id,
          idx.nombre + (esRec ? '  ·  recomendado' : ''),
          insuficiente
            ? 'Para tu graduación este índice queda muy grueso.'
            : idx.detalle,
          idx.precio, 'radio', false);
      }).join('') +
      '</div>';

    return bloque(4, 'Grosor del cristal',
      'Cuanto más alto el índice, más fino el cristal. Con graduaciones altas se nota mucho.',
      cuerpo, 'bloqueIndice');
  }

  /* ---- 5. Tratamientos ---- */
  function htmlPaso5() {
    if (!config.conCristales) return '';
    var disponibles = Cristales.tratamientosDisponibles(producto, config);

    return bloque(5, 'Tratamientos',
      'El endurecido antirrayas va incluido en todos nuestros cristales.',
      '<div class="config__opciones">' +
      disponibles.map(function (d) {
        var t = d.tratamiento;
        var bonificado = t.bonificable;
        var detalle = d.bloqueadoPor
          ? 'No se puede combinar con ' + d.bloqueadoPor.nombre + '.'
          : t.detalle;
        return '<label class="opcion">' +
          '<input type="checkbox" name="tratamiento" value="' + U.esc(t.id) + '"' +
          (d.elegido ? ' checked' : '') +
          ((t.incluido || d.bloqueadoPor) ? ' disabled' : '') + '>' +
          '<span class="opcion__tilde" aria-hidden="true">' + I.tilde + '</span>' +
          '<span class="opcion__cabeza">' +
          '<span class="opcion__nombre">' + U.esc(t.nombre) + '</span>' +
          '<span class="opcion__precio' + ((t.incluido || bonificado) ? ' opcion__precio--gratis' : '') + '">' +
          (t.incluido ? 'Incluido'
            : bonificado ? '<span class="tachado">' + U.precio(t.precio) + '</span> Sin cargo'
              : '+ ' + U.precio(t.precio)) +
          '</span></span>' +
          '<span class="opcion__detalle">' + U.esc(detalle) + '</span>' +
          '</label>';
      }).join('') +
      '</div>');
  }

  /* ---- 6. Tinte (sólo sol con graduación) ---- */
  function htmlPaso6() {
    if (!config.conCristales || producto.tipo !== 'sol') return '';
    return bloque(6, 'Color del cristal', null,
      '<div class="config__opciones config__opciones--2">' +
      Cristales.TINTES_SOL.map(function (t) {
        return opcion('tinte', t.id, config.tinteSol === t.id, t.nombre, t.detalle);
      }).join('') +
      '</div>');
  }

  /* ---- Resumen de precio ---- */
  function htmlResumen() {
    var c = Cristales.calcular(producto, config);
    return '<div class="resumen-precio">' +
      c.lineas.map(function (l) {
        return '<div class="resumen-precio__linea' + (l.promo ? ' resumen-precio__linea--promo' : '') + '">' +
          '<span>' + U.esc(l.nombre) + '</span>' +
          '<span>' + (l.tachado ? '<span class="tachado">' + U.precio(l.tachado) + '</span> ' : '') +
          (l.monto === 0 ? 'Sin cargo' : U.precio(l.monto)) + '</span></div>';
      }).join('') +
      '<div class="resumen-precio__linea resumen-precio__linea--promo">' +
      '<span>Envío</span><span>Sin cargo</span></div>' +
      '<div class="resumen-precio__total"><span>Total</span><span>' + U.precio(c.total) + '</span></div>' +
      '<p class="nota mt-s">' + CONFIG.PAGOS.cuotasSinInteres + ' cuotas sin interés de ' + U.cuota(c.total) + '</p>' +
      '</div>';
  }

  function htmlGarantias() {
    return '<div class="ficha__garantias">' +
      '<div class="garantia">' + I.envio + '<span>' + U.esc(CONFIG.ENVIO.leyenda) + '. ' +
      'AMBA en ' + U.esc(CONFIG.ENVIO.plazoAMBA) + ', interior ' + U.esc(CONFIG.ENVIO.plazoInterior) + '.' +
      (config.conCristales ? ' ' + U.esc(CONFIG.ENVIO.plazoConReceta) + '.' : '') + '</span></div>' +
      '<div class="garantia">' + I.cambio + '<span>' + U.esc(CONFIG.LEGAL.cambios) + '</span></div>' +
      '<div class="garantia">' + I.escudo + '<span>' + U.esc(CONFIG.LEGAL.garantia) + '</span></div>' +
      (config.uso === 'progresivo'
        ? '<div class="garantia">' + I.ojo + '<span>' + U.esc(CONFIG.LEGAL.adaptacionProgresivos) + '</span></div>'
        : '') +
      '</div>';
  }

  /* ============================================================
     Render
     ============================================================ */
  /* Reemplaza el CONTENIDO de #config, nunca el nodo: los listeners
     delegados viven en #config y se registran una sola vez.

     Después sincroniza lo que vive FUERA de #config (precio grande,
     cuotas, garantías y barra fija), que si no se queda desfasado
     al cambiar de modo o de uso. */
  function pintarConfig() {
    $('#config').innerHTML =
      htmlPaso1() + htmlPaso2() + htmlPaso3() + htmlPaso4() + htmlPaso5() + htmlPaso6() +
      '<div class="config__bloque" id="resumen">' + htmlResumen() + '</div>';
    sincronizarFuera();
  }

  /* Todo lo que muestra el precio pero no está dentro de #config. */
  function sincronizarFuera() {
    var c = Cristales.calcular(producto, config);

    var grande = $('#precioGrande');
    if (grande) grande.textContent = U.precio(c.total);

    var cuotas = $('#cuotasGrande');
    if (cuotas) cuotas.textContent = CONFIG.PAGOS.cuotasSinInteres + ' cuotas sin interés de ' + U.cuota(c.total);

    var gar = $('#garantias');
    if (gar) gar.innerHTML = htmlGarantias();

    var p = $('#barraPrecio'), q = $('#barraCuotas');
    if (p) p.textContent = U.precio(c.total);
    if (q) q.textContent = CONFIG.PAGOS.cuotasSinInteres + ' × ' + U.cuota(c.total);
  }

  function pintarFicha() {
    var c = Cristales.calcular(producto, config);

    $('#ficha').innerHTML =
      htmlMedia() +
      '<div class="ficha__info">' +
      htmlCabezal() +
      '<div class="ficha__precio-bloque">' +
      '<span class="ficha__precio" id="precioGrande">' + U.precio(c.total) + '</span>' +
      (producto.precioTachado ? '<span class="tachado">' + U.precio(producto.precioTachado) + '</span>' : '') +
      '<span class="ficha__cuotas" id="cuotasGrande">' + CONFIG.PAGOS.cuotasSinInteres + ' cuotas sin interés de ' + U.cuota(c.total) + '</span>' +
      '</div>' +
      '<div class="config" id="config"></div>' +
      '<div class="ficha__acciones">' +
      '<button class="btn btn--acento btn--grande btn--bloque" id="agregar"' +
      (producto.stock ? '' : ' disabled') + '>' +
      (producto.stock ? 'Agregar al carrito' : 'Sin stock') + '</button>' +
      '</div>' +
      '<div id="garantias">' + htmlGarantias() + '</div>' +
      '</div>';

    engancharConfig();   // una sola vez, sobre el #config recién creado
    pintarConfig();
    $('#agregar').addEventListener('click', agregar);
  }

  /* ============================================================
     Eventos del configurador
     ============================================================ */
  function engancharConfig() {
    var raiz = $('#config');

    /* --- Radios --- */
    raiz.addEventListener('change', function (e) {
      var t = e.target;

      if (t.name === 'modo') {
        config.conCristales = t.value === 'cristales';
        if (config.conCristales && producto.tipo === 'sol' && config.uso === 'sin-aumento') {
          config.uso = 'lejos';
        }
        return pintarConfig();
      }

      if (t.name === 'uso') {
        config.uso = t.value;
        autoIndice();
        return pintarConfig();
      }

      if (t.name === 'modoReceta') {
        config.modoReceta = t.value;
        return pintarConfig();
      }

      if (t.name === 'indice') {
        config.indice = t.value;
        config.indiceAuto = false;   // el usuario eligió: dejamos de pisarlo
        return actualizarPrecio();
      }

      if (t.name === 'tinte') {
        config.tinteSol = t.value;
        return actualizarPrecio();
      }

      if (t.name === 'tratamiento') {
        var id = t.value;
        var lista = config.tratamientos.slice();
        if (t.checked) {
          if (lista.indexOf(id) === -1) lista.push(id);
        } else {
          lista = lista.filter(function (x) { return x !== id; });
        }
        config.tratamientos = lista;
        // Se re-dibuja el bloque entero porque los incompatibles cambian.
        return pintarConfig();
      }

      if (t.id === 'archivoReceta') {
        config.recetaArchivo = t.files && t.files[0] ? t.files[0].name : null;
        return pintarConfig();
      }
    });

    /* --- Campos de receta: NO re-dibujar mientras se escribe --- */
    raiz.addEventListener('input', function (e) {
      var t = e.target;

      if (t.dataset && t.dataset.ojo) {
        config.receta[t.dataset.ojo][t.dataset.campo] = t.value;
        autoIndice();
        actualizarRecomendacion();
        actualizarPrecio();
        return;
      }

      if (t.id === 'dp') {
        config.receta.dp = t.value;
      }
    });

    /* --- Transponer cilindro positivo ---
       Delegado, porque el botón se re-crea en cada repintado. */
    raiz.addEventListener('click', function (e) {
      if (!e.target.closest('#btnTransponer')) return;
      config.receta = Cristales.transponer(config.receta);
      autoIndice();
      pintarConfig();
      UI.aviso('Receta transpuesta a cilindro negativo', 'exito');
    });
  }

  /* Elige el índice solo mientras el usuario no haya tocado esa sección. */
  function autoIndice() {
    if (!config.indiceAuto) return;
    var rec = Cristales.recomendarIndice(config.receta);
    if (rec.potencia > 0) config.indice = rec.indice.id;
  }

  function actualizarRecomendacion() {
    var bloqueIdx = $('#bloqueIndice');
    if (!bloqueIdx) return;
    // Re-dibuja sólo el bloque de índice: no tiene inputs de texto,
    // así que no hay foco que perder.
    bloqueIdx.outerHTML = htmlPaso4();
  }

  /* Actualiza el desglose sin re-dibujar el resto del configurador
     (se usa mientras el usuario escribe la receta). */
  function actualizarPrecio() {
    var resumen = $('#resumen');
    if (resumen) resumen.innerHTML = htmlResumen();
    sincronizarFuera();
  }

  /* ============================================================
     Agregar al carrito
     ============================================================ */
  function agregar() {
    var v = Cristales.validar(config);

    if (!v.ok) {
      var host = $('#erroresReceta');
      var mensajes = [];
      Object.keys(v.errores).forEach(function (k) {
        (v.errores[k] || []).forEach(function (m) {
          mensajes.push((k === 'od' ? 'Ojo derecho: ' : k === 'oi' ? 'Ojo izquierdo: ' : '') + m);
        });
      });
      if (host) {
        host.innerHTML = '<div class="campo__error mt-s">' +
          mensajes.map(function (m) { return '<p>· ' + U.esc(m) + '</p>'; }).join('') + '</div>';
        host.scrollIntoView({ behavior: U.reducido ? 'auto' : 'smooth', block: 'center' });
      }
      UI.aviso(mensajes[0] || 'Revisá los datos de la receta', 'error');
      return;
    }

    // Guardamos la receta en la cuenta para no tener que recargarla.
    if (config.conCristales && config.modoReceta === 'cargar' && Auth.logueado()) {
      var esf = Cristales.num(config.receta.od.esf);
      if (esf != null) Auth.Cuenta.guardarReceta(config.receta, 'Receta de ' + U.fecha(new Date(), 'corta'));
    }

    Carrito.agregar(producto.sku, config.conCristales ? config : null, 1);
  }

  /* ============================================================
     Relacionados
     ============================================================ */
  function pintarRelacionados() {
    var lista = Catalogo.relacionados(producto, 4);
    if (!lista.length) return;
    $('#seccionRelacionados').hidden = false;
    $('#relacionados').innerHTML = lista.map(UI.tarjetaProducto).join('');
    UI.revelar($('#relacionados'));
  }

  /* ============================================================
     Barra fija en mobile
     ============================================================ */
  function montarBarraFija() {
    var barra = $('#barraFija');
    if (!barra) return;
    $('#barraAgregar').addEventListener('click', agregar);

    var acciones = $('#agregar');
    if (!acciones || !('IntersectionObserver' in window)) {
      barra.classList.add('visible');
      return;
    }
    // La barra aparece cuando el botón grande se fue de pantalla.
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        barra.classList.toggle('visible', !e.isIntersecting);
      });
    }, { threshold: 0 });
    obs.observe(acciones);
  }

  /* ============================================================
     Datos estructurados
     ============================================================ */
  function jsonLd() {
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: Catalogo.nombreCompleto(producto),
      description: producto.relato,
      color: producto.colorNombre,
      material: Catalogo.MATERIALES_NOMBRE[producto.material],
      sku: producto.sku,
      brand: { '@type': 'Brand', name: (Catalogo.marca(producto.marca) || {}).nombreLargo || producto.marca },
      offers: {
        '@type': 'Offer',
        price: producto.precio,
        priceCurrency: 'ARS',
        availability: producto.stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
      }
    });
    document.head.appendChild(s);
  }

  /* ---------- Arranque ---------- */
  pintarMigas();
  pintarFicha();
  pintarRelacionados();
  montarBarraFija();
  jsonLd();
})();
