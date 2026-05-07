/**
 * modules/tasks/tasks.js
 *
 * Kanban board with:
 *  - IndexedDB persistence (store: "tasks")
 *  - Google Drive sync via the existing sync.js flow
 *  - Native HTML5 drag-and-drop
 *  - Add / Edit / Delete tasks
 */

import { markUnsyncedChanges } from "../../db.js";
import { confirmModal } from "../ui.js";
import { getAllTasks, saveTask, deleteTask } from "./db.js";

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
  setupDropZones();
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
        <button class="btn-card-edit" data-id="${task.id}" title="Editar" draggable="false">✏️</button>
        <button class="btn-card-del"  data-id="${task.id}" title="Eliminar" draggable="false">🗑</button>
      </div>
    </div>
  `;

  // Edit / delete buttons (stop propagation so card click doesn't fire)
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
  const card = e.target.closest(".task-card");
  if (!card) return;
  dragSrcId = card.dataset.id;
  // Use a slight delay so the "dragging" class is captured in the ghost image
  setTimeout(() => card.classList.add("dragging"), 0);
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", dragSrcId);
}

function onDragEnd(e) {
  const card = e.target.closest(".task-card");
  if (card) card.classList.remove("dragging");
  removePlaceholder();
  container.querySelectorAll(".kanban-col").forEach(c => c.classList.remove("drag-over"));
  dragSrcId = null;
}

/** Attach drag & drop listeners once on the board — survives re-renders */
function setupDropZones() {
  const board = container.querySelector("#kanban-board");
  if (!board || board._dndReady) return;
  board._dndReady = true;

  board.addEventListener("dragstart", onDragStart);
  board.addEventListener("dragend",   onDragEnd);

  board.addEventListener("dragenter", (e) => {
    const col = e.target.closest(".kanban-col");
    if (col) e.preventDefault();
  });

  board.addEventListener("dragover", (e) => {
    const col = e.target.closest(".kanban-col");
    if (!col) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // Highlight current column
    container.querySelectorAll(".kanban-col").forEach(c => c.classList.remove("drag-over"));
    col.classList.add("drag-over");

    // Placeholder inside the col-cards area
    const zone = col.querySelector(".col-cards");
    if (!zone) return;

    const afterEl = getDragAfterElement(zone, e.clientY);
    
    // Only move/create placeholder if needed to avoid flickering
    if (!placeholder) {
      placeholder = document.createElement("div");
      placeholder.className = "drop-placeholder";
    }

    if (afterEl) {
      if (placeholder.nextSibling !== afterEl) {
        zone.insertBefore(placeholder, afterEl);
      }
    } else {
      if (placeholder.parentElement !== zone || placeholder.nextSibling !== null) {
        zone.appendChild(placeholder);
      }
    }
  });

  board.addEventListener("dragleave", (e) => {
    if (!board.contains(e.relatedTarget)) {
      container.querySelectorAll(".kanban-col").forEach(c => c.classList.remove("drag-over"));
      removePlaceholder();
    }
  });

  board.addEventListener("drop", async (e) => {
    const col = e.target.closest(".kanban-col");
    if (!col) return;
    e.preventDefault();
    
    const newCol = col.dataset.col;
    const droppedId = e.dataTransfer.getData("text/plain") || dragSrcId;
    
    removePlaceholder();
    container.querySelectorAll(".kanban-col").forEach(c => c.classList.remove("drag-over"));

    if (!droppedId || !newCol) return;

    // Use string comparison for IDs to be safe
    const task = tasks.find(t => String(t.id) === String(droppedId));
    if (!task || task.col === newCol) return;

    task.col = newCol;
    await saveTask(task);
    await markUnsyncedChanges();
    renderBoard();
  });
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
  const confirmed = await confirmModal("Eliminar tarea", "¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.");
  if (!confirmed) return;
  
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
