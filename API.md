# TrustVault REST API Documentation (API.md)

This specification documents the complete REST API for TrustVault, including authentication requirements, role-based authorization, explicit document-level permissions, request/response structures, error codes, and audit trail behavior.

---

## Global Headers & Protocols

* **Base URL:** `/api`
* **Authentication:** `Authorization: Bearer <access_token>` or HttpOnly cookie `access_token`
* **Correlation ID:** `X-Request-ID` (automatically generated if not provided)
* **Standard Response Format:** `application/json` (unless downloading binary streams)

---

## 1. Authentication Endpoints

### 1.1 User Login
* **Method:** `POST`
* **Path:** `/api/auth/login`
* **Purpose:** Authenticates user credentials using Argon2id and issues JWT access token.
* **Authentication:** None (Public)
* **Rate Limit:** 10 requests / minute / IP
* **Request Body:**
  ```json
  {
    "email": "alice@trustvault.com",
    "password": "AlicePassword123!"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "user": {
      "id": "7b2c019d-7f41-4c12-9cbb-964dfb3fa0f1",
      "email": "alice@trustvault.com",
      "full_name": "Alice Richardson",
      "role": "owner",
      "is_active": true,
      "created_at": "2026-10-24T10:00:00Z",
      "updated_at": "2026-10-24T10:00:00Z"
    }
  }
  ```
* **Error Responses:**
  - `401 Unauthorized`: Incorrect email or password / Account disabled
  - `429 Too Many Requests`: Rate limit exceeded
* **Audit Event:** `AUTH_LOGIN_SUCCESS` (Outcome: SUCCESS) or `AUTH_LOGIN_FAILED` / `AUTH_LOGIN_BLOCKED_DISABLED` (Outcome: FAILED/DENIED)

---

### 1.2 User Logout
* **Method:** `POST`
* **Path:** `/api/auth/logout`
* **Purpose:** Terminates active session and clears HttpOnly cookies.
* **Authentication:** Required (Bearer token)
* **Audit Event:** `AUTH_LOGOUT` (Outcome: SUCCESS)

---

### 1.3 Current User Profile
* **Method:** `GET`
* **Path:** `/api/auth/me`
* **Purpose:** Returns the authenticated user's profile and active permissions.
* **Authentication:** Required (Bearer token)

---

## 2. Document Management Endpoints

### 2.1 Upload Confidential Document
* **Method:** `POST`
* **Path:** `/api/documents/upload`
* **Purpose:** Validates and stores a new confidential document in private storage.
* **Authentication:** Required
* **Allowed Roles:** `owner`, `admin`
* **Request Format:** `multipart/form-data`
  - `title`: string (required)
  - `description`: string (optional)
  - `category`: string (required)
  - `tags`: string (optional, comma-separated)
  - `sensitivity`: `Confidential` | `Restricted` | `Internal` | `Public`
  - `file`: binary file (PDF, DOCX, XLSX, PPTX, TXT, CSV, PNG, JPG, JSON)
* **Response (201 Created):** `DocumentResponse`
* **Audit Event:** `DOCUMENT_UPLOAD` (Outcome: SUCCESS)

---

### 2.2 List Authorized Documents
* **Method:** `GET`
* **Path:** `/api/documents`
* **Purpose:** Returns paginated list of documents the caller is authorized to discover.
* **Authentication:** Required
* **Query Parameters:**
  - `search`: string (filters title, description, tags)
  - `category`: string
  - `sensitivity`: string
  - `include_deleted`: boolean (owner only)
  - `page`: integer (default: 1)
  - `page_size`: integer (default: 10)
* **Response (200 OK):** `DocumentListResponse`
* **Security Enforcement:** Database query restricts results strictly to `owner_id == user.id OR id IN (active_grants)`. Unauthorized documents are completely hidden from pagination counts.

---

### 2.3 Get Document Details
* **Method:** `GET`
* **Path:** `/api/documents/{id}`
* **Purpose:** Retrieves document metadata, active permissions, and version history.
* **Authentication:** Required
* **Required Document Permission:** `READ`, `EDIT`, or `OWNER`
* **Response (200 OK):** `DocumentDetailResponse`
* **Audit Event:** `DOCUMENT_VIEW` (Outcome: SUCCESS) or `DOCUMENT_VIEW_DENIED` (Outcome: DENIED)

---

### 2.4 Download Document Content
* **Method:** `GET`
* **Path:** `/api/documents/{id}/download`
* **Purpose:** Streams confidential document bytes directly from private storage.
* **Authentication:** Required
* **Required Document Permission:** `READ`, `EDIT`, or `OWNER`
* **Immediate Revocation Check:** Queries database on every single request. If permission was revoked, download is rejected immediately.
* **Response (200 OK):** Binary stream with headers:
  - `Content-Disposition: attachment; filename="filename.pdf"`
  - `X-Content-SHA256: <hash>`
  - `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`
* **Error Responses:**
  - `403 Forbidden`: You do not have READ permission for this document.
  - `404 Not Found`: Document not found.
* **Audit Event:** `DOCUMENT_DOWNLOAD_SUCCESS` (Outcome: SUCCESS) or `DOCUMENT_DOWNLOAD_DENIED` (Outcome: DENIED)

---

