/* ==========================================================================
   Colan PollHub - Production Service Worker
   Handles native Web Push Notifications and background notification clicks
   ========================================================================== */

self.addEventListener('install', (event) => {
  // Activate immediately without waiting for old worker to exit
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim all active clients immediately so push events work without reload
  event.waitUntil(self.clients.claim());
});

// Push Event: Received from browser push service even if tab/app is closed
self.addEventListener('push', (event) => {
  let payload = {
    title: "🍛 Today's Food Poll is Live!",
    body: "Your lunch poll is ready. Choose your food before cutoff.",
    icon: "/logo.png",
    badge: "/favicon.png",
    tag: "pollhub-poll-notification",
    data: {
      type: "POLL_PUBLISHED",
      url: "/dashboard"
    }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch (e) {
      try {
        payload.body = event.data.text();
      } catch (err) {
        // Use default fallback payload
      }
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: payload.icon || '/logo.png',
    badge: payload.badge || '/favicon.png',
    tag: payload.tag || 'pollhub-poll-alert',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: payload.data || { url: '/dashboard' },
    actions: [
      { action: 'vote', title: 'Vote Now 🍛' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

// Notification Click Event: Focus existing window or open new PollHub window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetPath = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/dashboard';

  const destinationUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. If an existing PollHub window is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(destinationUrl);
          }
          return;
        }
      }

      // 2. Otherwise open a fresh window straight to the destination
      if (self.clients.openWindow) {
        return self.clients.openWindow(destinationUrl);
      }
    })
  );
});
