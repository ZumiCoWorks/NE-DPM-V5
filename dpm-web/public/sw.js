// Service Worker for NavEaze PWA - CACHE-FIRST Strategy (PWA routes only)
const CACHE_NAME = 'naveaze-v4-offline';
const RUNTIME_CACHE = 'naveaze-runtime-v4';

// Critical assets to precache
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/nav-eaze-logo.svg',
  '/nav-eaze-logo-dark.svg',
  '/attendee-manifest.json',
  '/staff-manifest.json'
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('SW: Installing v4...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Precaching critical assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activating v4...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - CACHE-FIRST strategy (PWA routes only)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Supabase API calls (always fetch fresh)
  if (url.hostname.includes('supabase')) {
    return;
  }

  // ⚠️ CRITICAL: Only cache PWA routes (/attendee, /staff)
  // DO NOT cache admin/organizer routes to avoid breaking development
  const isPWARoute = url.pathname.startsWith('/attendee') ||
    url.pathname.startsWith('/staff') ||
    url.pathname === '/' ||
    url.pathname === '/index.html';

  // For non-PWA routes, just fetch normally (no caching)
  if (!isPWARoute && !url.pathname.includes('.')) {
    // Navigation requests for admin routes - fetch fresh, no cache
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('SW: Serving from cache:', url.pathname);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache if not successful
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
              return networkResponse;
            }

            // Only cache if it's a PWA route or static asset
            const shouldCache = isPWARoute ||
              url.pathname.includes('.') || // Static assets
              url.pathname.includes('attendee-manifest') ||
              url.pathname.includes('staff-manifest');

            if (shouldCache) {
              // Clone the response
              const responseToCache = networkResponse.clone();

              // Cache the fetched resource
              caches.open(RUNTIME_CACHE)
                .then((cache) => {
                  console.log('SW: Caching new resource:', url.pathname);
                  cache.put(request, responseToCache);
                });
            }

            return networkResponse;
          })
          .catch((error) => {
            console.error('SW: Fetch failed, serving offline fallback:', error);

            // Only serve offline fallback for PWA routes
            if (isPWARoute && request.mode === 'navigate') {
              return caches.match('/index.html');
            }

            // For admin routes, let it fail naturally
            return new Response('Offline - Resource not cached', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Message event - for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      })
    );
  }
});
