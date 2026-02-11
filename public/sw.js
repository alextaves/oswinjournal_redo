const VIDEO_CACHE = 'video-cache-v1';
const ASSET_CACHE = 'asset-cache-v1';

// Clean up old caches when a new version is activated
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== VIDEO_CACHE && key !== ASSET_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only cache mobile videos (chris_mobile_), pass through desktop/panel videos untouched
  if (url.pathname.endsWith('.mp4') && url.pathname.includes('chris_mobile_')) {
    // Skip range requests — let the browser handle partial fetches normally
    if (event.request.headers.get('range')) {
      return;
    }
    event.respondWith(
      caches.open(VIDEO_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) {
            return cached;
          }
          return fetch(event.request).then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // Don't intercept other video requests at all — let them stream normally
  if (url.pathname.endsWith('.mp4')) {
    return;
  }

  // Network-first for everything else (HTML, JS, CSS, images, etc.)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(ASSET_CACHE).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
