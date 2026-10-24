# TrustVault: AI Development History & Security Prompt Log

This document records genuine development prompts, AI-generated outputs, defects or limitations discovered during review, corrective actions taken, and the corresponding Git commit references.

---

### Entry 1: Environment Setup, Toolchain Discovery & Frontend Dependency Resolution

* **Date:** 2026-10-24
* **Prompt / Request Summary:**
  Inspect the empty project directory, configure the development environment (Python, Node.js, Git, Vite, Tailwind CSS), initialize version control, and set up project scaffolding.
* **AI-Generated Output:**
  Initial command execution attempted to run `git`, `python`, `node`, and `npm` directly. The Windows App Execution alias intercepted `python.exe` and `winget.exe`, while `node` and `npm` were missing from the machine. Furthermore, running `npm install` on the newly scaffolded Vite React app resulted in an `ERESOLVE` peer dependency conflict between `@hookform/resolvers` and optional `effect` packages.
* **Specific Defect or Limitation Discovered:**
  1. Windows App Execution Aliases fail in sandboxed or non-interactive environments with `Program failed to run: The file cannot be accessed by the system`.
  2. Newly installed Windows software (Git, Node.js LTS) does not immediately propagate into active PowerShell environment sessions without updating `$env:PATH`.
  3. Strict npm v11 dependency resolution failed on `@hookform/resolvers` due to unpinned optional peer dependencies.
* **How the Output Was Reviewed:**
  Direct terminal inspection of error codes (`ERESOLVE`, `CommandNotFoundException`), locating real binary paths in `C:\Program Files\Git\cmd`, `C:\Program Files\nodejs`, and `C:\Users\Surya\AppData\Local\Python\bin`.
* **Corrective Action:**
  1. Installed Git and Node.js LTS via silent winget installer with package agreements accepted.
  2. Dynamically prepended official binary directories to `$env:PATH` in execution commands.
  3. Resolved npm dependency resolution cleanly by specifying `--legacy-peer-deps` during frontend package installation.
  4. Configured `.gitignore` and `.env.example` with strict security defaults.
* **Git Commit Reference:** `1cfac5a`

---

### Entry 2: Email Validation Constraints on Local Domains & Authentication Schema Defense

* **Date:** 2026-10-24
* **Prompt / Request Summary:**
  Implement user authentication schemas, Argon2id password verification, session tokens, and automated authentication security tests using mock user identities (`@trustvault.local`).
* **AI-Generated Output:**
  Defined Pydantic schemas using `EmailStr` and created test fixtures with `.local` email addresses (e.g., `admin@trustvault.local`, `owner.a@trustvault.local`). Pytest execution immediately failed with HTTP 422 Unprocessable Entity during `/api/auth/login` and user creation tests.
* **Specific Defect or Limitation Discovered:**
  Pydantic V2 integrates `email-validator` 2.x, which strictly enforces RFC 6761 / RFC 6762 reserved special-use top-level domain constraints. Domains ending in `.local` are rejected by default with `The part after the @-sign is a special-use or reserved name that cannot be used with email`. This caused login authentication attempts to fail at the schema validation boundary before reaching the password verification logic.
* **How the Output Was Reviewed:**
  Isolated test execution of `test_login_successful` via pytest with full traceback; reproduced the validation failure directly with `pydantic.EmailStr`.
* **Corrective Action:**
  1. Replaced `.local` mock domains with standard valid enterprise domains (`@trustvault.com`) across `backend/seed.py` and `backend/tests/conftest.py`.
  2. Added `email-validator>=2.2.0` explicitly to `requirements.txt`.
  3. Confirmed all authentication endpoints correctly accept sanitized enterprise email addresses and return appropriate 200/401 status codes.
* **Git Commit Reference:** `Pending`

---

### Entry 3: Storage Path Isolation in Test Fixtures & Multi-Threaded Audit Chain Concurrency

* **Date:** 2026-10-24
* **Prompt / Request Summary:**
  Develop automated test suites for document access authorization, immediate permission revocation, and tamper-evident audit hash chaining with concurrent write stress testing.
* **AI-Generated Output:**
  During test runs, `test_immediate_permission_revocation_lifecycle` failed with HTTP 404 on authorized document download, and `test_concurrent_audit_writes_preserve_chain_integrity` failed due to missing events across worker threads.
* **Specific Defect or Limitation Discovered:**
  1. In `test_revocation.py`, importing `from app.storage.storage import file_storage` at top-level bound the test to the global unpatched storage instance (`./private_storage`), while the request handlers inside `app.routers.documents` used the temporary test directory patched in `conftest.py`. This caused the document file to be written to `./private_storage` while the download endpoint searched the isolated temporary directory.
  2. In `test_concurrent_audit_writes_preserve_chain_integrity`, worker threads created new `SessionLocal()` sessions against an unconfigured engine rather than sharing the test database session factory, creating disconnected in-memory SQLite tables.
* **How the Output Was Reviewed:**
  Analyzed file path resolution in `SecureFileStorage.read()` and inspected SQLite connection pool behavior under concurrent threads.
* **Corrective Action:**
  1. Updated `conftest.py` session fixture to dynamically re-point `file_storage.base_dir` in-place to the temporary test directory and restore it on teardown.
  2. Introduced a `session_factory` fixture bound to the in-memory `StaticPool` test engine to ensure concurrent thread workers commit to the same cryptographic audit ledger.
  3. Executed the 34-test suite; verified 100% pass rate with intact SHA-256 hash chains across all concurrent operations.
* **Git Commit Reference:** `Pending`

---
