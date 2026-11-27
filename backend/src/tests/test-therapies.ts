process.env.NODE_ENV = 'test';
process.env.ALLOW_DESTRUCTIVE_RESET = 'true';

import fs from 'fs';
import path from 'path';
import http from 'http';
import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'url';
import { createApp } from '../app';
import { connectDatabase, closeDatabase } from '../config/db';
import { seedDatabase } from '../seeds/seed';
import { ensureTherapyCatalogSeeded } from '../seeds/therapyCatalog';
import { closePdfBrowser } from '../modules/therapies/therapy.pdf';
import { User } from '../models/User';
import { Doctor } from '../models/Doctor';
import { Patient } from '../models/Patient';
import { TherapyCategory } from '../models/TherapyCategory';
import { Therapy } from '../models/Therapy';
import { TreatmentPlan } from '../models/TreatmentPlan';
import { AuditLog } from '../models/AuditLog';

const EXPECTED_MAIN_THERAPIES = [
  'Scalp Acupuncture',
  'Tongue Acupuncture',
  'Ear Acupuncture',
  'Face Acupuncture',
  'Abdomen Acupuncture',
  'Body Acupuncture',
  'Manual Physiotherapy',
  'Electronic Physiotherapy',
  'Chinese Therapy',
  'CVFT (Transcranial Magnetic Stimulator)',
  'Brain Stimulator',
  'Chest Therapy',
  'Hair PRP',
  'Occupational Therapy',
  'Psychotherapy',
  'Speech and Language Therapy',
  'Acupressure',
  'CFT (Chinese Foot Treatment)',
  'Touliao',
  'Ionic Foot Detox',
  'Cupping Therapy',
  'OT (Occupational) Device',
  'Ozone Therapy',
  'Far Infrared Radiation Therapy',
  'Autism Device',
  'Counseling',
  'Others',
];

const EXPECTED_ED_THERAPIES = [
  'Linear Shockwave Therapy',
  'Double Channel Electromagnetic Shockwave',
  'Acupuncture',
  'Hydrogen Rich Water',
  'Ozone Therapy',
];

let passed = 0;
let failed = 0;

const assert = (condition: boolean, label: string, detail?: string) => {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.error(`  FAIL: ${label}${detail ? ` (${detail})` : ''}`);
    failed++;
  }
};

const loadPdfJs = async () => {
  const dynamicImport = new Function('specifier', 'return import(specifier)') as (
    s: string
  ) => Promise<any>;

  let pdfjs: any;
  let workerPath: string;
  try {
    pdfjs = await dynamicImport('pdfjs-dist/legacy/build/pdf.mjs');
    workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
  } catch {
    pdfjs = await dynamicImport('pdfjs-dist/build/pdf.mjs');
    workerPath = require.resolve('pdfjs-dist/build/pdf.worker.mjs');
  }

  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
  }
  return pdfjs;
};

const extractPdfText = async (pdfBuffer: Buffer): Promise<{ numPages: number; pagesText: string[] }> => {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    verbosity: 0,
  });
  const doc = await loadingTask.promise;
  const pagesText: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = (content.items || []).map((item: any) => item.str || '');
    pagesText.push(strings.join(' '));
  }

  return { numPages: doc.numPages, pagesText };
};

const apiJson = async (
  baseUrl: string,
  endpoint: string,
  options: { method?: string; token?: string; body?: any } = {}
) => {
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, headers: res.headers };
};

