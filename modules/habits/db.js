/**
 * modules/habits/db.js
 */
import { openDB } from "../../db.js";

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

export async function removeLastWaterIntake() {
  const db = await openDB();
  const today = new Date().toISOString().split("T")[0];

  return new Promise((resolve, reject) => {
    const tx    = db.transaction("water", "readwrite");
    const store = tx.objectStore("water");
    const index = store.index("date");
    const req   = index.openCursor(IDBKeyRange.only(today), "prev");

    req.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        resolve(true);
      } else {
        resolve(false);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

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
