/**
 * modules/books/db.js
 */
import { openDB } from "../../db.js";

export async function addBook(book) {
  const db = await openDB();
  const entry = {
    ...book,
    createdAt: Date.now(),
    currentPage: parseInt(book.currentPage) || 0,
    totalPages: parseInt(book.totalPages) || 0
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction("books", "readwrite");
    const store = tx.objectStore("books");
    const req = store.add(entry);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllBooks() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("books", "readonly");
    const store = tx.objectStore("books");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function updateBookProgress(bookId, newPage) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["books", "reading_log"], "readwrite");
    const bookStore = tx.objectStore("books");
    const logStore = tx.objectStore("reading_log");

    const getReq = bookStore.get(bookId);
    getReq.onsuccess = () => {
      const book = getReq.result;
      if (!book) return reject("Book not found");

      const oldPage = book.currentPage;
      book.currentPage = parseInt(newPage);
      bookStore.put(book);

      // Log the daily progress
      const today = new Date().toISOString().split("T")[0];
      const logEntry = {
        bookId,
        date: today,
        pagesRead: book.currentPage - oldPage,
        timestamp: Date.now()
      };
      logStore.add(logEntry);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteBook(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("books", "readwrite");
    const store = tx.objectStore("books");
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
