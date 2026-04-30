/**
 * modules/notes.js — Notes app module
 */

import {
  addItem,
  getAllItems,
  deleteItem,
  markUnsyncedChanges,
  getSyncState,
} from "../db.js";

// DOM references
const textarea  = document.getElementById("note-input");
const saveBtn   = document.getElementById("btn-save");
const itemsList = document.getElementById("items-list");
const lastSyncEl = document.getElementById("last-sync-text");

export async function initNotes(updateSyncDisplay) {
  // Save button logic
  saveBtn.addEventListener("click", async () => {
    const value = textarea.value.trim();
    if (!value) return;

    saveBtn.disabled = true;

    await addItem(value);
    await markUnsyncedChanges();

    textarea.value = "";
    await refreshItems();
    if (updateSyncDisplay) await updateSyncDisplay();
    
    saveBtn.disabled = false;
    textarea.focus();
  });

  // Ctrl+Enter to save
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      saveBtn.click();
    }
  });

  await refreshItems();
}

export async function refreshItems() {
  const items = await getAllItems();
  renderItems(items);
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

    li.querySelector(".btn-delete").addEventListener("click", async () => {
      await deleteItem(item.id);
      await markUnsyncedChanges();
      await refreshItems();
    });

    itemsList.appendChild(li);
  }
}

function formatTime(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month:  "short",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
