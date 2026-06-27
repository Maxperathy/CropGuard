const CACHE_NAME = 'cropguard-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/images/CG-logo.svg',
  '/images/Crop_Guard_logo_tech_shield_202606270752.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip POST and non-http requests
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // 1. App shell & static assets: cache-first
  if (request.destination === 'document' ||
      url.pathname.match(/\.(js|css|woff2|png|jpg|jpeg|ico|svg)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        }).catch(() => {
          // If offline and request is document, return index.html
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
    );
    return;
  }

  // 2. Fallback to network, then cache
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});
