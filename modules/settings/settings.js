/**
 * modules/settings/settings.js
 */
import { getMeta, setMeta } from "../../db.js";
import { confirmModal, alertModal } from "../ui.js";
import { runAssistant } from "../assistant/assistant.js";

export async function initSettings(container, preloadedHtml) {
  container.innerHTML = preloadedHtml || "<h2>Cargando...</h2>";

  const startInput = container.querySelector("#notif-start");
  const endInput   = container.querySelector("#notif-end");
  const saveBtn    = container.querySelector("#btn-save-settings");
  const testBtn    = container.querySelector("#btn-test-ai");
  const clearBtn   = container.querySelector("#btn-clear-data");

  // Load current values
  const start = await getMeta("ai_notif_start") || "09:00";
  const end   = await getMeta("ai_notif_end")   || "21:00";
  
  startInput.value = start;
  endInput.value   = end;

  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = "Guardando...";
    
    await setMeta("ai_notif_start", startInput.value);
    await setMeta("ai_notif_end", endInput.value);
    
    setTimeout(async () => {
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar Cambios";
      await alertModal("Configuración", "Los cambios han sido guardados correctamente ✓");
    }, 500);
  });

  testBtn.addEventListener("click", async () => {
    testBtn.disabled = true;
    testBtn.textContent = "Enviando...";
    await runAssistant();
    setTimeout(() => {
      testBtn.disabled = false;
      testBtn.textContent = "Probar Notificación 🔔";
    }, 1000);
  });

  clearBtn.addEventListener("click", async () => {
    const confirmed = await confirmModal(
      "¿Borrar todo?",
      "Esto eliminará todas tus notas y datos locales. No se borrará lo que ya esté sincronizado en Drive."
    );
    if (confirmed) {
      // Logic to clear indexedDB could be added in db.js
      // For now, let's just alert
      alert("Esta función requiere implementar clearDB().");
    }
  });
}
