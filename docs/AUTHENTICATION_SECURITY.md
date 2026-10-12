# Authentication, Session Management & Password Recovery Architecture

## 1. Overview & Authentication Strategy

DocPresc implements an enterprise-grade medical platform authentication architecture conforming to BMDC digital practice guidelines and international healthcare cybersecurity standards:

- **Primary Authentication**: JSON Web Tokens (JWT) signed with HMAC SHA-256 (`JWT_SECRET`).
- **Transport Security**: Transported via HTTP-Only, SameSite=Strict cookies with Authorization Bearer header fallback for REST clients.
- **Credential Storage**: Passwords salted and hashed with `bcryptjs` using 10 rounds of salt generation.
- **Session Duration**: Default 7 days expiry with configurable remember-me flags.

---

## 2. Password Recovery (OTP-Based) Architecture

DocPresc utilizes an email-based One-Time Password (OTP) verification workflow instead of legacy static reset URLs to safeguard doctor accounts against token interception, email link preview leaks, and phishing.

```
┌────────────────┐        ┌──────────────────┐        ┌──────────────────┐        ┌────────────────┐
│ 1. EMAIL INPUT │ -----> │  2. 6-DIGIT OTP  │ -----> │  3. NEW PASSWORD │ -----> │   4. SUCCESS   │
│ Doctor submits │        │ Resend email or  │        │ Validates policy │        │ Auto-redirect  │
│ registered mail│        │ local dev preview│        │ & resets bcrypt  │        │ to /login      │
└────────────────┘        └──────────────────┘        └──────────────────┘        └────────────────┘
```

### 2.1 OTP Lifecycle & Safeguards

| Parameter | Configuration | Security Purpose |
|:---|:---|:---|
| **OTP Format** | 6-digit numeric (`100000` to `999999`) | Cryptographically random using `crypto.randomInt` |
| **Storage Format** | SHA-256 digest (`crypto.createHash('sha256')`) | Raw OTP is never persisted to database |
| **Time-To-Live (TTL)** | 5 minutes (`OTP_EXPIRES_IN = 300`) | Minimizes exposure window |
| **Resend Cooldown** | 60 seconds (`OTP_RESEND_COOLDOWN = 60`) | Prevents mail flooding and denial of service |
| **Max Failed Attempts** | 5 verification attempts | Locks out brute-force attacks immediately |
| **Reset Token TTL** | 15 minutes | Issued upon successful OTP verification |

### 2.2 Security Defenses

1. **Anti-Enumeration Protection**:
   `POST /api/auth/forgot-password` returns `success: true` with a generic message regardless of whether the email exists in the database. Attackers cannot probe for doctor email addresses.
2. **Immediate OTP Invalidation**:
   Once verified, the OTP hash is wiped from the database (`record.otpHash = ''`), ensuring that an OTP cannot be reused even within its 5-minute lifespan.
3. **Single-Use Authorization Token**:
   Verification issues a high-entropy 256-bit token (`crypto.randomBytes(32).toString('hex')`). The hash of this token is required to execute `POST /api/auth/reset-password`. Once consumed, the entire reset session is purged.

---

## 3. Password Complexity Policy

All user registrations and password resets enforce strict policy rules:

- **Minimum Length**: 8 characters
- **Uppercase Character**: At least 1 uppercase letter (`[A-Z]`)
- **Lowercase Character**: At least 1 lowercase letter (`[a-z]`)
- **Special Character**: At least 1 non-alphanumeric symbol (`[^A-Za-z0-9]`)

---

## 4. Local Development Offline Fallback

To support local testing when transactional email providers (`RESEND_API_KEY`) are unconfigured:
- In `development` mode without an API key, the generated OTP is logged to the backend terminal (`[DEV OTP CODE] --> XXXXXX <--`).
- The API response contains `devOtp` for the client to render an auto-fill helper badge in local environments.
- In `production` mode, `devOtp` is strictly stripped and full transactional email dispatch is required.
