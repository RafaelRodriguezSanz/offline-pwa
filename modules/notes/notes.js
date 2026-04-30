/**
 * modules/notes/notes.js
 */

import { addItem, getAllItems, deleteItem } from "./db.js";
import { markUnsyncedChanges } from "../../db.js";
import { confirmModal } from "../ui.js";

export async function initNotes(container, updateSyncDisplay, preloadedHtml) {
  // Usar HTML precargado o cargar si no existe
  if (preloadedHtml) {
    container.innerHTML = preloadedHtml;
  } else {
    const response = await fetch("./modules/notes/notes.html");
    container.innerHTML = await response.text();
  }

  const textarea  = container.querySelector("#note-input");
  const saveBtn   = container.querySelector("#btn-save");
  const syncBtn   = container.querySelector("#btn-sync");
  const itemsList = container.querySelector("#items-list");

  if (syncBtn) {
    syncBtn.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("trigger-global-sync"));
    });
  }

  saveBtn.addEventListener("click", async () => {
    const value = textarea.value.trim();
    if (!value) return;

    saveBtn.disabled = true;
    await addItem(value);
    await markUnsyncedChanges();

    textarea.value = "";
    await refreshItems(itemsList);
    if (updateSyncDisplay) await updateSyncDisplay();
    
    saveBtn.disabled = false;
    textarea.focus();
  });

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      saveBtn.click();
    }
  });

  await refreshItems(itemsList);
}

export async function refreshItems(itemsList) {
  const items = await getAllItems();
  renderItems(items, itemsList);
}

function renderItems(items, itemsList) {
  itemsList.innerHTML = "";
  if (items.length === 0) {
    itemsList.innerHTML = `<li class="empty-state">No notes yet. Start typing above.</li>`;
    return;
  }
  items.forEach(item => {
    const li = document.createElement("li");
    li.className  = "item-card";
    li.innerHTML = `
      <span class="item-value">${escapeHTML(item.value)}</span>
      <span class="item-time">${formatTime(item.createdAt)}</span>
      <button class="btn-delete" title="Delete note">✕</button>
    `;
    li.querySelector(".btn-delete").addEventListener("click", async () => {
      const confirmed = await confirmModal(
        "¿Eliminar nota?",
        "¿Estás seguro de que quieres borrar esta nota permanentemente?"
      );
      if (confirmed) {
        await deleteItem(item.id);
        await markUnsyncedChanges();
        await refreshItems(itemsList);
      }
    });
    itemsList.appendChild(li);
  });
}

function formatTime(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function escapeHTML(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
