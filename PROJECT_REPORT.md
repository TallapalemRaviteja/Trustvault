# TrustVault: Project Architecture & Engineering Report (PROJECT_REPORT.md)

## 1. Executive Summary & Problem Statement

Modern enterprise document management systems often fail in two critical security domains:
1. **Inadequate Authorization Enforcement:** Applications routinely rely on predictable identifiers, client-side permission checks, or coarse role models where any administrator can inspect any confidential document.
2. **Untrustworthy or Modifiable Audit Records:** Standard audit logs stored in typical database tables or flat files can be silently deleted, modified, or reordered by an attacker or insider with elevated database privileges.

**TrustVault** was engineered from the ground up to solve both problems:
* **Explicit, Per-Document Authorization:** Deny-by-default access control ensuring only document owners and named grantees can view metadata or download content.
* **Tamper-Evident Audit Trails:** Deterministic SHA-256 hash-chained cryptographic ledger where any event modification, deletion, reordering, or insertion is immediately detected.

---

## 2. Proposed Solution & Architecture

TrustVault is built with a segregated, multi-tiered enterprise architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                 React + TypeScript Frontend                 │
│         (Tailwind CSS, Vite, Lucide React, Recharts)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON / Binary Streams
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend Gateway                   │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  SecurityHeadersMiddleware (CSP, Nosniff, HSTS)     │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                              │
│   ┌──────────────────────────▼──────────────────────────┐   │
│   │     Centralized Authorization Service (Live DB)     │   │
│   │     - Enforces READ, EDIT, OWNER, and DENIED-Audit  │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                              │
│   ┌──────────────────────────▼──────────────────────────┐   │
│   │       Tamper-Evident SHA-256 Audit Engine           │   │
│   │       - Canonical JSON serialization                │   │
│   │       - Strict monotonic sequence & hash chaining   │   │
│   │       - Signed HMAC-SHA256 Checkpoints              │   │
│   └──────────────────────────┬──────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌────────────────────────┐            ┌────────────────────────┐
│  SQL Database Ledger   │            │ Private File Storage   │
│  (PostgreSQL / SQLite) │            │ (Randomized UUID Keys, │
│  - Users & Grants      │            │  Path-traversal safe,  │
│  - Hash-chained Events │            │  Outside Web Root)     │
└────────────────────────┘            └────────────────────────┘
```

---

## 3. Core Features & Capabilities

1. **Enterprise Identity & Roles:**
   - **Administrator:** System configuration, user account enablement/disablement, audit verification, security metrics.
   - **Document Owner:** File uploads, versioning, metadata editing, soft-deletion, explicit permission management.
   - **Viewer:** Accesses only assets explicitly shared with them.
2. **Document-Level Permissions (READ & EDIT):**
   - Explicit named grants (`DocumentPermission`).
   - Real-time revocation: setting `revoked_at` immediately denies subsequent download requests.
   - Separate version records preserving historical content hashes.
3. **Private Document Storage:**
   - Random internal storage keys (`<uuid>.bin`) isolated from public web directories.
   - Content hashing with SHA-256.
   - Multi-layer file upload validation (magic byte checks, double-extension defenses, size limits).
4. **Tamper-Evident Hash-Chained Audit Trail:**
   - Monotonic sequence numbers.
   - Deterministic canonical JSON hashing concatenated with the previous hash ($H(E_n) = \text{SHA256}(\text{Canonical}(E_n) \parallel H(E_{n-1}))$).
   - Automated verification engine (`audit_service.verify_chain_integrity`) and CLI utility (`python -m app.cli.verify_audit`).
   - Automatic secret redaction (passwords, tokens, cookies, and document contents are strictly redacted).
   - HMAC signed checkpoints for chain head protection.
5. **Security Operations Dashboards:**
   - Real-time aggregate statistics.
   - 7-day visual operation comparisons (Recharts).
   - Interactive Audit Explorer with deep event inspection.
   - User account status and role management.

---

## 4. Permission Model & Security Decisions

| Decision | Implementation | Rationale |
| :--- | :--- | :--- |
| **Deny by Default** | All endpoints enforce authentication and explicit checks. | Prevents accidental data exposure on new routes. |
| **No Implicit Admin Read** | `AuthorizationService.can_read` denies admins unless explicitly granted. | Enforces least-privilege content isolation; prevents rogue admins from reading confidential files. |
| **Live Database Checks** | Zero permission caching in memory. | Guarantees immediate revocation enforcement without stale cache windows. |
| **Soft Revocation Tracking** | Permissions record `revoked_at` timestamp. | Maintains full forensic history of when permissions were granted, modified, or terminated. |
| **Argon2id Hashing** | RFC 9106 recommended parameters (64 MB RAM, 2 passes). | Highest resistance to GPU and ASIC brute-force cracking. |
| **Double Extension Defense** | Rejects secondary dangerous extensions (`.pdf.exe`). | Defends against social engineering and MIME confusion attacks. |

---

## 5. Testing & Verification

A comprehensive automated test suite of **34 tests** verifies every security-critical behavior:
* **Authentication Tests (6):** Password hashing, disabled account lockout, bearer token revocation, unauthenticated access blocks.
* **Cross-User Authorization Tests (11):** Horizontal isolation between owners, unauthorized download blocks, version access blocks, search result filtering, non-admin role escalation rejection, admin content isolation.
* **Revocation Tests (2):** Full grant, access, immediate revocation, and subsequent download denial lifecycle.
* **File Validation Tests (7):** Path traversal prevention, extension allowlists, double extensions, magic byte verification, storage key escaping.
* **Audit Integrity Tests (6):** Canonical hashing, intact chain verification, field modification detection, event deletion detection, sequence reordering detection, multi-threaded concurrent write stress testing.
* **Administrative Tests (4):** Admin metrics access, non-admin blocks, account disablement and re-enablement, self-disable prevention.

**Result:** 34 passed out of 34 tests (100% pass rate).

---

## 6. AI Development & Collaboration (PROMPTS.md)

AI pair programming was utilized across all development phases:
1. Environment toolchain discovery, silent winget automation, and npm dependency tree resolution.
2. Discovery and resolution of RFC 6761 special-use `.local` domain constraints in Pydantic's `EmailStr`.
3. Storage path isolation between global instances and temporary test directories in pytest fixtures.
4. Resolution of indirect peer dependencies in Recharts (`react-is`) and TypeScript bundler module configurations.
5. Production containerization and security documentation.

---

## 7. Deliberate Exclusions & Known Limitations

1. **Client-Side File Copies:** Once an authorized user downloads a confidential document to their local device, revoking access cannot retroactively erase the local file on their physical disk.
2. **Folder Permission Inheritance:** Omitted by design. Per-document explicit grants are mathematically simpler to audit and eliminate cascading permission errors.
3. **Hardware Security Module (HSM) Integration:** HMAC checkpoints are currently signed with an environment secret (`AUDIT_CHECKPOINT_KEY`). Integration with AWS KMS / Google Cloud HSM is recommended for enterprise banking deployments.
4. **Malware Sandboxing:** Magic byte and extension validation verify file headers, but do not scan for active document exploits. Production systems should integrate an external antivirus engine (e.g. ClamAV).
