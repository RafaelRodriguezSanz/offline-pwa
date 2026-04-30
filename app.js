/**
 * app.js — Component Router & Orchestrator (with Pre-fetching)
 */

import { getSyncState } from "./db.js";
import { initGoogleAuth, syncToDrive } from "./sync.js";
import { initNotes, refreshItems } from "./modules/notes/notes.js";
import { initHabits } from "./modules/habits/habits.js";
import { initBooks } from "./modules/books/books.js";

// Ensure Google Auth is initialized as soon as the script loads
window.onGISLoad = () => {
  console.log("[App] Google GSI script loaded.");
  initGoogleAuth();
};

// ─── DOM references ───────────────────────────────────────────────────────────

const appContainer  = document.getElementById("app-container");
const syncStatus    = document.getElementById("sync-status");
const lastSyncEl    = document.getElementById("last-sync-text");
const notifBanner   = document.getElementById("notif-banner");
const notifAllowBtn = document.getElementById("btn-allow-notif");
const notifDismiss  = document.getElementById("btn-dismiss-notif");

// Navigation
const navItems    = document.querySelectorAll(".nav-item");
const sideNav     = document.getElementById("side-nav");
const menuToggle  = document.getElementById("menu-toggle");
const menuClose   = document.getElementById("menu-close");
const navOverlay  = document.getElementById("nav-overlay");

// ─── Template Cache ───────────────────────────────────────────────────────────

const templateCache = {
  "notes-app": null,
  "water-app": null,
  "books-app": null
};

async function prefetchTemplates() {
  const paths = {
    "notes-app": "./modules/notes/notes.html",
    "water-app": "./modules/habits/habits.html",
    "books-app": "./modules/books/books.html"
  };

  // Fetch all in parallel
  const promises = Object.entries(paths).map(async ([key, url]) => {
    try {
      const res = await fetch(url);
      templateCache[key] = await res.text();
    } catch (e) {
      console.warn(`Failed to prefetch ${key}`, e);
    }
  });

  return Promise.all(promises);
}

// ─── Router Logic ─────────────────────────────────────────────────────────────

async function navigate(target) {
  // If not in cache, show loader (fallback)
  if (!templateCache[target] && target !== "tasks-app") {
    appContainer.innerHTML = '<div class="loader">Cargando...</div>';
  }

  try {
    // Inject from cache if available
    const html = templateCache[target];

    switch (target) {
      case "notes-app":
        await initNotes(appContainer, updateLastSyncDisplay, html);
        break;
      case "water-app":
        await initHabits(appContainer, html);
        break;
      case "books-app":
        await initBooks(appContainer, html);
        break;
      case "tasks-app":
        appContainer.innerHTML = '<div class="empty-state"><p>Próximamente: Gestor de Tareas</p></div>';
        break;
      default:
        appContainer.innerHTML = '<div class="error">Sección no encontrada</div>';
    }
  } catch (err) {
    console.error(`[Router] Error loading ${target}:`, err);
    appContainer.innerHTML = `<div class="error-state"><p>Error al cargar el módulo.</p></div>`;
  }
}

function toggleMenu(show) {
  sideNav.classList.toggle("open", show);
  navOverlay.classList.toggle("show", show);
}

function toggleMenu(show) {
  sideNav.classList.toggle("open", show);
  navOverlay.classList.toggle("show", show);
}

function setupNavigation() {
  if (!menuToggle) return;

  menuToggle.addEventListener("click", () => toggleMenu(true));
  menuClose.addEventListener("click", () => toggleMenu(false));
  navOverlay.addEventListener("click", () => toggleMenu(false));

  navItems.forEach(item => {
    item.addEventListener("click", async () => {
      const targetId = item.getAttribute("data-target");
      if (item.classList.contains("active")) return;
      
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      
      await navigate(targetId);
      toggleMenu(false);
    });
  });
}

