# 🩺 DocPresc — Digital Prescription Management System

A production-ready, enterprise-grade **Digital Prescription Management Web Application** designed specifically for doctors, clinical chambers, and healthcare organizations in Bangladesh.

---

## 🚀 Key Features

- **⚡ Fast Prescription Writing**: Complete digital prescriptions in under a minute with structured inputs.
- **📄 Live Pad Preview**: Real-time BMDC-standard prescription pad preview with instant **A4 / A5** paper switching.
- **💊 26,373+ Formulary Database**: Fast debounced autocomplete supporting **Allopathic**, **Unani (ইউনানি)**, **Ayurvedic (আয়ুর্বেদিক)**, and **Herbal** medicines with quick-dose presets (`1+0+1`, `1+1+1`, meal timing).
- **📋 Patient Medical Timeline**: Global patient search (`Ctrl+K`), allergy warnings, visit history, and 1-click **"Clone Rx"** for returning patients.
- **🖨️ Clean Print & PDF**: Instant browser printing and high-fidelity PDF export with full Bengali font support.
- **🔐 Secure 6-Digit Email OTP Recovery**: Cryptographically secure password reset flow with SHA-256 digests, 60s cooldown, 5-attempt brute-force protection, and zero-enumeration design.
- **🛡️ Enterprise Super Admin Hub**: Consolidated directly inside `frontend/src/admin/`, providing executive metrics, doctor BMDC license approvals, account activation/suspension toggles, formulary management, and security audit logs.
- **🔒 Tamper-Proof & Compliant**: Immutability for finalized prescriptions, public QR code verification, and security audit logs.
- **🌐 Bilingual Support**: Full English and বাংলা (Bengali) interface with seamless switching.

---

## 🛠️ Monorepo Architecture

```
DocPresc/
├── frontend/    # React 18, Vite, Tailwind CSS (Doctor Portal & Admin Hub) (Port 5173)
│   ├── src/app/       # Routing, layouts, providers, guards
│   ├── src/features/  # Clinical feature slices (auth, dashboard, prescriptions, patients, etc.)
│   ├── src/admin/     # Enterprise Admin Center (pages, layouts, components, hooks, services)
│   └── src/locales/   # English & Bengali translation matrices
└── backend/     # Node.js, Express, TypeScript, MongoDB API (Port 5000)
    ├── src/modules/       # Cohesive domain feature modules
    ├── src/repositories/  # Data access abstractions for Mongoose models
    ├── src/validators/    # Zod input validation schemas
    └── data/medex/        # Cleaned MedEx datasets (25,341 allopathic, 916 herbal)
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
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Validation & Test Commands

```bash
# Run all automated tests (Unit, OTP flow, Regression, E2E)
npm test

# Run TypeScript type check across both workspaces
npm run typecheck

# Production build across frontend and backend
npm run build

# Run lint checks
npm run lint
```

---

## 🔑 Demo Accounts

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Doctor** | `doctor@prescription.com` | `Doctor123!` | Dr. Moshfiqur Rahman (BMDC: `A-54321`) |
| **Admin** | `admin@prescription.com` | `Admin123!` | System Manager |

---

## 📚 Documentation

Detailed architectural and operational documentation is available in `docs/`:
- [System Architecture](docs/architecture.md)
- [API Contracts](docs/api-contracts.md)
- [Feature Inventory](docs/feature-inventory.md)
- [Migration Plan](docs/migration-plan.md)
- [Production Deployment Guide](docs/deployment.md)

---

## 📄 License
MIT License
