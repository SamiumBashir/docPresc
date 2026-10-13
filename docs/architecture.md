# DocPresc Full-Stack System Architecture

## 1. System Overview
DocPresc is an enterprise-grade digital prescription management system engineered specifically for Bangladeshi medical practitioners, clinical staff, and healthcare organizations. It provides a bilingual (Bengali & English) clinical pad interface, real-time medicine autocomplete across a database of 26,373+ formulary medicines (Allopathic, Unani, Ayurvedic, Herbal), multi-chamber clinic scheduling, patient electronic medical records (EMR), cryptographically secured email OTP password recovery, tamper-proof prescription finalization, and public QR-code authenticity verification.

---

## 2. Monorepo Organization & Workspaces
The repository is structured as a unified monorepo containing exactly two production applications: `frontend` and `backend`.

```
DocPresc/
├── frontend/                     # React 18 + Vite + Tailwind CSS Single-Page Application
│   ├── public/                   # Static assets & web manifests
│   ├── src/
│   │   ├── app/                  # Application core, routing, layouts, providers, guards
│   │   │   ├── router/           # React Router v6 centralized route matrix & code splitting
│   │   │   ├── layouts/          # Clinical consultation AppLayout
│   │   │   ├── providers/        # ErrorBoundary, LanguageProvider, AuthProvider, QueryClient
│   │   │   └── guards/           # ProtectedRoute & AdminRoute role guards
│   │   ├── features/             # Business feature modules
│   │   │   ├── auth/             # Login, registration, password recovery, session restore
│   │   │   ├── dashboard/        # Clinical metrics, today's schedule, quick actions
│   │   │   ├── prescriptions/    # Prescription editor, live pad preview, history, cloning
│   │   │   ├── patients/         # Patient registry, demographics, search (Ctrl+K)
│   │   │   ├── medicines/        # Formulary catalog & brand/generic search
│   │   │   ├── medical-history/  # Patient visit timeline & previous prescription retrieval
│   │   │   ├── pdf/              # Print engine & client-side PDF export (A4/A5)
│   │   │   └── qr-verification/  # Public patient verification view
│   │   ├── admin/                # Consolidated Enterprise Admin Center
│   │   │   ├── pages/            # Dashboard, Doctor management, Medicines, Audit logs
│   │   │   ├── layouts/          # Dedicated dark-slate AdminLayout
│   │   │   ├── components/       # Badges, modals, viewers
│   │   │   ├── hooks/            # TanStack Query custom hooks
│   │   │   ├── services/         # Administrative API services
│   │   │   └── routes/           # Admin route subtree
│   │   ├── components/           # Shared UI components
│   │   │   ├── ui/               # Button, Modal, PageLoader, Toast, ProgressBar
│   │   │   ├── forms/            # Inputs, selects, autosuggest
│   │   │   ├── feedback/         # Error states, empty states
│   │   │   └── shared/           # Navigation bars, sidebar, language switcher
│   │   ├── services/             # Canonical API client & endpoint definitions
│   │   ├── locales/              # English & Bengali clinical translation matrices
│   │   ├── types/                # Domain TypeScript interfaces
│   │   └── main.tsx              # Application entrypoint
│   └── package.json
│
├── backend/                      # Node.js + Express + TypeScript API Server
│   ├── src/
│   │   ├── config/               # Database connection (db.ts) & Environment (env.ts)
│   │   ├── modules/              # Cohesive feature modules
│   │   │   ├── auth/             # JWT auth, doctor signup, credentials verification
│   │   │   ├── users/            # Doctor profile & account preferences
│   │   │   ├── patients/         # Patient EMR records & search
│   │   │   ├── prescriptions/    # Prescription CRUD, finalization immutability, cloning
│   │   │   ├── medicines/        # 26,373+ MedEx formulary search & indexing
│   │   │   ├── medical-history/  # Patient visit history & prescription timeline
│   │   │   ├── admin/            # Doctor license approval, system telemetry, audit trail
│   │   │   ├── otp/              # 6-digit cryptographic OTP generation & verification
│   │   │   ├── email/            # Nodemailer Gmail SMTP & Resend transactional delivery
│   │   │   ├── audit-logs/       # Security compliance audit logging
│   │   │   └── qr-verification/  # Public prescription verification token resolution
│   │   ├── middleware/           # Auth, error handler, rate limiter, file uploads
│   │   ├── repositories/         # Data access abstractions for Mongoose models
│   │   ├── validators/           # Zod schema definitions for input validation
│   │   ├── errors/               # Centralized AppError hierarchy
│   │   ├── constants/            # HTTP status codes, roles, pagination limits
│   │   ├── types/                # Express request extensions, API contracts
│   │   ├── app.ts                # Express application factory & middleware pipeline
│   │   └── server.ts             # Server startup, multi-port binding, graceful shutdown
│   ├── data/medex/               # Cleaned MedEx datasets (25,341 allopathic, 916 herbal)
│   ├── scripts/                  # Scraping, cleaning, seeding automation
│   ├── tests/                    # Unit, regression, flow, and end-to-end integration test suites
│   └── package.json
│
├── docs/                         # System architecture, API contracts, deployment guides
├── .github/workflows/ci.yml      # Automated continuous integration workflow
├── .env.example                  # Consolidated environment variable configuration template
└── package.json                  # Root workspace definition & unified scripts
```

