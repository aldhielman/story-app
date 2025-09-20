import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

const CACHE_NAME = 'story-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/scripts/index.js',
  '/styles/styles.css',
  '/favicon.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// Precache and route static assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Application Shell - Cache First Strategy
registerRoute(
  ({ request }) => request.destination === 'document',
  new CacheFirst({
    cacheName: 'app-shell',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Static Assets (CSS, JS, Images) - Cache First Strategy
registerRoute(
  ({ request }) => 
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// API Calls - Network First Strategy (with offline fallback)
registerRoute(
  ({ url }) => url.origin === 'https://story-api.dicoding.dev',
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// External Resources (Leaflet, etc.) - Stale While Revalidate
registerRoute(
  ({ url }) => url.origin === 'https://unpkg.com',
  new StaleWhileRevalidate({
    cacheName: 'external-resources',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// Offline Fallback for Navigation
const OFFLINE_HTML = '/offline.html';
const OFFLINE_STORIES = '/offline-stories.html';

// Cache offline pages
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('offline-pages').then((cache) => {
      return cache.addAll([OFFLINE_HTML, OFFLINE_STORIES]);
    })
  );
});

// Serve offline fallback for navigation requests
registerRoute(
  ({ request }) => request.mode === 'navigate',
  async ({ event }) => {
    try {
      const response = await fetch(event.request);
      return response;
    } catch (error) {
      const cache = await caches.open('offline-pages');
      
      // Check if it's a story-related route
      if (event.request.url.includes('/story')) {
        return cache.match(OFFLINE_STORIES) || cache.match(OFFLINE_HTML);
      }
      
      return cache.match(OFFLINE_HTML);
    }
  }
);

// Message event - handle notification display from main thread
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data.data;
    self.registration.showNotification(title, options);
  }
  
  // Handle skip waiting
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data || event.data.text().trim() === '') {
    event.waitUntil(
      self.registration.showNotification('Story App - Test Push', {
        body: 'Push notification test dari Developer Tools',
        icon: '/favicon.png',
        badge: '/favicon.png',
        data: {
          url: '/#/',
          storyId: null
        }
      })
    );
    return;
  }

  try {
    const pushData = event.data.json();
    
    if (pushData.source === 'server') {
      event.waitUntil(
        self.registration.showNotification(pushData.title || 'Story App', {
          body: pushData.body || pushData.message,
          icon: pushData.icon || '/favicon.png',
          badge: pushData.badge || '/favicon.png',
          data: {
            url: pushData.url || pushData.data?.url || '/#/',
            storyId: pushData.storyId || pushData.data?.storyId
          }
        })
      );
    }
  } catch (error) {
    event.waitUntil(
      self.registration.showNotification('Story App - Test Push', {
        body: event.data.text() || 'Push notification test',
        icon: '/favicon.png',
        badge: '/favicon.png',
        data: {
          url: '/#/',
          storyId: null
        }
      })
    );
  }
});

// Notification click event - handle navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.url;
  const storyId = event.notification.data?.storyId;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          client.postMessage({
            type: 'NAVIGATE_TO',
            url: targetUrl,
            storyId: storyId
          });
          return client.focus();
        }
      }
      
      const fullUrl = targetUrl.startsWith('#') 
        ? `${self.location.origin}/${targetUrl}` 
        : `${self.location.origin}${targetUrl}`;
      
      return clients.openWindow(fullUrl);
    })
  );
});