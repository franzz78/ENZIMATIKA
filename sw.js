const CACHE_NAME = 'enzimatika-v2-cache';
const RESOURCES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

// Proses Menginstalasi Service Worker dan Mencadangkan Data Aset Lokal
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Worker] Mengarsipkan seluruh aset lokal utama kedalam cache.');
        return cache.addAll(RESOURCES_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Proses Membersihkan File Cache Versi Lama Jika Aplikasi Diperbarui
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Worker] Membuang sisa berkas cache usang:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Strategi Pengambilan File: Cache Terlebih Dahulu, Jika Gagal Ambil Lewat Internet
self.addEventListener('fetch', (event) => {
  // Hanya tangani skema request http/https biasa (mengabaikan skema eksternal google cdn modules)
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request);
        })
    );
  }
});
