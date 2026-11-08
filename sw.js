/* ============================================================
   PROJECT W.A.T.C.H. DTR — Service Worker v6.0
   PWA Offline Support
   ============================================================ */

// ✅ Pinalitan ang version para mag-force update sa mga devices
const CACHE_NAME = 'watch-dtr-v6.0.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

/* ============================================================
   INSTALL — I-cache ang mga assets
   ============================================================ */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version 6.0...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      console.log('[SW] Install complete');
      return self.skipWaiting();
    })
  );
});

/* ============================================================
   ACTIVATE — I-delete ang lumang caches
   ============================================================ */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
      );
    }).then(() => {
      console.log('[SW] Activate complete');
      return self.clients.claim();
    })
  );
});

/* ============================================================
   FETCH — Network First, Fallback to Cache
   ============================================================ */
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // ✅ HUWAG i-cache ang Apps Script API calls (para laging fresh ang data)
  if (url.includes('script.google.com')) {
    return;
  }

  // ✅ HUWAG i-cache ang Google Sheets
  if (url.includes('docs.google.com')) {
    return;
  }

  // ✅ HUWAG i-cache ang non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // I-cache ang bagong valid responses
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback sa cache kapag offline
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Kung walang cached, ibalik ang index.html
          return caches.match('/index.html');
        });
      })
  );
});