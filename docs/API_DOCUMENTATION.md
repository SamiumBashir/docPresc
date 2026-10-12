# DocPresc RESTful API Specification

## Base URL
- **Local Development**: `http://localhost:5000/api`
- **Production Server**: `https://docpresc.onrender.com/api`

---

## Authentication & Password Recovery Endpoints

### 1. Request Password Reset OTP
Initiates a password recovery session by generating and hashing a 6-digit OTP sent to the doctor's email.

- **Method & Path**: `POST /auth/forgot-password`
- **Access**: Public
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "email": "doctor@prescription.com"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "If an account exists for this email, a 6-digit password reset OTP has been sent."
}
```
*(In local development without Resend API key, an additional `"devOtp": "835400"` property is included for ease of testing)*.

- **Response `429 Too Many Requests` (Active Cooldown)**:
```json
{
  "success": false,
  "message": "Please wait 45 seconds before requesting a new OTP."
}
```

---

### 2. Verify 6-Digit OTP
Validates the 6-digit code against the stored SHA-256 hash. If successful, issues a 15-minute single-use reset authorization token.

- **Method & Path**: `POST /auth/verify-otp`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "doctor@prescription.com",
  "otp": "835400"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "OTP verified successfully.",
  "data": {
    "resetToken": "ab4e76edd2f9d4940545c58262ab10a4f12cf1d712c347667955809165273e09"
  }
}
```
- **Response `400 Bad Request` (Invalid or Expired OTP)**:
```json
{
  "success": false,
  "message": "Invalid OTP. You have 4 attempts remaining."
}
```
- **Response `429 Too Many Requests` (Lockout After 5 Failures)**:
```json
{
  "success": false,
  "message": "Too many failed verification attempts. For your security, please request a new OTP."
}
```

---

### 3. Resend OTP
Dispatches a fresh OTP if the 60-second cooldown has elapsed.

- **Method & Path**: `POST /auth/resend-otp`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "doctor@prescription.com"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "If an account exists for this email, a new password reset OTP has been sent."
}
```

---

### 4. Complete Password Reset
Consumes the single-use reset token and commits the new salted/hashed password to the User model.

- **Method & Path**: `POST /auth/reset-password`
- **Access**: Public
- **Request Body**:
```json
{
  "resetToken": "ab4e76edd2f9d4940545c58262ab10a4f12cf1d712c347667955809165273e09",
  "password": "DoctorNewPassword123!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Your password has been reset successfully. You can now log in with your new password."
}
```
- **Response `400 Bad Request` (Password Policy Violation)**:
```json
{
  "success": false,
  "message": "Password must contain at least one uppercase letter, one lowercase letter, and one special character."
}
```

---

## Other Core Modules
- `POST /api/auth/register` — Doctor account self-onboarding with BMDC verification number
- `POST /api/auth/login` — Authentication with JWT cookie and Bearer token issuance
- `GET /api/auth/me` — Authenticated session verification
- `GET /api/prescriptions` — Paginated prescription ledger with search filters
- `POST /api/prescriptions` — Clinical prescription finalization and QR-code generation
