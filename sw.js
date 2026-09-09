/* NDS Ore — service worker: l'app si apre anche senza rete */
var CACHE = 'nds-ore-v1';

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
