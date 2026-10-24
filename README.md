# TrustVault: Secure Document Sharing Platform with Tamper-Evident Audit Trails

[![Security First](https://img.shields.io/badge/Security-First-0284c7.svg)](SECURITY.md)
[![Audit Integrity](https://img.shields.io/badge/Audit-SHA--256%20Hash%20Chained-10b981.svg)](THREATS.md)
[![Tests Passing](https://img.shields.io/badge/Tests-34%20Passed%20(100%25)-10b981.svg)](PROJECT_REPORT.md)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/TallapalemRaviteja/Trustvault)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**TrustVault** is a security-critical enterprise document sharing web application designed to solve two core challenges:
1. **Prevent unauthorized access** to confidential assets through strict document-level authorization, immediate revocation enforcement, and private storage isolation.
2. **Provide undeniable, tamper-evident evidence** of who accessed or attempted to access documents through a deterministic SHA-256 hash-chained audit ledger.

---

## Architecture & Technology Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router v7, TanStack Query, React Hook Form, Zod, Lucide React, Recharts.
* **Backend:** Python 3.12+, FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic migrations, Uvicorn.
* **Database:** PostgreSQL (with SQLite engine fallback for zero-setup local tests).
* **Storage:** Private local / S3-compatible storage with randomized internal keys and SHA-256 content fingerprints.
* **Security:** Argon2id password hashing, short-lived JWT access tokens with HttpOnly cookies, CSP, rate limiting, and centralized authorization.

---

## Quick Start & Installation

### 1. Prerequisites
* Python 3.12+
* Node.js 20+ & npm
* Git

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations (or initial schema seed)
alembic upgrade head

# Seed reproducible testing accounts and sample documents
python seed.py

# Start backend server (listening on port 8000)
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start Vite dev server (proxies /api to http://localhost:8000)
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## Seed Accounts & Credentials

The database seeder (`python seed.py`) generates 6 standard accounts across all roles:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Administrator** | Admin Alice | `admin@trustvault.com` | `AdminPassword123!` |
| **Document Owner** | Alice Richardson | `alice@trustvault.com` | `AlicePassword123!` |
| **Document Owner** | Bob Martinez | `bob@trustvault.com` | `BobPassword123!` |
| **Viewer** | Carol Danvers | `carol@trustvault.com` | `CarolPassword123!` |
| **Viewer** | Dave Bowman | `dave@trustvault.com` | `DavePassword123!` |
| **Disabled Account** | Eve Compromised | `eve.disabled@trustvault.com` | `EvePassword123!` |

*(The login screen includes 1-click test identity buttons for instant switching).*

---

## Automated Security Testing

Execute the comprehensive 34-test security suite verifying authentication, cross-user isolation, immediate revocation, file upload validation, and audit chain integrity:

```bash
# From repository root:
cd backend
$env:PYTHONPATH = "."
pytest tests -v
```

### Command-Line Audit Integrity Verification
To independently verify the full cryptographic hash chain without starting the web UI:

```bash
cd backend
python -m app.cli.verify_audit
```

Output:
```text
============================================================
 TRUSTVAULT AUDIT TRAIL INTEGRITY VERIFICATION TOOL
============================================================
Status:               VERIFIED_INTACT
Events Checked:       34
First Sequence:       1
Last Sequence:        34
Last Event Hash:      59be644d2753d8fabc70e5de0a68a5d09e37f4f9...
------------------------------------------------------------
 [PASS] Audit chain cryptographically verified. No tampering detected.
```

---

## Production Docker Deployment

Deploy the entire TrustVault stack (PostgreSQL database, FastAPI backend, and Nginx frontend) with Docker Compose:

```bash
docker compose up -d --build
```

Services:
* **Web Application:** `http://localhost` (Port 80)
* **API Documentation:** `http://localhost:8000/docs`
* **PostgreSQL:** Port 5432 (Internal Docker Network)

---

## Comprehensive Project Documentation

Detailed technical references are maintained in the repository:
* [THREATS.md](file:///d:/Trustvault/THREATS.md): Comprehensive threat model with 18 detailed threat scenarios, attack vectors, mitigations, and automated test mappings.
* [SECURITY.md](file:///d:/Trustvault/SECURITY.md): Security architecture, Argon2id parameters, JWT claims, storage encryption, and hash-chain mathematical proofs.
* [API.md](file:///d:/Trustvault/API.md): Complete OpenAPI endpoint documentation with request/response schemas and audit outcomes.
* [PROJECT_REPORT.md](file:///d:/Trustvault/PROJECT_REPORT.md): Complete engineering analysis, architectural trade-offs, and test metrics.
* [DEMO_SCRIPT.md](file:///d:/Trustvault/DEMO_SCRIPT.md): Step-by-step 5-minute evaluator demonstration guide.
* [PROMPTS.md](file:///d:/Trustvault/PROMPTS.md): Genuine dated AI development history tracking prompts, defects discovered, reviews, and Git commits.

---

## License
MIT License. Developed for enterprise security assessment and evaluation.
