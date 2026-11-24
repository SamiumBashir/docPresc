# docPresc Environment Configuration Guide

All environment variables in docPresc are validated at startup using **Zod** in `backend/src/config/env.ts`. If any required variable is missing or insecure, the backend fails fast with a clear error description.

---

## 1. Environment Variables Reference

| Variable | Required in Prod | Default (Dev) | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` | Runtime mode: `development`, `production`, or `test`. |
| `PORT` | No | `5000` | Port for the Express HTTP server. |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/docrx` | MongoDB connection string (Atlas cluster in production). |
| `JWT_SECRET` | Yes | Insecure fallback in dev only | Minimum 32-character high-entropy secret for signing access tokens. |
| `JWT_EXPIRES_IN` | No | `15m` | Lifetime of JWT access token. |
| `COOKIE_SECRET` | Yes | Insecure fallback in dev only | Secret key used for signing HTTP cookies. |
| `OTP_PEPPER` | Yes | Insecure fallback in dev only | Cryptographic pepper mixed into OTP hashes before hashing. |
| `OTP_EXPIRES_IN` | No | `600` (10 min) | Lifespan of password reset OTP in seconds. |
| `OTP_RESEND_COOLDOWN`| No | `60` (1 min) | Minimum seconds before requesting another OTP. |
| `CORS_ORIGIN` | Yes in Prod | `*` (Dev) | Comma-separated list of allowed frontend origins (e.g. `https://doc-presc.vercel.app`). |
| `ALLOW_DESTRUCTIVE_RESET` | No | `false` | Explicit opt-in safety guard required to wipe and re-seed the database. |
| `CLOUDINARY_CLOUD_NAME` | Optional | - | Cloudinary cloud name for signature uploads. (Uses LocalBase64 fallback if omitted). |
| `CLOUDINARY_API_KEY` | Optional | - | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Optional | - | Cloudinary API secret. |
| `SMTP_HOST` | Optional | `smtp.gmail.com` | SMTP host for password reset email dispatch. |
| `SMTP_PORT` | Optional | `465` | SMTP port (465 for SSL, 587 for TLS). |
| `SMTP_USER` | Optional | - | SMTP authentication username / Gmail address. |
| `SMTP_PASS` | Optional | - | SMTP authentication password / Gmail 16-character App Password. |
| `EMAIL_FROM` | Optional | `DocPresc <no-reply@docpresc.com>` | Sender email header for outgoing transactional notifications. |

---

## 2. Production Security Enforcements

In `production` mode (`NODE_ENV=production`):
1. **Secrets Cannot Be Default**: If `JWT_SECRET`, `COOKIE_SECRET`, or `OTP_PEPPER` contain default development strings like `'dev-secret'` or are shorter than 32 characters, the server refuses to boot.
2. **CORS Cannot Be Wildcard**: `CORS_ORIGIN` must be explicitly defined without wildcard (`*`) when credentials are enabled.
3. **Destructive Wipe Blocked**: `seedDatabase(force=true)` will throw an exception regardless of flags.
