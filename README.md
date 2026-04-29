# LocalSync PWA

A minimal offline-first Progressive Web App that stores notes locally in IndexedDB and backs them up to Google Drive once per day. No backend, no framework, no dependencies — just vanilla JS.

---

## File tree

```
localsync/
├── index.html       ← App shell (HTML only)
├── app.js           ← UI + orchestration (ES module)
├── db.js            ← IndexedDB abstraction
├── sync.js          ← Google Drive sync logic
├── sw.js            ← Service Worker (cache-first)
├── styles.css       ← Minimal dark theme
├── manifest.json    ← PWA manifest
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── README.md
```

---

## 1 — Configure Google OAuth

Before running or deploying the app you need a Google OAuth 2.0 Client ID.

### Steps

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or select an existing one).
3. Enable the **Google Drive API**:
   - APIs & Services → Library → search "Google Drive API" → Enable.
4. Create OAuth credentials:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID.
   - Application type: **Web application**.
   - Name: e.g. "LocalSync".
5. Add **Authorised JavaScript origins**:
   - For local dev: `http://localhost:8080`
   - For GitHub Pages: `https://<your-username>.github.io`
6. Click **Create** and copy the **Client ID**.
7. Open `sync.js` and replace the placeholder:

```js
// sync.js, line ~15
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
//                        ↑ paste your real Client ID here
```

> **Note:** The `drive.file` scope only allows the app to access files it creates. It cannot read other files in the user's Drive.

---

## 2 — Run locally

You need HTTPS or localhost for Service Workers and OAuth to work.

### Option A — Python (built-in)

```bash
cd localsync
python3 -m http.server 8080
# → open http://localhost:8080
```

### Option B — Node `http-server`

```bash
npm install -g http-server
http-server . -p 8080 --cors
# → open http://localhost:8080
```

### Option C — VS Code Live Server

Install the "Live Server" extension and click **Go Live**.

---

## 3 — Deploy to GitHub Pages

```bash
# 1. Create a GitHub repo (e.g. "localsync")
# 2. Push all files to the repo root on the main branch

git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<username>/localsync.git
git push -u origin main

# 3. In repo Settings → Pages:
#    Source: Deploy from a branch
#    Branch: main / (root)
#    Click Save

# App is live at:
# https://<username>.github.io/localsync/
```

**Important**: After deploying, add `https://<username>.github.io` to the
**Authorised JavaScript origins** in your Google Cloud Console OAuth client.

---

## 4 — Testing guide

### 4.1 Save data

1. Open the app.
2. Type a note in the text area.
3. Click **Save** (or press Ctrl+Enter).
4. The note appears in the list immediately.
5. A "Saved locally ✓" message appears in the top-right.

### 4.2 Reload and verify persistence

1. Reload the page (F5).
2. Notes are still there — they survive reload because they are stored in IndexedDB.

### 4.3 Test offline mode

1. Open DevTools → Network → select **Offline** from the throttle dropdown.
2. Reload. The app loads from the Service Worker cache.
3. Add a note — it saves to IndexedDB.
4. The red "offline" badge appears next to the meta bar.
5. Restore network — the badge disappears.

### 4.4 Trigger manual sync

1. Click **Sync now →**.
2. A Google sign-in popup appears.
3. Sign in and grant Drive access.
4. The status shows "Uploading to Google Drive…" then "Sync complete ✓".
5. "Last sync: …" updates in the meta bar.

### 4.5 Verify file in Google Drive

1. Go to [drive.google.com](https://drive.google.com).
2. Search for **app-backup.json**.
3. Open it — you'll see:
   ```json
   {
     "lastUpdated": 1718000000000,
     "items": [
       { "id": 1, "value": "Your note", "createdAt": 1718000000000 }
     ]
   }
   ```

### 4.6 Test auto-sync trigger

Auto-sync runs on app load when:
- `hasUnsyncedChanges = true`
- More than 24 hours have passed since `lastSyncAt`

To test this without waiting 24 hours:

1. Open DevTools → Application → IndexedDB → appDB → metadata.
2. Edit `lastSyncAt` to a timestamp from 25+ hours ago (e.g. `Date.now() - 90000000`).
3. Ensure `hasUnsyncedChanges = true`.
4. Reload the app — sync starts automatically.

### 4.7 PWA install

- **Desktop Chrome**: Click the install icon in the address bar.
- **Android Chrome**: Banner appears, or use ⋮ menu → "Add to Home screen".
- **iOS Safari**: Share → "Add to Home Screen".

---

## Architecture decisions

| Decision | Rationale |
|---|---|
| ES modules (`type="module"`) | Clean code splitting, no bundler needed |
| `drive.file` scope | Minimal permissions — only files the app created |
| Local always wins | Simplest strategy; no merge conflicts possible |
| Cache-first SW | Fast loads; assets served from cache immediately |
| GIS Token Client | Modern replacement for deprecated `gapi.auth2` |

---

## Known limitations

- **Token expiry**: GIS tokens expire after 1 hour. A second sync attempt in the same session will silently re-request a token (no popup if the user is still signed in to Google).
- **Multiple devices**: Because local always overwrites remote, using two devices will result in the last device to sync winning. For personal use this is usually fine.
- **Icons**: The included icons are programmatically generated placeholders. Replace `icons/icon-192.png` and `icons/icon-512.png` with your own designs for a production app.