const runTherapiesTests = async () => {
  console.log('\nStarting Therapy & Treatment Management Verification Suite...\n');
  await connectDatabase();
  await seedDatabase(true);
  await ensureTherapyCatalogSeeded(true);

  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address() as any;
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  try {
    // ----------------------------------------------------
    // Setup Test Actors: Admin, Doctor A, Doctor B
    // ----------------------------------------------------
    const passwordRaw = 'TestPass123!';
    const passwordHash = await bcrypt.hash(passwordRaw, 10);

    const adminEmail = `therapy_admin_${Date.now()}@example.com`;
    await User.create({
      name: 'Clinical Governance Admin',
      email: adminEmail,
      phone: '01700001111',
      passwordHash,
      role: 'admin',
      status: 'active',
    });

    const loginAdmin = await apiJson(baseUrl, '/api/v1/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: passwordRaw },
    });
    const tokenAdmin: string = loginAdmin.data?.data?.accessToken || loginAdmin.data?.data?.token;
    assert(loginAdmin.status === 200 && Boolean(tokenAdmin), 'Admin user authenticates');

    const loginDocA = await apiJson(baseUrl, '/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'doctor@prescription.com', password: 'Doctor123!' },
    });
    const tokenDocA: string = loginDocA.data?.data?.accessToken || loginDocA.data?.data?.token;
    assert(loginDocA.status === 200 && Boolean(tokenDocA), 'Doctor A authenticates');

    const doctorA = await Doctor.findOne({ email: 'doctor@prescription.com' });
    const patientsA = await Patient.find({ doctorId: doctorA!._id }).sort({ createdAt: 1 });
    assert(patientsA.length >= 2, 'Doctor A has seeded patients');
    const patientA1 = patientsA[0];

    const userDocB = await User.create({
      name: 'Dr. Other Clinician',
      email: `docb_therapy_${Date.now()}@example.com`,
      phone: '01788991122',
      passwordHash,
      role: 'doctor',
      status: 'active',
    });
    const doctorB = await Doctor.create({
      userId: userDocB._id,
      name: 'Dr. Other Clinician',
      qualification: 'MBBS',
      specialization: 'General Medicine',
      bmdcNumber: 'A-77112',
      phone: '01788991122',
      email: userDocB.email,
      status: 'active',
    });
    const loginDocB = await apiJson(baseUrl, '/api/v1/auth/login', {
      method: 'POST',
      body: { email: userDocB.email, password: passwordRaw },
    });
    const tokenDocB: string = loginDocB.data?.data?.accessToken || loginDocB.data?.data?.token;
    assert(loginDocB.status === 200 && Boolean(tokenDocB), 'Doctor B authenticates');

    // ----------------------------------------------------
    // Suite 1: Initial Seeded Hospital Catalog & Safety
    // ----------------------------------------------------
    console.log('\nSuite 1: Initial Hospital Catalog & Safety Checks');
    const catsCount = await TherapyCategory.countDocuments({});
    const seededCount = await Therapy.countDocuments({});
    assert(catsCount === 2, 'Exactly 2 initial categories seeded', `got ${catsCount}`);
    assert(seededCount === 32, 'Exactly 32 initial therapies seeded (27 Main + 5 ED)', `got ${seededCount}`);

    // Re-seed idempotency
    await ensureTherapyCatalogSeeded();
    assert((await Therapy.countDocuments({})) === 32, 'Re-seeding is strictly idempotent');

    const catMainRes = await apiJson(baseUrl, '/api/v1/therapies/catalog?section=main&limit=100', {
      token: tokenDocA,
    });
    const mainNames = (catMainRes.data?.data?.therapies || []).map((t: any) => t.name);
    assert(
      mainNames.length === 27 && EXPECTED_MAIN_THERAPIES.every((lbl) => mainNames.includes(lbl)),
      'Main Treatments preserves all 27 exact labels from source list'
    );

    const catEdRes = await apiJson(baseUrl, '/api/v1/therapies/catalog?section=ed&limit=100', {
      token: tokenDocA,
    });
    const edItems = catEdRes.data?.data?.therapies || [];
    const edNames = edItems.map((t: any) => t.name);
    assert(
      edNames.length === 5 &&
        EXPECTED_ED_THERAPIES.every((lbl) => edNames.includes(lbl)) &&
        edItems.every((t: any) => t.isEdTreatment === true),
      'ED Treatments preserves all 5 exact labels in dedicated ED category'
    );

    const allSeeded = [...(catMainRes.data?.data?.therapies || []), ...edItems];
    assert(
      allSeeded.every((t: any) => t.verificationStatus === 'PENDING_CLINICAL_REVIEW'),
      'All seeded entries start strictly as PENDING_CLINICAL_REVIEW (never pre-approved)'
    );

    const cvft = allSeeded.find((t: any) => t.name === 'CVFT (Transcranial Magnetic Stimulator)');
    const touliao = allSeeded.find((t: any) => t.name === 'Touliao');
    const cft = allSeeded.find((t: any) => t.name === 'CFT (Chinese Foot Treatment)');
    const ionicDetox = allSeeded.find((t: any) => t.name === 'Ionic Foot Detox');
    const ozone = allSeeded.find((t: any) => t.name === 'Ozone Therapy' && !t.isEdTreatment);
    const manualPhysio = allSeeded.find((t: any) => t.name === 'Manual Physiotherapy');
    const shockwaveEd = edItems.find((t: any) => t.name === 'Linear Shockwave Therapy');

    assert(
      Boolean(cvft?.terminologyReviewRequired && touliao?.terminologyReviewRequired && cft?.terminologyReviewRequired),
      'CVFT, Touliao, and CFT are flagged for terminology verification'
    );
    assert(
      Boolean(ionicDetox?.specialReviewFlags?.length && ozone?.specialReviewFlags?.length),
      'Ionic Foot Detox and Ozone Therapy carry special governance review flags'
    );

    // Search filtering check
    const searchRes = await apiJson(baseUrl, '/api/v1/therapies/catalog?search=Shockwave', {
      token: tokenDocA,
    });
    assert(
      searchRes.status === 200 && (searchRes.data?.data?.therapies || []).length === 2,
      'Catalog search accurately filters shockwave modalities'
    );

    // ----------------------------------------------------
    // Suite 2: Admin Catalog Governance, Categories & Verification
    // ----------------------------------------------------
    console.log('\nSuite 2: Admin Catalog Management & Clinical Verification');

    // Cross-role guard: Doctor cannot create categories, therapies, or approve therapies
    const docCreateCat = await apiJson(baseUrl, '/api/v1/therapies/categories', {
      method: 'POST',
      token: tokenDocA,
      body: { name: 'Unauthorized Category' },
    });
    assert(docCreateCat.status === 403, 'Doctor blocked from creating therapy categories');

    const docVerify = await apiJson(baseUrl, `/api/v1/therapies/catalog/${manualPhysio._id}/verify`, {
      method: 'POST',
      token: tokenDocA,
      body: { verificationStatus: 'APPROVED', governanceReviewed: true },
    });
    assert(docVerify.status === 403, 'Doctor blocked from self-approving catalog therapies');

    // Admin creates custom category & therapy
    const newCatRes = await apiJson(baseUrl, '/api/v1/therapies/categories', {
      method: 'POST',
      token: tokenAdmin,
      body: { name: 'Neuro Rehabilitation', nameBn: 'নিউরো রিহ্যাবিলিটেশন' },
    });
    assert(newCatRes.status === 201 && Boolean(newCatRes.data?.data?._id), 'Admin creates new therapy category');

    const newTherapyRes = await apiJson(baseUrl, '/api/v1/therapies/catalog', {
      method: 'POST',
      token: tokenAdmin,
      body: {
        name: 'Pediatric Gait Training',
        bengaliName: 'শিশু গেইট প্রশিক্ষণ',
        categoryId: newCatRes.data.data._id,
        description: 'Supervised clinical gait training',
        requiredProviderQualifications: 'Licensed Physiotherapist',
        consentRequired: false,
      },
    });
    assert(
      newTherapyRes.status === 201 && newTherapyRes.data?.data?.verificationStatus === 'PENDING_CLINICAL_REVIEW',
      'Admin creates new therapy defaulting strictly to PENDING_CLINICAL_REVIEW'
    );

    // Edit therapy metadata
    const editTherapyRes = await apiJson(baseUrl, `/api/v1/therapies/catalog/${newTherapyRes.data.data._id}`, {
      method: 'PUT',
      token: tokenAdmin,
      body: {
        administrativeNotes: 'Verified equipment checklist maintained by rehab wing.',
        defaultSessionDurationMinutes: 45,
      },
    });
    assert(
      editTherapyRes.status === 200 && editTherapyRes.data?.data?.defaultSessionDurationMinutes === 45,
      'Admin updates therapy metadata cleanly'
    );

    // Verification governance enforcement on flagged items
    const badVerifyCvft = await apiJson(baseUrl, `/api/v1/therapies/catalog/${cvft._id}/verify`, {
      method: 'POST',
      token: tokenAdmin,
      body: {
        verificationStatus: 'APPROVED',
        governanceReviewed: true,
        terminologyConfirmed: false,
      },
    });
    assert(
      badVerifyCvft.status === 400 && badVerifyCvft.data?.code === 'TERMINOLOGY_CONFIRMATION_REQUIRED',
      'Approving CVFT without terminology confirmation rejected'
    );

    const badVerifyDetox = await apiJson(baseUrl, `/api/v1/therapies/catalog/${ionicDetox._id}/verify`, {
      method: 'POST',
      token: tokenAdmin,
      body: {
        verificationStatus: 'APPROVED',
        governanceReviewed: false,
      },
    });
    assert(
      badVerifyDetox.status === 400 && badVerifyDetox.data?.code === 'GOVERNANCE_REVIEW_REQUIRED',
      'Approving flagged Ionic Foot Detox without governance review rejected'
    );

    // Approve Manual Physiotherapy, Linear Shockwave (ED), and Pediatric Gait Training
    const approvePhysio = await apiJson(baseUrl, `/api/v1/therapies/catalog/${manualPhysio._id}/verify`, {
      method: 'POST',
      token: tokenAdmin,
      body: {
        verificationStatus: 'APPROVED',
        governanceReviewed: true,
        requiredProviderQualifications: 'BPT / Licensed Physiotherapist',
        verificationNotes: 'Approved for supervised outpatient rehabilitation.',
      },
    });
    assert(
      approvePhysio.status === 200 && approvePhysio.data?.data?.verificationStatus === 'APPROVED',
      'Admin approves Manual Physiotherapy'
    );

    const approveShockwave = await apiJson(baseUrl, `/api/v1/therapies/catalog/${shockwaveEd._id}/verify`, {
      method: 'POST',
      token: tokenAdmin,
      body: {
        verificationStatus: 'APPROVED',
        governanceReviewed: true,
        consentRequired: true,
        requiredProviderQualifications: 'Urologist / Supervised Men\'s Health Specialist',
        verificationNotes: 'Approved with mandatory patient consent.',
      },
    });
    assert(
      approveShockwave.status === 200 && approveShockwave.data?.data?.verificationStatus === 'APPROVED',
      'Admin approves Linear Shockwave Therapy (ED Treatments)'
    );

    const approveGait = await apiJson(
      baseUrl,
      `/api/v1/therapies/catalog/${newTherapyRes.data.data._id}/verify`,
      {
        method: 'POST',
        token: tokenAdmin,
        body: { verificationStatus: 'APPROVED', governanceReviewed: true },
      }
    );
    assert(approveGait.status === 200, 'Admin approves custom Pediatric Gait Training therapy');

    // Toggle disabled test
    const disableGait = await apiJson(
      baseUrl,
      `/api/v1/therapies/catalog/${newTherapyRes.data.data._id}/status`,
      {
        method: 'PATCH',
        token: tokenAdmin,
        body: { isActive: false },
      }
    );
    assert(
      disableGait.status === 200 && disableGait.data?.data?.isActive === false,
      'Admin disables therapy entry'
    );

    // ----------------------------------------------------
    // Suite 3: Staff Practitioners Provisioning
    // ----------------------------------------------------
    console.log('\nSuite 3: Practitioner Authorization & Account Provisioning');
    const prac1Email = `staff1_${Date.now()}@example.com`;
    const prac2Email = `staff2_${Date.now()}@example.com`;

    const createPrac1 = await apiJson(baseUrl, '/api/v1/therapies/practitioners', {
      method: 'POST',
      token: tokenAdmin,
      body: {
        name: 'Tasnim Akter (Physiotherapist)',
        email: prac1Email,
        password: passwordRaw,
        qualification: 'BPT, MPT',
        designation: 'Senior Physiotherapist',
        registrationNumber: 'PT-4421',
      },
    });
    assert(createPrac1.status === 201 && createPrac1.data?.data?.role === 'staff', 'Admin provisions Staff Practitioner 1');
    const prac1Id = createPrac1.data.data._id;

    const createPrac2 = await apiJson(baseUrl, '/api/v1/therapies/practitioners', {
      method: 'POST',
      token: tokenAdmin,
      body: {
        name: 'Rafiq Hasan (Therapy Assistant)',
        email: prac2Email,
        password: passwordRaw,
        designation: 'Therapy Assistant',
      },
    });
    assert(createPrac2.status === 201, 'Admin provisions Staff Practitioner 2');
    const prac2Id = createPrac2.data.data._id;

    const loginStaff1 = await apiJson(baseUrl, '/api/v1/auth/login', {
      method: 'POST',
      body: { email: prac1Email, password: passwordRaw },
    });
    const loginStaff2 = await apiJson(baseUrl, '/api/v1/auth/login', {
      method: 'POST',
      body: { email: prac2Email, password: passwordRaw },
    });
    const tokenStaff1: string = loginStaff1.data?.data?.accessToken || loginStaff1.data?.data?.token;
    const tokenStaff2: string = loginStaff2.data?.data?.accessToken || loginStaff2.data?.data?.token;
    assert(Boolean(tokenStaff1 && tokenStaff2), 'Both staff practitioners authenticate cleanly');

    const pracsRes = await apiJson(baseUrl, '/api/v1/therapies/practitioners', { token: tokenDocA });
    const pracsList = pracsRes.data?.data || [];
    assert(
      pracsRes.status === 200 &&
        pracsList.some((p: any) => p._id === prac1Id) &&
        pracsList.every((p: any) => !('passwordHash' in p)),
      'Practitioners directory excludes passwordHash and returns active clinicians/staff'
    );

    // ----------------------------------------------------
    // Suite 4: Treatment Plan Creation, Clinical Guardrails & Anti-IDOR
    // ----------------------------------------------------
    console.log('\nSuite 4: Treatment Plan Clinical Guardrails & Anti-IDOR');

    // Reject assigning unapproved therapy
    const unapprovedPlan = await apiJson(baseUrl, '/api/v1/therapies/plans', {
      method: 'POST',
      token: tokenDocA,
      body: {
        patientId: patientA1._id.toString(),
        therapyId: ozone._id.toString(),
        assignedPractitionerId: prac1Id,
        clinicianApprovalConfirmed: true,
        status: 'ACTIVE',
      },
    });
    assert(
      unapprovedPlan.status === 400 && unapprovedPlan.data?.code === 'THERAPY_NOT_APPROVED',
      'Reject assigning unapproved therapy to a patient'
    );

    // Reject assigning disabled therapy
    const disabledPlan = await apiJson(baseUrl, '/api/v1/therapies/plans', {
      method: 'POST',
      token: tokenDocA,
      body: {
        patientId: patientA1._id.toString(),
        therapyId: newTherapyRes.data.data._id,
        assignedPractitionerId: prac1Id,
        clinicianApprovalConfirmed: true,
        status: 'ACTIVE',
      },
    });
    assert(
      disabledPlan.status === 400 && disabledPlan.data?.code === 'THERAPY_DISABLED',
      'Reject assigning disabled therapy to a patient'
    );

    // Reject activating ED plan without obtained patient consent
    const noConsentPlan = await apiJson(baseUrl, '/api/v1/therapies/plans', {
      method: 'POST',
      token: tokenDocA,
      body: {
        patientId: patientA1._id.toString(),
        therapyId: shockwaveEd._id.toString(),
        assignedPractitionerId: prac1Id,
        clinicianApprovalConfirmed: true,
        consentStatus: 'PENDING',
        status: 'FINALIZED',
      },
    });
    assert(
      noConsentPlan.status === 400 && noConsentPlan.data?.code === 'PATIENT_CONSENT_REQUIRED',
      'Reject finalizing therapy requiring consent when consentStatus is PENDING'
    );

    // Reject Doctor B creating plan for Doctor A's patient (Anti-IDOR)
    const crossDocCreate = await apiJson(baseUrl, '/api/v1/therapies/plans', {
      method: 'POST',
      token: tokenDocB,
      body: {
        patientId: patientA1._id.toString(),
        therapyId: manualPhysio._id.toString(),
        assignedPractitionerId: prac1Id,
        clinicianApprovalConfirmed: true,
        status: 'DRAFT',
      },
    });
    assert(crossDocCreate.status === 403, 'Doctor B blocked from creating plan for Doctor A\'s patient');

    // Doctor A creates valid Main Treatment Plan with initial session & NO frequency entered
    const session1Date = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const validPlanRes = await apiJson(baseUrl, '/api/v1/therapies/plans', {
      method: 'POST',
      token: tokenDocA,
      body: {
        patientId: patientA1._id.toString(),
        therapyId: manualPhysio._id.toString(),
        assignedPractitionerId: prac1Id,
        treatmentObjective: 'Restore cervical range of motion (ঘাড়ের জড়তা কমানো)',
        clinicalIndication: 'Cervical myofascial stiffness',
        clinicianApprovalConfirmed: true,
        plannedSessions: 4,
        precautions: 'Avoid forced rotation if acute radicular pain arises.',
        patientInstructions: 'হালকা গরম সেঁক নেবেন এবং ভারী ওজন বহন করবেন না।',
        status: 'FINALIZED',
        initialSessions: [{ scheduledAt: session1Date, practitionerNotes: 'Initial evaluation session' }],
      },
    });
    assert(
      validPlanRes.status === 201 &&
        /^TP-\d{4}-\d{6}$/.test(validPlanRes.data?.data?.plan?.chartNumber || '') &&
        validPlanRes.data?.data?.plan?.frequency === '' &&
        validPlanRes.data?.data?.sessions?.length === 1,
      'Doctor A creates valid Treatment Plan with atomic TP chartNumber, initial session, and zero invented frequency'
    );

    const plan1 = validPlanRes.data.data.plan;
    const initialSession = validPlanRes.data.data.sessions[0];

    // Also create sensitive ED plan with OBTAINED consent
    const edPlanRes = await apiJson(baseUrl, '/api/v1/therapies/plans', {
      method: 'POST',
      token: tokenDocA,
      body: {
        patientId: patientA1._id.toString(),
        therapyId: shockwaveEd._id.toString(),
        assignedPractitionerId: userDocB._id.toString(), // another doctor practitioner shouldn't be mixed? Wait: use Doctor A userId
        clinicianApprovalConfirmed: true,
        consentStatus: 'OBTAINED',
        consentNotes: 'Written consent form signed in clinic.',
        status: 'FINALIZED',
      },
    });
    assert(
      edPlanRes.status === 201 && edPlanRes.data?.data?.plan?.isEdPlan === true,
      'ED Treatment Plan created cleanly when consent is OBTAINED'
    );

    // Cross-doctor & cross-staff access restrictions
    const docBViewPlan1 = await apiJson(baseUrl, `/api/v1/therapies/plans/${plan1._id}`, {
      token: tokenDocB,
    });
    assert(docBViewPlan1.status === 403, 'Doctor B blocked from reading Doctor A\'s treatment plan');

    const staff2ViewPlan1 = await apiJson(baseUrl, `/api/v1/therapies/plans/${plan1._id}`, {
      token: tokenStaff2,
    });
    assert(staff2ViewPlan1.status === 403, 'Unassigned Staff 2 blocked from reading Plan 1');

    const staff1ViewPlan1 = await apiJson(baseUrl, `/api/v1/therapies/plans/${plan1._id}`, {
      token: tokenStaff1,
    });
    assert(
      staff1ViewPlan1.status === 200 && staff1ViewPlan1.data?.data?.plan?._id === plan1._id,
      'Assigned Staff 1 can read assigned Treatment Plan 1'
    );

    const adminViewPlan1 = await apiJson(baseUrl, `/api/v1/therapies/plans/${plan1._id}`, {
      token: tokenAdmin,
    });
    assert(adminViewPlan1.status === 403, 'Admin blocked from direct patient plan clinical view');

    // ----------------------------------------------------
    // Suite 5: Session Scheduling, Completion, Locks & History
    // ----------------------------------------------------
    console.log('\nSuite 5: Session Scheduling, Tracking & Optimistic Concurrency Locks');
    const session2Date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const session3Date = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    const addSessionsRes = await apiJson(
      baseUrl,
      `/api/v1/therapies/plans/${plan1._id}/sessions`,
      {
        method: 'POST',
        token: tokenDocA,
        body: {
          sessions: [{ scheduledAt: session2Date }, { scheduledAt: session3Date }],
        },
      }
    );
    assert(
      addSessionsRes.status === 201 && addSessionsRes.data?.data?.length === 2,
      'Doctor A schedules follow-up sessions 2 and 3 sequentially'
    );
    const session2 = addSessionsRes.data.data[0];

    // Staff 2 cannot update Staff 1's session
    const staff2UpdateSess = await apiJson(
      baseUrl,
      `/api/v1/therapies/sessions/${initialSession._id}`,
      {
        method: 'PATCH',
        token: tokenStaff2,
        body: { version: 1, status: 'Completed' },
      }
    );
    assert(staff2UpdateSess.status === 403, 'Unassigned Staff 2 blocked from updating Staff 1 session');

    // Staff 1 marks Session 1 Completed with notes and feedback
    const completeSess1 = await apiJson(
      baseUrl,
      `/api/v1/therapies/sessions/${initialSession._id}`,
      {
        method: 'PATCH',
        token: tokenStaff1,
        body: {
          version: initialSession.version,
          status: 'Completed',
          practitionerNotes: 'Completed 30m gentle cervical mobilization cleanly.',
          patientFeedback: 'হালকা আরাম বোধ করছেন।',
          nextSessionDate: session2Date,
        },
      }
    );
    assert(
      completeSess1.status === 200 &&
        completeSess1.data?.data?.status === 'Completed' &&
        completeSess1.data?.data?.version === 2 &&
        Boolean(completeSess1.data?.data?.completedAt),
      'Assigned Staff 1 completes session 1, increments version to 2, and records completedAt'
    );

    // Concurrent optimistic lock conflict (409) using stale version: 1
    const staleUpdateSess1 = await apiJson(
      baseUrl,
      `/api/v1/therapies/sessions/${initialSession._id}`,
      {
        method: 'PATCH',
        token: tokenDocA,
        body: {
          version: 1,
          practitionerNotes: 'Conflicting stale update',
        },
      }
    );
    assert(
      staleUpdateSess1.status === 409 && staleUpdateSess1.data?.code === 'SESSION_CONFLICT',
      'Concurrent stale version session update triggers 409 SESSION_CONFLICT'
    );

    // Completed session preservation (cannot revert status or delete)
    const revertCompleted = await apiJson(
      baseUrl,
      `/api/v1/therapies/sessions/${initialSession._id}`,
      {
        method: 'PATCH',
        token: tokenDocA,
        body: { version: 2, status: 'Scheduled' },
      }
    );
    assert(
      revertCompleted.status === 400 && revertCompleted.data?.code === 'COMPLETED_SESSION_IMMUTABLE',
      'Cannot revert a Completed session status'
    );

    const deleteCompleted = await apiJson(
      baseUrl,
      `/api/v1/therapies/sessions/${initialSession._id}`,
      {
        method: 'DELETE',
        token: tokenDocA,
      }
    );
    assert(
      deleteCompleted.status === 400 && deleteCompleted.data?.code === 'COMPLETED_SESSION_IMMUTABLE',
      'Completed session deletion prevented to preserve history'
    );

    // Deleting a non-completed session succeeds
    const deleteSess2 = await apiJson(baseUrl, `/api/v1/therapies/sessions/${session2._id}`, {
      method: 'DELETE',
      token: tokenDocA,
    });
    assert(deleteSess2.status === 200, 'Non-completed scheduled session can be removed');

    // Parent plan auto-promoted from FINALIZED to ACTIVE
    const refreshedPlan = await TreatmentPlan.findById(plan1._id);
    assert(refreshedPlan?.status === 'ACTIVE', 'Parent FINALIZED plan promoted to ACTIVE after session completion');

    // ----------------------------------------------------
    // Suite 6: Patient Treatment History & Validation
    // ----------------------------------------------------
    console.log('\nSuite 6: Patient Treatment History & Input Validation');
    const historyRes = await apiJson(
      baseUrl,
      `/api/v1/patients/${patientA1._id}/treatment-history`,
      { token: tokenDocA }
    );
    assert(
      historyRes.status === 200 &&
        historyRes.data?.data?.summary?.totalPlans === 2 &&
        historyRes.data?.data?.summary?.completedSessionsCount === 1 &&
        historyRes.data?.data?.summary?.upcomingSessionsCount === 1,
      'Patient treatment history returns accurate plans and session counts'
    );

    const docBHistory = await apiJson(
      baseUrl,
      `/api/v1/patients/${patientA1._id}/treatment-history`,
      { token: tokenDocB }
    );
    assert(docBHistory.status === 403, 'Doctor B blocked from reading Doctor A\'s patient treatment history');

    const badValidation = await apiJson(baseUrl, '/api/v1/therapies/plans', {
      method: 'POST',
      token: tokenDocA,
      body: { patientId: 'invalid-id', plannedSessions: 0 },
    });
    assert(
      badValidation.status === 400 && badValidation.data?.code === 'VALIDATION_ERROR',
      'Invalid payload rejected with 400 VALIDATION_ERROR'
    );

    // ----------------------------------------------------
    // Suite 7: Selectable-Text A4 Treatment Plan PDF
    // ----------------------------------------------------
    console.log('\nSuite 7: Selectable-Text A4 Treatment Plan PDF & Security');

    const unauthPdf = await fetch(`${baseUrl}/api/v1/therapies/plans/${plan1._id}/pdf`);
    assert(unauthPdf.status === 401, 'Unauthenticated Treatment Plan PDF request rejected (401)');

    const docBPdf = await fetch(`${baseUrl}/api/v1/therapies/plans/${plan1._id}/pdf`, {
      headers: { Authorization: `Bearer ${tokenDocB}` },
    });
    assert(docBPdf.status === 403, 'Cross-doctor Treatment Plan PDF request rejected (403)');

    const pdfRes = await fetch(`${baseUrl}/api/v1/therapies/plans/${plan1._id}/pdf`, {
      headers: { Authorization: `Bearer ${tokenDocA}` },
    });
    const cacheCtrl = pdfRes.headers.get('cache-control') || '';
    const contentDisp = pdfRes.headers.get('content-disposition') || '';
    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

    assert(
      pdfRes.status === 200 &&
        (pdfRes.headers.get('content-type') || '').includes('application/pdf') &&
        cacheCtrl.includes('private') &&
        cacheCtrl.includes('no-store') &&
        contentDisp.includes(`Treatment-Plan-${patientA1.patientId}`),
      'Authorized PDF streams with private no-store cache headers and patient-code filename'
    );

    const extracted = await extractPdfText(pdfBuffer);
    const fullText = extracted.pagesText.join('\n');
    const compactText = fullText.replace(/\s+/g, '');

    assert(
      extracted.numPages >= 1 &&
        fullText.includes('PATIENT TREATMENT PLAN') &&
        fullText.includes(plan1.chartNumber) &&
        fullText.includes(patientA1.name) &&
        fullText.includes('Manual Physiotherapy') &&
        fullText.includes('Tasnim Akter (Physiotherapist)') &&
        compactText.includes('হালকাগরম') &&
        compactText.includes('ওজনবহন') &&
        /Page\s+1\s+of\s+\d+/i.test(fullText) &&
        !fullText.includes('Frequency'),
      'PDF renders selectable bilingual Unicode text, session log, footer, and omits unentered Frequency row'
    );

    const edPdfRes = await fetch(`${baseUrl}/api/v1/therapies/plans/${edPlanRes.data.data.plan._id}/pdf`, {
      headers: { Authorization: `Bearer ${tokenDocA}` },
    });
    const edDisp = edPdfRes.headers.get('content-disposition') || '';
    assert(
      edPdfRes.status === 200 && !edDisp.toLowerCase().includes('shockwave') && !edDisp.toLowerCase().includes('ed-'),
      'ED Treatment Plan PDF keeps filename generic without sensitive modality leaks'
    );

    const outDir = process.env.THERAPY_TEST_OUT_DIR;
    if (outDir) {
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'treatment-plan-sample.pdf'), pdfBuffer);
    }

    // ----------------------------------------------------
    // Suite 8: Audit Event Metadata Privacy Verification
    // ----------------------------------------------------
    console.log('\nSuite 8: Audit Logging & Clinical Privacy Verification');
    const logs = await AuditLog.find({
      action: {
        $in: [
          'THERAPY_CATEGORY_CREATE',
          'THERAPY_CREATE',
          'THERAPY_UPDATE',
          'THERAPY_STATUS_TOGGLE',
          'THERAPY_VERIFY',
          'PRACTITIONER_CREATE',
          'TREATMENT_PLAN_CREATE',
          'TREATMENT_PLAN_FINALIZE',
          'TREATMENT_PLAN_VIEW',
          'TREATMENT_PLAN_PDF',
          'THERAPY_SESSION_CREATE',
          'THERAPY_SESSION_UPDATE',
          'THERAPY_SESSION_DELETE',
        ],
      },
    })
      .lean()
      .exec();

    for (const reqAction of [
      'THERAPY_CATEGORY_CREATE',
      'THERAPY_CREATE',
      'THERAPY_VERIFY',
      'TREATMENT_PLAN_FINALIZE',
      'THERAPY_SESSION_UPDATE',
      'TREATMENT_PLAN_PDF',
    ]) {
      assert(
        logs.some((l) => l.action === reqAction),
        `Audit log recorded ${reqAction}`
      );
    }

    const leakedClinicalText = logs.some((l) => {
      const s = JSON.stringify(l.details || {});
      return (
        s.includes('Cervical') ||
        s.includes('radicular') ||
        s.includes('হালকা') ||
        s.includes('Written consent') ||
        s.includes('mobilization')
      );
    });
    assert(!leakedClinicalText, 'Audit logs store metadata only with zero clinical notes/feedback/precautions');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closePdfBrowser();
    await closeDatabase();
  }

  console.log(`\nSummary: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
};

runTherapiesTests().catch(async (err) => {
  console.error('Unhandled error in Therapies test suite:', err);
  await closePdfBrowser().catch(() => {});
  await closeDatabase().catch(() => {});
  process.exit(1);
});
