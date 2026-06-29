/* CHAYA merchant web push — minimal handler; keep in sync with server payload shape. */
self.addEventListener("push", (event) => {
  let title = "CHAYA";
  let body = "새 주문이 있습니다.";
  let url = "/";
  let tag = "chaya-guest-order";

  try {
    if (event.data) {
      const j = event.data.json();
      if (typeof j.title === "string") title = j.title;
      if (typeof j.body === "string") body = j.body;
      if (typeof j.tag === "string" && j.tag.trim()) tag = j.tag.trim();
      if (j.data && typeof j.data.url === "string") url = j.data.url;
    }
  } catch {
    /* use defaults */
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/chaya-store-icon.png",
      badge: "/icons/chaya-store-icon.png",
      data: { url },
      vibrate: [400, 150, 400, 150, 600],
      tag,
      renotify: true,
      requireInteraction: true,
      silent: false,
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
