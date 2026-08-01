# 🩺 DocRx — Doctor Digital Prescription Management System

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![BMDC Compliant](https://img.shields.io/badge/BMDC-Compliant-008BA3)](https://bmdc.org.bd/)

**DocRx** is a modern, fast, professional digital prescription management system engineered specifically for registered medical practitioners and chambers in Bangladesh. It empowers doctors to generate comprehensive digital prescriptions in under 60 seconds, search from over 120+ preloaded Bangladeshi medicines with intelligent debounced autocomplete, prescribe across **Allopathic**, **Unani (ইউনানি)**, and **Ayurvedic (আয়ুর্বেদিক)** systems, track longitudinal patient clinical timelines, and export or print crisp A4/A5 letterhead prescriptions.

---

## 🌟 Key Features

### 1. Interactive Prescription Workspace & Live Pad Preview
- **Split-Screen Ergonomics**: Clinical entry forms on the left and an authentic, real-time live preview of the prescription pad on the right.
- **Authentic Bangladesh Medical Chamber Layout**: Strict adherence to BMDC standards including doctor letterhead, BMDC Registration Number, chamber consultation address, patient bar, left column for clinical notes (C/C, O/E, Vitals, Investigations, Diagnosis), right column with **℞** emblem and numbered drug schedule, bilingual advice (বাংলা ও English), follow-up date, digital doctor signature, and verification QR code.
- **Paper Size Switcher**: One-click instant toggle between standard **A4** (210×297mm) and compact **A5** (148×210mm) prescription pads.
- **Draft Autosave & Crash Recovery**: Continuous `localStorage` sync with automatic prompt to restore unfinished drafts if accidentally closed.
- **Finalization & Legal Immutability**: Finalized prescriptions are permanently locked as immutable medical records with a cryptographic `shareToken`.

### 2. Intelligent Medicine Autocomplete & Quick-Dose Controls
- **Ultra-Fast Search**: 300ms debounced multi-field index matching brand names, generic names, strengths, dosage forms, and manufacturers.
- **Multi-System Drug Support**:
  - 💊 **Allopathic (অ্যালোপ্যাথিক)**: Square, Beximco, Incepta, Renata, Healthcare, Opsonin, Eskayef, ACI, Aristopharma.
  - 🌿 **Unani (ইউনানি)**: Hamdard Laboratories, Modern Herbal, Ibn Sina Natural (e.g. *Cinkara, Safi, Sualin, Carmina, Habbe Suranjan, Majun Arad Khurma, Khamira Gaozaban*).
  - 🌱 **Ayurvedic (আয়ুর্বেদিক)**: Sadhana Aushadhalaya, The Ayurvedic Pharmacy / AP, Sri Sri Tattva (e.g. *Chyawanprash, Draksharishta, Ashwagandharishta, Dashamularishta, Triphala Churna, Amritarishta*).
- **One-Click Quick Dose Pills**:
  - **Frequencies**: `1+0+0`, `0+1+0`, `0+0+1`, `1+0+1`, `1+1+1`, `1+1+1+1`
  - **Dose Units**: `1/2 tablet`, `1 tablet`, `2 tablets`, `5 ml (1 tsp)`, `10 ml (2 tsp)`, `1 puff`, `2 puffs`
  - **Durations**: `3 days`, `5 days`, `7 days`, `10 days`, `14 days`, `1 month`, `Continue (চলবে)`
  - **Instructions**: `After meal (খাবার পর)`, `Before meal (খাবার আগে)`, `With meal`, `At bedtime`, `Empty stomach`, `জ্বর/ব্যথা থাকলে`
- **Reorderable Medicine Table**: Interactive Up/Down controls to prioritize drug order (e.g. Antibiotic on top, Painkiller, Antiulcerant).

### 3. Patient Management & Medical History Timeline
- **Global Quick Search (`Ctrl+K`)**: Search instantly by Patient Name, Phone (`0171...`), or Patient ID (`PAT-2026-XXXX`).
- **Longitudinal History Timeline**: Full chronological record of past consultations, previous diagnoses, vitals, and prescribed drugs.
- **One-Click "Clone Rx"**: Duplicate a previous prescription into an editable new draft for returning patient follow-up visits in seconds.

### 4. Print & PDF Generation
- **Pixel-Perfect Print Engine**: Dedicated `@media print` rules hiding sidebars, navigation, and UI chrome to print only the letterhead pad.
- **High-Fidelity PDF Export**: Client-side canvas rasterization with full UTF-8 font preservation for Bengali typography (*Hind Siliguri / Inter*).
- **Public QR Verification**: Secure public URL (`/prescription/share/:token`) enabling patients to view, download, or verify their prescription on any smartphone.

### 5. Clinical Templates, Multi-Chamber Support & Admin
- **Protocol Presets**: Preloaded with clinical templates for *Common Cold & Viral Fever, Acute Gastritis & GERD, Essential Hypertension & Dyslipidemia*.
- **Multi-Chamber Manager**: Manage multiple consultation chambers with individual visiting hours and an active chamber switcher.
- **Admin Oversight**: BMDC verification, doctor account approvals, bulk CSV drug import, and security compliance audit logs.
- **Bilingual Interface**: Seamless instant toggle between English and বাংলা (Bengali).

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti |
| **PDF & Print Engine** | `jsPDF`, `html2canvas`, `qrcode.react`, CSS Print Media Queries |
| **Backend Server** | Node.js, Express.js, TypeScript |
| **Database & ORM** | MongoDB, Mongoose *(with automated in-memory MongoDB fallback for zero-config startup)* |
| **Validation & Security** | Zod, JSON Web Tokens (JWT), Bcrypt.js, Helmet, CORS, Cookie Parser |
| **Fonts** | Inter, Hind Siliguri (Google Fonts), JetBrains Mono |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/) (version 9 or higher)
- Optional: Local MongoDB instance (The backend automatically falls back to an embedded in-memory MongoDB if local MongoDB is not running).

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/SamiumBashir/prescription-management-system.git
   cd prescription-management-system
   ```

2. **Install all dependencies (Root, Backend & Frontend)**:
   ```bash
   npm run install:all
   ```

3. **Run the Development Servers**:
   ```bash
   # Starts both Backend (port 5000) and Frontend (port 5173) concurrently:
   npm run dev
   ```

   Or run them in separate terminal windows:
   ```bash
   # Terminal 1 - Backend Server:
   npm run dev:backend

   # Terminal 2 - Frontend Application:
   npm run dev:frontend
   ```

4. **Access the Application**:
   - **Frontend App**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
   - **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Persona & BMDC |
| :--- | :--- | :--- | :--- |
| **Doctor** | `doctor@prescription.com` | `Doctor123!` | Dr. Moshfiqur Rahman (BMDC: `A-54321`) |
| **Admin** | `admin@prescription.com` | `Admin123!` | System Administrator & Audit Oversight |

*Tip: You can also use the convenient 1-click demo buttons on the login screen.*

---

## 🧪 Automated Testing

DocRx includes a comprehensive automated test suite testing authentication, BMDC registration verification, medicine database search, Unani/Ayurvedic retrieval, doctor authorization isolation, prescription finalization immutability, and cloning:

```bash
# Run unit & privacy test suite:
npm test

