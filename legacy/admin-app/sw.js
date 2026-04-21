
// admin/sw.js

self.addEventListener("install", (event) => {
  console.log("Service Worker 설치 완료");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker 활성화 완료");
  return self.clients.claim();
});

self.addEventListener("push", (event) => {
  console.log("푸시 이벤트 수신:", event);

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error("푸시 데이터 파싱 오류:", e);
  }

  const title = data.title || "새 주문 알림";
  const options = {
    body: data.body || "새로운 주문이 접수되었습니다.",
    icon: "/admin/icon.png",
    badge: "/admin/badge.png",
    data: data.url || "/admin/",
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("알림 클릭됨:", event.notification);
  event.notification.close();

  const targetUrl = event.notification.data || "/admin/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/admin/") && "focus" in client) {
          client.focus();
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
