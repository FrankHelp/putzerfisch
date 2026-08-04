/* Putzerfisch – Service Worker.
 *
 * Kümmert sich nur um Push-Benachrichtigungen: Die Riffpost kommt im
 * Hintergrund an, wird angezeigt und öffnet beim Tippen die richtige Seite.
 * Bewusst kein Offline-Caching – die App lädt frisch, wenn sie geöffnet wird.
 */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch {
    /* kaputtes Payload ignorieren – Standardtext zeigen */
  }
  e.waitUntil(
    self.registration.showNotification(data.title || '🐚 Riffpost', {
      body: data.body || 'Jemand war im Riff aktiv.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'riffpost',
      data: { url: data.url || '/#/feed' },
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/#/feed';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(url); // offene App zur richtigen Seite bringen
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
