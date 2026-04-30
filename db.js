/**
 * db.js — IndexedDB abstraction layer
 *
 * Manages two object stores:
 *  - "items"    : user notes { id, value, createdAt }
 *  - "metadata" : sync state { key, value }
 */

const DB_NAME    = "appDB";
const DB_VERSION = 2;

/** Open (or upgrade) the database. Returns a Promise<IDBDatabase>. */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Called only when the DB is created or upgraded
    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Items store — keyed by auto-incremented id
      if (!db.objectStoreNames.contains("items")) {
        const store = db.createObjectStore("items", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }

      // Metadata store — simple key/value pairs
      if (!db.objectStoreNames.contains("metadata")) {
        db.createObjectStore("metadata", { keyPath: "key" });
      }

      // Water store — tracking daily intake
      if (!db.objectStoreNames.contains("water")) {
        const waterStore = db.createObjectStore("water", {
          keyPath: "id",
          autoIncrement: true,
        });
        waterStore.createIndex("date", "date", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror  = () => reject(request.error);
  });
}

// ─── Items ────────────────────────────────────────────────────────────────────

/**
 * Add a new item.
 * @param {string} value - Text content entered by the user.
 * @returns {Promise<number>} Newly assigned id.
 */
export async function addItem(value) {
  const db   = await openDB();
  const item = { value, createdAt: Date.now() };

  return new Promise((resolve, reject) => {
    const tx    = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");
    const req   = store.add(item);

    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Retrieve all items, sorted newest-first.
 * @returns {Promise<Array>}
 */
export async function getAllItems() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx    = db.transaction("items", "readonly");
    const store = tx.objectStore("items");
    const req   = store.getAll();

    req.onsuccess = () => {
      const items = req.result.sort((a, b) => b.createdAt - a.createdAt);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a single item by id.
 * @param {number} id
 */
export async function deleteItem(id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx    = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");
    const req   = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

/**
 * Read a metadata value by key.
 * @param {string} key
 * @returns {Promise<any>} The stored value, or undefined if not set.
 */
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

/**
 * Write a metadata value.
 * @param {string} key
 * @param {any}    value
 */
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

/**
 * Convenience: mark that unsynced changes exist.
 */
export async function markUnsyncedChanges() {
  await setMeta("hasUnsyncedChanges", true);
}

/**
 * Convenience: read the full sync state.
 * @returns {Promise<{ lastSyncAt: number|undefined, hasUnsyncedChanges: boolean }>}
 */
export async function getSyncState() {
  const [lastSyncAt, hasUnsyncedChanges] = await Promise.all([
    getMeta("lastSyncAt"),
    getMeta("hasUnsyncedChanges"),
  ]);
  return { lastSyncAt, hasUnsyncedChanges: !!hasUnsyncedChanges };
}

/**
 * mark a successful sync.
 */
export async function markSynced() {
  await Promise.all([
    setMeta("lastSyncAt", Date.now()),
    setMeta("hasUnsyncedChanges", false),
  ]);
}

// ─── Water ────────────────────────────────────────────────────────────────────

/**
 * Add a water glass entry.
 * @returns {Promise<number>}
 */
export async function addWaterIntake() {
  const db = await openDB();
  const entry = {
    timestamp: Date.now(),
    date: new Date().toISOString().split("T")[0],
  };

  return new Promise((resolve, reject) => {
    const tx    = db.transaction("water", "readwrite");
    const store = tx.objectStore("water");
    const req   = store.add(entry);

    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Get the number of glasses for today.
 * @returns {Promise<number>}
 */
export async function getWaterIntakeForToday() {
  const db = await openDB();
  const today = new Date().toISOString().split("T")[0];

  return new Promise((resolve, reject) => {
    const tx    = db.transaction("water", "readonly");
    const store = tx.objectStore("water");
    const index = store.index("date");
    const req   = index.count(IDBKeyRange.only(today));

    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Reset water intake for testing or manual reset (optional).
 */
export async function clearWaterIntakeToday() {
  const db = await openDB();
  const today = new Date().toISOString().split("T")[0];

  return new Promise((resolve, reject) => {
    const tx    = db.transaction("water", "readwrite");
    const store = tx.objectStore("water");
    const index = store.index("date");
    const req   = index.openKeyCursor(IDBKeyRange.only(today));

    req.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
}
