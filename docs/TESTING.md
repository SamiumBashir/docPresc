# docPresc Testing Architecture & Verification Guide

docPresc features a comprehensive, zero-config automated test suite that runs against an isolated in-memory MongoDB instance. Tests never touch or mutate live production Atlas data.

---

## 1. Test Architecture

- **Test Runner**: Node.js + `tsx` (TypeScript Execution)
- **Database Engine**: `mongodb-memory-server`
- **Execution Script**: `npm --prefix backend test`
- **Full Typechecking**: `npm run typecheck`
- **Production Build Verification**: `npm run build`

---

## 2. Test Suites Overview

The test runner (`backend/src/tests/run-tests.ts`) executes 8 automated suites:

1. **Suite 1: Authentication & Doctor Profile**
   - Verifies doctor user creation, password bcrypt hashing, and profile linkage.
   - Validates BMDC registration numbering.
2. **Suite 2: Medicine Database & Autocomplete**
   - Verifies seeding of 26,373+ MedEx formulary medicines.
   - Validates multi-type catalog: Allopathic (Napa, Paracetamol), Unani (Cinkara, Safi), and Ayurvedic (Chyawanprash, Triphala).
3. **Suite 3: Patient Management & Multi-Doctor Ownership Isolation (Anti-IDOR)**
   - Registers Doctor A and Doctor B.
   - Proves Doctor B cannot find Doctor A's patient using doctor-scoped queries.
   - Proves Doctor B cannot update or select Doctor A's patient.
4. **Suite 4: Prescription Lifecycle, Immutability & Public Share Security**
   - Verifies finalized prescription immutability.
   - Verifies prescription cloning creates an editable `DRAFT` linked to parent prescription.
   - Proves draft prescriptions are strictly blocked from public sharing.
   - Verifies expired public share tokens are rejected.
5. **Suite 5: Destructive Database Guardrails**
   - Verifies that attempting to run a destructive database wipe without `ALLOW_DESTRUCTIVE_RESET=true` is intercepted and blocked by the security guard.
6. **Suite 6: Session Management, Token Rotation & Reuse Detection**
   - Validates issuance of short-lived access tokens and cryptographically random refresh tokens.
   - Verifies refresh token rotation on `/auth/refresh`.
   - Proves that re-presenting an invalidated refresh token triggers reuse detection and revokes the entire session family immediately.
7. **Suite 7: Concurrency-Safe Atomic Sequence ID Generation**
   - Concurrently invokes `generateNextPatientId()` and `generateNextPrescriptionId()`.
   - Proves collision-free, monotonic sequence generation under simultaneous requests.
8. **Suite 8: Modular Services Anti-IDOR & Admin Metrics**
   - Verifies `patientService.getPatientById` enforces strict doctor scoping.
   - Verifies `adminService.getStats` aggregates doctor, patient, prescription, and medicine totals cleanly.

---

## 3. Running Tests Locally

```bash
# Run backend test suite
npm --prefix backend test

# Run full repository typecheck
npm run typecheck

# Run production build
npm run build
```

**Latest Results**: 32 Passed, 0 Failed.
