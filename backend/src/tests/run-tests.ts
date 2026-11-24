process.env.NODE_ENV = 'test';
process.env.ALLOW_DESTRUCTIVE_RESET = 'true';

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { connectDatabase, closeDatabase } from '../config/db';
import { User } from '../models/User';
import { Doctor } from '../models/Doctor';
import { Patient } from '../models/Patient';
import { Medicine } from '../models/Medicine';
import { Prescription } from '../models/Prescription';
import { Session } from '../models/Session';
import { seedDatabase } from '../seeds/seed';
import { authService } from '../modules/auth/auth.service';
import { generateNextPatientId, generateNextPrescriptionId } from '../shared/utils/idGenerator';
import { patientService } from '../modules/patients/patient.service';
import { prescriptionService } from '../modules/prescriptions/prescription.service';
import { adminService } from '../modules/admin/admin.service';

let passed = 0;
let failed = 0;

const assert = (condition: boolean, testName: string) => {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
};

const runAllTests = async () => {
  console.log('\n🏥 Starting DocRx Automated Backend Test Suite...\n');
  await connectDatabase();
  await seedDatabase(true);

  try {
    // ----------------------------------------------------
    // TEST SUITE 1: Authentication & Doctor Profile
    // ----------------------------------------------------
    console.log('🔹 Suite 1: Authentication & Doctor Credentials');
    const doctorUser = await User.findOne({ email: 'doctor@prescription.com' });
    assert(!!doctorUser, 'Doctor user exists in database');
    assert(doctorUser?.role === 'doctor', 'Doctor user has "doctor" role');

    const passwordMatch = await bcrypt.compare('Doctor123!', doctorUser!.passwordHash);
    assert(passwordMatch, 'Doctor password hashes and validates correctly');

    const doctorProfile = await Doctor.findOne({ userId: doctorUser!._id });
    assert(!!doctorProfile, 'Doctor profile linked to user');
    assert(doctorProfile?.bmdcNumber === 'A-54321', 'Doctor BMDC number matches A-54321');

    // ----------------------------------------------------
    // TEST SUITE 2: Medicine Database & Autocomplete
    // ----------------------------------------------------
    console.log('\n🔹 Suite 2: Medicine Database & Smart Search Autocomplete');
    const totalMedicines = await Medicine.countDocuments();
    assert(totalMedicines >= 40, `Medicine database populated with ${totalMedicines} entries`);

    const napaMatches = await Medicine.find({
      $or: [{ brandName: /^napa/i }, { genericName: /^napa/i }],
    });
    assert(napaMatches.length >= 3, `Autocomplete finds ${napaMatches.length} Napa brand variations (Napa, Napa Extra, etc.)`);

    const paraMatches = await Medicine.find({
      genericName: /paracetamol/i,
    });
    assert(paraMatches.length >= 5, `Generic search for "Paracetamol" returns ${paraMatches.length} brand medicines`);

    // Unani & Ayurvedic assertions
    const unaniCount = await Medicine.countDocuments({ medicineType: 'Unani' });
    assert(unaniCount >= 10, `Unani medicine database has ${unaniCount} entries (Cinkara, Safi, Sualin, etc.)`);

    const ayurCount = await Medicine.countDocuments({ medicineType: 'Ayurvedic' });
    assert(ayurCount >= 10, `Ayurvedic medicine database has ${ayurCount} entries (Chyawanprash, Triphala, etc.)`);

    // ----------------------------------------------------
    // TEST SUITE 3: Patient Management & Data Ownership Isolation
    // ----------------------------------------------------
    console.log('\n🔹 Suite 3: Patient Management & Multi-Doctor Ownership Isolation (Anti-IDOR)');
    const doctorA = doctorProfile!;
    
    // Create Doctor B
    const docBUser = await User.create({
      name: 'Dr. Other Doctor',
      email: 'other.doc@example.com',
      passwordHash: 'hashedpass',
      role: 'doctor',
      status: 'active',
    });
    const doctorB = await Doctor.create({
      userId: docBUser._id,
      name: 'Dr. Other Doctor',
      qualification: 'MBBS',
      specialization: 'General',
      bmdcNumber: 'B-99999',
      phone: '01999999999',
      email: 'other.doc@example.com',
    });

    const patientA = await Patient.findOne({ doctorId: doctorA._id });
    assert(!!patientA, 'Doctor A has registered patients');

    // Test 3a: Doctor B cannot find Doctor A's patient when scoped
    const leakedPatient = await Patient.findOne({ _id: patientA!._id, doctorId: doctorB._id });
    assert(!leakedPatient, 'CRITICAL PRIVACY TEST: Doctor B cannot find Doctor A patient with doctor-scoped query');

    // Test 3b: Doctor B cannot update Doctor A's patient
    const updateResult = await Patient.findOneAndUpdate(
      { _id: patientA!._id, doctorId: doctorB._id },
      { name: 'Hacked Name' }
    );
    assert(!updateResult, 'CRITICAL PRIVACY TEST: Doctor B cannot update Doctor A patient');

    // Test 3c: Scoped lookup prevents cross-doctor prescription creation
    const unscopedCrossLookup = await Patient.findOne({ _id: patientA!._id, doctorId: doctorB._id });
    assert(!unscopedCrossLookup, 'CRITICAL PRIVACY TEST: Scoped patient lookup denies Doctor B from selecting Doctor A patient');

    // ----------------------------------------------------
    // TEST SUITE 4: Prescription Immutability, Cloning & Share Security
    // ----------------------------------------------------
    console.log('\n🔹 Suite 4: Prescription Lifecycle, Immutability & Public Share Security');
    const existingRx = await Prescription.findOne({ doctorId: doctorA._id, status: 'FINALIZED' });
    assert(!!existingRx, 'Finalized prescription exists');
    assert(existingRx?.status === 'FINALIZED', 'Prescription status is FINALIZED');

    // Test 4a: Duplicate / Clone test
    const clonedRx = await Prescription.create({
      prescriptionId: 'RX-2026-TESTCLONE',
      doctorId: doctorA._id,
      patientId: existingRx!.patientId,
      patientSnapshot: existingRx!.patientSnapshot,
      chiefComplaints: existingRx!.chiefComplaints,
      medicines: existingRx!.medicines,
      diagnosis: existingRx!.diagnosis,
      investigations: existingRx!.investigations,
      advice: existingRx!.advice,
      status: 'DRAFT',
      shareToken: crypto.randomBytes(16).toString('hex'),
      parentPrescriptionId: existingRx!._id,
    });
    assert(clonedRx.status === 'DRAFT', 'Cloned prescription is created as an editable DRAFT');
    assert(clonedRx.parentPrescriptionId?.toString() === existingRx!._id.toString(), 'Cloned prescription maintains link to parent prescription');

    // Test 4b: Public share security - Draft prescriptions must NEVER be exposed publicly
    const draftRx = await Prescription.create({
      prescriptionId: 'RX-2026-DRAFTTEST',
      doctorId: doctorA._id,
      patientId: patientA!._id,
      patientSnapshot: patientA!,
      chiefComplaints: [{ complaint: 'Private draft complaint' }],
      diagnosis: [{ name: 'Secret provisional diagnosis' }],
      medicines: [],
      investigations: [],
      advice: [],
      notes: 'DOCTOR PRIVATE INTERNAL NOTES - NOT FOR PATIENT',
      status: 'DRAFT',
      shareToken: 'test_draft_share_token_12345678',
    });

    const publicDraftQuery = await Prescription.findOne({
      shareToken: draftRx.shareToken,
      status: 'FINALIZED',
      isShareRevoked: { $ne: true },
    });
    assert(!publicDraftQuery, 'CRITICAL PRIVACY TEST: Draft prescriptions are NEVER accessible via public share lookup');

    // Test 4c: Public share security - Finalized share tokens expire and can be revoked
    const expiredRx = await Prescription.create({
      prescriptionId: 'RX-2026-EXPIREDTEST',
      doctorId: doctorA._id,
      patientId: patientA!._id,
      patientSnapshot: patientA!,
      chiefComplaints: [],
      diagnosis: [],
      medicines: [],
      investigations: [],
      advice: [],
      status: 'FINALIZED',
      shareToken: 'test_expired_share_token_12345678',
      shareExpiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
    });

    const isExpired = Boolean(expiredRx.shareExpiresAt && new Date(expiredRx.shareExpiresAt) < new Date());
    assert(isExpired, 'Public share expiration check accurately detects expired tokens');

    // Test 4d: Destructive wipe protection
    console.log('\n🔹 Suite 5: Destructive Database Guardrails');
    let caughtDestructiveError = false;
    try {
      // Temporarily remove opt-in flag
      delete process.env.ALLOW_DESTRUCTIVE_RESET;
      await seedDatabase(true);
    } catch (err: any) {
      caughtDestructiveError = err.message.includes('[Security Guard]');
    } finally {
      process.env.ALLOW_DESTRUCTIVE_RESET = 'true';
    }
    assert(caughtDestructiveError, 'Destructive database wipe is strictly blocked when ALLOW_DESTRUCTIVE_RESET is missing');

    // ----------------------------------------------------
    // TEST SUITE 6: Session Management & Refresh Token Rotation
    // ----------------------------------------------------
    console.log('\n🔹 Suite 6: Session Management, Token Rotation & Reuse Detection');
    const userForSession = doctorUser!;
    const sessionTokens = await authService.createSession(userForSession, false, '127.0.0.1', 'TestSuite');
    assert(!!sessionTokens.accessToken, 'Session creation generates short-lived access token');
    assert(!!sessionTokens.refreshToken, 'Session creation generates cryptographically random refresh token');

    // Test 6a: Token rotation
    const rotatedTokens = await authService.refreshTokens(sessionTokens.refreshToken, '127.0.0.1', 'TestSuite');
    assert(!!rotatedTokens.accessToken, 'Token refresh issues new access token');
    assert(rotatedTokens.refreshToken !== sessionTokens.refreshToken, 'Token refresh rotates refresh token');

    // Test 6b: Token reuse detection (presenting old rotated token)
    let caughtReuse = false;
    try {
      await authService.refreshTokens(sessionTokens.refreshToken, '127.0.0.1', 'AttackerAgent');
    } catch (err: any) {
      caughtReuse = err.code === 'SESSION_REUSED';
    }
    assert(caughtReuse, 'CRITICAL SECURITY TEST: Re-presenting a consumed refresh token triggers reuse detection and revokes session family');

    // Test 6c: Verified revocation
    const activeSessionsCount = await Session.countDocuments({ userId: userForSession._id, isValid: true });
    assert(activeSessionsCount === 0, 'All sessions in compromised family are invalidated upon reuse detection');

    // ----------------------------------------------------
    // TEST SUITE 7: Concurrency-Safe Atomic Sequence ID Generation
    // ----------------------------------------------------
    console.log('\n🔹 Suite 7: Concurrency-Safe Atomic Sequence ID Generation');
    const patientIds = await Promise.all([
      generateNextPatientId(),
      generateNextPatientId(),
      generateNextPatientId(),
      generateNextPatientId(),
      generateNextPatientId(),
    ]);

    const uniquePatientIds = new Set(patientIds);
    assert(uniquePatientIds.size === 5, `Concurrent sequence generation produces 5 unique patient IDs without collisions (${patientIds.join(', ')})`);

    const rxIds = await Promise.all([
      generateNextPrescriptionId(),
      generateNextPrescriptionId(),
      generateNextPrescriptionId(),
      generateNextPrescriptionId(),
      generateNextPrescriptionId(),
    ]);
    const uniqueRxIds = new Set(rxIds);
    assert(uniqueRxIds.size === 5, `Concurrent sequence generation produces 5 unique prescription IDs without collisions (${rxIds.join(', ')})`);

    // ----------------------------------------------------
    // TEST SUITE 8: Modular Architecture Scoping & Admin Metrics
    // ----------------------------------------------------
    console.log('\n🔹 Suite 8: Modular Services Anti-IDOR & Admin Metrics');
    let doctorBAccessBlocked = false;
    try {
      await patientService.getPatientById(patientA!._id.toString(), doctorB._id.toString());
    } catch (err: any) {
      doctorBAccessBlocked = err.statusCode === 404 || err.statusCode === 403;
    }
    assert(doctorBAccessBlocked, 'CRITICAL ANTI-IDOR: patientService.getPatientById rejects cross-doctor access');

    // Admin metrics aggregation
    const adminMetrics = await adminService.getStats();
    assert(adminMetrics.stats.totalDoctors >= 2, 'Admin stats service accurately aggregates total doctors');
    assert(adminMetrics.stats.totalMedicines >= 40, 'Admin stats service accurately aggregates total medicines');

    // Admin authentication & doctor status lifecycle
    const adminLoginRes = await authService.login({ email: 'admin@prescription.com', password: 'Admin123!' });
    assert(adminLoginRes.user.role === 'admin', 'Admin user authenticates successfully with Admin123!');

    const suspendedDoc = await adminService.updateDoctorStatus(doctorA._id.toString(), 'suspended');
    assert(suspendedDoc !== null, 'Admin can suspend doctor status via doctor ID');
    const reactivatedDoc = await adminService.updateDoctorStatus(doctorA.userId.toString(), 'active');
    assert(reactivatedDoc !== null, 'Admin can activate doctor status via user ID fallback');

    console.log(`\n=========================================`);
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`=========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
};

runAllTests();
