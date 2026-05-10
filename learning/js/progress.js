/**
 * progress.js — Learning Progress Manager
 * Handles IndexedDB persistence and UI updates for read modules.
 */

const DB_NAME = "appDB";
const DB_VERSION = 6;
const STORE_NAME = "learning_progress";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => resolve(request.result);
    request.onerror   = () => reject(request.error);
  });
}

async function getProgress() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveModuleProgress(moduleId, isRead) {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME, "metadata"], "readwrite");
  
  // Save progress
  tx.objectStore(STORE_NAME).put({ id: moduleId, read: isRead, updatedAt: Date.now() });
  
  // Mark unsynced changes for global PWA sync
  tx.objectStore("metadata").put({ key: "hasUnsyncedChanges", value: true });
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function updateUI() {
  const progress = await getProgress();
  const progressMap = progress.reduce((acc, curr) => {
    acc[curr.id] = curr.read;
    return acc;
  }, {});

  // Update cards
  document.querySelectorAll(".module-card").forEach(card => {
    const id = card.getAttribute("data-module-id");
    if (progressMap[id]) {
      card.classList.add("is-read");
    } else {
      card.classList.remove("is-read");
    }
  });

  // Update area progress bars
  document.querySelectorAll(".track").forEach(track => {
    const cards = track.querySelectorAll(".module-card");
    const readCards = Array.from(cards).filter(c => c.classList.contains("is-read"));
    const percent = cards.length > 0 ? Math.round((readCards.length / cards.length) * 100) : 0;
    
    const bar = track.querySelector(".progress-bar");
    const text = track.querySelector(".progress-text");
    
    if (bar) bar.style.width = `${percent}%`;
    if (text) text.textContent = `${percent}%`;
  });
  
  // Update overall hero stats if they exist
  const allCards = document.querySelectorAll(".module-card");
  const allRead = document.querySelectorAll(".module-card.is-read");
  const overallStat = document.querySelector(".hero-stats .stat:first-child .stat-n");
  if (overallStat) {
      overallStat.textContent = `${allRead.length} / ${allCards.length}`;
  }
}

function setupToggles() {
  document.querySelectorAll(".card-read-toggle").forEach(toggle => {
    toggle.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const card = toggle.closest(".module-card");
      const id = card.getAttribute("data-module-id");
      const newState = !card.classList.contains("is-read");
      
      await saveModuleProgress(id, newState);
      updateUI();
    });
  });
}

// Init
document.addEventListener("DOMContentLoaded", async () => {
  // Wait a bit for DB to be ready if needed
  setTimeout(async () => {
    try {
      await updateUI();
      setupToggles();
    } catch (e) {
      console.warn("DB not ready or upgrade in progress", e);
    }
  }, 100);
});
