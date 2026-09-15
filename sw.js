self.addEventListener('push', function(event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }
  event.waitUntil(self.registration.showNotification(data.title || 'European Swing', {
    body: data.body || '',
    data: { url: data.url || '/' },
    tag: 'european-swing-alert'
  }));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var target = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(clients.openWindow(target));
});
