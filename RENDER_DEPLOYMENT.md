# TrustVault: 1-Click Render Deployment Guide (RENDER_DEPLOYMENT.md)

TrustVault is configured to run as a **unified, single-service deployment** on Render.com. 

Both the **React TypeScript Frontend** and the **FastAPI Backend** run inside the same web service on the same domain and port, eliminating CORS complications and providing **one single link** that works seamlessly across all devices (Desktop, Laptop, Tablet, and Mobile).

---

## Architecture of the Unified Render Deployment

```
   User on Mobile / Laptop
             │
             │ HTTPS (Single URL, e.g. https://trustvault.onrender.com)
             ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                 Render.com Web Service                       │
  │                                                              │
  │  ┌────────────────────────────────────────────────────────┐  │
  │  │                     FastAPI Engine                     │  │
  │  │  • /api/*   ──► Centralized Authorization & Audit API │  │
  │  │  • /*       ──► Built React 19 Frontend SPA (dist)     │  │
  │  └────────────────────────────────────────────────────────┘  │
  │                                                              │
  │  ┌─────────────────────────────┐ ┌────────────────────────┐  │
  │  │ Persistent Disk Volume      │ │ SQLite / PostgreSQL    │  │
  │  │ /app/private_storage        │ │ Cryptographic Ledger   │  │
  │  └─────────────────────────────┘ └────────────────────────┘  │
  └──────────────────────────────────────────────────────────────┘
```

---

## How to Get Your Live Render Link (Step-by-Step)

### Option A: Using Render Blueprints (Fastest & Recommended)

1. **Push your code to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/trustvault.git
   git branch -M main
   git push -u origin main
   ```

2. **Go to Render.com:**
   - Log into [dashboard.render.com](https://dashboard.render.com).
   - Click **"New +"** in the top right and select **"Blueprint"**.
   - Connect your `trustvault` repository.
   - Render will automatically detect the [`render.yaml`](file:///d:/Trustvault/render.yaml) file located in the project root.

3. **Deploy:**
   - Click **"Apply"**.
   - Render will build the unified Docker container (compiling the frontend and setting up the backend).
   - Once deployed, Render will display your live URL:
     ```
     https://trustvault-xxxx.onrender.com
     ```

---

### Option B: Manual Web Service on Render

If you prefer setting up the web service manually:

1. Click **"New +"** -> **"Web Service"**.
2. Connect your GitHub repository.
3. Configure the settings:
   * **Name:** `trustvault`
   * **Language / Runtime:** `Docker`
   * **Dockerfile Path:** `./Dockerfile`
   * **Instance Type:** `Free`
4. Add the following **Environment Variables**:
   * `ENVIRONMENT`: `production`
   * `SECRET_KEY`: `(click generate or paste a 32+ character random string)`
   * `AUDIT_CHECKPOINT_KEY`: `(click generate or paste a 32+ character random string)`
   * `DATABASE_URL`: `sqlite:///./trustvault.db`
   * `STORAGE_BACKEND`: `local`
   * `LOCAL_STORAGE_PATH`: `/app/private_storage`
   * `MAX_UPLOAD_SIZE_BYTES`: `26214400`
   * `CORS_ORIGINS`: `*`
5. (Optional for persistent files on free tier) Under **Disks**, add a disk:
   * **Name:** `trustvault-storage`
   * **Mount Path:** `/app/private_storage`
   * **Size:** `1 GB`
6. Click **"Create Web Service"**.

---

## Verifying on Mobile and Laptop

Once the service displays **Live**:

1. **Open the Render Link on Laptop:**
   - Go to `https://<your-service>.onrender.com/`
   - The login page appears with the **"Role Test Identities"** quick login buttons.
   - Click **"Owner A (Alice)"** and log in to inspect and upload documents.
   - Click **"Admin A"** to inspect system-wide audit integrity.

2. **Open the Render Link on Mobile Phone:**
   - Open your phone's browser (Safari, Chrome, Firefox) and paste the exact same link.
   - The UI is 100% responsive:
     - Touch-friendly drawer sidebar and cards.
     - Responsive document tables with horizontal scrolling.
     - Download buttons work with native mobile downloads.
     - Immediate permission revocation can be tested by opening two tabs or two devices simultaneously!

---

## Pre-Loaded Test Accounts on Render

The service automatically seeds these test accounts on first launch:

| Account | Role | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | Security Administrator | `admin@trustvault.com` | `AdminPassword123!` |
| **Owner A** | Document Owner (Alice) | `alice@trustvault.com` | `AlicePassword123!` |
| **Owner B** | Document Owner (Bob) | `bob@trustvault.com` | `BobPassword123!` |
| **Viewer A** | Authorized Viewer (Carol) | `carol@trustvault.com` | `CarolPassword123!` |
| **Viewer B** | Authorized Viewer (Dave) | `dave@trustvault.com` | `DavePassword123!` |
| **Disabled** | Compromised Account (Eve) | `eve.disabled@trustvault.com` | `EvePassword123!` |
