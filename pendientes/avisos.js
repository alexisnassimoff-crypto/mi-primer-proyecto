/* ============================================================
   Pendientes — avisos (alarmas) compartidos
   Los usa la app en el navegador (window.Avisos) y las funciones de
   Vercel (require) para leer y escribir los avisos igual en los dos lados.
   Un aviso «con hora» son minutos antes del inicio; uno «de todo el día»
   se mide desde la medianoche (-540 = ese día a las 9).
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.Avisos = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ALERTS_TIMED = [['', 'Sin aviso'], ['0', 'En el momento'], ['5', '5 min antes'], ['10', '10 min antes'], ['15', '15 min antes'], ['30', '30 min antes'], ['60', '1 hora antes'], ['120', '2 horas antes'], ['1440', '1 día antes'], ['2880', '2 días antes'], ['10080', '1 semana antes']];
  var ALERTS_ALLDAY = [['', 'Sin aviso'], ['-540', 'Ese día a las 9'], ['900', 'El día anterior a las 9'], ['2340', 'Dos días antes a las 9'], ['9540', 'Una semana antes a las 9']];
  var NUM_WORDS = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, diez: 10, quince: 15, veinte: 20, treinta: 30 };

  function plain(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function alertLabelFor(min, allDay) {
    if (min === null || min === undefined || min === '') return 'Sin aviso';
    var list = allDay ? ALERTS_ALLDAY : ALERTS_TIMED;
    for (var i = 0; i < list.length; i++) if (list[i][0] === String(min)) return list[i][1];
    min = Number(min);
    if (min === 0) return 'En el momento';
    var a = Math.abs(min);
    var u = a % 1440 === 0 ? (a / 1440) + (a === 1440 ? ' día' : ' días') : a % 60 === 0 ? (a / 60) + (a === 60 ? ' hora' : ' horas') : a + ' min';
    return min > 0 ? u + ' antes' : u + ' después';
  }

  function toAllDayAlert(v) {
    if (v === null || v === undefined) return v;
    return v < 1440 ? -540 : Math.round(v / 1440) * 1440 - 540;
  }

  /* «15 min antes», «1 hora antes», «El día anterior a las 9»… → minutos.
     null = sin aviso; undefined = no se entiende (se usa el de siempre). */
  function parseAlertText(s, timed) {
    var t = plain(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    if (!t) return undefined;
    if (/^(sin aviso|no|no avisar|ninguno|nada|-)$/.test(t)) return null;
    for (var i = 0; i < ALERTS_ALLDAY.length; i++) {
      var o = ALERTS_ALLDAY[i];
      if (o[0] !== '' && plain(o[1]) === t) { var v = Number(o[0]); return timed ? ({ '900': 1440, '2340': 2880, '9540': 10080 })[String(v)] : v; }
    }
    if (/en el momento|a la hora/.test(t)) return timed ? 0 : -540;
    if (/^(ese|el mismo) dia/.test(t)) return timed ? undefined : -540;
    if (/(dia anterior|el dia antes)/.test(t) && !/\d/.test(t)) return timed ? 1440 : 900;
    if (/despues/.test(t)) return undefined;
    var m = /(\d+(?:[.,]\d+)?|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|diez|quince|veinte|treinta)\s*(m|min|mins|minuto|minutos|h|hs|hora|horas|d|dia|dias|semana|semanas)\b/.exec(t);
    var n = m ? (isNaN(m[1].replace(',', '.')) ? NUM_WORDS[m[1]] : Number(m[1].replace(',', '.'))) : (/^\d+$/.test(t) ? Number(t) : NaN);
    if (isNaN(n)) return undefined;
    var u = m ? m[2] : 'min';
    var mins = Math.round(/^m/.test(u) ? n : /^h/.test(u) ? n * 60 : /^d/.test(u) ? n * 1440 : n * 10080);
    return timed ? mins : toAllDayAlert(mins);
  }

  return { ALERTS_TIMED: ALERTS_TIMED, ALERTS_ALLDAY: ALERTS_ALLDAY, alertLabelFor: alertLabelFor, toAllDayAlert: toAllDayAlert, parseAlertText: parseAlertText, plain: plain };
}));
