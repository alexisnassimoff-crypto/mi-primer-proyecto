/* ============================================================
   Pendientes — generador de archivos iCalendar (.ics)
   Módulo compartido: lo usa la app en el navegador (window.ICS)
   y la función serverless api/ics.js en Node (module.exports).
   Sin dependencias.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.ICS = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* Date -> 20261008T130000Z (UTC) */
  function toUTC(d) {
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' +
      pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
  }

  /* Date -> 20261008 (fecha local, para eventos de todo el día) */
  function toDateOnly(d) {
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
  }

  /* 20261008T130000Z | 20261008 -> Date (o null) */
  function parseStamp(s) {
    s = String(s || '').trim();
    var m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(s);
    if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
    m = /^(\d{4})(\d{2})(\d{2})$/.exec(s);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    var d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  /* Escapa un valor TEXT según RFC 5545 */
  function escapeText(s) {
    return String(s == null ? '' : s)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  function byteLen(ch) {
    var c = ch.charCodeAt(0);
    if (c < 0x80) return 1;
    if (c < 0x800) return 2;
    if (c >= 0xD800 && c <= 0xDBFF) return 4; /* par sustituto: se cuenta en el alto */
    if (c >= 0xDC00 && c <= 0xDFFF) return 0;
    return 3;
  }

  /* Pliega una línea a 75 octetos (RFC 5545 §3.1), sin cortar caracteres multibyte */
  function fold(line) {
    var out = '', cur = '', bytes = 0, limit = 75;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      var hi = ch.charCodeAt(0) >= 0xD800 && ch.charCodeAt(0) <= 0xDBFF;
      if (hi) { ch += line[i + 1] || ''; i++; }
      var b = byteLen(ch[0]);
      if (bytes + b > limit) { out += cur + '\r\n '; cur = ''; bytes = 1; limit = 75; }
      cur += ch; bytes += b;
    }
    return out + cur;
  }

  /* minutos antes del inicio -> duración ISO 8601 para TRIGGER.
     Positivo = antes (-PT15M). Negativo = después del inicio (PT9H, útil en eventos de todo el día). */
  function durationFromMinutes(min) {
    min = Math.round(Number(min) || 0);
    if (min === 0) return 'PT0M';
    var sign = min > 0 ? '-' : '', m = Math.abs(min);
    if (m % 10080 === 0) return sign + 'P' + (m / 10080) + 'W';
    if (m % 1440 === 0) return sign + 'P' + (m / 1440) + 'D';
    var d = Math.floor(m / 1440), rest = m % 1440, h = Math.floor(rest / 60), mm = rest % 60;
    var s = sign + 'P' + (d ? d + 'D' : '') + 'T' + (h ? h + 'H' : '') + (mm ? mm + 'M' : '');
    return s.replace(/T$/, '');
  }

  function mailto(email) {
    email = String(email || '').trim();
    return email ? 'mailto:' + email : '';
  }

  function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim()); }

  /* Un "quién": "Nombre <mail>", "mail", "Nombre" -> {name, email} */
  function parseWho(s) {
    s = String(s || '').trim();
    var m = /^(.*?)\s*<([^>]+)>$/.exec(s);
    if (m) return { name: m[1].trim(), email: m[2].trim() };
    if (isEmail(s)) return { name: '', email: s };
    return { name: s, email: '' };
  }

  function prop(name, params, value) {
    var p = '';
    for (var k in params) if (params[k] != null && params[k] !== '') {
      p += ';' + k + '=' + (/[;:,]/.test(params[k]) ? '"' + String(params[k]).replace(/"/g, '') + '"' : params[k]);
    }
    return name + p + ':' + value;
  }

  /* ev = {
       uid, title, description, location, url,
       start: Date, end: Date, allDay: bool,
       alarms: [minutosAntes, ...], rrule: 'FREQ=WEEKLY',
       organizer: {name, email}, attendees: [{name, email}], stamp: Date
     } */
  function eventLines(ev) {
    var L = [];
    var stamp = ev.stamp instanceof Date ? ev.stamp : new Date();
    var start = ev.start instanceof Date ? ev.start : parseStamp(ev.start);
    var end = ev.end instanceof Date ? ev.end : (ev.end ? parseStamp(ev.end) : null);
    if (!start) return L;
    if (!end) end = ev.allDay ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1) : new Date(start.getTime() + 60 * 60000);

    L.push('BEGIN:VEVENT');
    L.push('UID:' + (ev.uid || (toUTC(stamp) + '-' + Math.random().toString(36).slice(2, 10) + '@pendientes')));
    L.push('DTSTAMP:' + toUTC(stamp));
    if (ev.allDay) {
      L.push('DTSTART;VALUE=DATE:' + toDateOnly(start));
      L.push('DTEND;VALUE=DATE:' + toDateOnly(end));
    } else {
      L.push('DTSTART:' + toUTC(start));
      L.push('DTEND:' + toUTC(end));
    }
    L.push('SUMMARY:' + escapeText(ev.title || 'Sin título'));
    if (ev.description) L.push('DESCRIPTION:' + escapeText(ev.description));
    if (ev.location) L.push('LOCATION:' + escapeText(ev.location));
    if (ev.url) L.push('URL:' + String(ev.url).replace(/[\r\n]/g, ''));
    if (ev.rrule) L.push('RRULE:' + ev.rrule);
    if (ev.organizer && ev.organizer.email) {
      L.push(prop('ORGANIZER', { CN: ev.organizer.name }, mailto(ev.organizer.email)));
    }
    (ev.attendees || []).forEach(function (a) {
      if (!a || !a.email) return;
      L.push(prop('ATTENDEE', { CN: a.name, ROLE: 'REQ-PARTICIPANT', PARTSTAT: 'NEEDS-ACTION', RSVP: 'TRUE' }, mailto(a.email)));
    });
    if (ev.priority === 1 || ev.priority === 'high') L.push('PRIORITY:1');
    L.push('STATUS:CONFIRMED');
    L.push('TRANSP:' + (ev.allDay ? 'TRANSPARENT' : 'OPAQUE'));
    (ev.alarms || []).forEach(function (min) {
      if (min == null || min === '' || isNaN(min)) return;
      L.push('BEGIN:VALARM');
      L.push('ACTION:DISPLAY');
      L.push('DESCRIPTION:' + escapeText(ev.title || 'Recordatorio'));
      L.push('TRIGGER:' + durationFromMinutes(min));
      L.push('END:VALARM');
    });
    L.push('END:VEVENT');
    return L;
  }

  /* opts = { events: [ev], method: 'PUBLISH', name: 'Pendientes' } */
  function build(opts) {
    opts = opts || {};
    var events = opts.events || [];
    var out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pendientes//Agenda personal//ES', 'CALSCALE:GREGORIAN', 'METHOD:' + (opts.method || 'PUBLISH')];
    if (opts.name) { out.push('X-WR-CALNAME:' + escapeText(opts.name)); }
    for (var i = 0; i < events.length; i++) out.push.apply(out, eventLines(events[i]));
    out.push('END:VCALENDAR');
    return out.map(fold).join('\r\n') + '\r\n';
  }

  /* ---- Parámetros compactos para el link del API (GET /api/ics?...) ---- */
  function paramsFromEvent(ev) {
    var start = ev.start instanceof Date ? ev.start : parseStamp(ev.start);
    var end = ev.end instanceof Date ? ev.end : (ev.end ? parseStamp(ev.end) : null);
    var q = { t: ev.title || '' };
    if (ev.allDay) { q.s = toDateOnly(start); if (end) q.e = toDateOnly(end); }
    else { q.s = toUTC(start); if (end) q.e = toUTC(end); }
    if (ev.description) q.d = ev.description;
    if (ev.location) q.l = ev.location;
    if (ev.url) q.u = ev.url;
    if (ev.alarms && ev.alarms.length) q.a = ev.alarms.join(',');
    if (ev.rrule) q.r = ev.rrule;
    if (ev.organizer && ev.organizer.email) q.o = (ev.organizer.name ? ev.organizer.name + ' <' + ev.organizer.email + '>' : ev.organizer.email);
    var att = (ev.attendees || []).filter(function (a) { return a && a.email; }).map(function (a) { return a.name ? a.name + ' <' + a.email + '>' : a.email; });
    if (att.length) q.i = att.join(',');
    if (ev.uid) q.id = ev.uid;
    if (ev.priority === 1 || ev.priority === 'high') q.p = '1';
    return q;
  }

  function eventFromParams(q) {
    q = q || {};
    var get = function (k) { var v = q[k]; return Array.isArray(v) ? v[0] : v; };
    var s = String(get('s') || '').trim();
    var title = String(get('t') || '').trim();
    if (!s || !title) return null;
    var allDay = /^\d{8}$/.test(s);
    var start = parseStamp(s);
    if (!start) return null;
    var end = get('e') ? parseStamp(String(get('e'))) : null;
    var alarms = String(get('a') || '').split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x !== '' && !isNaN(x); }).map(Number);
    var org = get('o') ? parseWho(get('o')) : null;
    var att = String(get('i') || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean).map(parseWho).filter(function (a) { return a.email; });
    var rr = String(get('r') || '').trim();
    if (rr && !/^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)(;[A-Z]+=[A-Z0-9,]+)*$/.test(rr)) rr = '';
    return {
      uid: String(get('id') || '').replace(/[^\w.@-]/g, '').slice(0, 120) || undefined,
      title: title.slice(0, 300),
      description: String(get('d') || '').slice(0, 4000),
      location: String(get('l') || '').slice(0, 300),
      url: /^https?:\/\//.test(String(get('u') || '')) ? String(get('u')).slice(0, 500) : '',
      start: start, end: end, allDay: allDay,
      alarms: alarms.slice(0, 4), rrule: rr,
      organizer: org && org.email ? org : null,
      attendees: att.slice(0, 30),
      priority: get('p') === '1' ? 1 : 0
    };
  }

  return {
    build: build, fold: fold, escapeText: escapeText, toUTC: toUTC, toDateOnly: toDateOnly,
    parseStamp: parseStamp, durationFromMinutes: durationFromMinutes, parseWho: parseWho,
    isEmail: isEmail, paramsFromEvent: paramsFromEvent, eventFromParams: eventFromParams
  };
}));
