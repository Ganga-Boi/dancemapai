// DANCEMAP SERVICE WORKER – SAFE MODE
// Ingen fetch-intercept. Ingen cache af HTML eller API.

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// VIGTIGT: ingen fetch handler
