/**
 * progress.js — Learning Progress Manager
 * Handles IndexedDB persistence and UI updates for read modules.
 */

const STORE_NAME = "learning_progress";

import { openDB } from "../../db-base.js";

async function getProgress() {
  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      return [];
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("Failed to get progress:", err);
    return [];
  }
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

  // Update cards (for styling like line-through)
  document.querySelectorAll(".module-card").forEach(card => {
    const id = card.getAttribute("data-module-id");
    const title = card.querySelector(".card-title");
    if (progressMap[id]) {
      card.classList.add("is-read");
      if (title) title.classList.add("is-read");
    } else {
      card.classList.remove("is-read");
      if (title) title.classList.remove("is-read");
    }
  });

  // Update toggles (for sliding state)
  document.querySelectorAll(".card-read-toggle").forEach(toggle => {
    const id = toggle.getAttribute("data-module-id");
    if (progressMap[id]) {
      toggle.classList.add("active");
    } else {
      toggle.classList.remove("active");
    }
  });

  // Update area progress bars
  document.querySelectorAll(".track").forEach(track => {
    const labelClass = track.getAttribute("data-label-class");
    if (!labelClass) return;

    const cards = track.querySelectorAll(".module-card");
    const readCards = Array.from(cards).filter(c => {
      const id = c.getAttribute("data-module-id");
      const isRead = progressMap[id] === true;
      return isRead;
    });
    const percent = cards.length > 0 ? Math.round((readCards.length / cards.length) * 100) : 0;
    
    console.log(`[Progress] Track ${labelClass}: ${readCards.length}/${cards.length} = ${percent}%`);

    const bar = document.getElementById(`prog-bar-${labelClass}`);
    const text = document.getElementById(`prog-text-${labelClass}`);
    if (bar) bar.style.width = `${percent}%`;
    if (text) text.textContent = `${percent}%`;
  });
  
  // Update overall hero stats (XX / 51)
  const allCards = document.querySelectorAll(".module-card");
  const allRead = document.querySelectorAll(".module-card.is-read");
  const overallStat = document.querySelector(".stat-total-modules");
  if (overallStat) {
      overallStat.textContent = `${allRead.length} / ${allCards.length}`;
  }
}

function setupToggles() {
  document.querySelectorAll(".card-read-toggle").forEach(toggle => {
    toggle.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const id = toggle.getAttribute("data-module-id");
      const newState = !toggle.classList.contains("active");
      
      await saveModuleProgress(id, newState);
      updateUI();
    });
  });
}

// Init
window.addEventListener("curriculumRendered", async () => {
  try {
    await updateUI();
    setupToggles();
  } catch (e) {
    console.warn("Progress system initialization failed:", e);
  }
});
