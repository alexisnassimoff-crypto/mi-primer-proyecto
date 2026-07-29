/* ============================================================
   OJO — Motor de cristales oftálmicos
   ------------------------------------------------------------
   Toda la lógica óptica del sitio: tipos de uso, índices de
   refracción, tratamientos, validación de receta, recomendación
   automática de índice y cálculo de precio.

   Convención de receta: CILINDRO NEGATIVO (la que usan las
   ópticas en Argentina). Si viene una receta en cilindro positivo
   hay que transponerla — `transponer()` lo hace.
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- Tipos de uso ---------- */
  var USOS = [
    {
      id: 'lejos',
      nombre: 'Visión lejana',
      detalle: 'Para miopía o astigmatismo. Manejar, ver la tele, la calle.',
      recargo: 0
    },
    {
      id: 'cerca',
      nombre: 'Visión cercana',
      detalle: 'Para leer, coser, la pantalla del celular.',
      recargo: 0
    },
    {
      id: 'progresivo',
      nombre: 'Progresivo',
      detalle: 'Lejos, intermedio y cerca en un solo cristal, sin línea visible.',
      recargo: 138000,
      requiereAdicion: true,
      destacado: true
    },
    {
      id: 'ocupacional',
      nombre: 'Ocupacional / oficina',
      detalle: 'Optimizado para pantalla y escritorio. Campo intermedio más ancho que un progresivo.',
      recargo: 82000,
      requiereAdicion: true
    },
    {
      id: 'sin-aumento',
      nombre: 'Sin aumento',
      detalle: 'Cristal neutro, sólo para el filtro o el color. No corrige la visión.',
      recargo: 0,
      sinReceta: true
    }
  ];

  /* ---------- Índices de refracción ----------
     `hasta` es la graduación máxima (en dioptrías, valor absoluto del
     meridiano más potente) para la que ese índice sigue siendo
     razonable en espesor.                                            */
  var INDICES = [
    {
      id: '1.50', nombre: '1.50 estándar', precio: 46000, hasta: 2,
      espesorRel: 1.00,
      detalle: 'El cristal de entrada. Bien para graduaciones bajas.'
    },
    {
      id: '1.56', nombre: '1.56 afinado', precio: 64000, hasta: 4,
      espesorRel: 0.90,
      detalle: 'Un 10% más fino que el estándar. El equilibrio más común.'
    },
    {
      id: '1.61', nombre: '1.61 alto índice', precio: 92000, hasta: 6,
      espesorRel: 0.80,
      detalle: 'Un 20% más fino. Se empieza a notar de verdad en el borde.'
    },
    {
      id: '1.67', nombre: '1.67 ultra fino', precio: 138000, hasta: 8,
      espesorRel: 0.70,
      detalle: 'Un 30% más fino. Para graduaciones altas sin culo de botella.'
    },
    {
      id: '1.74', nombre: '1.74 ultra fino premium', precio: 205000, hasta: 99,
      espesorRel: 0.60,
      detalle: 'El más fino que existe. Un 40% menos de espesor que el estándar.'
    }
  ];

  /* ---------- Tratamientos ---------- */
  var TRATAMIENTOS = [
    {
      id: 'antirreflejo', nombre: 'Antirreflejo premium', precio: 29000,
      detalle: 'Saca los reflejos, mejora la nitidez de noche y hace que se te vean los ojos en las fotos.',
      recomendado: true, bonificable: true
    },
    {
      id: 'luz-azul', nombre: 'Filtro de luz azul', precio: 24000,
      detalle: 'Para el que vive frente a una pantalla. Reduce la fatiga visual.',
      recomendado: true
    },
    {
      id: 'fotocromatico', nombre: 'Fotocromático', precio: 68000,
      detalle: 'Se oscurece solo al sol y se aclara adentro. Un anteojo que hace de dos.',
      incompatible: ['polarizado', 'espejado']
    },
    {
      id: 'polarizado', nombre: 'Polarizado', precio: 59000,
      detalle: 'Elimina el encandilamiento del asfalto, el agua y la nieve. Imprescindible para manejar.',
      soloSol: true, incompatible: ['fotocromatico']
    },
    {
      id: 'espejado', nombre: 'Espejado', precio: 37000,
      detalle: 'Capa espejada exterior. Estético y suma protección en alta montaña o playa.',
      soloSol: true, incompatible: ['fotocromatico']
    },
    {
      id: 'endurecido', nombre: 'Endurecido antirrayas', precio: 0,
      detalle: 'Va incluido en todos nuestros cristales, sin cargo.',
      incluido: true
    }
  ];

  /* ---------- Tintes para cristal de sol con receta ---------- */
  var TINTES_SOL = [
    { id: 'gris', nombre: 'Gris', detalle: 'Neutro, no altera los colores.' },
    { id: 'marron', nombre: 'Marrón', detalle: 'Sube el contraste. El favorito para manejar.' },
    { id: 'verde', nombre: 'Verde G15', detalle: 'El clásico. Descansa la vista.' },
    { id: 'degrade', nombre: 'Degradé', detalle: 'Oscuro arriba, claro abajo.' }
  ];

  /* ---------- Rangos de validación ---------- */
  var RANGOS = {
    esfera: { min: -20, max: 20, paso: 0.25 },
    cilindro: { min: -6, max: 0, paso: 0.25 },
    eje: { min: 0, max: 180, paso: 1 },
    adicion: { min: 0.75, max: 3.5, paso: 0.25 },
    dp: { min: 48, max: 78 },
    dpMono: { min: 24, max: 39 }
  };

  function num(v) {
    if (v === '' || v == null) return null;
    var n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  function uso(id) {
    for (var i = 0; i < USOS.length; i++) if (USOS[i].id === id) return USOS[i];
    return null;
  }

  function indice(id) {
    for (var i = 0; i < INDICES.length; i++) if (INDICES[i].id === id) return INDICES[i];
    return null;
  }

  function tratamiento(id) {
    for (var i = 0; i < TRATAMIENTOS.length; i++) if (TRATAMIENTOS[i].id === id) return TRATAMIENTOS[i];
    return null;
  }

  /* ---------- Potencia del meridiano más fuerte ----------
     Con cilindro negativo, los dos meridianos principales de un ojo son
     `esf` y `esf + cil`. El espesor del cristal lo manda el de mayor
     valor absoluto, y para elegir índice se mira el peor de los dos ojos. */
  function potenciaMaxima(receta) {
    if (!receta) return 0;
    var max = 0;
    ['od', 'oi'].forEach(function (ojo) {
      var o = receta[ojo];
      if (!o) return;
      var esf = num(o.esf) || 0;
      var cil = num(o.cil) || 0;
      max = Math.max(max, Math.abs(esf), Math.abs(esf + cil));
    });
    return max;
  }

  /* ---------- Recomendación de índice ---------- */
  function recomendarIndice(receta) {
    var pot = potenciaMaxima(receta);
    var elegido = INDICES[0];
    for (var i = 0; i < INDICES.length; i++) {
      if (pot <= INDICES[i].hasta) { elegido = INDICES[i]; break; }
      elegido = INDICES[INDICES.length - 1];
    }

    var motivo;
    if (pot === 0) {
      motivo = 'Cargá tu graduación y te decimos cuál te conviene.';
    } else if (elegido.id === '1.50') {
      motivo = 'Con ' + fmtDioptria(pot) + ' te alcanza el estándar: el cristal ya te va a quedar finito.';
    } else {
      var ahorro = Math.round((1 - elegido.espesorRel) * 100);
      motivo = 'Con ' + fmtDioptria(pot) + ', el ' + elegido.id + ' te deja el cristal cerca de un ' +
        ahorro + '% más fino que el estándar. Es la diferencia entre un anteojo que se nota y uno que no.';
    }

    return { indice: elegido, potencia: pot, motivo: motivo };
  }

  function fmtDioptria(n) {
    var s = (n > 0 ? '' : '') + Math.abs(n).toFixed(2).replace('.', ',');
    return s + ' dioptrías';
  }

  /* Formato de un valor de receta: siempre con signo y dos decimales. */
  function fmtValor(v) {
    var n = num(v);
    if (n == null) return '—';
    return (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toFixed(2).replace('.', ',');
  }

  /* ---------- Validación ---------- */
  function validarOjo(o, opciones) {
    var errores = [];
    opciones = opciones || {};
    var esf = num(o.esf);
    var cil = num(o.cil);
    var eje = num(o.eje);

    if (esf == null) {
      errores.push('Falta la esfera.');
    } else {
      if (esf < RANGOS.esfera.min || esf > RANGOS.esfera.max) {
        errores.push('La esfera tiene que estar entre −20,00 y +20,00.');
      }
      if (Math.round(esf * 4) !== esf * 4) errores.push('La esfera va de a 0,25.');
    }

    if (cil != null && cil !== 0) {
      if (cil > 0) errores.push('El cilindro va en negativo. Si tu receta lo tiene en positivo, usá el botón de transponer.');
      else if (cil < RANGOS.cilindro.min) errores.push('El cilindro no puede ser menor a −6,00.');
      if (Math.round(cil * 4) !== cil * 4) errores.push('El cilindro va de a 0,25.');
      if (eje == null) errores.push('Si cargás cilindro, el eje es obligatorio.');
      else if (eje < 0 || eje > 180) errores.push('El eje va de 0 a 180.');
    }

    if (opciones.requiereAdicion) {
      var ad = num(o.adicion);
      if (ad == null) errores.push('Falta la adición.');
      else if (ad < RANGOS.adicion.min || ad > RANGOS.adicion.max) {
        errores.push('La adición va de +0,75 a +3,50.');
      }
    }

    return errores;
  }

  function validar(config) {
    var errores = {};
    var u = uso(config.uso);

    if (!config.conCristales) return { ok: true, errores: {} };
    if (!u) { errores.uso = ['Elegí para qué vas a usar los cristales.']; return { ok: false, errores: errores }; }

    if (!u.sinReceta && config.modoReceta === 'cargar') {
      var opciones = { requiereAdicion: !!u.requiereAdicion };
      var od = validarOjo(config.receta.od || {}, opciones);
      var oi = validarOjo(config.receta.oi || {}, opciones);
      if (od.length) errores.od = od;
      if (oi.length) errores.oi = oi;

      var dp = num(config.receta.dp);
      if (dp != null && (dp < RANGOS.dp.min || dp > RANGOS.dp.max)) {
        errores.dp = ['La distancia pupilar suele estar entre 48 y 78 mm. Si no la sabés, dejala vacía y la medimos nosotros.'];
      }
    }

    if (config.modoReceta === 'foto' && !config.recetaArchivo) {
      errores.archivo = ['Subí la foto de la receta o elegí otra opción.'];
    }

    return { ok: Object.keys(errores).length === 0, errores: errores };
  }

  /* ---------- Transposición de cilindro positivo a negativo ----------
     esf' = esf + cil ; cil' = −cil ; eje' = eje ± 90                  */
  function transponerOjo(o) {
    var esf = num(o.esf), cil = num(o.cil), eje = num(o.eje);
    if (esf == null || cil == null || cil <= 0) return o;
    var eje2 = eje == null ? null : (eje >= 90 ? eje - 90 : eje + 90);
    return {
      esf: (esf + cil).toFixed(2),
      cil: (-cil).toFixed(2),
      eje: eje2 == null ? '' : String(eje2),
      adicion: o.adicion
    };
  }

  function transponer(receta) {
    return {
      od: transponerOjo(receta.od || {}),
      oi: transponerOjo(receta.oi || {}),
      dp: receta.dp
    };
  }

  /* ---------- Tratamientos disponibles según el producto ---------- */
  function tratamientosDisponibles(producto, config) {
    var esSol = producto && producto.tipo === 'sol';
    var elegidos = (config && config.tratamientos) || [];

    return TRATAMIENTOS.filter(function (t) {
      return !t.soloSol || esSol;
    }).map(function (t) {
      var bloqueadoPor = null;
      (t.incompatible || []).forEach(function (otro) {
        if (elegidos.indexOf(otro) !== -1) bloqueadoPor = tratamiento(otro);
      });
      return {
        tratamiento: t,
        elegido: elegidos.indexOf(t.id) !== -1 || !!t.incluido,
        bloqueadoPor: bloqueadoPor
      };
    });
  }

  /* ---------- Precio ----------
     Devuelve el desglose completo, no sólo el total, para poder
     mostrarlo línea por línea en la ficha y en el carrito.        */
  function calcular(producto, config) {
    config = config || {};
    var lineas = [];
    var base = producto ? producto.precio : 0;

    var nombreArmazon = producto && global.Catalogo ? global.Catalogo.nombreCompleto(producto) : '';
    lineas.push({ id: 'armazon', nombre: ('Armazón ' + nombreArmazon).trim(), monto: base });

    if (!config.conCristales) {
      return { lineas: lineas, subtotal: base, total: base, bonificado: 0 };
    }

    var u = uso(config.uso);
    var idx = indice(config.indice) || INDICES[0];

    lineas.push({ id: 'cristales', nombre: 'Cristales ' + idx.nombre, monto: idx.precio });

    if (u && u.recargo) {
      lineas.push({ id: 'uso', nombre: u.nombre, monto: u.recargo });
    }

    var bonificado = 0;
    (config.tratamientos || []).forEach(function (id) {
      var t = tratamiento(id);
      if (!t || t.incluido) return;
      // Promo: el antirreflejo va sin cargo en todo cristal con receta.
      var gratis = t.bonificable && promoAntirreflejoActiva();
      if (gratis) {
        bonificado += t.precio;
        lineas.push({ id: t.id, nombre: t.nombre, monto: 0, tachado: t.precio, promo: true });
      } else {
        lineas.push({ id: t.id, nombre: t.nombre, monto: t.precio });
      }
    });

    var total = lineas.reduce(function (s, l) { return s + l.monto; }, 0);
    return { lineas: lineas, subtotal: total, total: total, bonificado: bonificado };
  }

  function promoAntirreflejoActiva() {
    var promos = (global.CONFIG && CONFIG.PROMOS) || [];
    return promos.some(function (p) { return p.tipo === 'tratamiento-gratis' && p.valor === 'antirreflejo'; });
  }

  /* ---------- Configuración por defecto para un producto ---------- */
  function configInicial(producto) {
    var esSol = producto && producto.tipo === 'sol';
    return {
      conCristales: !esSol,
      uso: esSol ? 'sin-aumento' : 'lejos',
      indice: '1.56',
      indiceAuto: true,
      tratamientos: esSol ? [] : ['antirreflejo'],
      tinteSol: esSol ? (producto.tinte || 'gris') : null,
      modoReceta: 'cargar',
      recetaArchivo: null,
      receta: {
        od: { esf: '', cil: '', eje: '', adicion: '' },
        oi: { esf: '', cil: '', eje: '', adicion: '' },
        dp: ''
      }
    };
  }

  /* ---------- Resumen legible, para carrito y checkout ---------- */
  function resumen(config) {
    if (!config || !config.conCristales) return ['Sólo armazón'];
    var out = [];
    var u = uso(config.uso);
    var idx = indice(config.indice);
    if (u) out.push(u.nombre);
    if (idx) out.push('Índice ' + idx.id);
    (config.tratamientos || []).forEach(function (id) {
      var t = tratamiento(id);
      if (t && !t.incluido) out.push(t.nombre);
    });
    if (config.tinteSol) {
      var tinte = TINTES_SOL.filter(function (t) { return t.id === config.tinteSol; })[0];
      if (tinte) out.push('Tinte ' + tinte.nombre);
    }
    if (config.modoReceta === 'cargar' && config.receta && config.receta.od) {
      var od = config.receta.od, oi = config.receta.oi || {};
      if (num(od.esf) != null || num(oi.esf) != null) {
        out.push('OD ' + fmtValor(od.esf) + (num(od.cil) ? ' ' + fmtValor(od.cil) + ' × ' + (od.eje || '—') : '') +
          ' · OI ' + fmtValor(oi.esf) + (num(oi.cil) ? ' ' + fmtValor(oi.cil) + ' × ' + (oi.eje || '—') : ''));
      }
      if (config.receta.dp) out.push('DP ' + config.receta.dp + ' mm');
    } else if (config.modoReceta === 'foto') {
      out.push('Receta adjunta como foto');
    } else if (config.modoReceta === 'despues') {
      out.push('Receta a enviar por WhatsApp');
    }
    return out;
  }

  global.Cristales = {
    USOS: USOS,
    INDICES: INDICES,
    TRATAMIENTOS: TRATAMIENTOS,
    TINTES_SOL: TINTES_SOL,
    RANGOS: RANGOS,
    uso: uso,
    indice: indice,
    tratamiento: tratamiento,
    tratamientosDisponibles: tratamientosDisponibles,
    potenciaMaxima: potenciaMaxima,
    recomendarIndice: recomendarIndice,
    validar: validar,
    transponer: transponer,
    calcular: calcular,
    configInicial: configInicial,
    resumen: resumen,
    fmtValor: fmtValor,
    num: num
  };

  // También se carga desde Node (ver api/_precios.js).
  if (typeof module !== 'undefined' && module.exports) module.exports = global.Cristales;
})(typeof window !== 'undefined' ? window : globalThis);
