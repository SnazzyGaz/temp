const CACHE = 'chromemory-permanent-v10';   // ← Increase this number every time you make changes
const BASE_PATH = '/chromemory';

const ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/sw.js`,
  `${BASE_PATH}/icon-192.png`,
  `${BASE_PATH}/icon-512.png`,
  `${BASE_PATH}/screenshot-wide.png`,
  `${BASE_PATH}/screenshot-narrow.png`,
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500&display=swap'
];

self.addEventListener('install', e => {
  console.log('📦 Installing Chromemory cache v10');
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();   // Activate immediately
});

self.addEventListener('activate', e => {
  console.log('✅ Service worker v10 activated');
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Improved fetch handler with network-first for important files
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Only handle our own requests
  if (!url.origin.includes('snazzygaz.github.io') && 
      !url.href.startsWith('https://fonts.googleapis.com')) {
    return;
  }

  // Network-first strategy for HTML and manifest (so updates are picked up quickly)
  if (e.request.mode === 'navigate' || 
      url.pathname.endsWith('.html') || 
      url.pathname.endsWith('manifest.json')) {
    
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request) || caches.match(`${BASE_PATH}/index.html`))
    );
    return;
  }

  // Cache-first for everything else (fast + offline support)
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request))
      .catch(() => new Response('Offline', { status: 503 }))
  );
});