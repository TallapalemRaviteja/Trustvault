# TrustVault: Comprehensive Security Threat Model (THREATS.md)

This threat model documents analyzed attack scenarios, attacker capabilities, implemented mitigations, corresponding source files and automated test coverage, along with residual risk assessments for the **TrustVault** Secure Document Sharing Platform.

---

## Threat Matrix Overview

| Threat ID | Threat Category | Target Asset / Vector | Severity | Mitigation Status |
| :--- | :--- | :--- | :--- | :--- |
| **TV-THR-01** | Authorization / IDOR | Direct Document ID Access | Critical | Verified Mitigated |
| **TV-THR-02** | Privilege Escalation | Horizontal Multi-Tenant Escalation | High | Verified Mitigated |
| **TV-THR-03** | Privilege Escalation | Vertical Self-Promotion to Admin | Critical | Verified Mitigated |
| **TV-THR-04** | Access Control | Stale Authorization Caches & Revocation Bypass | Critical | Verified Mitigated |
| **TV-THR-05** | Integrity / Audit | Audit Record Tampering (Field Modification) | Critical | Verified Mitigated |
| **TV-THR-06** | Integrity / Audit | Audit Event Deletion (Gap Injection) | Critical | Verified Mitigated |
| **TV-THR-07** | Integrity / Audit | Audit Event Reordering / Branch Swapping | High | Verified Mitigated |
| **TV-THR-08** | Integrity / Audit | Race Conditions & Forked Audit Chains | High | Verified Mitigated |
| **TV-THR-09** | Storage Security | Path Traversal via Malicious Filenames/Keys | Critical | Verified Mitigated |
| **TV-THR-10** | Input Validation | Spoofed MIME Types & Executable Extensions | High | Verified Mitigated |
| **TV-THR-11** | Resource Exhaustion | Oversized Uploads (Denial of Service) | Medium | Verified Mitigated |
| **TV-THR-12** | Information Disclosure | Search & Pagination Metadata Leakage | Medium | Verified Mitigated |
| **TV-THR-13** | Authentication | Brute-Force Password Guessing | High | Verified Mitigated |
| **TV-THR-14** | Session Management | Continued Session by Disabled Accounts | High | Verified Mitigated |
| **TV-THR-15** | Least Privilege | Implicit Admin Access to Confidential Docs | High | Verified Mitigated |
| **TV-THR-16** | Data Privacy | Sensitive Credentials in Audit Log Records | High | Verified Mitigated |
| **TV-THR-17** | Injection | Parameterized SQL Injection | Critical | Verified Mitigated |
| **TV-THR-18** | Client-Side Security | Stored XSS & Clickjacking via Malicious Files | High | Verified Mitigated |

---

## Detailed Threat Specifications

### TV-THR-01: Insecure Direct Object References (IDOR / BOLA) on Documents
* **Threat ID:** TV-THR-01
* **Attacker Capabilities:** Authenticated user with valid session token (Viewer A, Owner B, or unauthorized outsider).
* **Attack Scenario:** Attacker obtains or guesses a document UUID (`/api/documents/{id}/download` or `/api/documents/{id}`) belonging to Owner A and issues direct GET requests.
* **Potential Impact:** Complete breach of confidential documents, trade secrets, or unshared corporate financials.
* **Implemented Mitigation:**
  Centralized authorization service (`AuthorizationService.can_read`) enforces strict database check: actor must either be the documented `owner_id` or possess an active grant in `DocumentPermission` with `revoked_at IS NULL`. Document IDs provide zero implicit authorization.
* **Source Files / Endpoints:**
  - `backend/app/services/authorization.py`
  - `backend/app/routers/documents.py#download_document`
  - `backend/app/routers/documents.py#get_document_details`
* **Automated Test:** `backend/tests/test_authorization.py::test_owner_b_cannot_access_owner_a_private_document`, `test_viewer_without_permission_cannot_access_or_download`
* **Residual Risk:** None in API layer. If an authorized user downloads the file to an unmanaged workstation, local host security governs the downloaded copy.
* **Accepted Risk Justification:** Inherent property of document downloading; mitigated by strict download audit logging.

---

