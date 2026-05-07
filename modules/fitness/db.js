/**
 * modules/fitness/db.js
 */
import { openDB } from "../../db-base.js";

const STORE = "exercises";

export async function getAllLoggedExercises() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function logExercise(logEntry) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).put(logEntry);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
