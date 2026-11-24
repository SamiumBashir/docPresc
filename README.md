# 🩺 DocPresc — Digital Prescription Management System

A production-ready, enterprise-grade **Digital Prescription Management Web Application** designed specifically for doctors, clinical chambers, and healthcare organizations in Bangladesh.

Built as a **Modular Monolith with Clean Layered Architecture** (Node.js, Express, TypeScript, MongoDB, React, Vite, Tailwind CSS).

---

## 🚀 Key Features

- **⚡ Fast Prescription Writing**: Complete digital prescriptions in under a minute with structured clinical inputs.
- **📄 Live Pad Preview**: Real-time BMDC-standard prescription pad preview with instant **A4 / A5** paper switching.
- **💊 26,373+ Formulary Database**: Fast debounced autocomplete supporting **Allopathic**, **Unani (ইউনানি)**, **Ayurvedic (আয়ুর্বেদিক)**, and **Herbal** medicines with quick-dose presets (`1+0+1`, `1+1+1`, meal timing).
- **📋 Patient Medical Timeline**: Global patient search (`Ctrl+K`), allergy warnings, visit history, and 1-click **"Clone Rx"** for returning patients.
- **🖨️ Clean Print & PDF**: Instant browser printing and high-fidelity PDF export with full Bengali font support.
- **🔐 Secure 6-Digit Email OTP Recovery**: Cryptographically secure password reset flow with SHA-256 digests, 60s cooldown, 5-attempt brute-force protection, and zero-enumeration design.
- **🛡️ Enterprise Super Admin Hub**: Consolidated directly inside `frontend/src/admin/`, providing executive metrics, doctor BMDC license approvals, account activation/suspension toggles, formulary management, and security audit logs.
- **🔒 Tamper-Proof & Anti-IDOR Compliant**: Strict doctor-scoped patient and prescription data isolation at the service/repository layer, finalized prescription immutability, sanitized public QR code verification, and security audit logs.
- **🌐 Bilingual Support**: Full English and বাংলা (Bengali) interface with seamless switching.
- **📖 OpenAPI / Swagger Documentation**: Full interactive API documentation available out-of-the-box at `/api/v1/docs`.

---

## 🛠️ Modular Monolith Architecture

```
DocPresc/
├── frontend/                     # React 18, Vite, Tailwind CSS (Doctor Portal & Admin Hub) (Port 5173)
│   ├── src/app/                  # Routing, layouts, providers, guards
│   ├── src/features/             # Clinical feature slices (auth, dashboard, prescriptions, patients, etc.)
│   ├── src/admin/                # Enterprise Admin Center (pages, layouts, components, hooks, services)
│   ├── src/services/             # Centralized API client with 401 refresh token queue
│   └── src/locales/              # English & Bengali translation matrices
└── backend/                      # Node.js, Express, TypeScript, MongoDB API (Port 5000)
    ├── src/config/               # Database connection (db.ts) & Environment (env.ts)
    ├── src/modules/              # Domain-Driven Business Modules (Routes, Controller, Service, Repo)
    │   ├── auth/                 # JWT Auth, Refresh Token Rotation, Session Revocation, OTP
    │   ├── patients/             # Patient Registry, Demographics, Visit History (Anti-IDOR)
    │   ├── prescriptions/        # Prescription CRUD, Finalization, Cloning, Public Sharing
    │   ├── medicines/            # 26,373+ Formulary Database Autocomplete & Indexing
    │   ├── chambers/             # Multi-chamber scheduling & default chamber resolution
    │   ├── templates/            # Clinical prescription templates
    │   ├── admin/                # Doctor approvals, audit logs, system statistics
    │   └── uploads/              # Signature uploads (Cloudinary with local Base64 fallback)
    ├── src/shared/               # Core errors, middleware, asyncHandler, and atomic ID generators
    ├── src/infrastructure/       # Storage and Email delivery abstractions
    ├── src/routes/v1/            # Versioned API routes (/api/v1/*)
    └── src/docs/                 # OpenAPI 3.0 specification & Swagger UI
```

---

## 💻 Quick Start

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/SamiumBashir/docPresc.git
cd docPresc

# Install dependencies across both workspaces
npm run install:all
```

### 2. Environment Configuration
Copy `.env.example` to `backend/.env` and `frontend/.env`:
```bash
cp .env.example backend/.env
cp .env.example frontend/.env
```

### 3. Run Development Servers
```bash
# Concurrently starts Backend API (Port 5000) and Frontend App (Port 5173):
npm run dev
```

- **Doctor Portal**: [http://localhost:5173](http://localhost:5173)
- **Admin Center**: [http://localhost:5173/admin](http://localhost:5173/admin)
- **Backend API (v1)**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **Interactive Swagger Docs**: [http://localhost:5000/api/v1/docs](http://localhost:5000/api/v1/docs)
- **API Health Checks**:
  - Liveness: [http://localhost:5000/api/health/liveness](http://localhost:5000/api/health/liveness)
  - Readiness: [http://localhost:5000/api/health/readiness](http://localhost:5000/api/health/readiness)

---

## 🧪 Validation & Test Commands

```bash
# Run all automated tests (zero-config in-memory MongoDB runner)
npm test

# Run TypeScript type check across frontend and backend
npm run typecheck

# Production build across frontend and backend
npm run build

# Run lint checks
npm run lint
```

---

## 🔑 Development & Demo Accounts (Local Dev Only)

> **Security Note:** In production, admin credentials are never automatically provisioned with default passwords. Administrators must be provisioned securely via `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables.

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Doctor** | `doctor@prescription.com` | `Doctor123!` | Dr. Moshfiqur Rahman (BMDC: `A-54321`) (Dev/Test only) |
| **Admin** | Configured via `ADMIN_EMAIL` | Configured via `ADMIN_PASSWORD` | System Manager |

---

## 📚 Technical Documentation & Guides

- [System Architecture Guide](docs/ARCHITECTURE.md) — Modular Monolith design, layer responsibilities, request lifecycle.
- [Security Architecture & Hardening](docs/SECURITY.md) — Multi-doctor isolation (Anti-IDOR), refresh token rotation, session revocation.
- [Database Architecture & Indexes](docs/DATABASE.md) — Mongoose schemas, compound indexes, atomic sequence counters.
- [Environment Variables Reference](docs/ENVIRONMENT.md) — Production, staging, and local dev variables reference.
- [Testing Architecture Guide](docs/TESTING.md) — In-memory test runner, test suites, regression tests.
- [Migration & Upgrade Guide](docs/MIGRATION.md) — Upgrading from legacy monolithic routes to `/api/v1`.
- [Complete Audit Report](docs/AUDIT_REPORT.md) — Comprehensive pre/post-refactoring audit findings and resolution log.
