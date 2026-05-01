import { getAllDataForSync, getMeta } from "../../db.js";
import { getAccessToken, getUserProfile } from "../../sync.js";

const GEMINI_MODEL = "gemini-1.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function runAIAnalysis() {
  try {
    // 0. Requirements Check
    const apiKey = await getMeta("gemini_api_key");
    if (!apiKey) {
      console.log("[AI] No API Key found in settings. Skipping.");
      return;
    }

    const start = await getMeta("ai_notif_start") || "09:00";
    const end   = await getMeta("ai_notif_end")   || "21:00";
    
    // Time Check (current implementation)
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const startTime   = parseInt(start.replace(":", ""));
    const endTime     = parseInt(end.replace(":", ""));

    if (currentTime < startTime || currentTime > endTime) return;

    console.log("[AI] Starting analysis...");
    
    // 1. Get Data & User Profile (profile might fail if not logged in, it's ok)
    const data = await getAllDataForSync();
    let userName = "Usuario";
    try {
      const profile = await getUserProfile();
      userName = profile.given_name || profile.name || "Usuario";
    } catch (e) { /* ignore profile if not logged in */ }
    
    // 2. Prepare Prompt
    const prompt = `Hola Gemini. Actúa como un asistente de salud y productividad para ${userName}. 
    Analiza estos datos de mi PWA: ${JSON.stringify(data)}. 
    Dame un consejo de INCENTIVO o motivación personalizado. Máximo 20 palabras.`;

    // 3. Call Gemini using API KEY
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) throw new Error(`Gemini error: ${response.status}`);

    const result = await response.json();
    const aiText = result.candidates[0].content.parts[0].text;

    // 5. Show Notification with Emoji
    showAINotification(aiText);

  } catch (err) {
    console.error("[AI] Error:", err);
  }
}

function showAINotification(text) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification("🤖 Gemini Assistant", {
      body: text,
      icon: "./icons/icon-192.png"
    });
  }
}
