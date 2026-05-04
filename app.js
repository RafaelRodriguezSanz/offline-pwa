/**
 * app.js — Component Router & Orchestrator (with Pre-fetching)
 */

import { getSyncState, getMeta, setMeta, importAllData } from "./db.js";
import { initGoogleAuth, syncToDrive, requestToken, downloadFromDrive, hasValidToken } from "./sync.js";
import { initNotes, refreshItems } from "./modules/notes/notes.js";
import { initHabits } from "./modules/habits/habits.js";
import { initBooks } from "./modules/books/books.js";
import { initSettings } from "./modules/settings/settings.js";
import { initFitness } from "./modules/fitness/fitness.js";
import { initTasks }   from "./modules/tasks/tasks.js";
import { runAssistant } from "./modules/assistant/assistant.js";

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
  "notes-app":    null,
  "water-app":    null,
  "books-app":    null,
  "fitness-app":  null,
  "settings-app": null,
  "tasks-app":    null,
};

async function prefetchTemplates() {
  const paths = {
    "notes-app":    "./modules/notes/notes.html",
    "water-app":    "./modules/habits/habits.html",
    "books-app":    "./modules/books/books.html",
    "fitness-app":  "./modules/fitness/fitness.html",
    "settings-app": "./modules/settings/settings.html",
    "tasks-app":    "./modules/tasks/tasks.html",
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
      case "fitness-app":
        await initFitness(appContainer, html);
        break;
      case "tasks-app":
        await initTasks(appContainer, html);
        break;
      case "settings-app":
        await initSettings(appContainer, html);
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

let refreshing = false;

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.register("./sw.js", { scope: "./" });

    // 1. If there's already a worker waiting, show the prompt immediately
    if (reg.waiting) {
      showUpdatePrompt();
    }

    // 2. Detect if a new service worker is found and installed
    reg.addEventListener("updatefound", () => {
      const newWorker = reg.installing;
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          showUpdatePrompt();
        }
      });
    });

    // 3. Force a check for updates every time the app is opened
    reg.update();

    // ─── Periodic Sync ────────────────────────────────────────────────────────
    if ("periodicSync" in reg) {
      try {
        const status = await navigator.permissions.query({ name: "periodic-background-sync" });
        if (status.state === "granted") {
          await reg.periodicSync.register("ai-check", {
            minInterval: 6 * 60 * 60 * 1000 // 6 hours (browser limit)
          });
          console.log("[App] Periodic AI sync registered.");
        }
      } catch (e) {
        console.warn("[App] Periodic Sync failed:", e);
      }
    }

  } catch (err) {
    console.warn("[App] SW registration failed:", err);
  }
}


// Listen for the controlling service worker changing (e.g. skipWaiting was called)
navigator.serviceWorker.addEventListener("controllerchange", () => {
  if (refreshing) return;
  refreshing = true;
  // We can reload automatically or let the prompt handle it
  // For now, let's just reload if skipWaiting was triggered
  window.location.reload();
});

function showUpdatePrompt() {
  // Simple prompt. In a real app, this would be a nice Toast.
  const updateBanner = document.createElement("div");
  updateBanner.className = "update-prompt";
  updateBanner.innerHTML = `
    <div class="update-content">
      <p>✨ Nueva versión disponible</p>
      <button id="btn-update-now">Actualizar ahora</button>
    </div>
  `;
  document.body.appendChild(updateBanner);

  document.getElementById("btn-update-now").addEventListener("click", () => {
    // The skipWaiting() in sw.js will trigger 'controllerchange'
    // but we can also force a reload here if needed.
    window.location.reload();
  });
}

// ─── Status display ───────────────────────────────────────────────────────────

function setStatus(message, type = "") {
  syncStatus.textContent  = message;
  syncStatus.className    = type;
}

async function updateLastSyncDisplay() {
  try {
    const { lastSyncAt, hasUnsyncedChanges } = await getSyncState();
    const loginIndicator = document.getElementById("login-indicator");
    if (loginIndicator) {
      if (hasValidToken()) {
        loginIndicator.classList.add("logged-in");
        loginIndicator.title = "Conectado a Google Drive";
      } else {
        loginIndicator.classList.remove("logged-in");
        loginIndicator.title = "No conectado a Google Drive";
      }
    }

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
    
    // 3. First-time Login & Data Recovery Check
    const lastLogin = await getMeta("last_login");
    if (!lastLogin) {
      console.log("[App] First time use detected. Forcing login for data recovery.");
      const overlay = document.getElementById("login-overlay");
      const btnForceLogin = document.getElementById("btn-force-login");
      const loginStatus = document.getElementById("login-status");
      
      overlay.hidden = false;
      document.getElementById("splash-screen").classList.add("hidden");
      clearTimeout(safetyTimeout);

      btnForceLogin.addEventListener("click", async () => {
        try {
          btnForceLogin.disabled = true;
          loginStatus.textContent = "Conectando con Google...";
          
          await requestToken();
          
          loginStatus.textContent = "Buscando copia de seguridad en la nube...";
          const data = await downloadFromDrive();
          
          if (data) {
            loginStatus.textContent = "¡Copia encontrada! Restaurando datos locales...";
            await importAllData(data);
            await setMeta("lastSyncAt", Date.now());
            await setMeta("hasUnsyncedChanges", false);
          } else {
            loginStatus.textContent = "No se encontró copia previa. Iniciando desde cero...";
          }
          
          await setMeta("last_login", Date.now());
          
          loginStatus.textContent = "¡Todo listo! Recargando app...";
          setTimeout(() => location.reload(), 1500);

        } catch (err) {
          console.error("Login/Recovery failed:", err);
          loginStatus.textContent = "Error: " + err.message;
          btnForceLogin.disabled = false;
        }
      });
      
      // Stop further initialization until login completes
      return; 
    }

    // 4. Hide splash screen with a slight delay for smoothness
    setTimeout(() => {
      document.getElementById("splash-screen").classList.add("hidden");
      clearTimeout(safetyTimeout);
      console.log("[App] MultiPWA Ready.");
    }, 500);

    // ─── Assistant Schedule ──────────────────────────────────────────────────
    // Run once after 5s, then every 5 minutes
    setTimeout(runAssistant, 5000);
    setInterval(runAssistant, 5 * 60 * 1000);

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
