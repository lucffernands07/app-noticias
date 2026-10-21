const CACHE = "noticias-hoje-v3";
const ASSETS = ["/", "/index.html", "/manifest.webmanifest", "/icon.svg"];

// Periodic sync tag used for background news checks.
const PERIODIC_SYNC_TAG = "noticias-hoje-periodic";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Never cache API/edge function calls — always go to network.
  if (url.pathname.includes("/functions/v1/")) {
    return;
  }

  // For navigation requests, prefer network, fall back to cached shell.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/index.html", copy));
          return res;
        })
        .catch(() => caches.match("/index.html").then((r) => r || new Response("Offline", { status: 503 })))
    );
    return;
  }

  // Cache-first for same-origin static assets.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) =>
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        }).catch(() => cached)
      )
    );
  }
});

// --- Push notifications ----------------------------------------------------

// Handle push events from the platform (when supported). Builds a summary
// notification from the payload, or falls back to a generic alert.
self.addEventListener("push", (event) => {
  let payload = { title: "Notícias Hoje", body: "Novidades disponíveis." };
  try {
    if (event.data) payload = event.data.json();
  } catch {
    if (event.data) payload.body = event.data.text();
  }
  const options = {
    body: payload.body,
    icon: "/icon.svg",
    tag: "noticias-hoje-resumo",
    data: { url: payload.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Open the app when a notification is clicked.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return null;
    })
  );
});

// --- Background periodic sync (where supported) ---------------------------
// Used as a best-effort background scheduler. The main app also runs its own
// interval while the tab is open, so coverage is either: tab open → interval,
// or tab closed → periodic sync (Chromium only). This is a progressive
// enhancement — browsers without Periodic Sync simply rely on the open-tab
// interval.

self.addEventListener("periodicsync", (event) => {
  if (event.tag !== PERIODIC_SYNC_TAG) return;
  event.waitUntil(deliverBackgroundSummary(self.registration));
});

async function deliverBackgroundSummary(registration) {
  if (!("Notification" in self) || Notification.permission !== "granted")
    return;

  // Read settings from IndexedDB-less localStorage via a client page.
  // Service workers cannot access localStorage directly, so we ask an
  // open client for the settings; if none is open, we skip (the push
  // event path is the real delivery mechanism there).
  const clients = await self.clients.matchAll({ type: "window" });
  if (clients.length === 0) return;

  // Ask the first available client for settings.
  const client = clients[0];
  const settings = await postMessageAndWait(client, { type: "GET_SETTINGS" });
  if (!settings || !settings.pushEnabled || !settings.alertCategories?.length)
    return;

  const now = new Date();
  const [h, m] = (settings.alertTime || "08:00").split(":").map(Number);
  if (now.getHours() !== h || now.getMinutes() !== m) return;

  if (settings.lastNotifiedAt) {
    const last = new Date(settings.lastNotifiedAt);
    if (last.toDateString() === now.toDateString()) return;
  }

  // The detailed fetch happens in the open-tab scheduler. Here we just nudge
  // the user to open the app for their full summary.
  await registration.showNotification("📰 Notícias Hoje — Resumo", {
    body: "Suas notícias das categorias selecionadas estão disponíveis. Toque para abrir.",
    icon: "/icon.svg",
    tag: "noticias-hoje-resumo",
    data: { url: "/" },
  });
}

function postMessageAndWait(client, message) {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (e) => resolve(e.data);
    client.postMessage(message, [channel.port2]);
    // Timeout fallback so we never hang the service worker.
    setTimeout(() => resolve(null), 3000);
  });
}