### 2.5 Update Document Metadata
* **Method:** `PATCH`
* **Path:** `/api/documents/{id}`
* **Purpose:** Updates title, description, category, tags, or sensitivity.
* **Authentication:** Required
* **Required Document Permission:** `EDIT` or `OWNER`
* **Audit Event:** `DOCUMENT_EDIT` (Outcome: SUCCESS) or `DOCUMENT_EDIT_DENIED` (Outcome: DENIED)

---

### 2.6 Replace Document Content (New Version)
* **Method:** `POST`
* **Path:** `/api/documents/{id}/replace`
* **Purpose:** Uploads a replacement file, increments version number, and records version history.
* **Authentication:** Required
* **Required Document Permission:** `EDIT` or `OWNER`
* **Audit Event:** `VERSION_CREATE` & `DOCUMENT_REPLACE_CONTENT`

---

### 2.7 Soft-Delete Document
* **Method:** `DELETE`
* **Path:** `/api/documents/{id}`
* **Purpose:** Soft-deletes a document. Preserves audit history and version records.
* **Authentication:** Required
* **Required Document Permission:** `OWNER` only.
* **Audit Event:** `DOCUMENT_DELETE`

---

### 2.8 Restore Soft-Deleted Document
* **Method:** `POST`
* **Path:** `/api/documents/{id}/restore`
* **Purpose:** Restores a soft-deleted document.
* **Authentication:** Required
* **Required Document Permission:** `OWNER` only.
* **Audit Event:** `DOCUMENT_RESTORE`

---

## 3. Permission Management Endpoints

### 3.1 Grant Access to Named Recipient
* **Method:** `POST`
* **Path:** `/api/documents/{id}/permissions`
* **Purpose:** Grants explicit READ or EDIT access to another registered user.
* **Authentication:** Required
* **Required Document Permission:** `OWNER` only.
* **Request Body:**
  ```json
  {
    "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "permission": "READ"
  }
  ```
* **Audit Event:** `PERMISSION_GRANT` (Outcome: SUCCESS) or `PERMISSION_GRANT_DENIED` (Outcome: DENIED)

---

### 3.2 List Active Grants
* **Method:** `GET`
* **Path:** `/api/documents/{id}/permissions`
* **Purpose:** Lists current and historical grants.
* **Allowed Roles / Permissions:** Document Owner or Administrator.

---

### 3.3 Change Permission Level
* **Method:** `PATCH`
* **Path:** `/api/documents/{id}/permissions/{perm_id}`
* **Purpose:** Upgrades or downgrades permission (READ <-> EDIT).
* **Required Document Permission:** `OWNER` only.
* **Audit Event:** `PERMISSION_CHANGE`

---

### 3.4 Revoke Access Immediately
* **Method:** `DELETE`
* **Path:** `/api/documents/{id}/permissions/{perm_id}`
* **Purpose:** Immediately revokes access by stamping `revoked_at = utcnow()`.
* **Required Document Permission:** `OWNER` only.
* **Immediate Effect:** All subsequent requests by the grantee are denied with 403.
* **Audit Event:** `PERMISSION_REVOKE`

---

## 4. Tamper-Evident Audit Endpoints

### 4.1 Audit Explorer
* **Method:** `GET`
* **Path:** `/api/audit`
* **Purpose:** Search and inspect immutable hash-chained audit events.
* **Allowed Roles:**
  - `admin`: Full system-wide visibility.
  - `owner`: Restricted strictly to events on owned documents.
  - `viewer`: Denied (403 Forbidden).

---

### 4.2 Document Audit History
* **Method:** `GET`
* **Path:** `/api/audit/document/{id}`
* **Purpose:** Returns chronological audit history for a specific document.
* **Allowed Roles:** Document Owner or Administrator.

---

### 4.3 Verify Chain Integrity
* **Method:** `GET`
* **Path:** `/api/audit/verify`
* **Purpose:** Traverses the entire audit trail from sequence #1 to latest, verifying every SHA-256 link.
* **Allowed Roles:** `admin`, `owner`
* **Response (200 OK):**
  ```json
  {
    "is_valid": true,
    "status": "VERIFIED_INTACT",
    "total_events_checked": 45,
    "first_sequence": 1,
    "last_sequence": 45,
    "last_event_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "issues": [],
    "verified_at": "2026-10-24T10:45:00Z"
  }
  ```

---

### 4.4 Create Signed Checkpoint
* **Method:** `POST`
* **Path:** `/api/audit/checkpoint`
* **Purpose:** Signs the audit chain head with an HMAC-SHA256 signature to protect against full chain rewrites.
* **Allowed Roles:** `admin` only.
* **Audit Event:** `AUDIT_CHECKPOINT_CREATED`

---

## 5. Security Administration Endpoints

### 5.1 System Health
* **Method:** `GET`
* **Path:** `/api/system/health`
* **Purpose:** Probes database connectivity and private storage health.
* **Authentication:** None (Public)

---

### 5.2 Admin Dashboard Aggregate Stats
* **Method:** `GET`
* **Path:** `/api/admin/stats`
* **Purpose:** Returns real database-backed aggregate counts, 24h activity, and 7-day activity chart data.
* **Allowed Roles:** `admin` only.

---

### 5.3 Disable / Enable User Account
* **Method:** `PATCH`
* **Path:** `/api/users/{id}/status`
* **Purpose:** Enables or disables compromised user accounts.
* **Allowed Roles:** `admin` only.
* **Audit Event:** `ADMIN_ACCOUNT_DISABLE` / `ADMIN_ACCOUNT_ENABLE`