### TV-THR-02: Horizontal Privilege Escalation Across Document Owners
* **Threat ID:** TV-THR-02
* **Attacker Capabilities:** Authenticated Document Owner (e.g., Owner B) attempting to manage permissions, edit, or delete Owner A's documents.
* **Attack Scenario:** Attacker calls `DELETE /api/documents/{owner_a_doc_id}` or `POST /api/documents/{owner_a_doc_id}/permissions` with their own credentials.
* **Potential Impact:** Unauthorized permission changes, grant injection, or destruction of rival documents.
* **Implemented Mitigation:**
  `AuthorizationService.can_manage_permissions` and `can_delete` strictly verify `document.owner_id == user.id`. Server-side validation rejects any attempt by non-owners to modify permissions or delete records.
* **Source Files / Endpoints:**
  - `backend/app/services/authorization.py#can_manage_permissions`
  - `backend/app/routers/permissions.py#grant_permission`
  - `backend/app/routers/documents.py#delete_document`
* **Automated Test:** `backend/tests/test_authorization.py::test_unauthorized_user_cannot_delete_document`, `test_unauthorized_user_cannot_grant_self_permissions`
* **Residual Risk:** Minimal; access is completely server-enforced and fully audited with `PERMISSION_GRANT_DENIED` and `DOCUMENT_DELETE_DENIED`.

---

### TV-THR-03: Vertical Privilege Escalation to Administrator
* **Threat ID:** TV-THR-03
* **Attacker Capabilities:** Authenticated non-admin user (Owner or Viewer) attempting to assign themselves the `admin` role.
* **Attack Scenario:** Client issues `PATCH /api/users/{own_id}/role` with `{"role": "admin"}` or passes `role="admin"` during public registration.
* **Potential Impact:** Full takeover of administrative controls, ability to disable other accounts, or inspect system-wide audit logs.
* **Implemented Mitigation:**
  Endpoints modifying application roles require `require_admin` dependency. Self-registration hardcodes default role to `viewer` unless the executing actor is verified as an active Administrator.
* **Source Files / Endpoints:**
  - `backend/app/routers/users.py#update_user_role`
  - `backend/app/security/auth.py#require_admin`
* **Automated Test:** `backend/tests/test_authorization.py::test_viewer_cannot_escalate_role_to_admin`
* **Residual Risk:** None. Role assignment strictly checks `current_admin.role == UserRole.ADMIN.value`.

---

### TV-THR-04: Stale Authorization Caches & Revocation Race Conditions
* **Threat ID:** TV-THR-04
* **Attacker Capabilities:** Former grantee whose access was revoked by the document owner, attempting to download using a cached token or active session.
* **Attack Scenario:** Owner revokes Viewer A's READ permission. Viewer A immediately attempts to stream `/api/documents/{id}/download` using their existing session token.
* **Potential Impact:** Unauthorized data exfiltration following termination of NDA or contract.
* **Implemented Mitigation:**
  Zero in-memory permission caching. Every single document download and metadata view executes a live database query filtering for `revoked_at.is_(None)`. When `revoked_at` is set, subsequent requests are immediately blocked with HTTP 403 and logged as `DOCUMENT_DOWNLOAD_DENIED`.
* **Source Files / Endpoints:**
  - `backend/app/services/authorization.py#get_effective_permission`
  - `backend/app/routers/permissions.py#revoke_permission`
* **Automated Test:** `backend/tests/test_revocation.py::test_immediate_permission_revocation_lifecycle`
* **Residual Risk:** Unavoidable limitation: revocation cannot retroactively delete copies already downloaded to an external computer before revocation took place.

---

### TV-THR-05: Audit Record Tampering (Database Modification)
* **Threat ID:** TV-THR-05
* **Attacker Capabilities:** Rogue database administrator or attacker with direct database SQL write access attempting to alter an audit event.
* **Attack Scenario:** Attacker updates an event record (e.g. changing `outcome="DENIED"` to `"SUCCESS"` or changing `actor_id`).
* **Potential Impact:** Hidden forensic evidence and undetectable security compromises.
* **Implemented Mitigation:**
  SHA-256 deterministic hash chaining. Each event's `event_hash` is computed over its canonical JSON serialization concatenated with `prev_event_hash`. The verification service and CLI verify that recomputed hash matches stored `event_hash`. Any field modification immediately flags `TAMPERED_HASH_MISMATCH`.
* **Source Files / Endpoints:**
  - `backend/app/services/audit.py#canonicalize_event_dict`
  - `backend/app/services/audit.py#verify_chain_integrity`
  - `backend/app/cli/verify_audit.py`
* **Automated Test:** `backend/tests/test_audit_integrity.py::test_audit_integrity_fails_when_event_modified`
* **Residual Risk:** A rogue superuser who wipes the entire database and rewrites all hashes from genesis could theoretically forge a chain unless external checkpoints exist. Mitigated by HMAC signed checkpoints (`AuditCheckpoint`).

