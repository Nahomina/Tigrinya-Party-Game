// Mayim Service Worker — v18
// HTML pages: network-first (always fresh)
// Assets/fonts: cache-first (fast)
// Supabase API: network-first with cache fallback
const CACHE_VERSION = 'mayim-v21';
const SUPABASE_API_CACHE = 'mayim-supabase-v1';

const PRECACHE_ASSETS = [
  './style.css',
  './supabase.min.js',
  './words.js',
  './proverbs.js',
  './packs.js',
  './app.js',
  './manifest.json',
  './assets/NotoSansEthiopic.woff2',
  './assets/BebasNeue.woff2'
];

// ── Install: pre-cache static assets (NOT index.html — network-first) ────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => {
        // Add all assets, but continue even if some fail
        return Promise.allSettled(
          PRECACHE_ASSETS.map(url => cache.add(url))
        ).then(results => {
          const failed = results.filter(r => r.status === 'rejected');
          if (failed.length > 0) {
            console.warn(`[SW] Failed to cache ${failed.length} asset(s)`);
          }
          return cache;
        });
      })
      .then(() => self.skipWaiting())  // activate immediately
      .catch(err => {
        console.error('[SW] Cache install failed:', err);
        // Continue even if cache fails
        return self.skipWaiting();
      })
  );
});

// ── Activate: wipe all old caches immediately ─────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_VERSION && key !== SUPABASE_API_CACHE)
            .map(key => caches.delete(key).catch(err => console.warn(`[SW] Failed to delete cache ${key}:`, err)))
        )
      )
      .then(() => {
        self.clients.matchAll({ type: 'window' })
          .then(clients => {
            clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
          })
          .catch(err => console.warn('[SW] Failed to notify clients:', err));
        return self.clients.claim();  // take control of all open tabs immediately
      })
      .catch(err => {
        console.error('[SW] Activation failed:', err);
        return self.clients.claim();
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
            caches.open(key)
              .then(c => c.put(event.request, clone))
              .catch(err => console.warn('[SW] Cache write failed:', err));
          }
          return response;
        })
        .catch(err => {
          console.warn('[SW] Fetch failed, falling back to cache:', event.request.url, err);
          return caches.match(event.request);
        })
    );
    return;
  }

  // ── CDN scripts: network-first (don't cache — they version themselves) ─
  if (isCdnJs) {
    event.respondWith(
      fetch(event.request)
        .catch(err => {
          console.warn('[SW] CDN fetch failed, falling back to cache:', event.request.url);
          return caches.match(event.request);
        })
    );
    return;
  }

  // ── Everything else: cache-first, network fallback ─────────────────────
  // Try exact URL first, then strip query string so precached bare filenames
  // (e.g. ./app.js) serve versioned requests (e.g. ./app.js?v=33) — this
  // enables offline from the very first SW install without a second visit.
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      // Fallback: try the same URL without query params (catches versioned assets)
      const bareUrl = event.request.url.split('?')[0];
      return caches.match(bareUrl).then(cachedBare => {
        if (cachedBare) return cachedBare;
        return fetch(event.request)
          .then(response => {
            if (response && response.status === 200 && response.type === 'basic') {
              const toCache = response.clone();
              caches.open(CACHE_VERSION)
                .then(c => c.put(event.request, toCache))
                .catch(err => console.warn('[SW] Cache write failed:', err));
            }
            return response;
          })
          .catch(() => caches.match(event.request));
      });
    })
  );
});
