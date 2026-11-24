# docPresc — Comprehensive Repository Architecture & Security Audit Report

**Date:** November 23, 2026  
**Auditor Roles:** Senior Software Architect, Senior Full-Stack Engineer, Application Security Engineer, Database Architect, QA Engineer  
**Repository:** docPresc  

---

## 1. Executive Summary

A comprehensive, multi-disciplinary audit of the **docPresc** digital prescription management system was conducted across both backend (`Node.js/Express/TypeScript/Mongoose`) and frontend (`React 18/Vite/Tailwind CSS/TypeScript`).

While the application demonstrates extensive domain coverage for the Bangladeshi medical ecosystem (bilingual prescriptions, 26,000+ MedEx formulary items including Allopathic, Unani, and Ayurvedic systems, multi-chamber management, and responsive live prescription rendering), several **critical security vulnerabilities**, **architectural deficiencies**, **database concurrency risks**, and **API contract mismatches** were identified.

Most notably:
1. **Critical Patient Data Ownership Vulnerability (IDOR):** Unscoped patient lookups during prescription creation allow cross-doctor record linking and data corruption.
2. **Critical Destructive Seed Risk:** Destructive database reset logic (`deleteMany({})` across all collections) was vulnerable to executing against production MongoDB Atlas instances during tests or automated startups.
3. **Insecure CORS & Credential Configuration:** Arbitrary origins were reflected with `credentials: true`.
4. **Information Disclosure in Public Diagnostic Endpoints:** `/api/health/email-diagnostic` was publicly accessible, permitting arbitrary email dispatching and leaking internal SMTP parameters.
5. **Token Security:** Sensitive authentication JWT tokens were retained in browser `localStorage` without refresh token rotation or server-side session revocation.
6. **API Contract Mismatches:** Discrepancies between frontend service endpoints and backend route implementations (`finalize`, `clone`/`duplicate`, public sharing, and patient timeline/history).
7. **Race Conditions in ID Generation:** Prescription and patient ID generation used `countDocuments()` loops, prone to collision under concurrent traffic.

---

## 2. Existing Architecture Analysis

### 2.1 Backend Architecture
- **Framework:** Node.js + Express 4.19 + TypeScript 5.5.
- **Data Access:** Mongoose 8.5 connecting to MongoDB Atlas or local/in-memory fallback.
- **Routing:** Mounted under `/api` and root `/` via `routes/index.ts`.
- **Layering:** Currently organized as a semi-modular structure with loose separation:
  - Controllers contain both HTTP handling and direct database access logic.
  - Repositories (`src/repositories/`) exist for a subset of models but are largely bypassed by controllers.
  - `modules/` exists only as re-export barrel files.
  - Business logic is interspersed with validation and Mongoose queries in controllers.
- **Validation:** Zod schemas in `validators/schemas.ts`, parsed ad-hoc inside controllers or via `validate` middleware.
- **Error Handling:** Custom `AppError` class and centralized `errorHandler` middleware.

### 2.2 Frontend Architecture
- **Framework:** React 18 + Vite 5.4 + TypeScript 5.5.
- **Styling:** Tailwind CSS 3.4 with custom medical theme.
- **State Management:** React Context (`AuthContext`, `LanguageContext`), TanStack React Query v5.
- **Routing:** React Router v6 with `ProtectedRoute` and `AdminRoute` guards.
- **API Client:** Fetch-based `api-client.ts` with custom `ApiError`, handling timeout, retry, and base URL resolution.
- **Storage:** `localStorage` used for tokens, cached user objects, and auto-saved draft prescriptions.

---

## 3. Prioritized Issue Inventory

### 3.1 Critical Security Vulnerabilities (P0)