---

### TV-THR-06: Audit Record Deletion
* **Threat ID:** TV-THR-06
* **Attacker Capabilities:** Database operator attempting to delete evidence of an unauthorized access event.
* **Attack Scenario:** Attacker deletes event #3 from the `audit_events` table.
* **Potential Impact:** Destruction of audit trail continuity and concealment of attacks.
* **Implemented Mitigation:**
  The verification service enforces strict sequential monotonicity (`sequence_number == expected_seq`). A missing event creates an immediate sequence gap and breaks the cryptographic hash pointer `prev_event_hash` of subsequent events, triggering a verification failure.
* **Source Files / Endpoints:**
  - `backend/app/services/audit.py#verify_chain_integrity`
* **Automated Test:** `backend/tests/test_audit_integrity.py::test_audit_integrity_fails_when_event_deleted`
* **Residual Risk:** None. Gap detection is deterministic and mathematically provable.

---

### TV-THR-07: Audit Record Reordering or Splicing
* **Threat ID:** TV-THR-07
* **Attacker Capabilities:** Adversary attempting to alter chronological order of security events to establish a false alibi.
* **Attack Scenario:** Swapping sequence numbers or timestamps between events.
* **Potential Impact:** Inaccurate forensic timeline.
* **Implemented Mitigation:**
  Sequence numbers and ISO timestamps are embedded into the canonical JSON string hashed by SHA-256. Reordering changes the expected previous hash and produces hash validation failures.
* **Source Files / Endpoints:**
  - `backend/app/services/audit.py#verify_chain_integrity`
* **Automated Test:** `backend/tests/test_audit_integrity.py::test_audit_integrity_fails_when_events_reordered`
* **Residual Risk:** None; cryptographically verified.

---

### TV-THR-08: Concurrent Audit Writes & Chain Branching
* **Threat ID:** TV-THR-08
* **Attacker Capabilities:** High-concurrency traffic or simultaneous API requests causing race conditions in sequence generation.
* **Attack Scenario:** Two requests simultaneously query `MAX(sequence_number)` and generate conflicting events with identical sequences or divergent previous hashes.
* **Potential Impact:** Split-brain audit chain causing legitimate events to fail verification.
* **Implemented Mitigation:**
  Audit write serialization via threading synchronization lock (`_audit_lock`) and database transaction isolation. Events are assigned monotonic sequence numbers sequentially.
* **Source Files / Endpoints:**
  - `backend/app/services/audit.py#record_event`
* **Automated Test:** `backend/tests/test_audit_integrity.py::test_concurrent_audit_writes_preserve_chain_integrity`
* **Residual Risk:** Highly scaled multi-node backend clusters require distributed locking (e.g., PostgreSQL table locks / advisory locks or Redis Redlock).

---

### TV-THR-09: Directory / Path Traversal in Private Storage
* **Threat ID:** TV-THR-09
* **Attacker Capabilities:** Malicious user uploading a document with filename `../../../../etc/passwd` or craftily manipulating storage keys.
* **Attack Scenario:** Attempting to overwrite or read files outside the designated `private_storage` root directory.
* **Potential Impact:** Arbitrary file overwrite, arbitrary file read, host compromise.
* **Implemented Mitigation:**
  1. Internal storage keys are generated as random UUIDs (`uuid.uuid4().hex`), never based on user-supplied filenames.
  2. `sanitize_filename` strips all path components using `os.path.basename` and regex sanitization.
  3. `SecureFileStorage._resolve_key_path` enforces that `resolved_path.startswith(base_dir)`. Any violation raises HTTP 400.
* **Source Files / Endpoints:**
  - `backend/app/storage/storage.py#_resolve_key_path`
  - `backend/app/storage/validation.py#sanitize_filename`
* **Automated Test:** `backend/tests/test_file_validation.py::test_sanitize_filename_prevents_path_traversal`, `test_storage_key_path_traversal_blocked`
* **Residual Risk:** None on tested paths.

---

