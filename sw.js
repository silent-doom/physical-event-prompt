/**
 * EventFlow – Service Worker
 * Caches all static assets for offline support
 */

const CACHE_NAME  = 'eventflow-v1';
const APP_SHELL   = [
  '/',
  '/index.html',
  '/crowd-map.html',
  '/wait-times.html',
  '/parking.html',
  '/schedule.html',
  '/alerts.html',
  '/admin.html',
  '/js/config.js',
  '/js/components.js',
  '/js/home.js',
  '/js/crowd-map.js',
  '/js/wait-times.js',
  '/js/parking.js',
  '/js/schedule.js',
  '/js/alerts.js',
  '/js/admin.js',
  '/css/design-system.css',
  '/css/nav.css',
  '/css/home.css',
  '/css/pages.css',
  '/css/admin.css',
  '/manifest.json',
  '/assets/icons/icon-192.svg',
];

// ─── Install: Pre-cache app shell ──────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ─── Activate: Remove old caches ──────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── Fetch: Cache-first for app shell, network-first for Maps ─────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always network-first for Google Maps and Firebase
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('gstatic.com')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for local assets
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(resp => {
        if (resp.ok && event.request.method === 'GET') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return resp;
      })
    ).catch(() => caches.match('/index.html'))
  );
});
