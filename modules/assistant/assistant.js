/**
 * modules/assistant/assistant.js
 * Local assistant that provides tips from a JSONL file.
 */
import { getMeta } from "../../db.js";

const TIPS_FILE = "./static/tips.jsonl";
let cachedTips = [];

export async function runAssistant() {
  try {
    // 0. Time Check
    const start = await getMeta("ai_notif_start") || "09:00";
    const end   = await getMeta("ai_notif_end")   || "21:00";
    
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const startTime   = parseInt(start.replace(":", ""));
    const endTime     = parseInt(end.replace(":", ""));

    if (currentTime < startTime || currentTime > endTime) {
      console.log("[Assistant] Outside allowed hours. Sleeping.");
      return;
    }

    // 1. Load Tips if not cached
    if (cachedTips.length === 0) {
      const response = await fetch(TIPS_FILE);
      const text = await response.text();
      cachedTips = text.split("\n")
        .filter(line => line.trim() !== "")
        .map(line => JSON.parse(line));
    }

    if (cachedTips.length === 0) return;

    // 2. Pick a random tip
    const randomTip = cachedTips[Math.floor(Math.random() * cachedTips.length)];

    // 3. Show Notification
    showNotification(randomTip.title, randomTip.body);

  } catch (err) {
    console.error("[Assistant] Error:", err);
  }
}

function showNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, {
      body: body,
      icon: "./icons/icon-192.png"
    });
  }
}
