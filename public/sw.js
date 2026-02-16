// Network-first service worker — always serves fresh content
// Change this version string on each deploy to trigger an update
const VERSION = '2026-02-16a';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

// Always fetch from network — never serve stale cache
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
