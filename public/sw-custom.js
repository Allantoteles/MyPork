// Minimal Service Worker without external dependencies to avoid __name/_async helpers
const CACHE_NAME = 'mypork-runtime-v1';
const ASSET_CACHE = 'mypork-assets-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Network-first for navigations, stale-while-revalidate for static assets
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // HTML navigation
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Same-origin static assets (js, css, images, fonts)
  const isSameOrigin = url.origin === self.location.origin;
  const isAsset = /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf)$/.test(url.pathname);

  if (isSameOrigin && isAsset) {
    event.respondWith(
      caches.match(req).then(cached => {
        const networkPromise = fetch(req)
          .then(res => {
            const copy = res.clone();
            caches.open(ASSET_CACHE).then(cache => cache.put(req, copy));
            return res;
          })
          .catch(() => cached);
        return cached || networkPromise;
      })
    );
  }
});
