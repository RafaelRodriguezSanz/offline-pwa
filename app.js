/**
 * app.js — Main orchestrator
 */

import { getSyncState } from "./db.js";
import { initGoogleAuth, syncToDrive } from "./sync.js";
import { initNotes, refreshItems } from "./modules/notes/notes.js";
import { initWaterTracker } from "./modules/habits/habits.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// ─── DOM references ───────────────────────────────────────────────────────────

const syncStatus    = document.getElementById("sync-status");
const lastSyncEl    = document.getElementById("last-sync-text");
const notifBanner   = document.getElementById("notif-banner");
const notifAllowBtn = document.getElementById("btn-allow-notif");
const notifDismiss  = document.getElementById("btn-dismiss-notif");
const syncBtn       = document.getElementById("btn-sync");

// Navigation
const navItems    = document.querySelectorAll(".nav-item");
const appSections = document.querySelectorAll(".app-section");
const sideNav     = document.getElementById("side-nav");
const menuToggle  = document.getElementById("menu-toggle");
const menuClose   = document.getElementById("menu-close");
const navOverlay  = document.getElementById("nav-overlay");

// ─── Navigation Logic ─────────────────────────────────────────────────────────

function toggleMenu(show) {
  sideNav.classList.toggle("open", show);
  navOverlay.classList.toggle("show", show);
}

function setupNavigation() {
  if (!menuToggle) return;

  // Toggle buttons
  menuToggle.addEventListener("click", () => toggleMenu(true));
  menuClose.addEventListener("click", () => toggleMenu(false));
  navOverlay.addEventListener("click", () => toggleMenu(false));

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const targetId = item.getAttribute("data-target");
      
      // Update active nav item
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      
      // Show/hide sections
      appSections.forEach(section => {
        section.hidden = (section.id !== targetId);
      });

      // Close menu
      toggleMenu(false);
    });
  });
}

// ─── Service Worker ───────────────────────────────────────────────────────────

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    console.log("[App] Service Worker registered:", reg.scope);
  } catch (err) {
    console.error("[App] Service Worker registration failed:", err);
  }
}

// ─── Notification helpers ─────────────────────────────────────────────────────

function showNotifBanner() {
  if ("Notification" in window && Notification.permission === "default") {
    notifBanner.hidden = false;
  }
}

async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  notifBanner.hidden = true;

  if (permission === "granted") {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification("MultiPWA", {
        body: "Notifications enabled for hydration and sync reminders.",
        icon: "./icons/icon-192.png",
        tag:  "welcome",
      });
    }
  }
}

// ─── Status display ───────────────────────────────────────────────────────────

function setStatus(message, type = "") {
  syncStatus.textContent  = message;
  syncStatus.className    = type; // "active" | "error" | ""
}

async function updateLastSyncDisplay() {
  const { lastSyncAt, hasUnsyncedChanges } = await getSyncState();

  if (!lastSyncAt) {
    lastSyncEl.textContent = "Never synced";
    return;
  }

  const date = new Date(lastSyncAt);
  const formatted = date.toLocaleString(undefined, {
    month:  "short",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });

  lastSyncEl.textContent =
    `Last sync: ${formatted}` + (hasUnsyncedChanges ? " · unsaved changes" : "");
}

// ─── Auto-sync logic ──────────────────────────────────────────────────────────

async function maybeAutoSync() {
  if (!navigator.onLine) return;

  const { lastSyncAt, hasUnsyncedChanges } = await getSyncState();
  if (!hasUnsyncedChanges) return;

  const timeSinceSync = lastSyncAt ? Date.now() - lastSyncAt : Infinity;

  if (timeSinceSync > ONE_DAY_MS) {
    setStatus("Auto-syncing…", "active");
    const ok = await syncToDrive(setStatus);
    if (ok) {
        await updateLastSyncDisplay();
        await refreshItems(); // Refresh notes list after sync
    }
  } else {
    const hoursLeft = Math.ceil((ONE_DAY_MS - timeSinceSync) / 3_600_000);
    setStatus(`Sync in ~${hoursLeft}h`, "");
  }
}

// ─── Online / offline indicator ───────────────────────────────────────────────

function updateOnlineStatus() {
  document.body.classList.toggle("offline", !navigator.onLine);
}

// ─── Event wiring ─────────────────────────────────────────────────────────────

syncBtn.addEventListener("click", async () => {
  if (!window.google) {
    setStatus("Sync unavailable (Google script blocked).", "error");
    return;
  }

  syncBtn.disabled = true;
  setStatus("Starting sync…", "active");

  const ok = await syncToDrive(setStatus);
  if (ok) {
      await updateLastSyncDisplay();
      await refreshItems();
  }

  setTimeout(() => { syncBtn.disabled = false; }, 2000);
});

notifAllowBtn.addEventListener("click", requestNotificationPermission);
notifDismiss.addEventListener("click", () => { notifBanner.hidden = true; });

window.addEventListener("online",  updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

// ─── Boot ─────────────────────────────────────────────────────────────────────

async function init() {
  // Setup navigation first for immediate interactivity
  setupNavigation();

  await registerServiceWorker();
  updateOnlineStatus();

  window.onGISLoad = () => initGoogleAuth();

  // Initialize Modules
  await initNotes(updateLastSyncDisplay);
  await initWaterTracker();

  await updateLastSyncDisplay();
  showNotifBanner();
  await maybeAutoSync();

  console.log("[App] MultiPWA Ready.");
}

init();
