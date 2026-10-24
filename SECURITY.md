# TrustVault Security Architecture & Policy (SECURITY.md)

TrustVault is engineered with a **Security-First** philosophy. This document provides security researchers, compliance auditors, and system administrators with a comprehensive reference to our authentication, authorization, storage cryptography, audit chain verification, and defense-in-depth safeguards.

---

## 1. Authentication Architecture

### 1.1 Password Hashing with Argon2id
All user passwords are encrypted using **Argon2id** (RFC 9106), the winner of the Password Hashing Competition.
* **Algorithm:** Argon2id
* **Memory Cost ($m$):** 65,536 KiB (64 MiB)
* **Time Cost ($t$):** 2 iterations
* **Parallelism ($p$):** 1 thread
* **Hash Length:** 32 bytes
* **Salt:** Cryptographically secure random 16-byte salt per user

Plaintext passwords are never stored, logged, or included in error traces.

### 1.2 Session Management & Tokens
* **Token Type:** Signed JSON Web Tokens (JWT) using HMAC-SHA256 (`HS256`).
* **Lifespan:** Short-lived access credentials (default: 60 minutes).
* **Token Claims:** Minimal required payload (`sub`, `email`, `role`, `exp`, `iat`, `jti` unique token identifier).
* **Dual Delivery:**
  - `Authorization: Bearer <token>` header for API clients.
  - `HttpOnly`, `SameSite=Lax`, `Secure` cookies for browser navigation to prevent JavaScript session theft.

### 1.3 Active Account State Enforcement
Every authenticated request invokes `get_current_user`, which validates the database live state (`user.is_active is True`). When an administrator disables a compromised account, all active sessions and tokens for that user are immediately invalidated on their next request.

---

## 2. Document-Level Authorization Architecture

TrustVault enforces a strict **Deny-by-Default** authorization model. Unpredictable document IDs do not confer access rights.

```
                          Incoming Request
                                 │
                     ┌───────────▼───────────┐
                     │ Authenticate Identity │
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ Is User Active (Live)?│──── No ──► HTTP 401 Unauthorized
                     └───────────┬───────────┘
                                 │ Yes
                                 ▼
                   ┌───────────────────────────┐
                   │ Is User Document Owner?   │──── Yes ─► Grant Access (OWNER)
                   └───────────┬───────────┘
                               │ No
                               ▼
                   ┌───────────────────────────┐
                   │ Active DocumentPermission?│
                   │ (revoked_at IS NULL)      │──── Yes ─► Check (READ vs EDIT)
                   └───────────┬───────────┘
                               │ No
                               ▼
                   ┌───────────────────────────┐
                   │ Deny Access               │
                   │ Log to Audit: DENIED      │────► HTTP 403 Forbidden
                   └───────────────────────────┘
```

### 2.1 Separation of Duties
* **Document Owner:** Maintains sole authority to upload, edit, delete, and grant/revoke permissions for their own documents.
* **Viewer:** Strictly confined to discovering and downloading assets explicitly shared via active `DocumentPermission` records. Cannot delete, edit, or grant permissions.
* **Administrator:** Manages user accounts, enforces role updates, investigates security alerts, and verifies audit chain integrity. **Administrators do not implicitly receive access to download or read confidential document contents.**

### 2.2 Immediate Revocation Enforcement
Permissions are never cached in memory. Revoking access sets `DocumentPermission.revoked_at = utcnow()`. Because authorization re-queries the database for `revoked_at IS NULL` on every download, the grantee's next request is immediately rejected.

---

## 3. Cryptographic Storage & Document Integrity

### 3.1 Randomized Storage Keys
* Document contents are stored in a private directory located outside the web root (`./private_storage`).
* Storage filenames are assigned internal random UUID keys (e.g. `c7f9a8...bin`), preventing path traversal or filename-based attacks.
* Target filesystem paths are strictly validated using canonical directory resolution (`resolved_path.startswith(base_dir)`).

### 3.2 SHA-256 Document Fingerprints
* On upload, TrustVault computes the SHA-256 hash of the raw bytes.
* The hash is permanently indexed alongside the document metadata.
* On download, the response provides `X-Content-SHA256` for client verification.

---

## 4. Tamper-Evident Audit Trail & Hash Chaining

TrustVault maintains an append-only, cryptographically linked audit ledger for every security event (logins, uploads, views, downloads, edits, deletions, and access denials).

### 4.1 Hash Chaining Formulation
For every event $E_n$ at sequence number $n$:

$$\text{Canonical}(E_n) = \text{JSON}_{\text{sorted}}(\text{Seq}_n, \text{TS}_n, \text{Actor}_n, \text{Action}_n, \text{Target}_n, \text{Outcome}_n, \text{Meta}_n)$$

$$H(E_n) = \text{SHA256}\Big(\text{Canonical}(E_n) \parallel H(E_{n-1})\Big)$$

For the genesis event ($n = 1$):
$$H(E_0) = 0^{64}$$

### 4.2 Tamper Detection Capabilities
The automated integrity verification service (`audit_service.verify_chain_integrity`) and CLI utility (`python -m app.cli.verify_audit`) detect:
1. **Event Modification:** Changing any stored field recalculates a different hash than $H(E_n)$.
2. **Event Deletion:** Deleting an event creates a sequence gap ($n \ne \text{expected}$) and breaks the hash link $H(E_{n-1}) \ne \text{prev\_hash}$.
3. **Event Insertion / Reordering:** Breaks sequence monotonicity and invalidates subsequent chain links.

### 4.3 HMAC Signed Checkpoints
To prevent an attacker with full database access from rewriting the entire chain from scratch, TrustVault generates periodic HMAC-SHA256 checkpoints signed with an independent key (`AUDIT_CHECKPOINT_KEY`):

$$\text{Sig} = \text{HMAC-SHA256}_{K_{\text{audit}}}(n \parallel H(E_n))$$

---

## 5. Network & HTTP Hardening

* **Content-Security-Policy:** Restricts script execution to `'self'`, prevents framing (`frame-ancestors 'none'`).
* **X-Content-Type-Options:** `nosniff` prevents MIME-type confusion attacks.
* **X-Frame-Options:** `DENY` prevents clickjacking.
* **Cache-Control:** `no-store, no-cache, must-revalidate, max-age=0` ensures confidential documents are not retained in intermediate proxies or shared browser caches.
* **Request Correlation:** Generates and validates unique `X-Request-ID` across API logs and audit records.

---

## 6. Vulnerability Disclosure & Incident Response

To report security vulnerabilities or report potential integrity concerns:
1. Submit an encrypted advisory to `security@trustvault.local`.
2. Do not open public issues for zero-day vulnerabilities.
3. TrustVault security teams acknowledge reports within 24 hours.
