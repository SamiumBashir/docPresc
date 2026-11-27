process.env.NODE_ENV = 'test';
process.env.ALLOW_DESTRUCTIVE_RESET = 'true';

import fs from 'fs';
import path from 'path';
import http from 'http';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'url';
import { createApp } from '../app';
import { connectDatabase, closeDatabase } from '../config/db';
import { seedDatabase } from '../seeds/seed';
import { ensureFoodCatalogSeeded } from '../seeds/foodCatalog';
import { closePdfBrowser } from '../modules/food-charts/foodChart.pdf';
import { User } from '../models/User';
import { Doctor } from '../models/Doctor';
import { Patient } from '../models/Patient';
import { FoodCatalogItem } from '../models/FoodCatalogItem';
import { FoodChart } from '../models/FoodChart';
import { AuditLog } from '../models/AuditLog';

const EXPECTED_ALLOWED_LABELS = [
  'ভিটামিন ও মিনারেল সমৃদ্ধ ডিম',
  'ঢেঁকি ছাঁটা চাল',
  'দুধ (ফ্যাটলেস)',
  'দুধ (ফুল ক্রিম যুক্ত)',
  'দই',
  'অলিভ অয়েল',
  'সিসাম অয়েল (তিলের তেল)',
  'চিকেন (ফ্যাটলেস ও হেভি মেটাললেস)',
  'নাট বাটার',
  'হলুদ / টারমারিক',
  'শাক-সবজি',
  'লিক (ভেজিটেবল)',
  'ভিটামিন-সি',
  'মধু',
  'মরিঙ্গা চা',
  'সামুদ্রিক মাছ',
  'বিটরুট',
  'ফল',
  'কাঠের ঘানিতে ভাঙানো খাঁটি সরিষার তেল',
  'অন্যান্য',
];

