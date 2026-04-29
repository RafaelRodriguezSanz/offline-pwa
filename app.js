/**
 * app.js — UI layer and orchestration
 *
 * Responsibilities:
 *  - Register the service worker
 *  - Boot Google Auth
 *  - Request notification permission
 *  - Render the item list
 *  - Wire up "Save" and "Sync now" buttons
 *  - Run auto-sync on load if conditions are met
 */

import {
  addItem,
  getAllItems,
  deleteItem,
  markUnsyncedChanges,
  getSyncState,
} from "./db.js";

import { initGoogleAuth, syncToDrive } from "./sync.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// ─── DOM references ───────────────────────────────────────────────────────────

const textarea      = document.getElementById("note-input");
const saveBtn       = document.getElementById("btn-save");
const syncBtn       = document.getElementById("btn-sync");
const itemsList     = document.getElementById("items-list");
const syncStatus    = document.getElementById("sync-status");
const lastSyncEl    = document.getElementById("last-sync-text");
const notifBanner   = document.getElementById("notif-banner");
const notifAllowBtn = document.getElementById("btn-allow-notif");
const notifDismiss  = document.getElementById("btn-dismiss-notif");

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
  // Only show if notifications are supported and not yet decided
  if (
    "Notification" in window &&
    Notification.permission === "default"
  ) {
    notifBanner.hidden = false;
  }
}

async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  notifBanner.hidden = true;

  if (permission === "granted") {
    // Show a test notification so the user sees it works
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification("LocalSync", {
        body: "You'll be reminded to sync when data is pending.",
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

// ─── Item rendering ───────────────────────────────────────────────────────────

function formatTime(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month:  "short",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

function renderItems(items) {
  itemsList.innerHTML = "";

  if (items.length === 0) {
    itemsList.innerHTML = `<li class="empty-state">No notes yet. Start typing above.</li>`;
    return;
  }

  for (const item of items) {
    const li = document.createElement("li");
    li.className  = "item-card";
    li.dataset.id = item.id;

    li.innerHTML = `
      <span class="item-value">${escapeHTML(item.value)}</span>
      <span class="item-time">${formatTime(item.createdAt)}</span>
      <button class="btn-delete" title="Delete note" aria-label="Delete note">✕</button>
    `;

    // Delete handler
    li.querySelector(".btn-delete").addEventListener("click", async () => {
      await deleteItem(item.id);
      await markUnsyncedChanges();
      await refreshItems();
      await updateLastSyncDisplay();
    });

    itemsList.appendChild(li);
  }
}

async function refreshItems() {
  const items = await getAllItems();
  renderItems(items);
}

// ─── Auto-sync logic ──────────────────────────────────────────────────────────

/**
 * Check whether an automatic sync should run on app load.
 * Conditions: hasUnsyncedChanges=true AND >24 h since last sync.
 */
async function maybeAutoSync() {
  if (!navigator.onLine) return;

  const { lastSyncAt, hasUnsyncedChanges } = await getSyncState();
  if (!hasUnsyncedChanges) return;

  const timeSinceSync = lastSyncAt ? Date.now() - lastSyncAt : Infinity;

  if (timeSinceSync > ONE_DAY_MS) {
    setStatus("Auto-syncing…", "active");
    const ok = await syncToDrive(setStatus);
    if (ok) await updateLastSyncDisplay();
  } else {
    const hoursLeft = Math.ceil((ONE_DAY_MS - timeSinceSync) / 3_600_000);
    setStatus(`Sync in ~${hoursLeft}h`, "");
  }
}

// ─── Online / offline indicator ───────────────────────────────────────────────

function updateOnlineStatus() {
  document.body.classList.toggle("offline", !navigator.onLine);
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Event wiring ─────────────────────────────────────────────────────────────

saveBtn.addEventListener("click", async () => {
  const value = textarea.value.trim();
  if (!value) return;

  saveBtn.disabled = true;

  await addItem(value);
  await markUnsyncedChanges();

  textarea.value = "";
  await refreshItems();
  await updateLastSyncDisplay();
  setStatus("Saved locally ✓");

  saveBtn.disabled = false;
  textarea.focus();
});

// Allow Ctrl+Enter / Cmd+Enter to save
textarea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    saveBtn.click();
  }
});

syncBtn.addEventListener("click", async () => {
  syncBtn.disabled = true;
  setStatus("Starting sync…", "active");

  const ok = await syncToDrive(setStatus);
  if (ok) await updateLastSyncDisplay();

  // Re-enable after a short pause so the user can read the status
  setTimeout(() => { syncBtn.disabled = false; }, 2000);
});

notifAllowBtn.addEventListener("click", requestNotificationPermission);
notifDismiss.addEventListener("click", () => { notifBanner.hidden = true; });

window.addEventListener("online",  updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

// ─── Boot ─────────────────────────────────────────────────────────────────────

async function init() {
  // 1. Service worker
  await registerServiceWorker();

  // 2. Online / offline indicator
  updateOnlineStatus();

  // 3. Load GIS token client once the script is ready
  //    (the script tag uses onload="onGISLoad()" to call this)
  window.onGISLoad = () => initGoogleAuth();

  // 4. Render stored items
  await refreshItems();

  // 5. Show last-sync info
  await updateLastSyncDisplay();

  // 6. Notification permission prompt
  showNotifBanner();

  // 7. Auto-sync if conditions are met
  await maybeAutoSync();

  console.log("[App] Ready.");
}

// Kick off
init();
