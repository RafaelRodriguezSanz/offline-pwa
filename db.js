/**
 * db.js — Main Database Facade
 * Orchestrates module-specific DB logic and global sync operations.
 */

import { openDB as openBaseDB } from "./db-base.js";

// Re-export openDB for utility
export const openDB = openBaseDB;

// Module-specific imports
import * as notesDB from "./modules/notes/db.js";
import * as habitsDB from "./modules/habits/db.js";
import * as booksDB from "./modules/books/db.js";
import * as fitnessDB from "./modules/fitness/db.js";
import * as tasksDB from "./modules/tasks/db.js";
import * as settingsDB from "./modules/settings/db.js";

export { notesDB, habitsDB, booksDB, fitnessDB, tasksDB, settingsDB };

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
  const STORES = ["items", "water", "books", "reading_log", "exercises", "tasks"];
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES, "readonly");
    const results = {};
    const promises = STORES.map(storeName => {
      return new Promise((res, rej) => {
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => { results[storeName === "items" ? "items" : storeName] = req.result; res(); };
        req.onerror = () => rej(req.error);
      });
    });

    Promise.all(promises)
      .then(() => resolve(results))
      .catch(reject);
  });
}

/**
 * Used by sync.js to restore from backup.
 */
export async function importAllData(data) {
  const db = await openDB();
  const STORES = ["items", "water", "books", "reading_log", "exercises", "tasks"];
  const tx = db.transaction(STORES, "readwrite");

  for (const storeName of STORES) {
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
