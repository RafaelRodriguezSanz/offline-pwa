/**
 * modules/ui.js — Shared UI Components
 */

export function confirmModal(title, message) {
  const container = document.getElementById("modal-container");
  const titleEl = document.getElementById("modal-title");
  const msgEl = document.getElementById("modal-message");
  const btnConfirm = document.getElementById("modal-btn-confirm");
  const btnCancel = document.getElementById("modal-btn-cancel");

  if (!container || !titleEl || !msgEl || !btnConfirm || !btnCancel) {
    console.error("Modal elements not found in DOM");
    return Promise.resolve(confirm(message)); // Fallback
  }

  titleEl.textContent = title;
  msgEl.textContent = message;
  container.hidden = false;

  return new Promise((resolve) => {
    const handleConfirm = () => {
      container.hidden = true;
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      container.hidden = true;
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      btnConfirm.removeEventListener("click", handleConfirm);
      btnCancel.removeEventListener("click", handleCancel);
    };

    btnConfirm.addEventListener("click", handleConfirm);
    btnCancel.addEventListener("click", handleCancel);
  });
}
