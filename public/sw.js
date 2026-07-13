const CACHE_NAME = 'inventory-ritel-v2';
const ASSETS_TO_CACHE = [
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Hanya tangani request GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // STRATEGI 1: Cache-First untuk Aset Statis (Vite JS/CSS, Gambar, Fonts)
  if (
    url.pathname.startsWith('/build/') || 
    url.pathname.endsWith('.js') || 
    url.pathname.endsWith('.css') || 
    url.pathname.endsWith('.png') || 
    url.pathname.endsWith('.jpg') || 
    url.pathname.endsWith('.jpeg') || 
    url.pathname.endsWith('.svg') || 
    url.pathname.endsWith('.woff2') ||
    url.pathname.includes('/assets/')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        }).catch(() => {
          // Fallback jika fetch gagal dan tidak ada di cache
          return new Response('Aset tidak tersedia offline', { status: 404 });
        });
      })
    );
    return;
  }

  // STRATEGI 2: Network-First untuk Halaman Utama & Data Inertia (Dinamis)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Update cache dengan respon terbaru dari jaringan untuk fallback offline
        if (networkResponse.status === 250 || networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Jika jaringan mati/offline, berikan data terakhir dari cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Kembalikan response kosong/error jika benar-benar tidak ada cache sama sekali
          return new Response('Koneksi internet terputus', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
