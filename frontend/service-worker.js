const CACHE_NAME = 'lab-inventory-v1';
const APP_SHELL = [
  './',
  'index.html',
  'config.js',
  'manifest.webmanifest',
  'icon.svg',
  'css/style.css',
  'js/app.js',
  'js/api.js',
  'js/auth.js',
  'js/db.js',
  'js/dom.js',
  'js/sync.js',
  'js/views/login.js',
  'js/views/items.js',
  'js/views/item-form.js',
  'js/views/locations.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
