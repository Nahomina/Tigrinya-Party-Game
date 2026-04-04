// Mayim Service Worker — v3
// index.html: network-first (always fresh)
// Assets/fonts: cache-first (fast)
// Supabase API: network-first with cache fallback
const CACHE_VERSION = 'mayim-v3';
const SUPABASE_API_CACHE = 'mayim-supabase-v1';

const PRECACHE_ASSETS = [
  './style.css',
  './words.js',
  './app.js',
  './manifest.json',
  './assets/NotoSansEthiopic.woff2',
  './assets/BebasNeue.woff2'
];

// ── Install: pre-cache static assets (NOT index.html — network-first) ────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())  // activate immediately
  );
});

// ── Activate: wipe all old caches immediately ─────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION && key !== SUPABASE_API_CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => {
      self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
      });
      return self.clients.claim();  // take control of all open tabs immediately
    })
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isHtml    = url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === '';
  const isSbApi   = url.hostname.includes('supabase.co');
  const isCdnJs   = url.hostname.includes('jsdelivr.net');

  // ── index.html & Supabase: network-first, cache fallback ──────────────
  if (isHtml || isSbApi) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            const key = isSbApi ? SUPABASE_API_CACHE : CACHE_VERSION;
            caches.open(key).then(c => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // ── CDN scripts: network-first (don't cache — they version themselves) ─
  if (isCdnJs) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  // ── Everything else: cache-first, network fallback ─────────────────────
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          caches.open(CACHE_VERSION).then(c => c.put(event.request, response.clone()));
        }
        return response;
      }).catch(() => caches.match(event.request));
    })
  );
});
