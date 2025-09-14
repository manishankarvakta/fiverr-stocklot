// StockLot Service Worker - Mobile Optimized (No HTML Caching)

const CACHE_NAME = 'stocklot-v6-assets';
const urlsToCache = [
  // Cache ONLY static assets, NEVER cache HTML/documents
  '/static/js/bundle.js',
  '/static/css/main.css', 
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache assets only, force immediate takeover
self.addEventListener('install', (event) => {
  console.log('SW: Installing v6 with immediate takeover');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Caching static assets only');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('SW: Assets cached, skipping waiting');
        return self.skipWaiting(); // Force immediate activation
      })
  );
});

// Activate event - purge old caches and claim all clients immediately  
self.addEventListener('activate', (event) => {
  console.log('SW: Activating v6 and claiming clients');
  event.waitUntil(
    (async () => {
      // Delete all old caches that don't match current version
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
      
      // Take control of all clients immediately
      await self.clients.claim();
      console.log('SW: All clients claimed');
    })()
  );
});

// Fetch event - NEVER cache HTML, cache assets only
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // NEVER cache HTML/documents - always fetch fresh from network
  if (request.destination === 'document' || 
      request.url.includes('/api/') ||
      request.url.endsWith('.html') ||
      request.headers.get('accept')?.includes('text/html')) {
    
    console.log('SW: Network-only for HTML/API:', request.url);
    event.respondWith(fetch(request));
    return;
  }
  
  // Cache static assets only (js, css, images, fonts)
  if (['script', 'style', 'font', 'image'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          console.log('SW: Serving from cache:', request.url);
          return response;
        }
        
        return fetch(request).then((response) => {
          // Cache successful responses for static assets only
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // For all other requests, just fetch from network
  event.respondWith(fetch(request));
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