# Offline-First PWA (No Backend)

A simple experiment to demonstrate how to build a fully functional app:

- ✅ Without a backend  
- ✅ Fully client-side  
- ✅ Offline-first  
- ✅ With optional cloud sync using Google Drive  

👉 Demo: https://rafaelrodriguezsanz.github.io/offline-pwa/  
👉 Repo: https://github.com/RafaelRodriguezSanz/offline-pwa  

---

## 🧠 Idea

This project explores a simple architecture:

> Store everything locally, sync to the cloud only when needed.

Instead of relying on a backend, the app:

- Uses **IndexedDB** as the main database  
- Works fully offline  
- Syncs data to Google Drive once per day (or manually)  

The cloud is **not the source of truth** — it’s just a backup.

---

## 🧱 Architecture

- **Frontend-only PWA**
- Local database with IndexedDB
- Google OAuth 2.0 for authentication
- Google Drive API for backup storage
- Hosted on GitHub Pages (HTTPS)

---

## 🔄 How it works

1. User inputs data
2. Data is stored locally in IndexedDB
3. Changes are marked as "unsynced"
4. On app load:
   - If there are unsynced changes
   - And more than 24h passed since last sync
5. The app:
   - Authenticates the user (Google)
   - Serializes all data into JSON
   - Uploads it to Google Drive

---

## ⚙️ Features

- Offline-first
- Installable PWA
- Local persistence
- Daily cloud backup
- No backend required
- Minimal architecture

---

## 🔐 Authentication

Uses Google OAuth 2.0 with scope:
