/**
 * sw.js — Service Worker
 *
 * Implements a cache-first strategy for all app assets so the app
 * loads instantly and works fully offline after the first visit.
 */

const CACHE_NAME = "localsync-v22";

// ... (existing comments) ...

// ─── Periodic Sync ────────────────────────────────────────────────────────────

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "ai-check") {
    // Background assistant check
    console.log("[SW] Periodic assistant check triggered.");
  }
});

// All assets that must be available offline
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./app.js",
  "./db.js",
  "./sync.js",
  "./modules/ui.js",
  "./modules/assistant/assistant.js",
  "./static/tips.jsonl",
  "./static/exercises.jsonl",
  "./styles.css",
  "./manifest.json",
  "./static/body_front.svg",
  "./static/body_back.svg",
  "./app.js",
  "./sync.js",
  "./db.js",
  "./db-base.js",
  "./modules/ui.js",
  "./modules/notes/notes.js",
  "./modules/notes/db.js",
  "./modules/notes/notes.css",
  "./modules/notes/notes.html",
  "./modules/habits/habits.js",
  "./modules/habits/db.js",
  "./modules/habits/habits.css",
  "./modules/habits/habits.html",
  "./modules/books/books.js",
  "./modules/books/db.js",
  "./modules/books/books.css",
  "./modules/books/books.html",
  "./modules/settings/settings.js",
  "./modules/settings/db.js",
  "./modules/settings/settings.html",
  "./modules/fitness/fitness.js",
  "./modules/fitness/db.js",
  "./modules/fitness/fitness.css",
  "./modules/fitness/fitness.html",
  "./modules/tasks/tasks.js",
  "./modules/tasks/db.js",
  "./modules/tasks/tasks.css",
  "./modules/tasks/tasks.html",
  "./modules/learning/learning.js",
  "./modules/learning/learning.html",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  console.log("[SW] Installing…");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Cache each asset individually and bypass HTTP cache
        return Promise.allSettled(
          ASSETS_TO_CACHE.map((url) => {
            const req = new Request(`${url}?v=${CACHE_NAME}`, { cache: "reload" });
            return fetch(req).then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return cache.put(url, res);
            }).catch((err) => {
              console.warn(`[SW] Failed to cache: ${url}`, err);
            });
          })
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

  // Pass through non-GET requests
  if (event.request.method !== "GET") return;

  // Network-first for everything (fall back to cache if offline)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If successful response, clone and update cache
        if (response && response.status === 200 && response.type === "basic") {
          const toCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache));
        }
        return response;
      })
      .catch(() => {
        // If network fails (offline), try to serve from cache
        return caches.match(event.request);
      })
  );
});

// ─── Push / Notification (optional) ──────────────────────────────────────────

self.addEventListener("push", (event) => {
  const title = "MultiPWA";
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