| ID | Vulnerability | Location | Description & Impact |
|---|---|---|---|
| **SEC-01** | **Patient Ownership Bypass (IDOR)** | `controllers/prescription.controller.ts:156` | When creating a prescription, if `patientId` is an ObjectId, the controller performs `Patient.findById(validated.patientId)` without scoping by `doctorId`. Doctor A can create prescriptions referencing Doctor B's patients, updating their `lastVisit` and `lastDiagnosis`. |
| **SEC-02** | **Destructive Seed in Tests & Production DB Risk** | `seeds/seed.ts:179`, `tests/run-tests.ts:28` | `seedDatabase(true)` wipes all collections (`User`, `Doctor`, `Patient`, `Prescription`, `AuditLog`). Tests call `seedDatabase(true)` while `connectDatabase()` connects to whatever `MONGODB_URI` is in `.env`, threatening production data loss. |
| **SEC-03** | **Permissive CORS with Credentials** | `app.ts:31-35` | The CORS middleware reflects whatever `Origin` header arrives (`callback(null, true)`) while setting `credentials: true`. This allows any malicious third-party site to initiate authenticated cross-origin requests. |
| **SEC-04** | **Unauthenticated Diagnostic Email Relaying** | `app.ts:132-139` | `/api/health/email-diagnostic` allows unauthenticated GET requests with a `?to=` query parameter. Attackers can trigger spam emails and view server SMTP diagnostic output. |
| **SEC-05** | **Public Share Token Data Leakage** | `controllers/prescription.controller.ts:404` | `/api/public/prescriptions/share/:token` returns entire unredacted MongoDB documents, has no token expiration, lacks revocation, does not enforce `FINALIZED` status (exposing private DRAFT notes), and lacks rate limiting. |
| **SEC-06** | **Default Admin Credentials & Auto-Provisioning** | `seeds/seed.ts:307`, `server.ts:38`, `README.md` | Server startup runs `seedDatabase(false)` automatically creating an admin with known password `Admin123!` and email `admin@prescription.com`. Credentials were also published in public documentation. |
| **SEC-07** | **Insecure Fallback Secrets in Production** | `config/env.ts` | Default fallback values exist for `JWT_SECRET`, `COOKIE_SECRET`, and `OTP_PEPPER`. If missing in production, the application starts with well-known hardcoded keys instead of failing fast. |
| **SEC-08** | **Token Storage in localStorage & Lack of Refresh Rotation** | `AuthContext.tsx`, `api-client.ts` | Long-lived JWT tokens (7 to 30 days) are returned in login responses and stored in browser `localStorage`, making them vulnerable to XSS exfiltration. No refresh token rotation or server-side revocation mechanism exists. |
| **SEC-09** | **Unrestricted File Upload on Medicine CSV** | `controllers/medicine.controller.ts:387`, `routes/medicine.routes.ts:18` | `multer({ dest: os.tmpdir() })` has no file size limit, no MIME-type whitelist, and no validation on file contents, creating denial-of-service and arbitrary file injection risks. |

### 3.2 Architectural Problems (P1)

| ID | Issue | Location | Impact |
|---|---|---|---|
| **ARCH-01** | **Lack of Business Service Layer** | `controllers/*.ts` | Business logic, calculations, audit logging, and database operations are tightly coupled inside controller route handlers, making unit testing difficult and violating Clean Architecture. |
| **ARCH-02** | **Bypassed Repositories** | `repositories/*.ts` | Repositories were scaffolded but not used by controllers, resulting in inconsistent query construction and fragmented data-access logic. |
| **ARCH-03** | **Unversioned API Endpoints** | `routes/index.ts` | Endpoints are mounted at `/api` and `/` without versioning (`/api/v1`), creating breaking change risks for mobile or future API consumers. |
| **ARCH-04** | **Incomplete Module Encapsulation** | `modules/*/index.ts` | Feature modules are hollow barrel files instead of self-contained modules encapsulating routes, controllers, services, repositories, and models. |

### 3.3 Database & Concurrency Issues (P1)

| ID | Issue | Location | Impact |
|---|---|---|---|
| **DB-01** | **Race Condition in ID Generation** | `patient.controller.ts:9`, `prescription.controller.ts:11` | ID generation relies on `countDocuments()` followed by a loop checking `exists()`. Under concurrent patient registration or prescription writing, duplicate key conflicts or counter jumps occur. |
| **DB-02** | **Missing Patient Unique Compound Index** | `models/Patient.ts` | `patientId` is indexed but lacks `{ doctorId: 1, patientId: 1 }` unique compound index, and `phone` lacks doctor-scoped indexing. |
| **DB-03** | **Unindexed Doctor-Scoped Lookups** | `models/Prescription.ts` | Frequently filtered query combinations (e.g. `{ doctorId, status, createdAt }`) require compound indexing to prevent collection scans. |

