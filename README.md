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

## 🛠️ Tech Stack & Structure

```
Prescription/
├── backend/    # Node.js, Express, TypeScript, MongoDB API (Port 5000)
├── frontend/   # Doctor & Chamber Prescription Web App (Port 5173)
└── admin/      # Enterprise Admin Management Dashboard (Port 5174)
```

---

## 💻 Quick Start

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/SamiumBashir/docPresc.git
cd docPresc

# Install all dependencies (Backend, Frontend & Admin)
npm run install:all
```

### 2. Run Development Servers
```bash
# Starts Backend (5000), Frontend (5173), and Admin (5174) concurrently:
npm run dev
```

- **Doctor Portal (Frontend)**: [http://localhost:5173](http://localhost:5173)
- **Admin Management Portal**: [http://localhost:5174](http://localhost:5174)
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
