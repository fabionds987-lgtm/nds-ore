/* NDS Ore — service worker: l'app si apre anche senza rete */
var CACHE='nds-ore-v14'; /* v14: notifica del programma di domani */ //  /* v8: mezzo e km obbligatori · elenco cantieri che si rilegge da solo */

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(['./', './index.html']);
    }).then(function () { return self.skipWaiting(); })
      .catch(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                 /* gli invii POST a Supabase non passano di qui */
  var u;
  try { u = new URL(req.url); } catch (err) { return; }
  if (u.origin !== self.location.origin) return;    /* solo i file del nostro sito */

  e.respondWith(
    fetch(req).then(function (resp) {
      if (resp && resp.ok) {
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { try { c.put(req, copy); } catch (err) {} });
      }
      return resp;
    }).catch(function () {
      return caches.match(req).then(function (m) {
        return m || caches.match('./index.html') || caches.match('./');
      });
    })
  );
});

/* 27/11/2026 - Programma di domani: mostra la notifica e, toccandola, apre l'app */
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: 'NDS GROUP', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Programma di domani', {
    body: d.body || '', tag: 'programma-' + (d.giorno || ''), renotify: true, data: { giorno: d.giorno || '' }
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (l) {
    for (var i = 0; i < l.length; i++) { if ('focus' in l[i]) return l[i].focus(); }
    return self.clients.openWindow('./');
  }));
});
