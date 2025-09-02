// StockLot Service Worker for Push Notifications

const CACHE_NAME = 'stocklot-cache-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received', event);

  let notificationData = {
    title: 'StockLot Notification',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-icon.png'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text();
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    notificationData
  );

  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received', event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  let url = '/';

  // Handle different notification types and actions
  if (data.type === 'order') {
    if (action === 'view-order' || action === 'view') {
      url = `/orders/${data.orderId}`;
    } else if (action === 'track') {
      url = `/orders/${data.orderId}/track`;
    }
  } else if (data.type === 'bid') {
    if (action === 'view-listing' || action === 'view') {
      url = `/marketplace?listing=${data.listingId}`;
    } else if (action === 'place-bid') {
      url = `/marketplace?listing=${data.listingId}&action=bid`;
    }
  } else if (data.type === 'listing') {
    if (action === 'view-listing' || action === 'view') {
      url = `/marketplace?listing=${data.listingId}`;
    } else if (action === 'save') {
      url = `/saved-listings`;
    }
  } else if (data.type === 'message') {
    if (action === 'reply' || action === 'view-chat' || action === 'view') {
      url = `/messages`;
    }
  } else if (data.type === 'kyc') {
    if (action === 'view-kyc' || action === 'view') {
      url = `/profile/kyc`;
    }
  }

  // Close notification and open/focus client
  const promiseChain = clients.openWindow ?
    clients.openWindow(url) :
    clients.matchAll().then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow(url);
    });

  event.waitUntil(promiseChain);
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);

  if (event.tag === 'background-order-sync') {
    event.waitUntil(syncPendingOrders());
  } else if (event.tag === 'background-bid-sync') {
    event.waitUntil(syncPendingBids());
  }
});

// Sync pending orders when back online
async function syncPendingOrders() {
  try {
    const cache = await caches.open('pending-orders');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
          console.log('Synced pending order:', request.url);
        }
      } catch (error) {
        console.error('Failed to sync order:', error);
      }
    }
  } catch (error) {
    console.error('Error syncing pending orders:', error);
  }
}

// Sync pending bids when back online
async function syncPendingBids() {
  try {
    const cache = await caches.open('pending-bids');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
          console.log('Synced pending bid:', request.url);
        }
      } catch (error) {
        console.error('Failed to sync bid:', error);
      }
    }
  } catch (error) {
    console.error('Error syncing pending bids:', error);
  }
}

// Handle message from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('StockLot Service Worker loaded');