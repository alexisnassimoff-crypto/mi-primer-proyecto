/* Pendientes — service worker: la app abre sin conexión.
   Red primero (para recibir actualizaciones), caché como respaldo. */
var VERSION = 'pendientes-v2';
var CORE = ['./', 'index.html', 'app.css', 'app.js', 'parser.js', 'ics.js', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-192.png',
  'fonts/instrument-serif-latin.woff2', 'fonts/instrument-serif-italic-latin.woff2', 'fonts/inter-latin.woff2'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE).catch(function () {}); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.indexOf('/api/') === 0) return;
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined); });
    })
  );
});
