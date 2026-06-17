/* CHAYA merchant web push — minimal handler; keep in sync with server payload shape. */
self.addEventListener("push", (event) => {
  let title = "CHAYA";
  let body = "새 주문이 있습니다.";
  let url = "/";

  try {
    if (event.data) {
      const j = event.data.json();
      if (typeof j.title === "string") title = j.title;
      if (typeof j.body === "string") body = j.body;
      if (j.data && typeof j.data.url === "string") url = j.data.url;
    }
  } catch {
    /* use defaults */
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
      vibrate: [280, 120, 280, 120, 420],
      tag: "chaya-guest-order",
      renotify: true,
      requireInteraction: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const raw = event.notification.data && event.notification.data.url;
  let openUrl = typeof raw === "string" && raw.trim() ? raw.trim() : "/m";
  if (!/^https?:\/\//i.test(openUrl)) {
    openUrl = self.location.origin + (openUrl.startsWith("/") ? openUrl : `/${openUrl}`);
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      try {
        const path = new URL(openUrl).pathname;
        for (const c of clientList) {
          if ("focus" in c && c.url && c.url.includes(path)) {
            return c.focus();
          }
        }
      } catch {
        /* fall through */
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(openUrl);
      }
      return undefined;
    }),
  );
});
