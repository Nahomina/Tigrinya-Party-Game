// Mayim Service Worker — Cache-first strategy with versioning
// Updated for Supabase API caching
const CACHE_VERSION = 'mayim-v2';
const SUPABASE_API_CACHE = 'mayim-supabase-v1';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './words.js',
  './app.js',
  './manifest.json',
  './assets/NotoSansEthiopic.woff2',
  './assets/BebasNeue.woff2'
];

// ── Install: pre-cache all assets ─────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ─────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION && key !== SUPABASE_API_CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => {
      // Notify all open clients that a new version is active
      self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
      });
      return self.clients.claim();
    })
  );
});

// ── Fetch: serve from cache, fall back to network ─────────────────────────
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isSbApi = url.hostname.includes('supabase.co');

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache valid responses for future offline use
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          const cacheKey = isSbApi ? SUPABASE_API_CACHE : CACHE_VERSION;
          caches.open(cacheKey).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(() => {
        // Return offline fallback
        return caches.match(event.request);
      });
    })
  );
});
