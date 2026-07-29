/* ============================================================
   OJO — Catálogo
   ------------------------------------------------------------
   El estado de los filtros vive en la URL: así el back del
   navegador funciona y cualquier búsqueda es compartible.
   ============================================================ */
(function () {
  'use strict';

  var $ = U.$, $$ = U.$$;

  /* ---------- Definición de los grupos de filtro ---------- */
  var GRUPOS = [
    { clave: 'marca', titulo: 'Marca', campo: 'marca', etiqueta: function (v) { var m = Catalogo.marca(v); return m ? m.nombre : v; } },
    { clave: 'forma', titulo: 'Forma', campo: 'forma', etiqueta: function (v) { return Catalogo.FORMAS_NOMBRE[v] || v; } },
    { clave: 'material', titulo: 'Material', campo: 'material', etiqueta: function (v) { return Catalogo.MATERIALES_NOMBRE[v] || v; } },
    { clave: 'genero', titulo: 'Estilo', campo: 'genero', etiqueta: function (v) { return ({ hombre: 'Hombre', mujer: 'Mujer', unisex: 'Unisex' })[v] || v; } },
    { clave: 'calce', titulo: 'Calce', campo: 'calceNombre', etiqueta: function (v) { return ({ chico: 'Chico', mediano: 'Mediano', grande: 'Grande' })[v] || v; } },
    { clave: 'tags', titulo: 'Características', campo: 'tags', etiqueta: function (v) { return Catalogo.ETIQUETAS[v] || v; } }
  ];

  var estado = {
    tipo: 'todos',
    marca: [], forma: [], material: [], genero: [], calce: [], tags: [],
    precioMax: null,
    orden: 'relevancia'
  };

  /* ---------- URL → estado ---------- */
  function leerUrl() {
    var p = U.params();
    estado.tipo = p.get('tipo') || 'todos';
    ['marca', 'forma', 'material', 'genero', 'calce', 'tags'].forEach(function (k) {
      var v = p.get(k);
      estado[k] = v ? v.split(',').filter(Boolean) : [];
    });
    var max = p.get('hasta');
    estado.precioMax = max ? parseInt(max, 10) : null;
    estado.orden = p.get('orden') || 'relevancia';
  }

  function escribirUrl(reemplazar) {
    U.setParams({
      tipo: estado.tipo === 'todos' ? null : estado.tipo,
      marca: estado.marca, forma: estado.forma, material: estado.material,
      genero: estado.genero, calce: estado.calce, tags: estado.tags,
      hasta: estado.precioMax, orden: estado.orden === 'relevancia' ? null : estado.orden
    }, reemplazar);
  }

  /* ---------- Encabezado según el tipo ---------- */
  var TITULOS = {
    todos: { volanta: 'Todo el catálogo', titulo: 'El <em class="ital">catálogo</em>', bajada: 'Cinco marcas curadas. Todos los modelos se pueden armar con cristales de receta y todos van con envío sin cargo.' },
    sol: { volanta: 'Protección UV400', titulo: 'Anteojos de <em class="ital">sol</em>', bajada: 'Polarizados, espejados y degradés. Todos con protección UV400 real y la opción de armarlos con tu graduación.' },
    receta: { volanta: 'Con tu graduación', titulo: 'Anteojos de <em class="ital">receta</em>', bajada: 'Elegí el armazón y cargá tu receta: te recomendamos el índice de cristal que te conviene y lo armamos en taller.' }
  };

  function pintarCabezal() {
    var t = TITULOS[estado.tipo] || TITULOS.todos;
    $('#volantaTexto').textContent = t.volanta;
    $('#tituloCatalogo').innerHTML = t.titulo;
    $('#bajadaCatalogo').textContent = t.bajada;
    $('#migaActual').textContent = estado.tipo === 'sol' ? 'Anteojos de sol'
      : estado.tipo === 'receta' ? 'Anteojos de receta' : 'Catálogo';
    document.title = (estado.tipo === 'sol' ? 'Anteojos de sol' : estado.tipo === 'receta' ? 'Anteojos de receta' : 'Catálogo') + ' — ' + CONFIG.MARCA.nombre;
  }

  function pintarTiposRapidos() {
    var host = $('#tiposRapidos');
    var tipos = [
      { id: 'todos', texto: 'Todo' },
      { id: 'sol', texto: 'Sol' },
      { id: 'receta', texto: 'Receta' }
    ];
    host.innerHTML = tipos.map(function (t) {
      var n = Catalogo.filtrar({ tipo: t.id }).length;
      return '<button class="chip" data-tipo="' + t.id + '" aria-pressed="' + (estado.tipo === t.id) + '">' +
        U.esc(t.texto) + ' <span class="chip__conteo">' + n + '</span></button>';
    }).join('');

    host.querySelectorAll('[data-tipo]').forEach(function (b) {
      b.addEventListener('click', function () {
        estado.tipo = b.getAttribute('data-tipo');
        aplicar();
      });
    });
  }

  /* ---------- Panel de filtros ----------
     Los contadores se calculan sobre el resultado de TODOS los
     otros filtros menos el propio, que es lo que hace que los
     números tengan sentido al ir combinando.                     */
  function baseSinGrupo(clave) {
    var f = { tipo: estado.tipo };
    GRUPOS.forEach(function (g) {
      if (g.clave !== clave) f[g.clave] = estado[g.clave];
    });
    if (estado.precioMax) f.precioMax = estado.precioMax;
    return Catalogo.filtrar(f);
  }

  function pintarFiltros() {
    var host = $('#filtrosCuerpo');
    var rango = Catalogo.rangoPrecios();

    var html = GRUPOS.map(function (g) {
      var base = baseSinGrupo(g.clave);
      var conteos = Catalogo.facetas(base);
      var mapa = g.campo === 'tags' ? conteos.tags : conteos[g.campo];
      var valores = Object.keys(mapa).sort(function (a, b) { return mapa[b] - mapa[a]; });
      if (!valores.length) return '';

      return '<div class="filtros__grupo">' +
        '<p class="filtros__titulo">' + U.esc(g.titulo) + '</p>' +
        valores.map(function (v) {
          var marcado = estado[g.clave].indexOf(v) !== -1;
          return '<label class="filtros__check">' +
            '<input type="checkbox" data-grupo="' + g.clave + '" value="' + U.esc(v) + '"' + (marcado ? ' checked' : '') + '>' +
            '<span>' + U.esc(g.etiqueta(v)) + '</span>' +
            '<span class="filtros__conteo">' + mapa[v] + '</span>' +
            '</label>';
        }).join('') +
        '</div>';
    }).join('');

    html += '<div class="filtros__grupo">' +
      '<p class="filtros__titulo">Precio</p>' +
      '<div class="control">' +
      '<div class="control__cabeza"><span>Hasta</span>' +
      '<span class="control__valor" id="precioValor">' + U.precio(estado.precioMax || rango.max) + '</span></div>' +
      '<input class="deslizador" type="range" id="precioRango" ' +
      'min="' + rango.min + '" max="' + rango.max + '" step="5000" ' +
      'value="' + (estado.precioMax || rango.max) + '" aria-label="Precio máximo">' +
      '</div></div>';

    html += '<div class="filtros__grupo" style="border-bottom:0">' +
      '<button class="btn btn--fantasma btn--chico btn--bloque" id="limpiar">Limpiar filtros</button></div>';

    host.innerHTML = html;

    host.querySelectorAll('input[data-grupo]').forEach(function (input) {
      input.addEventListener('change', function () {
        var g = input.getAttribute('data-grupo');
        var v = input.value;
        if (input.checked) estado[g] = estado[g].concat([v]);
        else estado[g] = estado[g].filter(function (x) { return x !== v; });
        aplicar();
      });
    });

    var rangoEl = $('#precioRango');
    if (rangoEl) {
      rangoEl.addEventListener('input', function () {
        $('#precioValor').textContent = U.precio(parseInt(rangoEl.value, 10));
      });
      rangoEl.addEventListener('change', function () {
        var v = parseInt(rangoEl.value, 10);
        estado.precioMax = v >= rango.max ? null : v;
        aplicar();
      });
    }

    $('#limpiar').addEventListener('click', function () {
      GRUPOS.forEach(function (g) { estado[g.clave] = []; });
      estado.precioMax = null;
      aplicar();
    });
  }

  /* ---------- Chips de filtros activos ---------- */
  function pintarActivos() {
    var host = $('#filtrosActivos');
    var chips = [];

    GRUPOS.forEach(function (g) {
      estado[g.clave].forEach(function (v) {
        chips.push('<button class="chip activo" data-quitar="' + g.clave + '" data-valor="' + U.esc(v) + '">' +
          U.esc(g.etiqueta(v)) + '<span class="chip__x" aria-hidden="true">×</span>' +
          '<span class="solo-lectores">Quitar filtro</span></button>');
      });
    });

    if (estado.precioMax) {
      chips.push('<button class="chip activo" data-quitar="precioMax">Hasta ' + U.precio(estado.precioMax) +
        '<span class="chip__x" aria-hidden="true">×</span><span class="solo-lectores">Quitar filtro</span></button>');
    }

    host.innerHTML = chips.join('');
    host.querySelectorAll('[data-quitar]').forEach(function (b) {
      b.addEventListener('click', function () {
        var g = b.getAttribute('data-quitar');
        if (g === 'precioMax') estado.precioMax = null;
        else {
          var v = b.getAttribute('data-valor');
          estado[g] = estado[g].filter(function (x) { return x !== v; });
        }
        aplicar();
      });
    });
  }

  /* ---------- Resultados ---------- */
  function pintarGrilla() {
    var f = { tipo: estado.tipo, precioMax: estado.precioMax };
    GRUPOS.forEach(function (g) { f[g.clave] = estado[g.clave]; });

    var lista = Catalogo.ordenar(Catalogo.filtrar(f), estado.orden);
    var host = $('#grilla');

    $('#conteo').textContent = lista.length === 1 ? '1 modelo' : lista.length + ' modelos';

    if (!lista.length) {
      host.className = '';
      host.innerHTML = '<div class="tienda__vacio">' +
        '<h3>No encontramos nada con esos filtros</h3>' +
        '<p class="bajada mt-s" style="margin-inline:auto">Probá sacando alguno, o mirá todo el catálogo.</p>' +
        '<button class="btn btn--fantasma mt-m" id="vaciarFiltros">Limpiar filtros</button>' +
        '</div>';
      $('#vaciarFiltros').addEventListener('click', function () {
        GRUPOS.forEach(function (g) { estado[g.clave] = []; });
        estado.precioMax = null;
        estado.tipo = 'todos';
        aplicar();
      });
      return;
    }

    host.className = 'grilla grilla--3';
    host.innerHTML = lista.map(UI.tarjetaProducto).join('');
    UI.revelar(host);
  }

  /* ---------- Ciclo ---------- */
  function aplicar(sinUrl) {
    if (!sinUrl) escribirUrl();
    pintarCabezal();
    pintarTiposRapidos();
    pintarFiltros();
    pintarActivos();
    pintarGrilla();
  }

  /* ---------- Filtros en mobile ---------- */
  function montarBotonFiltros() {
    var btn = $('#btnFiltros');
    var panel = $('#filtros');
    function chequear() {
      var chico = window.matchMedia('(max-width:940px)').matches;
      btn.hidden = !chico;
      if (!chico) panel.classList.remove('abierto');
    }
    btn.addEventListener('click', function () {
      var abierto = panel.classList.toggle('abierto');
      btn.textContent = abierto ? 'Ocultar filtros' : 'Filtros';
    });
    window.addEventListener('resize', U.debounce(chequear, 150));
    chequear();
  }

  /* ---------- Arranque ---------- */
  leerUrl();
  $('#orden').value = estado.orden;
  $('#orden').addEventListener('change', function () {
    estado.orden = $('#orden').value;
    aplicar();
  });

  window.addEventListener('popstate', function () {
    leerUrl();
    $('#orden').value = estado.orden;
    aplicar(true);
  });

  montarBotonFiltros();
  aplicar(true);
})();
