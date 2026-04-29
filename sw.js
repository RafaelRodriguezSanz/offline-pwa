/**
 * sw.js — Service Worker
 *
 * Implements a cache-first strategy for all app assets so the app
 * loads instantly and works fully offline after the first visit.
 */

const CACHE_NAME = "localsync-v1";

// All assets that must be available offline
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./app.js",
  "./db.js",
  "./sync.js",
  "./styles.css",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  // Google Identity Services — cached so auth UI loads offline
  // (actual token requests still require network)
  "https://accounts.google.com/gsi/client",
];

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  console.log("[SW] Installing…");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Cache each asset individually so a single failure doesn't
        // abort the whole install.
        return Promise.allSettled(
          ASSETS_TO_CACHE.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`[SW] Failed to cache: ${url}`, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating…");

  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME) // Remove old caches
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim()) // Take control immediately
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Pass through non-GET requests (e.g. Drive API POSTs)
  if (event.request.method !== "GET") return;

  // Pass through Drive / Google API calls — they need fresh network responses
  if (
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("accounts.google.com")
  ) {
    // Network-first for external APIs (fall back to cache if offline)
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for all app assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      // Not in cache yet — fetch from network and cache for next time
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === "error") {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache));
        return response;
      });
    })
  );
});

// ─── Push / Notification (optional) ──────────────────────────────────────────

self.addEventListener("push", (event) => {
  const title = "LocalSync";
  const options = {
    body: "Open the app to sync your data.",
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    tag: "sync-reminder",
    renotify: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it; otherwise open a new one
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("./");
    })
  );
});
