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

// Push event - handle push notifications from server AND dev tools
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  console.log('Push data available:', !!event.data);
  
  let notificationTitle = 'Story App';
  let notificationOptions = {
    body: 'Push notification test',
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: 'story-app-notification',
    requireInteraction: false,
    data: {
      url: '/#/',
      storyId: null
    }
  };

  // Handle case when no data is provided (DevTools test)
  if (!event.data) {
    console.log('No push data, showing default notification');
    notificationTitle = 'Story App - Test Push';
    notificationOptions.body = 'Push notification test dari Developer Tools (no data)';
  } else {
    try {
      const pushDataText = event.data.text();
      console.log('Push data text:', pushDataText);
      
      if (pushDataText.trim() === '') {
        // Empty data from DevTools
        notificationTitle = 'Story App - Test Push';
        notificationOptions.body = 'Push notification test dari Developer Tools (empty data)';
      } else {
        // Try to parse as JSON
        try {
          const pushData = JSON.parse(pushDataText);
          console.log('Parsed push data:', pushData);
          
          notificationTitle = pushData.title || 'Story App';
          notificationOptions.body = pushData.body || pushData.message || 'New notification';
          notificationOptions.icon = pushData.icon || '/favicon.png';
          notificationOptions.badge = pushData.badge || '/favicon.png';
          notificationOptions.data = {
            url: pushData.url || pushData.data?.url || '/#/',
            storyId: pushData.storyId || pushData.data?.storyId
          };
        } catch (jsonError) {
          // Not JSON, treat as plain text
          console.log('Push data is not JSON, treating as plain text');
          notificationTitle = 'Story App - Test Push';
          notificationOptions.body = pushDataText;
        }
      }
    } catch (error) {
      console.error('Error processing push data:', error);
      notificationTitle = 'Story App - Error';
      notificationOptions.body = 'Error processing notification data';
    }
  }

  console.log('Showing notification with:', { notificationTitle, notificationOptions });

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log('Push notification shown successfully');
      })
      .catch((error) => {
        console.error('Failed to show push notification:', error);
      })
  );
});

// Message event - handle messages from main thread (untuk story notifications)
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data.data;
    
    console.log('Showing notification from message:', { title, options });
    
    self.registration.showNotification(title, options)
      .then(() => {
        console.log('Notification shown successfully from message');
      })
      .catch((error) => {
        console.error('Failed to show notification from message:', error);
      });
  }
});

// Notification click event - handle navigation (HANYA SATU)
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/#/';
  const storyId = event.notification.data?.storyId;
  
  console.log('Navigation target:', { targetUrl, storyId });
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus existing window and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          // Send navigation message to client
          client.postMessage({
            type: 'NAVIGATE_TO',
            url: targetUrl,
            storyId: storyId
          });
          return client.focus();
        }
      }
      
      // Open new window if no existing window found
      return clients.openWindow(targetUrl);
    })
  );
});