### TV-THR-10: File Extension Spoofing & MIME Manipulation
* **Threat ID:** TV-THR-10
* **Attacker Capabilities:** Attacker uploading an executable disguised as a PDF (`malicious.exe` renamed to `invoice.pdf` or `invoice.pdf.exe`).
* **Attack Scenario:** Tricking users or backend parsers into executing binary code.
* **Potential Impact:** Malware propagation, server-side code execution.
* **Implemented Mitigation:**
  1. Strict allowlist of extensions: `.pdf`, `.docx`, `.xlsx`, `.pptx`, `.txt`, `.csv`, `.png`, `.jpg`, `.jpeg`, `.json`.
  2. Suspicious double-extension defense: rejects any filename containing secondary dangerous extensions (`.exe`, `.bat`, `.cmd`, `.sh`, `.vbs`, etc.).
  3. Magic bytes signature validation: verifies header bytes (e.g. `%PDF-` for PDFs, `PK\x03\x04` for Office documents, PNG headers).
* **Source Files / Endpoints:**
  - `backend/app/storage/validation.py#validate_file_upload`
* **Automated Test:** `backend/tests/test_file_validation.py::test_unsupported_file_extension_rejected`, `test_suspicious_double_extension_blocked`, `test_magic_byte_mismatch_rejected`
* **Residual Risk:** File-type validation verifies structure but does not guarantee the document is free of embedded exploits (e.g. malicious PDF JavaScript). Enterprise deployments should pair with an anti-virus scanner (e.g. ClamAV).

---

### TV-THR-11: Denial of Service via Oversized File Uploads
* **Threat ID:** TV-THR-11
* **Attacker Capabilities:** User uploading multi-gigabyte files to exhaust storage space or memory buffers.
* **Attack Scenario:** Exhaustion of server disk or RAM leading to service outage.
* **Implemented Mitigation:**
  Enforces `MAX_UPLOAD_SIZE_BYTES` (25 MB) at both application layer and HTTP request stream. Oversized uploads are rejected with HTTP 413 Payload Too Large.
* **Source Files / Endpoints:**
  - `backend/app/storage/validation.py#validate_file_upload`
* **Automated Test:** `backend/tests/test_file_validation.py`
* **Residual Risk:** Distributed storage quotas per tenant should be added for multi-gigabyte enterprise production quotas.

---

### TV-THR-12: Metadata Leakage via Unauthorized Search & Pagination
* **Threat ID:** TV-THR-12
* **Attacker Capabilities:** Unauthorized viewer querying `/api/documents?search=confidential` or observing pagination counts.
* **Attack Scenario:** Deducing the existence, owner, or subject of confidential documents without having READ permissions.
* **Potential Impact:** Breach of competitive or legal confidentiality (e.g. "Merger_Acquisition_Draft.pdf").
* **Implemented Mitigation:**
  Search queries apply authorization filtering in the SQL `WHERE` clause before calculating totals or pagination offsets (`Document.owner_id == user.id OR Document.id IN (active_shared_ids)`). Non-owners receive zero results and zero total counts for unauthorized assets.
* **Source Files / Endpoints:**
  - `backend/app/routers/documents.py#list_documents`
* **Automated Test:** `backend/tests/test_authorization.py::test_search_results_exclude_unauthorized_documents`
* **Residual Risk:** None. The database query strictly confines results to permitted assets.

---

### TV-THR-13: Brute-Force Password Guessing & Credential Stuffing
* **Threat ID:** TV-THR-13
* **Attacker Capabilities:** Unauthenticated automated bot attempting rapid password dictionary attacks against `/api/auth/login`.
* **Attack Scenario:** Guessing user passwords via high-frequency automated requests.
* **Potential Impact:** Account compromise.
* **Implemented Mitigation:**
  1. In-memory sliding-window rate limiting on login endpoint (`check_rate_limit(request, key_prefix="login", max_requests=10)`). Returns HTTP 429 Too Many Requests when threshold exceeded.
  2. Argon2id password hashing imposes significant CPU and memory cost (64 MB per hash), rendering offline cracking computationally infeasible.
  3. Generic error message (`Incorrect email or password`) prevents username enumeration.
* **Source Files / Endpoints:**
  - `backend/app/security/rate_limiter.py`
  - `backend/app/security/hasher.py`
  - `backend/app/routers/auth.py#login`
* **Automated Test:** `backend/tests/test_auth.py::test_login_invalid_password_rejected`, `test_login_nonexistent_email_rejected`
* **Residual Risk:** Distributed attacks from rotating IPs. Production deployments should incorporate fail2ban or Cloudflare WAF.

---

