/**
 * modules/notes/db.js
 */
import { openDB } from "../../db.js";

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

export async function getAllItems() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx    = db.transaction("items", "readonly");
    const store = tx.objectStore("items");
    const index = store.index("createdAt");
    const req   = index.openCursor(null, "prev"); // newest first

    const results = [];
    req.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

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

export async function updateItem(id, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");
    
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const item = getReq.result;
      item.value = value;
      store.put(item);
    };

    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}
