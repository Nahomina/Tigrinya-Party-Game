// Mayim Service Worker — v33
// HTML pages:    network-first  (always fresh)
// JS/CSS assets: stale-while-revalidate  (fast + always up-to-date)
// Supabase API:  network-first with cache fallback
// Fonts:         cache-first  (immutable)

const CACHE_VERSION      = 'mayim-v33';
const SUPABASE_API_CACHE = 'mayim-supabase-v1';

// Assets to precache on install (bare URLs — no version query strings here)
const PRECACHE_ASSETS = [
  './style.css',
  './supabase.min.js',
  './words.js',
  './proverbs.js',
  './packs.js',
  './app.js',
  './manifest.json',
];

// Fonts: large, immutable — cache separately so they survive a full cache wipe
const FONT_CACHE   = 'mayim-fonts-v1';
const FONT_ASSETS  = [
  './assets/NotoSansEthiopic.woff2',
  './assets/BebasNeue.woff2',
];

// ── Install: pre-cache assets, skip waiting immediately ─────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Main cache
      caches.open(CACHE_VERSION).then(cache =>
        Promise.allSettled(PRECACHE_ASSETS.map(url => cache.add(url)))
          .then(results => {
            const failed = results.filter(r => r.status === 'rejected');
            if (failed.length) console.warn(`[SW] ${failed.length} precache miss(es)`);
          })
      ),
      // Font cache — kept across version bumps (fonts don't change)
      caches.open(FONT_CACHE).then(cache =>
        Promise.allSettled(FONT_ASSETS.map(url =>
          caches.match(url).then(hit => hit ? null : cache.add(url))
        ))
      ),
    ])
    .then(() => self.skipWaiting())  // activate immediately, no waiting for tabs to close
    .catch(() => self.skipWaiting())
  );
});

// ── Activate: wipe stale caches, claim all clients, trigger reload ──────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_VERSION && k !== SUPABASE_API_CACHE && k !== FONT_CACHE)
          .map(k => caches.delete(k).catch(() => {}))
      ))
      .then(() => self.clients.claim())
      .then(() => {
        // Tell every open tab a new version is live.
        // Pages decide whether to reload silently or show a banner.
        self.clients.matchAll({ type: 'window' }).then(clients =>
          clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' }))
        );
      })
      .catch(() => self.clients.claim())
  );
});

// ── Message handler ──────────────────────────────────────────────────────────
// Pages can send SKIP_WAITING to force a waiting SW to activate.
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url      = new URL(event.request.url);
  const isHtml   = url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === '';
  const isSbApi  = url.hostname.includes('supabase.co');
  const isCdn    = url.hostname.includes('jsdelivr.net') || url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com');
  const isFont   = url.pathname.endsWith('.woff2') || url.pathname.endsWith('.woff') || url.pathname.endsWith('.ttf');

  // ── HTML + Supabase API: network-first, cache fallback ───────────────────
  if (isHtml || isSbApi) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res && res.status === 200) {
            const key = isSbApi ? SUPABASE_API_CACHE : CACHE_VERSION;
            caches.open(key).then(c => c.put(event.request, res.clone())).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // ── Fonts: cache-first, never expire ─────────────────────────────────────
  if (isFont) {
    event.respondWith(
      caches.open(FONT_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(res => {
            if (res && res.status === 200) cache.put(event.request, res.clone()).catch(() => {});
            return res;
          });
        })
      )
    );
    return;
  }

  // ── CDN (external): network-first, cache as fallback ─────────────────────
  if (isCdn) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res && res.status === 200) {
            caches.open(CACHE_VERSION).then(c => c.put(event.request, res.clone())).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // ── Local JS/CSS/images: stale-while-revalidate ───────────────────────────
  // Serve the cached version immediately (fast) while fetching a fresh copy
  // in the background and updating the cache for next time.
  // Version-query-stripped lookup (app.js?v=33 → app.js) handles pages that
  // still carry old version strings — they always get the latest precached file.
  event.respondWith(
    caches.open(CACHE_VERSION).then(cache => {
      // Try exact URL first, then bare URL (strips ?v=X query string)
      return cache.match(event.request).then(exact => {
        const bareUrl  = event.request.url.split('?')[0];
        // Always a Promise — when exact is a Response we wrap it; otherwise do a bare-URL lookup
        const cacheHit = exact ? Promise.resolve(exact) : cache.match(bareUrl);

        // Background revalidation — always fetch fresh and update cache
        const networkFetch = fetch(event.request)
          .then(res => {
            if (res && res.status === 200 && res.type !== 'opaque') {
              // Store under BOTH the exact versioned URL and the bare URL
              // so future version bumps are served immediately
              const clone1 = res.clone();
              const clone2 = res.clone();
              cache.put(event.request, clone1).catch(() => {});
              cache.put(bareUrl, clone2).catch(() => {});
            }
            return res;
          })
          .catch(() => null);

        // Serve from cache immediately; fall through to network if nothing cached
        return cacheHit.then(cached => cached || networkFetch);
      });
    })
  );
});