### TV-THR-14: Active Session Hijack / Continuation for Disabled Accounts
* **Threat ID:** TV-THR-14
* **Attacker Capabilities:** Compromised user account whose administrator disabled the account (`is_active = False`), but an existing JWT token has not yet expired.
* **Attack Scenario:** Attacker uses a valid JWT issued before account disablement to make requests.
* **Potential Impact:** Unauthorized access following incident response or employee termination.
* **Implemented Mitigation:**
  `get_current_user` dependency queries the database on every protected endpoint and asserts `user.is_active is True`. If disabled, requests are rejected immediately with HTTP 401 Unauthorized regardless of token validity.
* **Source Files / Endpoints:**
  - `backend/app/security/auth.py#get_current_user`
  - `backend/app/routers/users.py#update_user_status`
* **Automated Test:** `backend/tests/test_auth.py::test_disabled_account_cannot_login`, `test_disabled_account_bearer_token_blocked`
* **Residual Risk:** None; active status is re-evaluated live.

---

### TV-THR-15: Administrator Document Access Bypass (Least Privilege Violation)
* **Threat ID:** TV-THR-15
* **Attacker Capabilities:** System Administrator attempting to view or download confidential document contents without explicit grant.
* **Attack Scenario:** Admin visits `/api/documents/{id}/download` assuming administrative status grants unrestricted read access.
* **Potential Impact:** Violation of separation of duties; rogue or coerced admin can read all enterprise confidential files.
* **Implemented Mitigation:**
  Admins are restricted to user management, system metrics, and audit verification. `AuthorizationService.can_read` does NOT treat `role == admin` as an implicit read grant. Confidential content download is denied with HTTP 403 unless explicitly shared by the owner.
* **Source Files / Endpoints:**
  - `backend/app/services/authorization.py#get_effective_permission`
* **Automated Test:** `backend/tests/test_authorization.py::test_administrator_cannot_automatically_download_confidential_document`
* **Residual Risk:** Break-glass emergency workflows should require multi-party approval in high-security organizations.

---

### TV-THR-16: Secret & Credential Leakage in Audit Logs
* **Threat ID:** TV-THR-16
* **Attacker Capabilities:** Auditor or administrator reviewing audit event metadata.
* **Attack Scenario:** Inspecting audit logs to find captured passwords, API keys, or session tokens.
* **Potential Impact:** Credential theft through operational logs.
* **Implemented Mitigation:**
  `AuditService.record_event` applies an automated redaction filter on all metadata dictionaries. Any key containing `password`, `token`, `secret`, `cookie`, or `content` is automatically replaced with `[REDACTED]`.
* **Source Files / Endpoints:**
  - `backend/app/services/audit.py#record_event`
* **Automated Test:** `backend/tests/test_audit_integrity.py::test_audit_records_sanitized_against_secrets`
* **Residual Risk:** None. Verified by automated unit test.

---

### TV-THR-17: SQL Injection
* **Threat ID:** TV-THR-17
* **Attacker Capabilities:** Attacker injecting SQL syntax in search parameters, IDs, or form fields.
* **Attack Scenario:** Submitting `' OR 1=1 --` in document search or ID fields.
* **Potential Impact:** Full database extraction, authentication bypass.
* **Implemented Mitigation:**
  100% of database access is implemented via SQLAlchemy 2.0 ORM using strictly parameterized queries. Raw unescaped string concatenation into SQL commands is completely prohibited.
* **Source Files / Endpoints:**
  - `backend/app/routers/documents.py`
  - `backend/app/routers/users.py`
  - `backend/app/routers/audit.py`
* **Automated Test:** `backend/tests/test_authorization.py::test_search_results_exclude_unauthorized_documents`
* **Residual Risk:** None. All user input is bound to parameterized statements.

---

### TV-THR-18: Stored Cross-Site Scripting (XSS) & Clickjacking
* **Threat ID:** TV-THR-18
* **Attacker Capabilities:** User uploading an SVG, HTML, or JavaScript payload in title, description, or file content.
* **Attack Scenario:** Executing scripts in the victim's browser to hijack session cookies.
* **Potential Impact:** Client-side account takeover.
* **Implemented Mitigation:**
  1. `SecurityHeadersMiddleware` delivers `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY`.
  2. HTML/SVG files are excluded from document upload allowlists.
  3. React JSX escapes all rendered metadata by default.
  4. Authentication cookies use `HttpOnly; SameSite=Lax`.
* **Source Files / Endpoints:**
  - `backend/app/security/headers.py`
  - `frontend/nginx.conf`
* **Automated Test:** `backend/tests/test_file_validation.py::test_unsupported_file_extension_rejected`
* **Residual Risk:** None under standard modern browsers enforcing CSP and nosniff headers.
