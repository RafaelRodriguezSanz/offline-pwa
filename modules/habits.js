/**
 * water.js — Water tracking logic and UI
 */

import { addWaterIntake, getWaterIntakeForToday } from "../db.js";

const waterCountEl = document.getElementById("water-count");
const waterProgressEl = document.getElementById("water-progress-fill");
const btnAddWater = document.getElementById("btn-add-water");
const waterGoal = 12;

export async function initWaterTracker() {
  await updateWaterUI();

  btnAddWater.addEventListener("click", async () => {
    await addWaterIntake();
    await updateWaterUI();
    
    // Add a little splash animation if we want to be premium
    btnAddWater.classList.add("splash");
    setTimeout(() => btnAddWater.classList.remove("splash"), 500);
  });

  // Start notification timer
  setupWaterNotifications();
}

async function updateWaterUI() {
  const count = await getWaterIntakeForToday();
  waterCountEl.textContent = `${count} / ${waterGoal}`;
  
  const percentage = Math.min((count / waterGoal) * 100, 100);
  waterProgressEl.style.width = `${percentage}%`;
  
  if (count >= waterGoal) {
    waterCountEl.classList.add("goal-reached");
  } else {
    waterCountEl.classList.remove("goal-reached");
  }
}

function setupWaterNotifications() {
  // Check every minute if we should send a notification
  setInterval(checkAndNotify, 60000);
  checkAndNotify(); // Initial check
}

async function checkAndNotify() {
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();

  // Between 9:00 and 21:00 (9 AM to 9 PM)
  if (hour >= 9 && hour <= 21) {
    // We only want to notify once per hour, ideally around the top of the hour
    // Or if the user hasn't been notified for this hour yet.
    const lastNotifHour = localStorage.getItem("lastWaterNotifHour");
    
    if (lastNotifHour != hour) {
      // It's a new hour!
      await sendWaterNotification(hour);
      localStorage.setItem("lastWaterNotifHour", hour);
    }
  }
}

async function sendWaterNotification(hour) {
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    const reg = await navigator.serviceWorker.ready;
    const count = await getWaterIntakeForToday();
    
    let body = `¡Es hora de un vaso de agua! Llevas ${count} de ${waterGoal}.`;
    if (count >= waterGoal) {
      body = `¡Meta cumplida! Has tomado ${count} vasos de agua hoy. ¡Sigue así!`;
    }

    reg.showNotification("Hidratación", {
      body: body,
      icon: "./icons/icon-192.png",
      tag: "water-reminder",
      renotify: true
    });
  }
}
