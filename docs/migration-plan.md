# DocPresc Architecture Refactoring & Migration Plan

## 1. Migration Goals & Constraints
- **Goal**: Consolidate the distributed DocPresc system into a unified, production-ready monorepo with exactly two primary applications (`frontend` and `backend`).
- **Core Constraint 1**: Zero regressions to existing clinical features, UI designs, Bengali typography, or business rules.
- **Core Constraint 2**: Consolidate the root `admin/` application into `frontend/src/admin/`, eliminating redundant sub-applications while retaining the full dark-slate admin experience, BMDC verification controls, formulary management, and audit logging.
- **Core Constraint 3**: Keep the `backend` independently executable and deployable on platforms like Render and Railway.
- **Core Constraint 4**: Zero destructive database operations on existing MongoDB Atlas collections.

---

## 2. Phase-by-Phase Execution Log

### Phase 1: Full Audit and Baseline Recording
- Inspected the repository tree across `frontend/`, `backend/`, and `admin/`.
- Verified passing baseline across all 4 test suites (`run-tests.ts`, `e2e-verification.ts`, `test-otp-flow.ts`, `regression-server-connection.ts`).
- Verified baseline frontend and backend builds.
- Produced initial architecture audit and feature matrix.

### Phase 2: Monorepo Root & Workspace Infrastructure
- Configured npm workspaces in root `package.json` targeting `["frontend", "backend"]`.
- Added standardized root commands: `npm run dev`, `npm run build`, `npm run test`, `npm run typecheck`, `npm run lint`.
- Created consolidated root `.env.example` documenting all configuration keys with safe defaults.
- Established `.github/workflows/ci.yml` for automated GitHub Actions build and test verification.
- Maintained `scripts/setup-root-dist.js` to ensure backward-compatibility for Render deployments when root directory is used.

### Phase 3: Frontend Consolidation & Admin Unification
- Created target structure inside `frontend/src/`:
  - `app/`: Router, layouts, providers, guards
  - `admin/`: Complete enterprise administration hub migrated from `admin/src/`
  - `features/`: Feature-sliced clinical domains (`auth`, `dashboard`, `prescriptions`, `patients`, `medicines`, `medical-history`, `pdf`, `qr-verification`)
  - `services/`: Canonical `api-client.ts` and modular endpoint services (`auth.api.ts`, `patient.api.ts`, etc.)
  - `locales/`: Bilingual English & Bengali translation matrix (`translations.ts`)
- Integrated `AdminLayout`, `AdminDashboard`, `DoctorManagement`, `MedicineManagement`, `AuditLogs`, and `AdminLogin` into the centralized router guarded by `ProtectedRoute requiredRole="admin"`.
- Cleanly deleted the redundant root `admin/` directory after verifying builds.

### Phase 4: Backend Modularization & Layer Decoupling
- Established cohesive feature slices in `backend/src/modules/`:
  - `auth`, `users`, `patients`, `prescriptions`, `medicines`, `medical-history`, `admin`, `otp`, `email`, `audit-logs`, `qr-verification`.
- Decoupled data access with `backend/src/repositories/`:
  - `patient.repository.ts`, `prescription.repository.ts`, `medicine.repository.ts`, `user.repository.ts`.
- Standardized error hierarchy with `backend/src/errors/` (`AppError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`).
- Preserved existing controllers and routes with seamless module re-exports.
- Maintained strict decoupling of `createApp()` in `app.ts` from server startup in `server.ts`.

### Phase 5: Verification & Quality Assurance
- Validated `npm run typecheck` across both applications: 0 TypeScript errors.
- Validated `npm run build` across both applications: 0 build errors.
- Executed all backend test suites:
  - `run-tests.ts`: 16/16 Passed
  - `test-otp-flow.ts`: 100% Passed (cryptographic OTP, cooldown, attempt limits)
  - `regression-server-connection.ts`: 18/18 Passed (network classification, session preservation)
  - `e2e-verification.ts`: 100% Passed (login, search, patient, prescription, immutability, clone, timeline, QR)

---

## 3. File Movement Mapping

| Original Location | New Canonical Location | Migration Notes |
|---|---|---|
| `admin/src/components/layout/AdminLayout.tsx` | `frontend/src/admin/layouts/AdminLayout.tsx` | Migrated, updated nav links to `/admin/*`, added doctor portal link |
| `admin/src/pages/Dashboard/AdminDashboard.tsx` | `frontend/src/admin/pages/AdminDashboard.tsx` | Migrated, connected to unified api-client |
| `admin/src/pages/Doctors/DoctorManagement.tsx` | `frontend/src/admin/pages/DoctorManagement.tsx` | Migrated, integrated with TanStack Query |
| `admin/src/pages/Medicines/MedicineManagement.tsx` | `frontend/src/admin/pages/MedicineManagement.tsx` | Migrated, supports formulary modal and CSV imports |
| `admin/src/pages/AuditLogs/AuditLogs.tsx` | `frontend/src/admin/pages/AuditLogs.tsx` | Migrated, connected to unified api-client |
| `admin/src/pages/Auth/AdminLogin.tsx` | `frontend/src/admin/pages/AdminLogin.tsx` | Migrated, authenticates via shared AuthContext |
| `admin/` (root directory) | *Removed* | Completely unified inside `frontend/src/admin/` |
| `frontend/src/api/client.ts` | `frontend/src/services/api-client.ts` | Canonical API client with retry and error typing; `api/client.ts` re-exports |
| `frontend/src/i18n/translations.ts` | `frontend/src/locales/translations.ts` | Canonical translation matrix; `i18n/` re-exports |
| `frontend/src/components/layout/AppLayout.tsx` | `frontend/src/app/layouts/AppLayout.tsx` | Re-exported for target architecture compliance |
| Inline route declarations in `App.tsx` | `frontend/src/app/router/index.tsx` | Centralized code-split router |