const EXPECTED_AVOIDED_LABELS = [
  'অতিরিক্ত চর্বিযুক্ত খাবার',
  'লাল মাংস',
  'ঝাল ও মসলাযুক্ত খাবার',
  'অ্যাসিডিটি তৈরি করে এমন খাবার (গ্যাস্ট্রিক)',
  'ফাস্টফুড',
  'মাটির নিচের খাবার (মুলা, গাজর, শালগম, আলু, ওলকপি)',
  'মিষ্টিকুমড়া',
  'মিষ্টি, চকোলেট ও প্যাস্ট্রি',
  'প্রক্রিয়াজাত সংরক্ষিত খাবার',
  'অন্যান্য',
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

const runFoodChartsTests = async () => {
  console.log('\nStarting Food Charts Backend & PDF Verification Suite...\n');
  await connectDatabase();
  await seedDatabase(true);
  await ensureFoodCatalogSeeded(true);

  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address() as any;
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  try {
    // Login Primary Seeded Doctor (Doctor A)
    const loginA = await apiJson(baseUrl, '/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'doctor@prescription.com', password: 'Doctor123!' },
    });
    assert(loginA.status === 200 && Boolean(loginA.data?.data?.accessToken || loginA.data?.data?.token), 'Doctor A logs in');
    const tokenA: string = loginA.data.data.accessToken || loginA.data.data.token;
    const doctorA = await Doctor.findOne({ email: 'doctor@prescription.com' });
    const patientsA = await Patient.find({ doctorId: doctorA!._id }).sort({ createdAt: 1 });
    assert(patientsA.length >= 2, 'Doctor A has at least 2 seeded patients');
    const patientA1 = patientsA[0];
    const patientA2 = patientsA[1];

    // Create Secondary Doctor (Doctor B) + Patient B1 for Anti-IDOR checks
    const hashB = await bcrypt.hash('DoctorB123!', 10);
    const userB = await User.create({
      name: 'Dr. Second Physician',
      email: `doctorb_${Date.now()}@example.com`,
      phone: '01788990011',
      passwordHash: hashB,
      role: 'doctor',
      status: 'active',
    });
    const doctorB = await Doctor.create({
      userId: userB._id,
      name: 'Dr. Second Physician',
      qualification: 'MBBS',
      specialization: 'Medicine',
      bmdcNumber: 'A-99887',
      phone: '01788990011',
      email: userB.email,
    });
    const patientB1 = await Patient.create({
      patientId: `PAT-TEST-${Date.now()}`,
      doctorId: doctorB._id,
      name: 'Cross Doctor Patient',
      phone: '01811223344',
      age: 40,
      gender: 'Female',
      allergies: [],
      medicalHistory: [],
    });
    const loginB = await apiJson(baseUrl, '/api/v1/auth/login', {
      method: 'POST',
      body: { email: userB.email, password: 'DoctorB123!' },
    });
    const tokenB: string = loginB.data.data.accessToken || loginB.data.data.token;
    assert(Boolean(tokenB), 'Doctor B logs in for ownership isolation checks');

    // Non-doctor Admin (no Doctor profile) token check
    const adminLogin = await apiJson(baseUrl, '/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'admin@prescription.com', password: 'Admin123!' },
    });
    const adminToken: string = adminLogin.data?.data?.accessToken || adminLogin.data?.data?.token || '';

    // ----------------------------------------------------
    // Suite 1: Catalog Seeding & Clinical Guardrails
    // ----------------------------------------------------
    console.log('\nSuite 1: 30-Item Catalog & Safety Guardrails');
    const unauthCat = await apiJson(baseUrl, '/api/v1/food-charts/catalog');
    assert(unauthCat.status === 401, 'Unauthenticated catalog request blocked (401)');

    if (adminToken) {
      const adminNoDoc = await apiJson(baseUrl, '/api/v1/food-charts/catalog', { token: adminToken });
      assert(adminNoDoc.status === 403, 'Non-doctor account without doctor profile rejected (403)');
    }

    await ensureFoodCatalogSeeded();
    const catRes = await apiJson(baseUrl, '/api/v1/food-charts/catalog', { token: tokenA });
    assert(catRes.status === 200, 'Authenticated doctor fetches food catalog');
    const allowedCat = catRes.data?.data?.allowed || [];
    const avoidedCat = catRes.data?.data?.avoided || [];
    assert(allowedCat.length === 20, `Allowed catalog has exact 20 items (got ${allowedCat.length})`);
    assert(avoidedCat.length === 10, `Avoided catalog has exact 10 items (got ${avoidedCat.length})`);

    const dbTotalCatalog = await FoodCatalogItem.countDocuments({ isActive: true });
    assert(dbTotalCatalog === 30, `Idempotent catalog has exactly 30 active items (got ${dbTotalCatalog})`);

    const allowedMatch = EXPECTED_ALLOWED_LABELS.every(
      (label, i) => allowedCat[i]?.labelBn === label
    );
    const avoidedMatch = EXPECTED_AVOIDED_LABELS.every(
      (label, i) => avoidedCat[i]?.labelBn === label
    );
    assert(allowedMatch, 'All 20 Allowed Bengali catalog strings match specification verbatim');
    assert(avoidedMatch, 'All 10 Avoided Bengali catalog strings match specification verbatim');

    const allLabelsJoined = [...allowedCat, ...avoidedCat].map((x: any) => x.labelBn).join(' ');
    assert(
      !/vitamin-d|40,?000|iu|tablet|supplement/i.test(allLabelsJoined),
      'Catalog strictly excludes Vitamin-D 40,000 IU tablets and all supplements'
    );

    // ----------------------------------------------------
    // Suite 2: Validation, Ownership, Anti-IDOR & Empty Charts
    // ----------------------------------------------------
    console.log('\nSuite 2: Auth Ownership, Spoof Prevention & Zod Validation');
    const emptyChartRes = await apiJson(baseUrl, '/api/v1/food-charts', {
      method: 'POST',
      token: tokenA,
      body: {
        patientId: patientA1._id.toString(),
        doctorId: doctorB._id.toString(), // Spoof attempt
      },
    });
    assert(emptyChartRes.status === 201, 'Empty blank draft chart succeeds with 0 selected items');
    assert(
      emptyChartRes.data.data.doctorId === doctorA!._id.toString(),
      'Server ignores spoofed body.doctorId and enforces req.doctor._id'
    );
    assert(
      emptyChartRes.data.data.allowedFoods.length === 0 &&
        emptyChartRes.data.data.avoidedFoods.length === 0 &&
        emptyChartRes.data.data.supplements.length === 0,
      'New chart starts with 0 auto-selected foods and 0 auto-populated supplements'
    );

    const invalidRes = await apiJson(baseUrl, '/api/v1/food-charts', {
      method: 'POST',
      token: tokenA,
      body: {
        patientId: patientA1._id.toString(),
        status: 'INVALID_STATUS',
        supplements: [{ name: '' }],
      },
    });
    assert(invalidRes.status === 400, 'Zod rejects invalid status & empty supplement name (400)');

    const crossCreateRes = await apiJson(baseUrl, '/api/v1/food-charts', {
      method: 'POST',
      token: tokenA,
      body: { patientId: patientB1._id.toString() },
    });
    assert(crossCreateRes.status === 403, 'Doctor A blocked from creating chart for Doctor B patient (403)');

    // ----------------------------------------------------
    // Suite 3: Concurrent Atomic FC-YYYY-NNNNNN Generation
    // ----------------------------------------------------
    console.log('\nSuite 3: Concurrent Atomic FC-YYYY-NNNNNN Generation');
    const concurrentResponses = await Promise.all(
      Array.from({ length: 8 }).map(() =>
        apiJson(baseUrl, '/api/v1/food-charts', {
          method: 'POST',
          token: tokenA,
          body: { patientId: patientA1._id.toString() },
        })
      )
    );
    const chartNumbers = concurrentResponses.map((r) => r.data?.data?.chartNumber);
    const allCreated = concurrentResponses.every((r) => r.status === 201);
    const validPattern = chartNumbers.every((num) => /^FC-\d{4}-\d{6}$/.test(num || ''));
    const uniqueNumbers = new Set(chartNumbers).size === chartNumbers.length;
    assert(allCreated && validPattern && uniqueNumbers, `8 concurrent charts produced 8 unique FC-YYYY-NNNNNN IDs (${chartNumbers.slice(0, 3).join(', ')}...)`);

    // ----------------------------------------------------
    // Suite 4: Draft Update, Delete, Finalize Immutability & Revision v2
    // ----------------------------------------------------
    console.log('\nSuite 4: CRUD, Finalize Immutability & Revision Versioning');
    const secretSupp = 'PrivateClinicalSupp987';
    const chartId = emptyChartRes.data.data._id;

    const updateRes = await apiJson(baseUrl, `/api/v1/food-charts/${chartId}`, {
      method: 'PUT',
      token: tokenA,
      body: {
        allowedFoods: [
          {
            catalogItemId: allowedCat[0]._id,
            labelBn: allowedCat[0].labelBn,
            category: allowedCat[0].category,
            isCustom: false,
            order: 0,
          },
          {
            catalogItemId: allowedCat[1]._id,
            labelBn: allowedCat[1].labelBn,
            category: allowedCat[1].category,
            isCustom: false,
            order: 1,
          },
          {
            catalogItemId: null,
            labelBn: 'কাস্টম স্যুপ',
            category: 'Custom',
            isCustom: true,
            portion: '1 bowl',
            timing: 'Evening',
            prepNote: 'No extra oil',
            order: 2,
          },
        ],
        avoidedFoods: [
          {
            catalogItemId: avoidedCat[1]._id,
            labelBn: avoidedCat[1].labelBn,
            category: avoidedCat[1].category,
            isCustom: false,
            order: 0,
          },
        ],
        supplements: [
          {
            name: secretSupp,
            dosage: '1 cap',
            frequency: '0+1+0',
            duration: '30 days',
            instructions: 'After lunch',
            order: 0,
          },
        ],
        dietaryInstructions: 'প্রতিদিন পর্যাপ্ত পানি পান করবেন।',
        additionalNotes: 'Review lipid profile after 4 weeks.',
      },
    });
    assert(updateRes.status === 200 && updateRes.data.data.allowedFoods.length === 3, 'Draft updated cleanly with catalog + custom foods + manual supplement');

    const getViewRes = await apiJson(baseUrl, `/api/food-charts/${chartId}`, { token: tokenA });
    assert(getViewRes.status === 200, 'Legacy /api/food-charts/:id mount returns chart cleanly');

    // Cross-doctor read/modify checks on chartId
    const crossRead = await apiJson(baseUrl, `/api/v1/food-charts/${chartId}`, { token: tokenB });
    const crossUpdate = await apiJson(baseUrl, `/api/v1/food-charts/${chartId}`, {
      method: 'PUT',
      token: tokenB,
      body: { dietaryInstructions: 'Hacked' },
    });
    const crossDelete = await apiJson(baseUrl, `/api/v1/food-charts/${chartId}`, {
      method: 'DELETE',
      token: tokenB,
    });
    const crossPdf = await fetch(`${baseUrl}/api/v1/food-charts/${chartId}/pdf`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(
      crossRead.status === 403 &&
        crossUpdate.status === 403 &&
        crossDelete.status === 403 &&
        crossPdf.status === 403,
      'Cross-doctor GET / PUT / DELETE / PDF all rejected with 403'
    );

    // Delete disposable concurrent draft
    const disposableId = concurrentResponses[0].data.data._id;
    const delDraft = await apiJson(baseUrl, `/api/v1/food-charts/${disposableId}`, {
      method: 'DELETE',
      token: tokenA,
    });
    const fetchDeleted = await apiJson(baseUrl, `/api/v1/food-charts/${disposableId}`, {
      token: tokenA,
    });
    assert(delDraft.status === 200 && fetchDeleted.status === 404, 'Draft deleted cleanly and returns 404 afterwards');

    // Finalize main chart v1
    const finalizeRes = await apiJson(baseUrl, `/api/v1/food-charts/${chartId}/finalize`, {
      method: 'POST',
      token: tokenA,
    });
    assert(
      finalizeRes.status === 200 &&
        finalizeRes.data.data.status === 'FINALIZED' &&
        Boolean(finalizeRes.data.data.finalizedAt),
      'Finalize transitions chart v1 to FINALIZED with timestamp'
    );

    // Immutability checks on finalized chart
    const editFinalized = await apiJson(baseUrl, `/api/v1/food-charts/${chartId}`, {
      method: 'PUT',
      token: tokenA,
      body: { dietaryInstructions: 'Should fail' },
    });
    const deleteFinalized = await apiJson(baseUrl, `/api/v1/food-charts/${chartId}`, {
      method: 'DELETE',
      token: tokenA,
    });
    assert(
      editFinalized.status === 400 && deleteFinalized.status === 400,
      'Direct PUT and DELETE on FINALIZED chart rejected with 400'
    );

    // Revise v1 -> v2
    const reviseRes = await apiJson(baseUrl, `/api/v1/food-charts/${chartId}/revise`, {
      method: 'POST',
      token: tokenA,
    });
    assert(
      reviseRes.status === 201 &&
        reviseRes.data.data.status === 'DRAFT' &&
        reviseRes.data.data.version === 2 &&
        reviseRes.data.data.parentChartId === chartId &&
        reviseRes.data.data.rootChartId === chartId &&
        reviseRes.data.data.chartNumber !== finalizeRes.data.data.chartNumber,
      'Revise spawns editable v2 DRAFT linked to parentChartId & rootChartId'
    );

    const versionsRes = await apiJson(baseUrl, `/api/v1/food-charts/${reviseRes.data.data._id}/versions`, {
      token: tokenA,
    });
    assert(
      versionsRes.status === 200 &&
        versionsRes.data.data.length === 2 &&
        versionsRes.data.data[0].version === 2 &&
        versionsRes.data.data[1].version === 1 &&
        versionsRes.data.data[1].status === 'FINALIZED',
      'Version history preserves finalized v1 verbatim alongside v2 draft'
    );

    // Verify patient endpoint mount on both /api and /api/v1
    const patientChartsV1 = await apiJson(
      baseUrl,
      `/api/v1/patients/${patientA1._id}/food-charts?status=FINALIZED`,
      { token: tokenA }
    );
    const patientChartsLegacy = await apiJson(
      baseUrl,
      `/api/patients/${patientA1._id}/food-charts`,
      { token: tokenA }
    );
    assert(
      patientChartsV1.status === 200 &&
        patientChartsV1.data.data.every((c: any) => c.status === 'FINALIZED') &&
        patientChartsLegacy.status === 200,
      'Patient food-charts routes work cleanly under /api/v1 and /api'
    );

    // Directory search & pagination
    const dirRes = await apiJson(
      baseUrl,
      `/api/v1/food-charts?status=FINALIZED&search=${encodeURIComponent(finalizeRes.data.data.chartNumber)}&page=1&limit=5`,
      { token: tokenA }
    );
    assert(
      dirRes.status === 200 &&
        dirRes.data.data.charts.length === 1 &&
        dirRes.data.data.pagination.total === 1,
      'Directory search + status filter + pagination returns exact match'
    );

    // ----------------------------------------------------
    // Suite 5: Prescription Attachment & Public Share Exclusion
    // ----------------------------------------------------
    console.log('\nSuite 5: Prescription Attachment & Public Share Privacy');
    // Reject attaching DRAFT chart
    const attachDraftRx = await apiJson(baseUrl, '/api/v1/prescriptions', {
      method: 'POST',
      token: tokenA,
      body: {
        patientId: patientA1._id.toString(),
        attachedFoodChartId: reviseRes.data.data._id, // DRAFT v2
        status: 'DRAFT',
      },
    });
    assert(attachDraftRx.status === 400, 'Rejects attaching a DRAFT food chart to prescription (400)');

    // Reject attaching FINALIZED chart belonging to Patient A1 onto Patient A2 Rx
    const wrongPatientRx = await apiJson(baseUrl, '/api/v1/prescriptions', {
      method: 'POST',
      token: tokenA,
      body: {
        patientId: patientA2._id.toString(),
        attachedFoodChartId: chartId,
        status: 'DRAFT',
      },
    });
    assert(wrongPatientRx.status === 400, 'Rejects attaching finalized food chart belonging to a different patient (400)');

    // Create & finalize Rx with valid FINALIZED Food Chart attached
    const validAttachedRx = await apiJson(baseUrl, '/api/v1/prescriptions', {
      method: 'POST',
      token: tokenA,
      body: {
        patientId: patientA1._id.toString(),
        advice: ['Follow balanced low-fat diet'],
        attachedFoodChartId: chartId,
        status: 'FINALIZED',
      },
    });
    assert(validAttachedRx.status === 201, 'Creates finalized prescription with attached FINALIZED food chart');

    const fetchedRx = await apiJson(
      baseUrl,
      `/api/v1/prescriptions/${validAttachedRx.data.data._id}`,
      { token: tokenA }
    );
    assert(
      fetchedRx.status === 200 &&
        fetchedRx.data.data.attachedFoodChartId?.chartNumber === finalizeRes.data.data.chartNumber,
      'Authenticated prescription GET populates attachedFoodChartId summary'
    );

    const shareToken = validAttachedRx.data.data.shareToken;
    const publicShareRes = await apiJson(baseUrl, `/api/public/prescriptions/share/${shareToken}`);
    const publicJsonStr = JSON.stringify(publicShareRes.data);
    assert(
      publicShareRes.status === 200 &&
        publicShareRes.data.data.attachedFoodChartId === undefined &&
        !publicJsonStr.includes(finalizeRes.data.data.chartNumber) &&
        !publicJsonStr.includes(secretSupp),
      'Public prescription share DTO strictly excludes Food Chart data and references'
    );

    // ----------------------------------------------------
    // Suite 6: Selectable-Text A4 PDF Generation (1-Page & Multi-Page)
    // ----------------------------------------------------
    console.log('\nSuite 6: Selectable-Text A4 PDF Verification (Single-Page & Multi-Page)');
    const pdfRes1 = await fetch(`${baseUrl}/api/v1/food-charts/${chartId}/pdf`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const ct = pdfRes1.headers.get('content-type') || '';
    const cc = pdfRes1.headers.get('cache-control') || '';
    const cd = pdfRes1.headers.get('content-disposition') || '';
    const pdfBuf1 = Buffer.from(await pdfRes1.arrayBuffer());

    assert(pdfRes1.status === 200, 'PDF endpoint returns 200 OK');
    assert(ct.includes('application/pdf'), `Content-Type is application/pdf (${ct})`);
    assert(
      cc.includes('private') &&
        cc.includes('no-store') &&
        cc.includes('no-cache') &&
        cc.includes('must-revalidate') &&
        cc.includes('proxy-revalidate'),
      `Cache-Control enforces private no-store headers (${cc})`
    );
    assert(
      /filename="Food-Chart-[^"]+-\d{4}-\d{2}-\d{2}\.pdf"/.test(cd),
      `Content-Disposition uses Food-Chart-<PatientID>-<YYYY-MM-DD>.pdf (${cd})`
    );
    assert(pdfBuf1.subarray(0, 5).toString() === '%PDF-', 'Response buffer starts with %PDF- magic bytes');

    const extracted1 = await extractPdfText(pdfBuf1);
    const fullText1 = extracted1.pagesText.join(' ');
    const compactText1 = fullText1.replace(/[\s\u0000]+/g, '');
    const bengaliCharCount = (fullText1.match(/[\u0980-\u09FF]/g) || []).length;
    assert(extracted1.numPages === 1, `Standard food chart renders on 1 A4 page (got ${extracted1.numPages})`);
    assert(
      fullText1.includes('PATIENT FOOD CHART') &&
        fullText1.includes(finalizeRes.data.data.chartNumber) &&
        fullText1.includes(patientA1.name) &&
        fullText1.includes(patientA1.patientId) &&
        fullText1.includes('Page 1 of 1'),
      'Single-page PDF contains selectable English clinical headers, patient info, and Page 1 of 1'
    );
    assert(
      bengaliCharCount >= 25 &&
        compactText1.includes('লালমাংস') &&
        fullText1.includes(secretSupp) &&
        fullText1.includes('Review lipid profile after 4 weeks.'),
      `Single-page PDF preserves selectable Bengali vector text (${bengaliCharCount} Bengali codepoints) and manual supplements`
    );

    // Create a multi-page chart (20 allowed catalog + 6 custom allowed + 10 avoided catalog + 5 custom avoided + 5 supplements + detailed instructions)
    const longChartRes = await apiJson(baseUrl, '/api/v1/food-charts', {
      method: 'POST',
      token: tokenA,
      body: {
        patientId: patientA1._id.toString(),
        allowedFoods: [
          ...allowedCat.map((item: any, idx: number) => ({
            catalogItemId: item._id,
            labelBn: item.labelBn,
            category: item.category,
            isCustom: false,
            portion: idx % 2 === 0 ? '1 serving daily' : undefined,
            timing: idx % 3 === 0 ? 'Morning / Lunch' : undefined,
            order: idx,
          })),
          ...Array.from({ length: 12 }).map((_, i) => ({
            catalogItemId: null,
            labelBn: `অতিরিক্ত অনুমোদিত খাদ্য নির্দেশনা নং ${i + 1} - পরিমিত পরিমাণে গ্রহণযোগ্য`,
            category: 'Custom',
            isCustom: true,
            portion: '1 cup / ১ কাপ',
            timing: 'Afternoon snack',
            prepNote: 'Steamed or lightly boiled with minimal salt and zero trans fat.',
            order: 20 + i,
          })),
        ],
        avoidedFoods: [
          ...avoidedCat.map((item: any, idx: number) => ({
            catalogItemId: item._id,
            labelBn: item.labelBn,
            category: item.category,
            isCustom: false,
            prepNote: 'Strictly avoid during acute symptom phase',
            order: idx,
          })),
          ...Array.from({ length: 6 }).map((_, i) => ({
            catalogItemId: null,
            labelBn: `অতিরিক্ত বর্জনীয় খাবার নং ${i + 1}`,
            category: 'Custom',
            isCustom: true,
            order: 10 + i,
          })),
        ],
        supplements: Array.from({ length: 5 }).map((_, i) => ({
          name: `Manual Clinical Supplement ${i + 1}`,
          dosage: `${(i + 1) * 250} mg`,
          frequency: '1+0+0',
          duration: '30 days',
          instructions: 'After breakfast',
          order: i,
        })),
        dietaryInstructions:
          'সকালে ঘুম থেকে উঠে হালকা কুসুম গরম পানি পান করবেন। প্রতিবেলার খাবারের মধ্যে অন্তত ৪ ঘণ্টা বিরতি রাখবেন। রাত ৯টার মধ্যে রাতের খাবার সম্পন্ন করবেন।',
        additionalNotes:
          'Follow-up with fresh fasting glucose and lipid panel after 1 month. Report any GI discomfort early.',
        status: 'FINALIZED',
      },
    });
    assert(longChartRes.status === 201, 'Long multi-page food chart created and finalized');

    const longPdfRes = await fetch(`${baseUrl}/api/v1/food-charts/${longChartRes.data.data._id}/pdf`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const pdfBufMulti = Buffer.from(await longPdfRes.arrayBuffer());
    const extractedMulti = await extractPdfText(pdfBufMulti);
    assert(
      extractedMulti.numPages >= 2,
      `Long food chart cleanly paginates across ${extractedMulti.numPages} A4 pages`
    );
    assert(
      extractedMulti.pagesText[0].includes('Allowed Foods') &&
        extractedMulti.pagesText[1].includes('Allowed Foods') &&
        extractedMulti.pagesText[1].includes(`Page 2 of ${extractedMulti.numPages}`),
      'Multi-page PDF repeats table column headers and Page X of Y footer on page 2'
    );

    // Save PDFs to scratch folder when FOOD_CHART_TEST_OUT_DIR is provided for visual inspection
    const outDir = process.env.FOOD_CHART_TEST_OUT_DIR;
    if (outDir) {
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'food-chart-1page.pdf'), pdfBuf1);
      fs.writeFileSync(path.join(outDir, 'food-chart-multipage.pdf'), pdfBufMulti);
    }

    // ----------------------------------------------------
    // Suite 7: Audit Event Metadata Privacy Verification
    // ----------------------------------------------------
    console.log('\nSuite 7: Audit Event Logging & Clinical Privacy Verification');
    const logs = await AuditLog.find({ resource: 'FoodChart' }).lean().exec();
    const expectedActions = [
      'FOOD_CHART_CREATE',
      'FOOD_CHART_VIEW',
      'FOOD_CHART_UPDATE',
      'FOOD_CHART_FINALIZE',
      'FOOD_CHART_REVISE',
      'FOOD_CHART_DELETE',
      'FOOD_CHART_PDF',
    ];
    for (const action of expectedActions) {
      assert(
        logs.some((l) => l.action === action),
        `Audit log recorded ${action}`
      );
    }

    const leakedClinicalDetails = logs.some((log) => {
      const s = JSON.stringify(log.details || {});
      return (
        s.includes('allowedFoods') ||
        s.includes('avoidedFoods') ||
        s.includes('supplements') ||
        s.includes(secretSupp) ||
        s.includes('ভিটামিন') ||
        s.includes('ডিম')
      );
    });
    assert(!leakedClinicalDetails, 'Audit logs store only safe metadata (zero clinical food/supplement details)');
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

runFoodChartsTests().catch(async (err) => {
  console.error('Unhandled error in Food Charts test suite:', err);
  await closePdfBrowser().catch(() => {});
  await closeDatabase().catch(() => {});
  process.exit(1);
});
