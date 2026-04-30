/**
 * modules/books/books.js
 */

import { addBook, getAllBooks, updateBookProgress, deleteBook } from "./db.js";
import { markUnsyncedChanges } from "../../db.js";
import { confirmModal } from "../ui.js";

export async function initBooks(container, preloadedHtml) {
  if (preloadedHtml) {
    container.innerHTML = preloadedHtml;
  } else {
    const response = await fetch("./modules/books/books.html");
    container.innerHTML = await response.text();
  }

  const booksListEl = container.querySelector("#books-list");
  const btnAddBook = container.querySelector("#btn-add-book-submit");
  const bookForm = container.querySelector("#book-form");

  const render = async () => {
    const books = await getAllBooks();
    booksListEl.innerHTML = "";
    if (books.length === 0) {
      booksListEl.innerHTML = '<li class="empty-state">No hay libros cargados. ¡Añade tu primera lectura!</li>';
      return;
    }
    books.forEach(book => {
      const li = document.createElement("li");
      li.className = "book-card";
      const progress = Math.round((book.currentPage / book.totalPages) * 100);
      li.innerHTML = `
        <div class="book-cover-container">
          <img src="${book.coverUrl || 'https://via.placeholder.com/120x180?text=No+Cover'}" alt="${book.title}" class="book-cover">
        </div>
        <div class="book-info">
          <h3 class="book-title-text">${book.title}</h3>
          <p class="book-author-text">por ${book.author}</p>
          <div class="progress-container">
            <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${progress}%"></div></div>
            <span class="progress-text">${book.currentPage} / ${book.totalPages} págs (${progress}%)</span>
          </div>
          <div class="book-actions">
            <input type="number" class="progress-input" value="${book.currentPage}" min="0" max="${book.totalPages}" id="input-progress-${book.id}">
            <button class="btn-update-progress" data-id="${book.id}">Actualizar</button>
            <button class="btn-delete-book" data-id="${book.id}">🗑️</button>
          </div>
        </div>
      `;
      li.querySelector(".btn-update-progress").addEventListener("click", async () => {
        const input = li.querySelector(".progress-input");
        await updateBookProgress(book.id, input.value);
        await markUnsyncedChanges();
        await render();
      });
      li.querySelector(".btn-delete-book").addEventListener("click", async () => {
        const confirmed = await confirmModal(
          "¿Eliminar libro?",
          `¿Estás seguro de que quieres eliminar "${book.title}"? Esta acción no se puede deshacer.`
        );
        if (confirmed) {
          await deleteBook(book.id);
          await markUnsyncedChanges();
          await render();
        }
      });
      booksListEl.appendChild(li);
    });
  };

  btnAddBook.addEventListener("click", async () => {
    const title = container.querySelector("#book-title").value;
    const author = container.querySelector("#book-author").value;
    const coverUrl = container.querySelector("#book-cover").value;
    const totalPages = container.querySelector("#book-pages").value;
    if (!title || !author || !totalPages) return alert("Please fill Title, Author and Pages");

    await addBook({ title, author, coverUrl, totalPages, currentPage: 0 });
    await markUnsyncedChanges();
    bookForm.reset();
    await render();
  });

  await render();
}