# Run live end-to-end API integration tests:
npm --prefix backend run test:e2e
```

---

## 📁 Project Structure

```
prescription/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment & Database connection (with Memory Server fallback)
│   │   ├── controllers/     # Auth, Doctor, Patient, Medicine, Prescription, Chamber, Admin
│   │   ├── middleware/      # JWT Auth, Doctor Scoping, Audit Logging, Error Handling
│   │   ├── models/          # Mongoose schemas: User, Doctor, Patient, Medicine, Prescription...
│   │   ├── routes/          # Modular API routes
│   │   ├── seeds/           # 120+ Bangladeshi medicines (Allopathic, Unani, Ayurvedic), chambers, templates
│   │   ├── tests/           # Unit & Live E2E test scripts
│   │   ├── validators/      # Zod validation schemas
│   │   ├── app.ts           # Express application configuration
│   │   └── server.ts        # Server entrypoint
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/             # HTTP Client with error handling and credentials
│   │   ├── components/
│   │   │   ├── layout/      # AppLayout, Sidebar, TopNavbar, QuickPatientSearchModal
│   │   │   ├── prescription/# LivePrescriptionPad, MedicineAutocomplete, QuickDosePills, Vitals...
│   │   │   └── ui/          # Modal, Toast notifications
│   │   ├── context/         # AuthContext, LanguageContext (EN/BN)
│   │   ├── i18n/            # English & Bengali translations
│   │   ├── pages/
│   │   │   ├── Admin/       # AdminDashboard, AdminDoctors, AdminMedicines (CSV Import), AuditLogs
│   │   │   ├── Auth/        # Login, Register
│   │   │   ├── Chambers/    # ChamberList
│   │   │   ├── Dashboard/   # Doctor KPI Dashboard
│   │   │   ├── Medicines/   # MedicineCatalog with Allopathic/Unani/Ayurvedic filters
│   │   │   ├── Patients/    # PatientList, PatientDetails (Medical History Timeline)
│   │   │   ├── Prescriptions/# NewPrescription, PrescriptionHistory, PrescriptionView
│   │   │   ├── Profile/     # DoctorProfile
│   │   │   ├── Public/      # PublicPrescriptionView (QR verification)
│   │   │   ├── Reports/     # DoctorReports (Clinical Analytics)
│   │   │   └── Settings/    # DoctorSettings
│   │   ├── types/           # TypeScript data contracts & interfaces
│   │   ├── App.tsx          # Application Routes & Protected Guards
│   │   ├── index.css        # Tailwind & Print Media Stylesheet
│   │   └── main.tsx         # React root mount
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
├── package.json
└── README.md
```

---

## 📄 License

This project is licensed under the **MIT License**.
