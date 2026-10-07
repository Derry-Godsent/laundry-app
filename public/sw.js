// public/sw.js - Basic offline caching for PWA
/* The version is in the name so a new install replaces the old cache: without
   a bump, an installed app keeps serving the icons it cached the first time. */
const CACHE_NAME = 'chapman-ops-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/apple-touch-icon.png',
  '/favicon-32.png',
  '/favicon-16.png',
  '/brand/monogram.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api') || event.request.url.includes('supabase')) {
    event.respondWith(fetch(event.request));
  } else {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});