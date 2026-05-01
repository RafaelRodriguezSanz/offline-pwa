/**
 * sync.js — Google Drive synchronisation logic
 *
 * Uses Google Identity Services (GIS) for OAuth 2.0 and the
 * Google Drive REST API (v3) with the drive.file scope.
 *
 * Strategy: local always overwrites remote. No merge / conflict resolution.
 * The backup file is always named "app-backup.json" in Drive.
 */

import { getAllDataForSync, markSynced } from "./db.js";

// ─── Configuration ────────────────────────────────────────────────────────────
// Replace with your own values from Google Cloud Console.
const GOOGLE_CLIENT_ID = "991288139958-285on6us2hs8sca5kna47n65dtplep6r.apps.googleusercontent.com";
const DRIVE_SCOPE   = "https://www.googleapis.com/auth/drive.file";
const CLOUD_SCOPE   = "https://www.googleapis.com/auth/cloud-platform";
const PROFILE_SCOPE = "https://www.googleapis.com/auth/userinfo.profile";
const SCOPES        = `${DRIVE_SCOPE} ${CLOUD_SCOPE} ${PROFILE_SCOPE}`;
const BACKUP_FILENAME = "app-backup.json";

// ─── Module state ─────────────────────────────────────────────────────────────
let tokenClient = null; // GIS TokenClient instance
let accessToken = null; // Current OAuth access token

// ─── Initialisation ───────────────────────────────────────────────────────────

/**
 * Initialise the Google Identity Services token client.
 * Must be called after the GIS script has loaded.
 */
export function initGoogleAuth() {
  try {
    if (!window.google?.accounts?.oauth2) {
      console.warn("Google Identity Services not loaded.");
      return;
    }

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: () => { }, 
    });
  } catch (err) {
    console.error("Error initializing Google Auth:", err);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Main entry point. Called by app.js on manual sync or auto-sync.
 * Handles auth → fetch items → upload.
 *
 * @param {function} onStatus - Callback(string) for status messages shown in UI.
 * @returns {Promise<boolean>} true = success, false = cancelled / failed.
 */
export async function syncToDrive(onStatus) {
  if (!navigator.onLine) {
    onStatus("Offline — sync skipped.");
    return false;
  }

  try {
    onStatus("Requesting Drive access…");
    await requestToken();

    onStatus("Reading local data…");
    const data = await getAllDataForSync();
    const payload = JSON.stringify({ lastUpdated: Date.now(), data }, null, 2);

    onStatus("Uploading to Google Drive…");
    const fileId = await findOrCreateFile();
    await uploadFile(fileId, payload);

    await markSynced();
    onStatus("Sync complete ✓");
    return true;
  } catch (err) {
    if (err.message === "USER_CANCELLED") {
      onStatus("Sync cancelled.");
    } else {
      console.error("Sync error:", err);
      onStatus(`Sync failed: ${err.message}`);
    }
    return false;
  }
}

// ─── OAuth helpers ────────────────────────────────────────────────────────────

/**
 * Request (or reuse) an OAuth access token.
 * Opens the Google consent popup if needed.
 */
function requestToken() {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      // Intentamos inicializar sobre la marcha si el script de Google ya está cargado
      initGoogleAuth();
    }
    
    if (!tokenClient) {
      return reject(new Error("Google Auth not initialised. Check your Client ID."));
    }

    // If we already have a (likely still valid) token, reuse it
    if (accessToken) {
      return resolve(accessToken);
    }

    // Override the callback to capture the token
    tokenClient.callback = (response) => {
      if (response.error) {
        // User dismissed the popup or an error occurred
        return reject(new Error(
          response.error === "access_denied" ? "USER_CANCELLED" : response.error
        ));
      }
      accessToken = response.access_token;
      resolve(accessToken);
    };

    // Prompt = "none" tries silent sign-in first; falls back to popup
    tokenClient.requestAccessToken({ prompt: "" });
  });
}

/**
 * Return the current access token (useful for other modules like AI).
 */
export async function getAccessToken() {
  if (!accessToken) {
    await requestToken();
  }
  return accessToken;
}

/**
 * Fetch basic user profile (name) from Google.
 */
export async function getUserProfile() {
  const token = await getAccessToken();
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return { name: "Usuario" };
  return res.json();
}

// ─── Drive REST helpers ───────────────────────────────────────────────────────

/**
 * Search Drive for the backup file.
 * @returns {Promise<string|null>} File ID if found, null otherwise.
 */
async function findFile() {
  const query = encodeURIComponent(`name='${BACKUP_FILENAME}' and trashed=false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`;

  const res = await driveRequest(url, { method: "GET" });

  if (!res.ok) throw new Error(`Drive search failed: ${res.status}`);

  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
}

/**
 * Find the existing backup file or create an empty placeholder.
 * @returns {Promise<string>} File ID (guaranteed to exist after this call).
 */
async function findOrCreateFile() {
  let fileId = await findFile();

  if (!fileId) {
    // Create metadata-only entry (content uploaded separately via patch)
    const metadata = { name: BACKUP_FILENAME, mimeType: "application/json" };
    const res = await driveRequest(
      "https://www.googleapis.com/drive/v3/files?fields=id",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      }
    );

    if (!res.ok) throw new Error(`Drive create failed: ${res.status}`);
    const data = await res.json();
    fileId = data.id;
  }

  return fileId;
}

/**
 * Upload (overwrite) the backup file content using a multipart PATCH request.
 * @param {string} fileId
 * @param {string} content - JSON string to write.
 */
async function uploadFile(fileId, content) {
  const boundary = "boundary_localsync_" + Date.now();
  const metadata = JSON.stringify({ name: BACKUP_FILENAME, mimeType: "application/json" });

  // Multipart body: metadata part + media part
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    metadata,
    `--${boundary}`,
    "Content-Type: application/json",
    "",
    content,
    `--${boundary}--`,
  ].join("\r\n");

  const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&fields=id`;

  const res = await driveRequest(url, {
    method: "PATCH",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive upload failed (${res.status}): ${err}`);
  }
}

/**
 * Wrapper around fetch that injects the Authorization header.
 */
function driveRequest(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