### 3.4 API Contract Mismatches & Functional Bugs (P1)

| ID | Mismatch / Bug | Frontend Call | Backend Definition | Resolution Required |
|---|---|---|---|---|
| **API-01** | **Prescription Finalization** | `POST /api/prescriptions/:id/finalize` in `prescription.api.ts` | Not defined in `prescription.routes.ts` | Provide explicit `POST /api/v1/prescriptions/:id/finalize` endpoint while maintaining `status: 'FINALIZED'` in `PUT`. |
| **API-02** | **Prescription Cloning** | `POST /api/prescriptions/:id/clone` in `prescription.api.ts` | `POST /api/prescriptions/:id/duplicate` in `prescription.routes.ts` | Support both `/clone` and `/duplicate` routes. |
| **API-03** | **Public Share Endpoint Path** | `GET /api/public/prescriptions/:token` in `prescription.api.ts` | `GET /api/public/prescriptions/share/:token` in `public.routes.ts` | Support both path signatures on public router. |
| **API-04** | **Patient Timeline / History** | `GET /api/patients/:id/timeline` in `patient.api.ts` | `GET /api/patients/:id/history` in `patient.routes.ts` | Aliasing `/timeline` to `/history` on patient router. |
| **API-05** | **Dummy Scripts in Frontend** | `"lint": "echo ..."` `"test": "echo ..."` | No real tests in `frontend/package.json` | Configure real ESLint and Vitest checks. |

---

## 4. Remediation Plan by Implementation Phase

### Phase 1: Critical Security Hardening
1. Secure environment configuration: strict startup validation in production (`fail-fast`), remove hardcoded secrets, require secure `ADMIN_SEED_PASSWORD` or disable auto-admin in production.
2. Restrict CORS to explicit allowlist from `CORS_ORIGIN`, blocking wildcard reflection when credentials are used.
3. Protect diagnostics: disable `/api/health/email-diagnostic` in production or require Admin authorization; redact credentials.
4. Enforce doctor-to-patient ownership in all patient lookups and updates.
5. Harden public prescription sharing: check `FINALIZED` status, implement share token expiration, return minimal sanitized DTO (redact patient contact and doctor private metadata), add rate limiting.
6. Guard seed and test scripts: prevent destructive operations on non-test databases, enforce `MONGODB_TEST_URI` or `mongodb-memory-server` for test runners.

### Phase 2: Modular Monolith Backend Architecture
1. Reorganize `backend/src/modules/` into clean layered domain modules:
   - `auth`, `users`, `doctors`, `patients`, `prescriptions`, `medicines`, `chambers`, `templates`, `uploads`, `admin`, `audit`.
   - Each module contains: `routes`, `controller`, `service`, `repository`, `model`, `validation`, `types`.
2. Introduce a unified `shared/` layer:
   - `middleware/`, `errors/`, `utils/`, `types/`, `constants/`.
3. Introduce an `infrastructure/` layer:
   - `database/`, `email/`, `storage/`, `logging/`.

### Phase 3: Database & API Hardening
1. Implement concurrency-safe ID generation using atomic sequence counters in MongoDB.
2. Optimize indexes with compound indexes for doctor-scoped queries.
3. Introduce versioned REST routes `/api/v1/*` with legacy backward-compatibility fallbacks to preserve existing integrations.
4. Resolve all API endpoint discrepancies (`finalize`, `clone`, `timeline`, `share`).

### Phase 4: Frontend Integration & Session Hardening
1. Update frontend API client to support short-lived tokens with HttpOnly refresh cookies and automatic token refresh without token storms.
2. Align frontend endpoint callers with updated backend contracts.
3. Replace dummy lint and test scripts with real ESLint and test runners.

### Phase 5: Secure Storage & Uploads
1. Build storage provider abstraction (Local disk / Memory / Cloudinary).
2. Validate file uploads with MIME-type verification, size boundaries, and sanitization.

### Phase 6: Observability, Tests & Production Readiness
1. Implement comprehensive unit, integration, and security regression test suites.
2. Add structured logging, request correlation IDs (`X-Request-ID`), liveness and readiness health checks.
3. Produce complete architectural and operational documentation.
