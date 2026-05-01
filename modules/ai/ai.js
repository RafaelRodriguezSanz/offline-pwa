import { getAllDataForSync, getMeta } from "../../db.js";
import { getAccessToken, getUserProfile } from "../../sync.js";

const GEMINI_MODEL = "gemini-1.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function runAIAnalysis() {
  try {
    const start = await getMeta("ai_notif_start") || "09:00";
    const end   = await getMeta("ai_notif_end")   || "21:00";
    
    // Time Check
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const startTime   = parseInt(start.replace(":", ""));
    const endTime     = parseInt(end.replace(":", ""));

    console.log("[AI] Starting analysis cycle...");
    
    // 1. Get Data & User Info
    const [data, profile, token] = await Promise.all([
      getAllDataForSync(),
      getUserProfile(),
      getAccessToken()
    ]);
    
    if (!token) return;
    const userName = profile.given_name || profile.name || "Usuario";
    
    // 2. Prepare Prompt
    const prompt = `Hola Gemini. Actúa como un asistente de salud y productividad para ${userName}. 
    Analiza estos datos de mi PWA: ${JSON.stringify(data)}. 
    Dame un consejo de INCENTIVO o motivación personalizado. Máximo 20 palabras.`;

    // 3. Call Vertex AI (The OAuth-friendly version of Gemini)
    // URL format: https://{REGION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{REGION}/publishers/google/models/{MODEL_ID}:streamGenerateContent
    const projectId = "991288139958";
    const region = "us-central1"; 
    const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/gemini-1.5-flash:streamGenerateContent`;
    
    console.log("[AI] Calling Vertex AI API...");
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[AI] Vertex AI Error (${response.status}):`, errText);
      return;
    }

    // Vertex AI Stream returns an array of objects
    const result = await response.json();
    // In streamGenerateContent, we get an array of chunks. We take the first one's text for simplicity.
    const aiText = result[0]?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (aiText) {
      console.log("[AI] Insight received:", aiText);
      showAINotification(aiText);
    } else {
      console.warn("[AI] No response content from Gemini.");
    }

  } catch (err) {
    console.error("[AI] Critical error:", err);
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
