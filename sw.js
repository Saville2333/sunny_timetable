/* 太阳神的随身陪伴课程表 · 离线缓存 */
const CACHE = 'sunny-timetable-v4';
const ASSETS = [
  './',
  './index.html',
  './app.css',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/store.js',
  './js/pdf-lite.js',
  './js/importer.js',
  './js/app.js',
  './js/views.js',
  './js/delight.js',
  './js/widget.js',
  './js/editor.js',
  './js/import-ui.js',
  './js/settings.js',
  './js/reminders.js',
  './js/weather.js',
  './js/rhythm.js',
  './js/food.js',
  './js/planner.js',
  './js/miniapps.js',
  './js/import-browser.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key !== CACHE;
      }).map(function (key) {
        return caches.delete(key);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request).then(function (response) {
        const copy = response.clone();
        caches.open(CACHE).then(function (cache) {
          cache.put(event.request, copy);
        });
        return response;
      });
    }).catch(function () {
      return caches.match('./index.html');
    })
  );
});
