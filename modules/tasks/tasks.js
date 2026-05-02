/**
 * modules/tasks/tasks.js
 *
 * Kanban board with:
 *  - IndexedDB persistence (store: "tasks")
 *  - Google Drive sync via the existing sync.js flow
 *  - Native HTML5 drag-and-drop
 *  - Add / Edit / Delete tasks
 */

import { openDB, markUnsyncedChanges } from "../../db.js";

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

const STORE = "tasks";

async function getDB() {
  return openDB(); // reuse the shared db.js opener
}

async function getAllTasks() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function saveTask(task) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).put(task);
    req.onsuccess = () => resolve(req.result); // returns id
    req.onerror   = () => reject(req.error);
  });
}

async function deleteTask(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ─── Module state ─────────────────────────────────────────────────────────────

let tasks        = [];   // in-memory cache
let editingId    = null; // null = new task
let dragSrcId    = null; // id of the card being dragged
let placeholder  = null; // drop placeholder element
let container    = null; // root DOM element

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initTasks(rootContainer, preloadedHtml) {
  container = rootContainer;
  container.innerHTML = preloadedHtml || "<div class='loader'>Cargando Tasks…</div>";

  tasks = await getAllTasks();

  renderBoard();
  bindUI();
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderBoard() {
  const cols = { todo: [], doing: [], done: [] };
  for (const t of tasks) {
    if (cols[t.col]) cols[t.col].push(t);
  }

  for (const col of ["todo", "doing", "done"]) {
    const el = container.querySelector(`#col-${col}`);
    if (!el) continue;
    el.innerHTML = "";

    // Sort by createdAt desc within each column
    const sorted = cols[col].sort((a, b) => b.createdAt - a.createdAt);
    for (const task of sorted) {
      el.appendChild(buildCard(task));
    }

    // Update count badge
    const badge = container.querySelector(`#count-${col}`);
    if (badge) badge.textContent = sorted.length;
  }

  setupDropZones();
}

function buildCard(task) {
  const card = document.createElement("div");
  card.className = `task-card priority-${task.priority ?? "medium"}`;
  card.dataset.id = task.id;
  card.draggable  = true;

  const date = new Date(task.createdAt).toLocaleDateString("es-ES", {
    day: "numeric", month: "short"
  });

  card.innerHTML = `
    <div class="card-title">${escHtml(task.title)}</div>
    ${task.desc ? `<div class="card-desc">${escHtml(task.desc)}</div>` : ""}
    <div class="card-footer">
      <span class="card-date">${date}</span>
      <div class="card-actions">
        <button class="btn-card-edit" data-id="${task.id}" title="Editar">✏️</button>
        <button class="btn-card-del"  data-id="${task.id}" title="Eliminar">🗑</button>
      </div>
    </div>
  `;

  // Drag events
  card.addEventListener("dragstart", onDragStart);
  card.addEventListener("dragend",   onDragEnd);

  // Edit / delete buttons
  card.querySelector(".btn-card-edit").addEventListener("click", (e) => {
    e.stopPropagation();
    openModal(task.id);
  });
  card.querySelector(".btn-card-del").addEventListener("click", (e) => {
    e.stopPropagation();
    confirmDelete(task.id);
  });

  // Click card body → open modal
  card.addEventListener("click", () => openModal(task.id));

  return card;
}

// ─── Drag & Drop ──────────────────────────────────────────────────────────────

function onDragStart(e) {
  dragSrcId = parseInt(e.currentTarget.dataset.id);
  e.currentTarget.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", dragSrcId);
}

function onDragEnd(e) {
  e.currentTarget.classList.remove("dragging");
  removePlaceholder();
  container.querySelectorAll(".kanban-col").forEach(c => c.classList.remove("drag-over"));
  dragSrcId = null;
}

function setupDropZones() {
  container.querySelectorAll(".col-cards").forEach(zone => {
    zone.addEventListener("dragover",  onDragOver);
    zone.addEventListener("dragleave", onDragLeave);
    zone.addEventListener("drop",      onDrop);
  });
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";

  const zone = e.currentTarget;
  zone.closest(".kanban-col").classList.add("drag-over");

  // Move placeholder to correct position
  removePlaceholder();
  placeholder = document.createElement("div");
  placeholder.className = "drop-placeholder";

  const afterEl = getDragAfterElement(zone, e.clientY);
  if (afterEl) {
    zone.insertBefore(placeholder, afterEl);
  } else {
    zone.appendChild(placeholder);
  }
}

function onDragLeave(e) {
  // Only clear if leaving the zone entirely (not entering a child)
  if (!e.currentTarget.contains(e.relatedTarget)) {
    e.currentTarget.closest(".kanban-col").classList.remove("drag-over");
  }
}

async function onDrop(e) {
  e.preventDefault();
  removePlaceholder();

  const zone    = e.currentTarget;
  const newCol  = zone.dataset.col;
  const col     = zone.closest(".kanban-col");
  col.classList.remove("drag-over");

  if (!dragSrcId || !newCol) return;

  const task = tasks.find(t => t.id === dragSrcId);
  if (!task || task.col === newCol) return;

  task.col = newCol;
  await saveTask(task);
  await markUnsyncedChanges();
  renderBoard();
}

function getDragAfterElement(container, y) {
  const cards = [...container.querySelectorAll(".task-card:not(.dragging)")];
  return cards.reduce((closest, child) => {
    const box    = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function removePlaceholder() {
  if (placeholder) { placeholder.remove(); placeholder = null; }
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function openModal(id = null, defaultCol = "todo") {
  editingId = id;

  const overlay  = container.querySelector("#task-modal-overlay");
  const titleEl  = container.querySelector("#modal-task-title");
  const inputTitle = container.querySelector("#task-input-title");
  const inputDesc  = container.querySelector("#task-input-desc");
  const inputCol   = container.querySelector("#task-input-col");
  const btnDelete  = container.querySelector("#btn-modal-delete");

  if (id !== null) {
    // Edit mode
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    titleEl.textContent   = "Editar tarea";
    inputTitle.value      = task.title;
    inputDesc.value       = task.desc ?? "";
    inputCol.value        = task.col;
    setPriority(task.priority ?? "medium");
    btnDelete.hidden      = false;
  } else {
    // New task
    titleEl.textContent   = "Nueva tarea";
    inputTitle.value      = "";
    inputDesc.value       = "";
    inputCol.value        = defaultCol;
    setPriority("medium");
    btnDelete.hidden      = true;
  }

  overlay.hidden = false;
  inputTitle.focus();
}

function closeModal() {
  const overlay = container.querySelector("#task-modal-overlay");
  overlay.hidden = true;
  editingId = null;
}

function setPriority(p) {
  container.querySelectorAll(".priority-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.priority === p);
  });
}

function getSelectedPriority() {
  return container.querySelector(".priority-btn.active")?.dataset.priority ?? "medium";
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

async function saveFromModal() {
  const title = container.querySelector("#task-input-title").value.trim();
  if (!title) {
    container.querySelector("#task-input-title").focus();
    return;
  }

  const col      = container.querySelector("#task-input-col").value;
  const desc     = container.querySelector("#task-input-desc").value.trim();
  const priority = getSelectedPriority();

  if (editingId !== null) {
    // Update existing
    const task = tasks.find(t => t.id === editingId);
    if (task) {
      task.title    = title;
      task.desc     = desc;
      task.col      = col;
      task.priority = priority;
      await saveTask(task);
    }
  } else {
    // Create new
    const newTask = {
      title,
      desc,
      col,
      priority,
      createdAt: Date.now(),
    };
    const newId   = await saveTask(newTask);
    newTask.id    = newId;
    tasks.push(newTask);
  }

  await markUnsyncedChanges();
  closeModal();
  tasks = await getAllTasks(); // re-sync from DB
  renderBoard();
}

async function confirmDelete(id) {
  if (!confirm("¿Eliminar esta tarea?")) return;
  await deleteTask(id);
  await markUnsyncedChanges();
  tasks = tasks.filter(t => t.id !== id);
  closeModal();
  renderBoard();
}

// ─── Bind UI events ───────────────────────────────────────────────────────────

function bindUI() {
  // Header "Nueva tarea" button
  container.querySelector("#btn-add-task")
    ?.addEventListener("click", () => openModal(null, "todo"));

  // Column "Agregar tarea" buttons
  container.querySelectorAll(".btn-col-add").forEach(btn => {
    btn.addEventListener("click", () => openModal(null, btn.dataset.col));
  });

  // Modal close / cancel
  container.querySelector("#modal-close")
    ?.addEventListener("click", closeModal);
  container.querySelector("#btn-modal-cancel")
    ?.addEventListener("click", closeModal);

  // Click outside modal to close
  container.querySelector("#task-modal-overlay")
    ?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeModal();
    });

  // Save
  container.querySelector("#btn-modal-save")
    ?.addEventListener("click", saveFromModal);

  // Delete from modal
  container.querySelector("#btn-modal-delete")
    ?.addEventListener("click", () => {
      if (editingId !== null) confirmDelete(editingId);
    });

  // Priority buttons
  container.querySelectorAll(".priority-btn").forEach(btn => {
    btn.addEventListener("click", () => setPriority(btn.dataset.priority));
  });

  // Enter key in title saves
  container.querySelector("#task-input-title")
    ?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveFromModal();
    });

  // Escape closes modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function escHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
