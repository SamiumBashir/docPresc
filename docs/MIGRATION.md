# docPresc Migration & Upgrade Guide
## Upgrading to the Modular Monolith Architecture (v1)

This guide documents the upgrade path from the legacy monolithic route architecture to the new **Modular Monolith** with versioned endpoints (`/api/v1/*`).

---

## 1. What Changed?

1. **Modular Architecture**: Business domains are now organized into `backend/src/modules/` (`auth`, `patients`, `prescriptions`, `medicines`, `chambers`, `templates`, `admin`, `uploads`).
2. **Versioned REST API**: All endpoints are mounted at `/api/v1/*`.
3. **Backward Compatibility**: Legacy `/api/*` and `/` routes are preserved. Existing frontend builds continue to function without disruption.
4. **Session Management**: Introduction of HttpOnly refresh token rotation and server-side session revocation in `backend/src/models/Session.ts`.
5. **Atomic ID Generation**: Replacement of race-prone `countDocuments()` with atomic MongoDB `Counter` sequence generators (`PAT-YYYY-XXXX` and `RX-YYYY-XXXXXX`).
6. **Strict Patient Ownership**: Scoping of all patient and prescription queries to `doctorId` at the service and repository level.

---

## 2. API Endpoint Mapping

| Domain | Legacy Endpoint | Versioned v1 Endpoint | Notes |
|---|---|---|---|
| **Auth** | `POST /api/auth/register` | `POST /api/v1/auth/register` | Sets HttpOnly refresh token cookie |
| **Auth** | `POST /api/auth/login` | `POST /api/v1/auth/login` | Sets HttpOnly refresh token cookie |
| **Auth** | - | `POST /api/v1/auth/refresh` | Rotates refresh token |
| **Auth** | `POST /api/auth/logout` | `POST /api/v1/auth/logout` | Revokes server session & clears cookies |
| **Patients** | `GET /api/patients` | `GET /api/v1/patients` | Doctor-scoped |
| **Patients** | `POST /api/patients` | `POST /api/v1/patients` | Concurrency-safe ID generation |
| **Patients** | `GET /api/patients/:id/timeline` | `GET /api/v1/patients/:id/timeline` | Aliased to `/history` |
| **Prescriptions** | `POST /api/prescriptions/:id/finalize` | `POST /api/v1/prescriptions/:id/finalize` | Locks prescription status |
| **Prescriptions** | `POST /api/prescriptions/:id/clone` | `POST /api/v1/prescriptions/:id/duplicate` | Aliased to `/clone` |
| **Prescriptions** | `POST /api/prescriptions/:id/share` | `POST /api/v1/prescriptions/:id/share` | Finalized only |
| **Public** | `GET /api/public/prescriptions/:token` | `GET /api/v1/public/prescriptions/:token` | Strips patient PII |
| **Docs** | - | `GET /api/v1/docs` | Interactive Swagger UI |
| **Docs** | - | `GET /api/v1/openapi.json` | OpenAPI 3.0.3 specification |
| **Health** | `GET /api/health` | `GET /api/health/liveness` | Process uptime probe |
| **Health** | - | `GET /api/health/readiness` | 503 if MongoDB disconnected |

---

## 3. Database Migration Steps

No breaking schema migrations are required:
1. Ensure MongoDB version is 5.0+.
2. The `counters` collection is created automatically on first sequence request.
3. The `sessions` collection is created automatically upon user authentication.
4. Old prescriptions and patients retain their existing IDs and remain fully accessible.