// ─── Service Worker ───────────────────────────────────────────────────────────

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./sw.js", { scope: "./" });
  } catch (err) {
    console.warn("[App] SW registration failed.");
  }
}

// ─── Status display ───────────────────────────────────────────────────────────

function setStatus(message, type = "") {
  syncStatus.textContent  = message;
  syncStatus.className    = type;
}

async function updateLastSyncDisplay() {
  try {
    const { lastSyncAt, hasUnsyncedChanges } = await getSyncState();
    if (!lastSyncAt) {
      lastSyncEl.textContent = "Never synced";
      return;
    }
    const date = new Date(lastSyncAt);
    lastSyncEl.textContent = `Last sync: ${date.toLocaleTimeString()} ${hasUnsyncedChanges ? " (unsaved)" : ""}`;
  } catch (e) {
    console.warn("Could not update sync display", e);
  }
}

// ─── Global Sync ─────────────────────────────────────────────────────────────

async function globalSync() {
  if (!window.google) return setStatus("Sync unavailable", "error");
  setStatus("Syncing…", "active");
  const ok = await syncToDrive(setStatus);
  if (ok) {
    await updateLastSyncDisplay();
    
    // Refresh the current view if necessary
    const activeNav = document.querySelector(".nav-item.active");
    if (!activeNav) return;

    const target = activeNav.dataset.target;
    if (target === "notes-app") {
      const list = appContainer.querySelector("#items-list");
      if (list) await refreshItems(list);
    } else if (target === "water-app") {
      // In habits.js we don't export a refresh, but navigate() re-runs init
      // which is fine. Or we could export it. For now let's just re-init if needed.
      // But init fetches the template. 
      // Better: export render functions for all.
    }
  }
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("#btn-sync-global");
  if (btn) globalSync();
});

notifAllowBtn.addEventListener("click", async () => {
  const permission = await Notification.requestPermission();
  notifBanner.hidden = true;
  if (permission === "granted") {
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification("MultiPWA", { body: "Notifications enabled.", icon: "./icons/icon-192.png" });
  }
});
notifDismiss.addEventListener("click", () => { notifBanner.hidden = true; });

window.addEventListener("online",  () => document.body.classList.remove("offline"));
window.addEventListener("offline", () => document.body.classList.add("offline"));

// ─── Boot ─────────────────────────────────────────────────────────────────────

async function init() {
  console.log("[App] Starting initialization...");
  
  // Safety net: ensure splash is hidden after 5 seconds no matter what
  const safetyTimeout = setTimeout(() => {
    const splash = document.getElementById("splash-screen");
    if (splash && !splash.classList.contains("hidden")) {
      console.warn("[App] Safety timeout reached. Forcing splash hide.");
      splash.classList.add("hidden");
    }
  }, 5000);

  try {
    setupNavigation();
    registerServiceWorker();

    console.log("[App] Prefetching templates...");
    const prefetchPromise = prefetchTemplates();

    if ("Notification" in window && Notification.permission === "default") {
      notifBanner.hidden = false;
    }

    // 2. Wait for the default template to be ready before first render
    await prefetchPromise;
    console.log("[App] Templates ready. Navigating to default module...");
    
    await navigate("notes-app");
    console.log("[App] Default module loaded.");
    
    updateLastSyncDisplay();
    
    // 3. Hide splash screen with a slight delay for smoothness
    setTimeout(() => {
      document.getElementById("splash-screen").classList.add("hidden");
      clearTimeout(safetyTimeout);
      console.log("[App] MultiPWA Ready.");
    }, 500);

  } catch (err) {
    console.error("[App] Critical error during init:", err);
    // If it fails, at least hide the splash so the user sees the error state
    document.getElementById("splash-screen").classList.add("hidden");
    clearTimeout(safetyTimeout);
    appContainer.innerHTML = `<div class="error-state">
      <h3>Error al iniciar</h3>
      <p>${err.message}</p>
      <button onclick="location.reload()">Reintentar</button>
    </div>`;
  }
}

init();
