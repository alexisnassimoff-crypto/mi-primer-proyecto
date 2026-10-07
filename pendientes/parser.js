/* ============================================================
   Pendientes — parser de carga rápida en castellano
   "Llamar a Matías mañana 10:00 #central @matias !30m ~45m $5000"
   Devuelve título, tema, fecha, hora, duración, alertas, invitados,
   monto, prioridad, repetición, lugar y tipo (tarea/reunión/recordatorio).
   Sin dependencias. UMD: window.Parser en el navegador, module.exports en Node.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.Parser = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MESES = { enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
    ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, sept: 8, set: 8, oct: 9, nov: 10, dic: 11 };
  var DIAS = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };
  var NUMS = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, quince: 15, veinte: 20, treinta: 30 };
  var RE_MES = '(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sept|sep|set|oct|nov|dic)';
  var RE_DIA = '(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)';

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function hm(h, m) { return pad(h) + ':' + pad(m || 0); }
  function plain(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function addDays(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
  function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }

  function parseAmount(str) {
    var t = String(str).replace(/\s/g, '');
    var m = /^(\d{1,3}(?:[.,]\d{3})+)(?:[.,](\d{1,2}))?$/.exec(t);
    if (m) return Number(m[1].replace(/[.,]/g, '')) + (m[2] ? Number('0.' + m[2]) : 0);
    var n = Number(t.replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  function toMinutes(n, unit) {
    n = Number(String(n).replace(',', '.'));
    unit = plain(unit || 'm');
    if (/^(h|hs|hora|horas)$/.test(unit)) return Math.round(n * 60);
    if (/^(d|dia|dias)$/.test(unit)) return Math.round(n * 1440);
    if (/^(w|sem|semana|semanas)$/.test(unit)) return Math.round(n * 10080);
    return Math.round(n);
  }

  function fixHour(h, ampm, dayPart) {
    h = Number(h);
    var ap = plain(ampm || '').replace(/\./g, '');
    var dp = plain(dayPart || '');
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    if (dp === 'tarde' && h < 12) h += 12;
    if (dp === 'noche' && h < 12) h += 12;
    if (dp === 'manana' && h === 12) h = 0;
    return h;
  }

  /* Tema por #tag: id, alias o nombre (por prefijo, sin acentos) */
  function matchTopic(tag, topics) {
    var t = plain(tag);
    if (!t) return null;
    var best = null;
    for (var i = 0; i < topics.length; i++) {
      var tp = topics[i];
      var keys = [tp.id, tp.name].concat(tp.aliases || []).map(plain);
      for (var k = 0; k < keys.length; k++) {
        if (keys[k] === t) return tp;
        if (!best && keys[k].indexOf(t) === 0) best = tp;
        if (!best && keys[k].split(/\s+/).some(function (w) { return w.length > 2 && w.indexOf(t) === 0; })) best = tp;
      }
    }
    return best;
  }

  /* Sugiere un tema por palabras clave cuando el usuario no eligió ninguno */
  function suggestTopic(text, parsed, topics) {
    var t = ' ' + plain(text) + ' ';
    for (var i = 0; i < topics.length; i++) {
      var tp = topics[i];
      if (!tp.keywords) continue;
      var re = new RegExp('(^|[^a-z0-9])(' + tp.keywords + ')(?=$|[^a-z0-9])', 'i');
      if (re.test(t)) return tp.id;
    }
    if (parsed && parsed.amount != null) {
      var g = topics.filter(function (x) { return x.id === 'gastos'; })[0];
      if (g) return g.id;
    }
    return null;
  }

  function parse(text, opts) {
    opts = opts || {};
    var now = opts.now ? new Date(opts.now) : new Date();
    var topics = opts.topics || [];
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var r = { title: '', topic: null, kind: 'tarea', date: null, time: null, duration: null,
      alert: undefined, alert2: undefined, invitees: [], amount: null, priority: 0,
      location: null, repeat: null, allDay: true, hints: [] };
    var s = ' ' + String(text || '').replace(/\s+/g, ' ').trim() + ' ';
    var dateObj = null, timeObj = null, relTime = null;

    function take(re, fn) {
      var hit = false;
      s = s.replace(re, function () {
        var res = fn.apply(null, arguments);
        if (res === false) return arguments[0];
        hit = true;
        return res == null ? ' ' : res;
      });
      return hit;
    }
    function setDate(d) { if (!dateObj && d) dateObj = d; }
    function setTime(h, m) { h = Number(h); m = Number(m || 0); if (timeObj || h > 23 || m > 59) return false; timeObj = { h: h, m: m }; return true; }

    /* 1. invitados: mails sueltos y @nombre */
    take(/(^|\s)([\w.+-]+@[\w-]+(?:\.[\w-]+)+)(?=[\s,;]|$)/g, function (m, pre, mail) { r.invitees.push(mail); return pre; });
    take(/(^|\s)@([^\s@,;]+)/g, function (m, pre, name) { r.invitees.push(name.replace(/[.,;:]+$/, '')); return pre; });

    /* 2. #tema */
    take(/(^|\s)#([^\s#,;]+)/g, function (m, pre, tag) {
      var tp = matchTopic(tag, topics);
      if (tp) { r.topic = tp.id; return pre; }
      r.hints.push('tema-desconocido:' + tag);
      return false;
    });

    /* 3. prioridad */
    take(/(^|\s)!!(?=\s|$)/g, function () { r.priority = 1; });
    take(/(^|\s)(urgente|importante|prioridad alta|asap|urgentemente)(?=[\s,.;!]|$)/gi, function () { r.priority = 1; });

    /* 4. alertas: !15m !1h !1d !1w !0 !no */
    take(/(^|\s)!(?:(no|sin)|(\d+)\s*(m|min|mins|h|hs|d|w|sem)?)(?=[\s,;.]|$)/gi, function (m, pre, no, n, unit) {
      var v = no ? null : toMinutes(n, unit || 'm');
      if (r.alert === undefined) r.alert = v; else if (r.alert2 === undefined && v != null) r.alert2 = v;
      return pre;
    });

    /* 5. duración: ~45m, dura 1h, durante 30 min, (2h) */
    take(/(^|\s)~(\d+(?:[.,]\d+)?)\s*(m|min|mins|h|hs)?(?=[\s,;.]|$)/gi, function (m, pre, n, u) { r.duration = toMinutes(n, u || 'm'); return pre; });
    take(/(^|\s)(?:dura|durante|por)\s+(\d+(?:[.,]\d+)?)\s*(h|hs|hora|horas|m|min|mins|minutos)(?=[\s,;.]|$)/gi, function (m, pre, n, u) { r.duration = toMinutes(n, u); return pre; });
    take(/(^|\s)\((\d+(?:[.,]\d+)?)\s*(h|hs|hora|horas|m|min|minutos)\)(?=[\s,;.]|$)/gi, function (m, pre, n, u) { r.duration = toMinutes(n, u); return pre; });

    /* 6. monto: $5000, $ 5.000, 5000$, 5000 pesos, 5 lucas, $5k, usd 100 */
    take(/(^|\s)(?:\$|ars|usd|u\$s|us\$|dolares|dólares)\s?(\d[\d.,]*)\s?(k|lucas)?(?=[\s,;]|$)/gi, function (m, pre, n, k) { var v = parseAmount(n); if (v == null) return false; r.amount = k ? v * 1000 : v; return pre; });
    take(/(^|\s)(\d[\d.,]*)\s?(\$|pesos|mangos|lucas|luca|k)(?=[\s,;.]|$)/gi, function (m, pre, n, k) { var v = parseAmount(n); if (v == null) return false; r.amount = /^(lucas|luca|k)$/i.test(k) ? v * 1000 : v; return pre; });

    /* 7. rango horario: de 10 a 11:30 */
    take(/(^|\s)(?:de|desde)\s+(?:las?\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(?:hs|h)?\s+(?:a|hasta)\s+(?:las?\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(hs|h|am|pm)?(?:\s+de\s+la\s+(ma[ñn]ana|tarde|noche))?(?=[\s,;.]|$)/gi,
      function (m, pre, h1, m1, h2, m2, ap, dp) {
        var a = fixHour(h1, ap, dp), b = fixHour(h2, ap, dp);
        if (a > 23 || b > 23 || Number(m1 || 0) > 59 || Number(m2 || 0) > 59) return false;
        var start = a * 60 + Number(m1 || 0), end = b * 60 + Number(m2 || 0);
        if (end <= start) { if (b < 12) { b += 12; end = b * 60 + Number(m2 || 0); } if (end <= start) return false; }
        if (!setTime(Math.floor(start / 60), start % 60)) return false;
        r.duration = end - start;
        return pre;
      });

    /* 8. partes del día */
    take(/(^|\s)(?:a\s+la|por\s+la|en\s+la|de)\s+(ma[ñn]ana|manana)(?=[\s,;.]|$)/gi, function (m, pre) { return setTime(9, 0) ? pre : false; });
    take(/(^|\s)(?:a\s+la|por\s+la|en\s+la|de)\s+tarde(?=[\s,;.]|$)/gi, function (m, pre) { return setTime(16, 0) ? pre : false; });
    take(/(^|\s)(?:a\s+la|por\s+la|en\s+la|de)\s+noche(?=[\s,;.]|$)/gi, function (m, pre) { return setTime(20, 0) ? pre : false; });
    take(/(^|\s)(?:al\s+)?mediod[ií]a(?=[\s,;.]|$)/gi, function (m, pre) { return setTime(13, 0) ? pre : false; });
    take(/(^|\s)(?:a\s+)?primera\s+hora(?=[\s,;.]|$)/gi, function (m, pre) { return setTime(8, 0) ? pre : false; });

    /* 9. horas */
    take(/(^|\s)(?:a\s+las?\s+|a\s+la\s+)?(\d{1,2})[:.](\d{2})\s*(hs|h|am|pm|a\.m\.|p\.m\.)?(?:\s+de\s+la\s+(ma[ñn]ana|tarde|noche))?(?=[\s,;)]|\.\s|\.$|$)/gi,
      function (m, pre, h, mi, ap, dp) { return setTime(fixHour(h, ap, dp), mi) ? pre : false; });
    take(/(^|\s)(?:a\s+las?|a\s+la)\s+(\d{1,2})(?:\s*(hs|h|am|pm))?(?:\s+de\s+la\s+(ma[ñn]ana|tarde|noche))?(?=[\s,;)]|\.\s|\.$|$)/gi,
      function (m, pre, h, ap, dp) {
        var hh = fixHour(h, ap, dp);
        if (!ap && !dp && hh >= 1 && hh <= 6) hh += 12; /* "a las 3" → 15:00 */
        return setTime(hh, 0) ? pre : false;
      });
    take(/(^|\s)(\d{1,2})\s?(hs|h|am|pm|a\.m\.|p\.m\.)(?:\s+de\s+la\s+(ma[ñn]ana|tarde|noche))?(?=[\s,;)]|\.\s|\.$|$)/gi,
      function (m, pre, h, ap, dp) { return setTime(fixHour(h, ap, dp), 0) ? pre : false; });

    /* 10. fechas */
    var HORA_SUELTA = '(?:\\s+(\\d{1,2})(?=[\\s,;.]|$))?'; /* "mañana 10" → 10:00 (sólo 6–23) */
    function horaSuelta(h) { if (h != null && h !== '' && !timeObj) { var n = Number(h); if (n >= 6 && n <= 23) { setTime(n, 0); return true; } } return false; }

    take(/(^|\s)(?:el\s+)?pasado\s+ma[ñn]ana(?=[\s,;.]|$)/gi, function (m, pre) { setDate(addDays(today, 2)); return pre; });
    take(new RegExp('(^|\\s)(?:el\\s+)?ma[ñn]ana' + HORA_SUELTA + '(?=[\\s,;.]|$)', 'gi'), function (m, pre, h) { setDate(addDays(today, 1)); horaSuelta(h); return pre; });
    take(new RegExp('(^|\\s)hoy' + HORA_SUELTA + '(?=[\\s,;.]|$)', 'gi'), function (m, pre, h) { setDate(today); horaSuelta(h); return pre; });

    /* todos los lunes → semanal + fecha del próximo lunes */
    take(new RegExp('(^|\\s)(?:todos\\s+los|cada)\\s+' + RE_DIA + '(?=[\\s,;.]|$)', 'gi'), function (m, pre, dia) {
      r.repeat = 'weekly';
      var dow = DIAS[plain(dia)]; var diff = (dow - today.getDay() + 7) % 7; setDate(addDays(today, diff)); return pre;
    });
    take(new RegExp('(^|\\s)(?:el\\s+|este\\s+|el\\s+pr[oó]ximo\\s+|pr[oó]ximo\\s+|el\\s+pr[oó]x\\s+)?' + RE_DIA + '(\\s+que\\s+viene|\\s+pr[oó]ximo)?' + HORA_SUELTA + '(?=[\\s,;.]|$)', 'gi'),
      function (m, pre, dia, next, h) {
        var dow = DIAS[plain(dia)]; var diff = (dow - today.getDay() + 7) % 7;
        var forceNext = /pr[oó]x/i.test(m) || !!next;
        if (forceNext && diff === 0) diff = 7;
        setDate(addDays(today, diff)); horaSuelta(h); return pre;
      });

    /* dd/mm[/aa] */
    take(/(^|\s)(?:el\s+)?(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2}|\d{4}))?(?=[\s,;.]|$)/g, function (m, pre, d, mo, y) {
      d = Number(d); mo = Number(mo) - 1;
      if (mo < 0 || mo > 11 || d < 1 || d > 31) return false;
      var year = y ? (y.length === 2 ? 2000 + Number(y) : Number(y)) : today.getFullYear();
      var dt = new Date(year, mo, Math.min(d, daysInMonth(year, mo)));
      if (!y && dt < addDays(today, -1)) dt = new Date(year + 1, mo, Math.min(d, daysInMonth(year + 1, mo)));
      setDate(dt); return pre;
    });
    /* 15 de octubre [de 2026] | 15 oct */
    take(new RegExp('(^|\\s)(?:el\\s+)?(\\d{1,2})\\s+(?:de\\s+)?' + RE_MES + '(?:\\s+(?:de\\s+|del\\s+)?(\\d{4}))?' + HORA_SUELTA + '(?=[\\s,;.]|$)', 'gi'), function (m, pre, d, mes, y, h) {
      d = Number(d); var mo = MESES[plain(mes)];
      if (mo == null || d < 1 || d > 31) return false;
      var year = y ? Number(y) : today.getFullYear();
      var dt = new Date(year, mo, Math.min(d, daysInMonth(year, mo)));
      if (!y && dt < addDays(today, -1)) dt = new Date(year + 1, mo, Math.min(d, daysInMonth(year + 1, mo)));
      setDate(dt); horaSuelta(h); return pre;
    });
    /* en 3 días / en 2 semanas / en 1 mes / en 2 horas / en 30 min */
    take(/(^|\s)en\s+(\d+|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|quince|veinte|treinta)\s+(d[ií]as?|semanas?|mes|meses|horas?|minutos?|min)(?=[\s,;.]|$)/gi, function (m, pre, n, u) {
      n = isNaN(n) ? NUMS[plain(n)] : Number(n); u = plain(u);
      if (/^dia/.test(u)) setDate(addDays(today, n));
      else if (/^semana/.test(u)) setDate(addDays(today, n * 7));
      else if (/^mes/.test(u)) { var dt = new Date(today); dt.setMonth(dt.getMonth() + n); setDate(dt); }
      else { var t = new Date(now.getTime() + n * (/^hora/.test(u) ? 60 : 1) * 60000); t.setSeconds(0, 0); if (/^hora/.test(u)) t.setMinutes(Math.round(t.getMinutes() / 5) * 5); relTime = t; }
      return pre;
    });
    take(/(^|\s)(?:la\s+)?(?:semana\s+que\s+viene|pr[oó]xima\s+semana|semana\s+pr[oó]xima)(?=[\s,;.]|$)/gi, function (m, pre) { var diff = (1 - today.getDay() + 7) % 7 || 7; setDate(addDays(today, diff)); return pre; });
    take(/(^|\s)(?:el\s+|este\s+)?(?:fin\s+de\s+semana|finde)(?=[\s,;.]|$)/gi, function (m, pre) { var diff = (6 - today.getDay() + 7) % 7; setDate(addDays(today, diff)); return pre; });
    take(/(^|\s)(?:a\s+)?fin\s+de\s+mes(?=[\s,;.]|$)/gi, function (m, pre) { setDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)); return pre; });
    /* el 15 (día del mes más próximo) */
    take(/(^|\s)el\s+(\d{1,2})(?=[\s,;]|\.\s|\.$|$)(?!\s*(?:de\s+[a-z]|\/|:))/gi, function (m, pre, d) {
      d = Number(d); if (d < 1 || d > 31) return false;
      var y = today.getFullYear(), mo = today.getMonth();
      if (d < today.getDate()) { mo += 1; if (mo > 11) { mo = 0; y += 1; } }
      while (d > daysInMonth(y, mo)) { mo += 1; if (mo > 11) { mo = 0; y += 1; } }
      setDate(new Date(y, mo, d)); return pre;
    });

    /* 11. repetición */
    take(/(^|\s)(todos\s+los\s+d[ií]as|cada\s+d[ií]a|diario|diariamente|a\s+diario)(?=[\s,;.]|$)/gi, function () { r.repeat = 'daily'; });
    take(/(^|\s)(todas\s+las\s+semanas|cada\s+semana|semanal|semanalmente)(?=[\s,;.]|$)/gi, function () { r.repeat = 'weekly'; });
    take(/(^|\s)(todos\s+los\s+meses|cada\s+mes|mensual|mensualmente)(?=[\s,;.]|$)/gi, function () { r.repeat = 'monthly'; });
    take(/(^|\s)(todos\s+los\s+a[ñn]os|cada\s+a[ñn]o|anual|anualmente)(?=[\s,;.]|$)/gi, function () { r.repeat = 'yearly'; });

    /* 12. tipo */
    take(/^\s*(?:recordar(?:me)?|recordatorio|acordarme\s+de|acordate\s+de|acordarme|avisame|avisarme|recordame|no\s+olvidar(?:me)?\s+de|no\s+olvidar(?:me)?)\s*(?:de\s+|que\s+)?:?\s*/i, function () { r.kind = 'recordatorio'; return ' '; });
    if (r.kind === 'tarea' && /(^|\s)(reuni[oó]n|reunion|reu|meeting|llamada|llamar|llamarlo|llamarla|llamarle|call|zoom|meet|cita|turno|entrevista|almuerzo|almorzar|cena|cenar|desayuno|caf[eé]|juntarme|juntarnos|juntada|visita|visitar|charla|videollamada|presentaci[oó]n|demo|evento|ir\s+a)(?=[\s,;.]|$)/i.test(s)) r.kind = 'reunion';

    /* 13. lugar (sólo para reuniones): "... en la oficina" al final */
    if (r.kind === 'reunion') {
      take(/\s+en\s+(?:la\s+|el\s+|los\s+|las\s+|lo\s+de\s+)?([^\s,;][^,;]{1,40}?)\s*$/i, function (m, place) {
        if (/^(punto|caso|general|principio|total|serio|fin|breve|cuanto)$/i.test(place.trim())) return false;
        r.location = place.trim(); return ' ';
      });
    }

    /* 14. resolver fecha/hora */
    if (relTime) { dateObj = dateObj || new Date(relTime.getFullYear(), relTime.getMonth(), relTime.getDate()); if (!timeObj) timeObj = { h: relTime.getHours(), m: relTime.getMinutes() }; }
    if (timeObj && !dateObj) {
      var cand = new Date(today.getFullYear(), today.getMonth(), today.getDate(), timeObj.h, timeObj.m);
      dateObj = cand.getTime() > now.getTime() ? today : addDays(today, 1);
    }
    if (dateObj) r.date = ymd(dateObj);
    if (timeObj) { r.time = hm(timeObj.h, timeObj.m); r.allDay = false; }

    /* 15. título */
    var t = s.replace(/\s+/g, ' ').trim();
    t = t.replace(/^[\s,;:.\-–·]+/, '').replace(/[\s,;:\-–·]+$/, '');
    for (var i = 0; i < 3; i++) t = t.replace(/\s+(a|de|en|el|la|los|las|para|con|y|al|del|que|por)$/i, '').replace(/[\s,;:\-–·]+$/, '');
    t = t.replace(/\s+,/g, ',').replace(/\s+\./g, '.');
    if (t) t = t.charAt(0).toUpperCase() + t.slice(1);
    r.title = t;
    return r;
  }

  return { parse: parse, matchTopic: matchTopic, suggestTopic: suggestTopic, parseAmount: parseAmount, plain: plain };
}));
