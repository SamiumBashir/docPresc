# DocPresc Production Deployment Guide

## 1. Hosting Architecture Overview
DocPresc is designed for high availability and decoupled scalability:
- **Frontend SPA**: Deployable to **Vercel**, **Netlify**, or **Cloudflare Pages**.
- **Backend API**: Independently deployable to **Render**, **Railway**, **AWS ECS**, or a custom Docker host.
- **Database**: Managed **MongoDB Atlas** replica set (version 6.0+ recommended).
- **Email Service**: Gmail SMTP, Resend, or Brevo for transactional OTP delivery.

---

## 2. Backend Deployment on Render

### Using `render.yaml` (Infrastructure as Code)
The project includes a ready-to-deploy `render.yaml`:
```yaml
services:
  - type: web
    name: docpresc-backend
    runtime: node
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: npm run start
    plan: free
    healthCheckPath: /api/health
    autoDeploy: true
```

### Manual Configuration on Render:
1. Create a **New Web Service** pointing to `Presc-Backend` (or the unified `DocPresc` repository).
2. If connecting the monorepo root:
   - **Root Directory**: `backend` (or leave empty if using root `dist/server.js` proxy)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start` (or `node dist/server.js`)
   - **Health Check Path**: `/api/health`
3. Configure Required Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/prescription_db?retryWrites=true&w=majority`
   - `JWT_SECRET`: `your_random_64_char_secret_key`
   - `COOKIE_SECRET`: `your_random_cookie_signing_key`
   - `OTP_PEPPER`: `your_random_otp_pepper_string`
   - `FRONTEND_URL`: `https://your-frontend-domain.vercel.app`
   - `CORS_ORIGIN`: `https://your-frontend-domain.vercel.app`
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `465`
   - `SMTP_USER`: `your_gmail_address@gmail.com`
   - `SMTP_PASS`: `your_16_char_gmail_app_password`
   - `EMAIL_FROM`: `DocPresc Medical Cloud <your_gmail_address@gmail.com>`

---

## 3. Frontend Deployment on Vercel

1. Create a **New Project** in Vercel importing `docPresc`.
2. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Environment Variables:
   - `VITE_API_BASE_URL`: `https://your-backend-service.onrender.com/api`
4. Single-Page Application (SPA) Rewrites:
   Vercel will route all deep links (e.g. `/prescriptions/new`, `/admin/doctors`) through `index.html` via `vercel.json` if configured, or by default with Vite preset.

---

## 4. Local Development Quickstart

### Prerequisites
- Node.js version 20+
- Running MongoDB instance (`mongodb://localhost:27017/prescription_db`)

### Commands
```bash
# 1. Install all dependencies across both workspaces
npm run install:all

# 2. Seed database with initial doctor, admin, and MedEx medicines
npm run seed

# 3. Start both backend and frontend development servers concurrently
npm run dev
```

- **Frontend**: Accessible at `http://localhost:5173`
- **Backend API**: Accessible at `http://localhost:5000`
- **API Health Check**: `http://localhost:5000/api/health`
- **Admin Center**: Accessible at `http://localhost:5173/admin`
