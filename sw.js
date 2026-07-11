'use strict';

// При промяна на файловете вдигни версията, за да се обнови кешът.
const CACHE = 'wash-v4';

// Относителни пътища — за да работи и под подпапка (GitHub Pages project page).
const ASSETS = [
  '.',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first: онлайн винаги показва свежото съдържание (и обновява кеша),
// а офлайн пада обратно към кеша. Така обновленията не „засядат“ в кеша.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Само същодоменни заявки минават през нашата стратегия.
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Успешен отговор от мрежата → обнови кеша и върни свежото.
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        // Няма мрежа → от кеша; за навигация падни към index.html.
        caches.match(req).then((cached) => cached || caches.match('index.html'))
      )
  );
});
