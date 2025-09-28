// sw.js
self.addEventListener('push', (event) => {
    const data = event.data.json();
    console.log('푸쉬 알림을 받았습니다.', data);
    const options = {
        body: data.message,
        icon: '/path/to/icon.png', // 알림에 표시할 아이콘 경로
        vibrate: [200, 100, 200],
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
});