/**
 * db.js — Base DB Engine & Metadata
 */

const DB_NAME    = "appDB";
const DB_VERSION = 5;

/** Open (or upgrade) the database. Returns a Promise<IDBDatabase>. */
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Timeout safety for DB open
    const timeout = setTimeout(() => {
      reject(new Error("IndexedDB opening timed out after 3s"));
    }, 3000);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Notes store
      if (!db.objectStoreNames.contains("items")) {
        const store = db.createObjectStore("items", { keyPath: "id", autoIncrement: true });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }

      // Metadata store (Global sync state)
      if (!db.objectStoreNames.contains("metadata")) {
        db.createObjectStore("metadata", { keyPath: "key" });
      }

      // Water store
      if (!db.objectStoreNames.contains("water")) {
        const waterStore = db.createObjectStore("water", { keyPath: "id", autoIncrement: true });
        waterStore.createIndex("date", "date", { unique: false });
      }

      // Books store
      if (!db.objectStoreNames.contains("books")) {
        db.createObjectStore("books", { keyPath: "id", autoIncrement: true });
      }

      // Reading Log store
      if (!db.objectStoreNames.contains("reading_log")) {
        const logStore = db.createObjectStore("reading_log", { keyPath: "id", autoIncrement: true });
        logStore.createIndex("bookId", "bookId", { unique: false });
        logStore.createIndex("date", "date", { unique: false });
      }

      // Exercises store
      if (!db.objectStoreNames.contains("exercises")) {
        db.createObjectStore("exercises", { keyPath: "id", autoIncrement: true });
      }

      // Tasks store (Kanban)
      if (!db.objectStoreNames.contains("tasks")) {
        const tasksStore = db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
        tasksStore.createIndex("col", "col", { unique: false });
        tasksStore.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => {
      clearTimeout(timeout);
      resolve(request.result);
    };
    request.onerror   = () => {
      clearTimeout(timeout);
      reject(request.error);
    };
  });
}

// ─── Metadata & Sync State (Global) ───────────────────────────────────────────

export async function getMeta(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction("metadata", "readonly");
    const store = tx.objectStore("metadata");
    const req   = store.get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : undefined);
    req.onerror   = () => reject(req.error);
  });
}

export async function setMeta(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction("metadata", "readwrite");
    const store = tx.objectStore("metadata");
    const req   = store.put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

export async function getSyncState() {
  const [lastSyncAt, hasUnsyncedChanges] = await Promise.all([
    getMeta("lastSyncAt"),
    getMeta("hasUnsyncedChanges"),
  ]);
  return { lastSyncAt, hasUnsyncedChanges: !!hasUnsyncedChanges };
}

export async function markSynced() {
  await Promise.all([
    setMeta("lastSyncAt", Date.now()),
    setMeta("hasUnsyncedChanges", false),
  ]);
}

export async function markUnsyncedChanges() {
  await setMeta("hasUnsyncedChanges", true);
}

/**
 * Used by sync.js to get everything.
 */
export async function getAllDataForSync() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["items", "water", "books", "reading_log", "exercises", "tasks"], "readonly");
    const notesStore = tx.objectStore("items");
    const waterStore = tx.objectStore("water");
    const booksStore = tx.objectStore("books");
    const logsStore  = tx.objectStore("reading_log");
    const exerStore  = tx.objectStore("exercises");
    const tasksStore = tx.objectStore("tasks");

    const data = {};
    const reqs = [
      notesStore.getAll(),
      waterStore.getAll(),
      booksStore.getAll(),
      logsStore.getAll(),
      exerStore.getAll(),
      tasksStore.getAll(),
    ];

    Promise.all(reqs.map(r => new Promise((res, rej) => {
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }))).then(([items, water, books, reading_log, exercises, tasks]) => {
      resolve({ items, water, books, reading_log, exercises, tasks });
    }).catch(reject);
  });
}

/**
 * Used by sync.js to restore from backup.
 * DANGER: Overwrites local data.
 */
export async function importAllData(data) {
  const db = await openDB();
  const stores = ["items", "water", "books", "reading_log", "exercises", "tasks"];
  const tx = db.transaction(stores, "readwrite");

  for (const storeName of stores) {
    const store = tx.objectStore(storeName);
    store.clear();
    const records = data[storeName] || [];
    for (const record of records) {
      store.put(record);
    }
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

