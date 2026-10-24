# TrustVault: 5-Minute Evaluation & Demonstration Plan (DEMO_SCRIPT.md)

This structured 5-minute walkthrough guides evaluators, security auditors, and stakeholders through demonstrating TrustVault's core capabilities: secure authentication, document isolation, explicit document-level permissions, immediate access revocation, and cryptographic audit integrity verification.

---

## Pre-requisites & Seed Credentials

Ensure the backend and frontend are running:
* **Frontend:** `http://localhost:5173`
* **Backend API Docs:** `http://localhost:8000/docs`

### Pre-configured Demo Accounts:
* **Security Admin:** `admin@trustvault.com` / `AdminPassword123!`
* **Owner A (Alice):** `alice@trustvault.com` / `AlicePassword123!`
* **Owner B (Bob):** `bob@trustvault.com` / `BobPassword123!`
* **Viewer A (Carol):** `carol@trustvault.com` / `CarolPassword123!`
* **Viewer B (Dave):** `dave@trustvault.com` / `DavePassword123!`
* **Disabled Account:** `eve.disabled@trustvault.com` / `EvePassword123!`

*(Tip: On the Login screen, click any of the 6 quick "Role Test Identities" buttons to auto-populate credentials).*

---

## 5-Minute Demonstration Walkthrough

### Minute 0:00 - 1:00 | Authentication & Disabled Account Containment
1. Navigate to `http://localhost:5173/login`.
2. Click the **"Disabled (Eve)"** identity button and click **"Access Secure Vault"**.
   - **Expected Result:** Login is immediately rejected with `Your account has been disabled. Please contact an administrator.` (Logged as `AUTH_LOGIN_BLOCKED_DISABLED`).
3. Click the **"Owner A (Alice)"** identity button and log in.
   - **Expected Result:** Alice lands on the **Owner Dashboard**, displaying her private documents ("Q4 2026 Financial Audit Report") and recent audit activity.

---

### Minute 1:00 - 2:00 | Document Upload & Cryptographic Fingerprinting
1. Click **"Upload Document"** in the sidebar.
2. Drag and drop any test file (e.g., a `.pdf` or `.docx` file).
3. Set Title: `Confidential Patent Application 2026`, Sensitivity: `Restricted`, Category: `Engineering`.
4. Click **"Upload & Secure Asset"**.
   - **Observe:** The file is ingested, assigned a random UUID storage key, and computed with a SHA-256 fingerprint.
5. In the Document Details view, view the **SHA-256 Document Content Digest** and click **Copy**.

---

### Minute 2:00 - 3:00 | Document-Level Sharing & Cross-User Isolation
1. From Alice's document page, select the **"Access Permissions"** tab.
2. Click **"Grant New Access"**.
3. Select `Dave Bowman (Viewer B)`, choose **READ Access**, and click **Grant Access**.
   - **Observe:** Dave is now listed in the Access Control List.
4. Sign out, and log in as **"Owner B (Bob)"**.
   - Navigate to the **Document Library**. Notice that Alice's private documents are **completely absent** from Bob's search and pagination.
   - Attempting to access Alice's document URL directly returns an **Access Denied** error page.

---

### Minute 3:00 - 4:00 | Immediate Permission Revocation Lifecycle
1. Sign out, and log in as **"Viewer B (Dave)"**.
   - Notice Alice's `Confidential Patent Application 2026` appears in Dave's **Shared Documents** view.
   - Click the document and click **"Download (Live Auth)"**.
   - **Result:** Download succeeds.
2. In a separate tab (or incognito window), log in as **"Owner A (Alice)"**.
   - Go to `Confidential Patent Application 2026` -> **Access Permissions**.
   - Find Dave Bowman and click **"Immediate Revoke"**. Confirm the prompt.
3. Switch back to **Dave's tab** (without logging out).
   - Click **"Download (Live Auth)"** again.
   - **Expected Result:** Download is **instantly denied** (`You do not have READ permission for this document`).
   - Demonstrates: Zero stale caches; immediate live database permission revocation.

---

### Minute 4:00 - 5:00 | Cryptographic Audit Trail & Tamper Verification
1. Sign out and log in as **"Admin A"** (`admin@trustvault.com`).
2. Explore the **Security Center Dashboard**:
   - Inspect the **7-Day Operations & Security Chart** comparing authorized operations to denied attempts.
   - Note the recent `DOCUMENT_DOWNLOAD_DENIED` alert generated when Dave attempted to download post-revocation.
3. Navigate to **"Audit Explorer"** in the sidebar.
   - Review the append-only cryptographic ledger.
   - Click the **Eye icon** on any event to inspect its Canonical JSON, Sequence Number, Previous Hash ($H[n-1]$), and Current Hash ($H[n]$).
4. Click **"Verify Cryptographic Integrity"**:
   - **Result:** Displays a green confirmation badge: `Cryptographic Status: VERIFIED_INTACT. Traversed N sequential events. No tampering detected.`
5. Optional CLI Verification:
   - In terminal, execute:
     ```powershell
     python -m app.cli.verify_audit
     ```
   - Reports `[PASS] Audit chain cryptographically verified. No tampering detected.`
