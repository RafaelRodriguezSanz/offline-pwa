/**
 * db-base.js — Core IndexedDB opener
 */

export const DB_NAME    = "appDB";
export const DB_VERSION = 6;

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    const timeout = setTimeout(() => {
      reject(new Error("IndexedDB opening timed out after 3s"));
    }, 3000);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("items")) {
        const store = db.createObjectStore("items", { keyPath: "id", autoIncrement: true });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }

      if (!db.objectStoreNames.contains("metadata")) {
        db.createObjectStore("metadata", { keyPath: "key" });
      }

      if (!db.objectStoreNames.contains("water")) {
        const waterStore = db.createObjectStore("water", { keyPath: "id", autoIncrement: true });
        waterStore.createIndex("date", "date", { unique: false });
      }

      if (!db.objectStoreNames.contains("books")) {
        db.createObjectStore("books", { keyPath: "id", autoIncrement: true });
      }

      if (!db.objectStoreNames.contains("reading_log")) {
        const logStore = db.createObjectStore("reading_log", { keyPath: "id", autoIncrement: true });
        logStore.createIndex("bookId", "bookId", { unique: false });
        logStore.createIndex("date", "date", { unique: false });
      }

      if (!db.objectStoreNames.contains("exercises")) {
        db.createObjectStore("exercises", { keyPath: "id", autoIncrement: true });
      }

      if (!db.objectStoreNames.contains("tasks")) {
        const tasksStore = db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
        tasksStore.createIndex("col", "col", { unique: false });
        tasksStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      if (!db.objectStoreNames.contains("learning_progress")) {
        db.createObjectStore("learning_progress", { keyPath: "id" });
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
