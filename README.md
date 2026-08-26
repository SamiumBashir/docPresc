# 🩺 DocRx — Digital Prescription Management System

A modern, fast, and production-ready **Digital Prescription Management Web Application** designed for doctors and medical chambers in Bangladesh.

---

## 🚀 Key Features

- **⚡ Fast Prescription Writing**: Write complete digital prescriptions in under a minute.
- **📄 Live Pad Preview**: Real-time BMDC-standard prescription pad preview with instant **A4 / A5** paper switching.
- **💊 Multi-System Medicine Search**: Fast debounced autocomplete supporting **Allopathic**, **Unani (ইউনানি)**, and **Ayurvedic (আয়ুর্বেদিক)** medicines with quick-dose pills (`1+0+1`, `1+1+1`, meal timing).
- **📋 Patient Medical Timeline**: Global patient search (`Ctrl+K`), allergy warnings, visit history, and 1-click **"Clone Rx"** for returning patients.
- **🖨️ Clean Print & PDF**: Instant browser printing and high-fidelity PDF export with full Bengali font support.
- **🔒 Secure & Compliant**: Immutability for finalized prescriptions, public QR code verification, and security audit logs.
- **🌐 Bilingual Support**: Full English and বাংলা (Bengali) interface.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express.js, TypeScript, Zod Validation, JWT Auth
- **Database**: MongoDB & Mongoose *(with auto in-memory database fallback for zero-config run)*
- **Export**: jsPDF, html2canvas, QR Code

---

## 💻 Quick Start

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/SamiumBashir/docPresc.git
cd docPresc

# Install all dependencies (Root, Backend & Frontend)
npm run install:all
```

### 2. Run Development Server
```bash
# Starts both Backend (port 5000) and Frontend (port 5173) concurrently:
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

---

## 🔑 Demo Accounts

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Doctor** | `doctor@prescription.com` | `Doctor123!` | Dr. Moshfiqur Rahman (BMDC: `A-54321`) |
| **Admin** | `admin@prescription.com` | `Admin123!` | System Manager |

*(You can also use the 1-click demo buttons on the login screen)*

---

## 📄 License
MIT License
