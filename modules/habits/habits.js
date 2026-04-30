/**
 * modules/habits/habits.js
 */

import { addWaterIntake, getWaterIntakeForToday, removeLastWaterIntake } from "./db.js";
import { markUnsyncedChanges } from "../../db.js";

export async function initHabits(container, preloadedHtml) {
  if (preloadedHtml) {
    container.innerHTML = preloadedHtml;
  } else {
    const response = await fetch("./modules/habits/habits.html");
    container.innerHTML = await response.text();
  }

  const waterCountEl = container.querySelector("#water-count");
  const waterFillEl = container.querySelector("#water-fill");
  const btnAddWater = container.querySelector("#btn-add-water");
  const btnRemoveWater = container.querySelector("#btn-remove-water");
  const waterGoal = 12;

  const updateUI = async () => {
    const count = await getWaterIntakeForToday();
    waterCountEl.textContent = `${count} / ${waterGoal}`;
    const percentage = Math.min((count / waterGoal) * 100, 100);
    waterFillEl.style.height = `${percentage}%`;
    waterCountEl.classList.toggle("goal-reached", count >= waterGoal);
  };

  btnAddWater.addEventListener("click", async () => {
    await addWaterIntake();
    await markUnsyncedChanges();
    await updateUI();
    btnAddWater.classList.add("splash");
    setTimeout(() => btnAddWater.classList.remove("splash"), 500);
  });

  btnRemoveWater.addEventListener("click", async () => {
    const removed = await removeLastWaterIntake();
    if (removed) {
      await markUnsyncedChanges();
      await updateUI();
    }
  });

  await updateUI();
}