---

## 3. Request Processing Pipeline
Every incoming API request follows a strictly layered, predictable lifecycle:

```
HTTP Request
     │
     ▼
[Security & Network Middleware]
  - Helmet (HTTP security headers)
  - CORS Origin Reflection
  - Compression (Gzip/Deflate)
  - Rate Limiting (express-rate-limit)
     │
     ▼
[Routing Layer] (`backend/src/routes/`)
     │
     ▼
[Authentication & Authorization] (`backend/src/middleware/auth.ts`)
  - Centralized Bearer JWT validation
  - Doctor / Admin Role-Based Access Control (RBAC)
  - Object-level tenant ownership enforcement
     │
     ▼
[Input Validation] (`backend/src/validators/schemas.ts`)
  - Strict Zod schema parsing
  - Sanitization of user-submitted text & payloads
     │
     ▼
[Controller Layer] (`backend/src/controllers/`)
  - HTTP concern handling (status codes, headers, cookie lifecycle)
  - Delegation to domain services
     │
     ▼
[Service Layer] (`backend/src/services/` & `backend/src/modules/`)
  - Business rules implementation
  - Finalization immutability enforcement
  - Audit log emission
     │
     ▼
[Repository / Model Layer] (`backend/src/repositories/` & `backend/src/models/`)
  - Mongoose ODM schema validation
  - MongoDB Atlas query execution & indexing
     │
     ▼
JSON HTTP Response / Structured Error (`backend/src/middleware/errorHandler.ts`)
```

---

## 4. Decoupled Application Architecture
- `app.ts` encapsulates the creation and configuration of the Express application instance without triggering network listeners or opening database connections on import. This enables test runners to evaluate routes and middleware in isolation.
- `server.ts` performs runtime preflight checks, validates environment variables, starts the HTTP server with multi-port binding (`PORT`, `5000`, `8080`), triggers background database connectivity, and handles `SIGTERM`/`SIGINT` signals for graceful shutdown.

---

## 5. Security Architecture
1. **Password Hashing**: Uses `bcryptjs` with salt rounds = 10 for user authentication passwords.
2. **Cryptographic OTP Flow**: 6-digit password reset OTPs are hashed using `crypto.createHash('sha256')` combined with a server-side `OTP_PEPPER` before persistent storage. Raw OTP tokens are never written to disk or logs.
3. **Immutability of Medical Prescriptions**: Finalized prescriptions (`status: 'FINALIZED'`) reject direct update mutations. If corrections are required, returning patients receive a fresh clone prescription preserving the parent lineage.
4. **Tenant Isolation**: Doctors cannot inspect or mutate patients or prescriptions owned by other practitioners. Object-level doctor ID ownership checks are enforced on every query.
5. **Zero Enumeration Password Reset**: Forgot password and OTP requests return generic success messages, preventing malicious enumeration of registered clinical emails.
