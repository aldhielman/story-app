import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

// DO PRECACHING
const manifest = self.__WB_MANIFEST;
precacheAndRoute(manifest);

// Cache strategies
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

registerRoute(
  ({ request }) => 
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker',
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

registerRoute(
  ({ url }) => url.origin !== self.location.origin,
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

// Message event - handle messages from main thread (untuk story notifications)
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data.data;
    
    console.log('Showing notification from message:', { title, options });
    
    // Enhanced notification options with image support
    const enhancedOptions = {
      ...options,
      vibrate: [200, 100, 200], // Vibration pattern
      silent: false,
      renotify: true,
      timestamp: Date.now()
    };
    
    // Prevent duplicate notifications by checking recent notifications
    const notificationTag = enhancedOptions.tag || 'default';
    const lastShown = self.lastNotificationTimes || {};
    const now = Date.now();
    
    // Perbaiki waktu duplicate check menjadi 3 detik
    if (lastShown[notificationTag] && (now - lastShown[notificationTag]) < 3000) {
      console.log('Skipping duplicate notification with tag:', notificationTag);
      return;
    }
    
    // Store timestamp
    self.lastNotificationTimes = { ...lastShown, [notificationTag]: now };
    
    self.registration.showNotification(title, enhancedOptions)
      .then(() => {
        console.log('Notification shown successfully from message');
      })
      .catch((error) => {
        console.error('Failed to show notification from message:', error);
      });
  }
});

// Notification click event - handle navigation dan actions
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  const action = event.action;
  const targetUrl = event.notification.data?.url || '/#/';
  const storyId = event.notification.data?.storyId;
  
  console.log('Notification action:', { action, targetUrl, storyId });
  
  // Handle different actions
  if (action === 'close') {
    // Just close the notification
    return;
  }
  
  // Default action or 'view' action - navigate to story
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus existing window and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          console.log('Focusing existing client and navigating');
          client.focus();
          client.postMessage({
            type: 'NAVIGATE_TO',
            url: targetUrl,
            storyId: storyId
          });
          return;
        }
      }
      
      // No existing window found, open new one
      console.log('Opening new window');
      return clients.openWindow(self.location.origin + targetUrl);
    })
  );
});