# DocPresc API Contracts & Endpoint Specification

## 1. Authentication & Recovery Endpoints (`/api/auth`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | None | Public | Register doctor account with BMDC number |
| `POST` | `/api/auth/login` | None | Public | Authenticate practitioner or administrator |
| `GET` | `/api/auth/me` | Bearer JWT | Doctor/Admin | Get current profile, chamber, and doctor details |
| `PUT` | `/api/auth/profile` | Bearer JWT | Doctor | Update doctor qualifications, signature, and settings |
| `POST` | `/api/auth/logout` | Bearer JWT | Any | Terminate session and clear authentication cookies |
| `POST` | `/api/auth/forgot-password` | None | Public | Dispatch 6-digit cryptographic OTP to registered email |
| `POST` | `/api/auth/verify-reset-otp` | None | Public | Verify 6-digit OTP and issue single-use `resetToken` |
| `POST` | `/api/auth/resend-reset-otp` | None | Public | Re-dispatch OTP subject to 60s cooldown limit |
| `POST` | `/api/auth/reset-password` | None | Public | Reset password using verified `resetToken` |

### Sample Payload: Register Doctor
```json
{
  "name": "Dr. Sarah Ahmed",
  "email": "sarah.ahmed@prescription.com",
  "password": "Password123!",
  "qualification": "MBBS, FCPS (Medicine)",
  "specialization": "Internal Medicine",
  "bmdcNumber": "A-89211",
  "phone": "01711000000"
}
```

---

## 2. Patient Management Endpoints (`/api/patients`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/patients` | Bearer JWT | Doctor | List registered patients (supports pagination & search) |
| `POST` | `/api/patients` | Bearer JWT | Doctor | Register new patient with demographics |
| `GET` | `/api/patients/:id` | Bearer JWT | Doctor | Fetch patient demographic and medical history |
| `PUT` | `/api/patients/:id` | Bearer JWT | Doctor | Update patient contact details and allergies |
| `GET` | `/api/patients/:id/history` | Bearer JWT | Doctor | Retrieve full patient visit timeline & past prescriptions |

---

## 3. Prescription Management Endpoints (`/api/prescriptions`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/prescriptions` | Bearer JWT | Doctor | List prescriptions (filters: date range, patient, status) |
| `POST` | `/api/prescriptions` | Bearer JWT | Doctor | Create a new prescription draft |
| `GET` | `/api/prescriptions/:id` | Bearer JWT | Doctor | Retrieve full prescription record |
| `PUT` | `/api/prescriptions/:id` | Bearer JWT | Doctor | Update draft prescription content |
| `POST` | `/api/prescriptions/:id/finalize` | Bearer JWT | Doctor | Seal prescription as finalized and lock immutability |
| `POST` | `/api/prescriptions/:id/clone` | Bearer JWT | Doctor | Duplicate finalized prescription as a new draft |

### Immutability Rules:
- Calling `PUT /api/prescriptions/:id` on a prescription with `status === 'FINALIZED'` returns `400 Bad Request` with code `PRESCRIPTION_FINALIZED`.
- To create amendments for returning patients, call `POST /api/prescriptions/:id/clone`.

---

## 4. Medicine Database & Autocomplete Endpoints (`/api/medicines`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/medicines` | None/JWT | Public/Doctor | Search formulary (Allopathic, Unani, Ayurvedic, Herbal) |
| `POST` | `/api/medicines` | Bearer JWT | Admin | Add new medicine brand or generic |
| `PUT` | `/api/medicines/:id` | Bearer JWT | Admin | Update medicine properties and dosage suggestions |
| `DELETE` | `/api/medicines/:id` | Bearer JWT | Admin | Remove medicine record from database |
| `POST` | `/api/medicines/import` | Bearer JWT | Admin | Bulk CSV formulary ingestion |

### Query Parameters for `/api/medicines`:
- `search`: Brand name or generic substring (e.g. `napa`, `paracetamol`, `cinkara`, `triphala`)
- `medicineType`: Filter by system (`Allopathic`, `Unani`, `Ayurvedic`, `Herbal`, `all`)
- `limit`: Maximum results to return (default: `20`, max: `200`)

---

## 5. Enterprise Admin Endpoints (`/api/admin`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/admin/stats` | Bearer JWT | Admin | Executive analytics (counts of doctors, rx, meds, clinics) |
| `GET` | `/api/admin/doctors` | Bearer JWT | Admin | List all registered doctors and BMDC license numbers |
| `PUT` | `/api/admin/doctors/:id/status` | Bearer JWT | Admin | Toggle doctor account status (`active`, `pending`, `suspended`) |
| `GET` | `/api/admin/audit-logs` | Bearer JWT | Admin | Searchable security audit log trail |

---

## 6. Public QR Verification Endpoints (`/api/public`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/public/prescriptions/share/:token` | None | Public | Verify prescription authenticity using unguessable token |

### Security Boundaries on Public Verification:
- Sensitive private doctor credentials and authentication tokens are strictly stripped from response.
- Patient contact numbers, emails, and address fields are redacted to preserve confidentiality.
- Only verification status (`FINALIZED`), date issued, doctor name, BMDC number, chamber location, and prescribed medicines are rendered.
