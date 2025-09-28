// /admin/sw.js (stable)
self.addEventListener('push', (event) => {
  const data = event?.data ? event.data.json() : { title: '알림', message: '새 소식이 있습니다.' };
  const options = {
    body: data.message,
    icon: '/icons/notification.png',
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(data.title || 'CHAYA', options));
});

// Ensure Supabase requests are not cached/handled by SW
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.host.includes('supabase.co')) {
    // Do nothing so the request goes straight to network
    return;
  }
});
