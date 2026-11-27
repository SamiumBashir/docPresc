import { ITreatmentPlan } from '../../models/TreatmentPlan';
import { ITherapySession } from '../../models/TherapySession';
import {
  escapeHtml,
  safeMediaSrc,
  loadBundledFontCss,
  renderHtmlToA4Pdf,
  closePdfBrowser,
} from '../../shared/utils/pdfRenderer';

export { closePdfBrowser };

const formatDateShort = (date?: Date | string | null): string => {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTimeShort = (date?: Date | string | null): string => {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatConsentLabel = (status: string): string => {
  switch (status) {
    case 'OBTAINED':
      return 'Consent Obtained';
    case 'PENDING':
      return 'Consent Pending';
    case 'DECLINED':
      return 'Consent Declined';
    case 'NOT_REQUIRED':
    default:
      return 'Not Specified';
  }
};

export const buildTreatmentPlanHtml = (
  plan: ITreatmentPlan,
  sessions: ITherapySession[] = []
): string => {
  const fontCss = loadBundledFontCss();
  const docSnap = plan.doctorSnapshot || ({} as ITreatmentPlan['doctorSnapshot']);
  const patSnap = plan.patientSnapshot || ({} as ITreatmentPlan['patientSnapshot']);
  const therapySnap = plan.therapySnapshot || ({} as ITreatmentPlan['therapySnapshot']);
  const pracSnap = plan.practitionerSnapshot || ({} as ITreatmentPlan['practitionerSnapshot']);

  const chamberPopulated =
    plan.chamberId && typeof plan.chamberId === 'object' && 'name' in plan.chamberId
      ? (plan.chamberId as any)
      : null;

  const rawDoctorName = docSnap.name || 'Physician';
  const doctorDisplayName = /^Dr\.?/i.test(rawDoctorName) ? rawDoctorName : `Dr. ${rawDoctorName}`;
  const qualificationLines = (docSnap.qualification || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const authorityLabel = docSnap.healthcareAuthority || 'BMDC';
  const regNo = docSnap.registrationNumber || docSnap.bmdcNumber || '';

  const chamberName = chamberPopulated?.name || docSnap.chamberName || '';
  const chamberAddress = chamberPopulated?.address || docSnap.chamberAddress || '';
  const chamberPhone = chamberPopulated?.phone || docSnap.phone || '';
  const chamberApptPhone = chamberPopulated?.appointmentPhone || docSnap.appointmentPhone || '';
  const chamberHours = chamberPopulated?.visitingHours || docSnap.visitingHours || '';
  const chamberDays =
    Array.isArray(chamberPopulated?.visitingDays) && chamberPopulated.visitingDays.length > 0
      ? chamberPopulated.visitingDays.join(', ')
      : Array.isArray(docSnap.visitingDays) && docSnap.visitingDays.length > 0
      ? docSnap.visitingDays.join(', ')
      : '';
  const chamberRoom = chamberPopulated?.roomNo || docSnap.roomNo || '';
  const chamberWebsite = chamberPopulated?.website || docSnap.website || '';

  const logoSrc = safeMediaSrc(docSnap.logo);
  const signatureSrc = safeMediaSrc(chamberPopulated?.signature || docSnap.signature);
  const planDate = formatDateShort(plan.finalizedAt || plan.createdAt);

  const therapyList =
    Array.isArray(plan.therapySnapshots) && plan.therapySnapshots.length > 0
      ? plan.therapySnapshots
      : therapySnap?.name
      ? [therapySnap]
      : [];

  const uniqueCategories = Array.from(
    new Set(therapyList.map((item) => item.categoryName).filter(Boolean))
  );
  const combinedQuals = Array.from(
    new Set(therapyList.map((item) => item.requiredProviderQualifications).filter(Boolean))
  ).join(' • ');
  const combinedEquipment = Array.from(
    new Set(therapyList.map((item) => item.requiredEquipment).filter(Boolean))
  ).join(' • ');

  // Build clinical parameter rows ONLY for non-empty fields supplied by the clinician
  const parameterRows: Array<{ label: string; value: string }> = [
    {
      label: therapyList.length > 1 ? `Prescribed Therapies (${therapyList.length})` : 'Prescribed Therapy',
      value:
        therapyList.length > 1
          ? therapyList
              .map((item, idx) => {
                const display = item.bengaliName
                  ? `${item.name} (${item.bengaliName})`
                  : item.name;
                return `${idx + 1}. ${display}`;
              })
              .join('\n')
          : therapyList[0]?.bengaliName
          ? `${therapyList[0].name} (${therapyList[0].bengaliName})`
          : therapyList[0]?.name || '',
    },
    {
      label: uniqueCategories.length > 1 ? 'Therapy Categories' : 'Therapy Category',
      value: uniqueCategories.join(', '),
    },
    {
      label: 'Assigned Practitioner',
      value: [
        pracSnap.name,
        pracSnap.designation || pracSnap.role,
        pracSnap.qualification,
        pracSnap.registrationNumber ? `Reg: ${pracSnap.registrationNumber}` : '',
      ]
        .filter(Boolean)
        .join(' — '),
    },
  ];

  if (plan.treatmentObjective) {
    parameterRows.push({ label: 'Treatment Objective', value: plan.treatmentObjective });
  }
  if (plan.clinicalIndication) {
    parameterRows.push({ label: 'Clinical Indication', value: plan.clinicalIndication });
  }
  if (plan.plannedSessions !== null && plan.plannedSessions !== undefined) {
    parameterRows.push({ label: 'Planned Sessions', value: `${plan.plannedSessions} session(s)` });
  }
  if (plan.sessionDuration) {
    parameterRows.push({ label: 'Session Duration', value: plan.sessionDuration });
  }
  if (plan.frequency) {
    parameterRows.push({ label: 'Frequency', value: plan.frequency });
  }
  if (plan.scheduleSummary) {
    parameterRows.push({ label: 'Schedule Summary', value: plan.scheduleSummary });
  }
  if (plan.startDate || plan.endDate) {
    const startStr = plan.startDate ? formatDateShort(plan.startDate) : 'TBD';
    const endStr = plan.endDate ? formatDateShort(plan.endDate) : 'Ongoing';
    parameterRows.push({ label: 'Treatment Period', value: `${startStr} to ${endStr}` });
  }
  if (plan.consentStatus && plan.consentStatus !== 'NOT_REQUIRED') {
    parameterRows.push({
      label: 'Patient Consent',
      value: plan.consentNotes
        ? `${formatConsentLabel(plan.consentStatus)} — ${plan.consentNotes}`
        : formatConsentLabel(plan.consentStatus),
    });
  }
  if (combinedQuals) {
    parameterRows.push({
      label: 'Provider Qualification Standard',
      value: combinedQuals,
    });
  }
  if (combinedEquipment) {
    parameterRows.push({ label: 'Facility Equipment', value: combinedEquipment });
  }

  const parametersHtml = parameterRows
    .map(
      (row) => `
      <tr>
        <th class="detail-th">${escapeHtml(row.label)}</th>
        <td class="detail-td font-bn">${escapeHtml(row.value)}</td>
      </tr>`
    )
    .join('');

  const precautionsHtml =
    plan.precautions || plan.patientInstructions
      ? `
      <section class="section-block">
        <div class="notes-grid ${plan.precautions && plan.patientInstructions ? 'two-col' : 'one-col'}">
          ${
            plan.precautions
              ? `
            <div class="note-card">
              <div class="note-title">Contraindications &amp; Clinical Precautions</div>
              <div class="note-body font-bn">${escapeHtml(plan.precautions)}</div>
            </div>`
              : ''
          }
          ${
            plan.patientInstructions
              ? `
            <div class="note-card">
              <div class="note-title">Patient Instructions &amp; Preparation</div>
              <div class="note-body font-bn">${escapeHtml(plan.patientInstructions)}</div>
            </div>`
              : ''
          }
        </div>
      </section>`
      : '';

  const sessionsHtml =
    sessions.length > 0
      ? `
      <section class="section-block">
        <div class="section-heading">
          <span>Scheduled &amp; Completed Therapy Sessions (${sessions.length})</span>
          <span class="section-heading-sub">Session Tracking Log</span>
        </div>
        <table class="session-table">
          <thead>
            <tr>
              <th style="width: 7%;">#</th>
              <th style="width: 19%;">Scheduled Date</th>
              <th style="width: 19%;">Practitioner</th>
              <th style="width: 13%;">Status</th>
              <th style="width: 42%;">Clinical Notes / Patient Feedback</th>
            </tr>
          </thead>
          <tbody>
            ${sessions
              .map((sess) => {
                const notesParts: string[] = [];
                if (sess.completedAt) {
                  notesParts.push(`Completed: ${formatDateShort(sess.completedAt)}`);
                }
                if (sess.practitionerNotes) {
                  notesParts.push(`Notes: ${sess.practitionerNotes}`);
                }
                if (sess.patientFeedback) {
                  notesParts.push(`Feedback: ${sess.patientFeedback}`);
                }
                if (sess.nextSessionDate) {
                  notesParts.push(`Next Follow-up: ${formatDateShort(sess.nextSessionDate)}`);
                }
                return `
                  <tr>
                    <td class="num-cell">${sess.sessionNumber}</td>
                    <td class="num-cell">${escapeHtml(formatDateTimeShort(sess.scheduledAt))}</td>
                    <td>${escapeHtml(sess.assignedPractitionerName)}</td>
                    <td>
                      <span class="sess-status ${
                        sess.status === 'Completed'
                          ? 'is-completed'
                          : sess.status === 'Cancelled' || sess.status === 'Missed'
                          ? 'is-muted'
                          : ''
                      }">${escapeHtml(sess.status)}</span>
                    </td>
                    <td class="font-bn">${
                      notesParts.length > 0 ? escapeHtml(notesParts.join(' | ')) : '—'
                    }</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </section>`
      : '';

  const completedCount = sessions.filter((s) => s.status === 'Completed').length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Patient Treatment Plan - ${escapeHtml(plan.chartNumber)}</title>
  <style>
    ${fontCss}

    @page {
      size: A4 portrait;
      margin: 13mm 11mm 14mm 11mm;
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Inter', 'Noto Sans Bengali', Arial, sans-serif;
      font-size: 11px;
      line-height: 1.42;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .font-bn {
      font-family: 'Noto Sans Bengali', 'Inter', Arial, sans-serif;
    }

    .sheet {
      width: 100%;
    }

    /* 1. Letterhead */
    .letterhead {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding-bottom: 10px;
      border-bottom: 2px solid #007086;
    }

    .doc-col {
      flex: 1.25;
      min-width: 0;
    }

    .doc-name {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      color: #005b6d;
      letter-spacing: -0.01em;
    }

    .doc-qual {
      margin: 2px 0 0 0;
      font-size: 10px;
      color: #334155;
      font-weight: 500;
      white-space: pre-line;
    }

    .doc-spec {
      margin: 2px 0 0 0;
      font-size: 10.5px;
      font-weight: 700;
      color: #0f172a;
    }

    .doc-meta {
      margin: 2px 0 0 0;
      font-size: 9.5px;
      color: #475569;
    }

    .reg-badge {
      display: inline-block;
      margin-top: 4px;
      padding: 2px 6px;
      font-size: 9px;
      font-weight: 600;
      color: #0f172a;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 3px;
      font-variant-numeric: tabular-nums;
    }

    .clinic-col {
      flex: 1;
      display: flex;
      justify-content: flex-end;
      align-items: flex-start;
      gap: 10px;
      text-align: right;
      min-width: 0;
    }

    .clinic-logo {
      max-height: 46px;
      max-width: 72px;
      object-fit: contain;
    }

    .clinic-name {
      margin: 0;
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }

    .clinic-line {
      margin: 1.5px 0 0 0;
      font-size: 9.5px;
      color: #475569;
      line-height: 1.32;
    }

    /* 2. Banner */
    .title-banner {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border-bottom: 1px solid #cbd5e1;
      background: #f8fafc;
    }

    .banner-left {
      font-size: 10px;
      color: #334155;
      font-variant-numeric: tabular-nums;
    }

    .banner-center {
      text-align: center;
    }

    .banner-title {
      margin: 0;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: #0f172a;
      text-transform: uppercase;
    }

    .banner-subtitle {
      margin: 1px 0 0 0;
      font-size: 10.5px;
      font-weight: 600;
      color: #007086;
    }

    .banner-right {
      text-align: right;
      font-size: 10px;
      color: #334155;
      font-variant-numeric: tabular-nums;
    }

    .banner-label {
      color: #64748b;
      font-weight: 500;
      margin-right: 4px;
    }

    .banner-value {
      font-weight: 700;
      color: #0f172a;
    }

    .status-chip {
      display: inline-block;
      margin-left: 4px;
      padding: 1px 5px;
      font-size: 8.5px;
      font-weight: 700;
      border-radius: 3px;
      letter-spacing: 0.04em;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #334155;
    }

    .status-chip.approved {
      border-color: #aee2e8;
      background: #f0f9fa;
      color: #065b6d;
    }

    /* 3. Patient Bar */
    .patient-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      padding: 8px 12px;
      border-bottom: 1.5px solid #0f172a;
      background: #ffffff;
      margin-bottom: 12px;
      font-size: 10.5px;
    }

    .patient-cell-left { text-align: left; min-width: 0; }
    .patient-cell-center { text-align: left; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .patient-cell-right { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }

    /* 4. Details Table */
    .section-block {
      margin-bottom: 12px;
    }

    .section-heading {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding-bottom: 4px;
      margin-bottom: 6px;
      border-bottom: 1.5px solid #0f172a;
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .section-heading-sub {
      font-size: 9.5px;
      font-weight: 600;
      color: #007086;
      text-transform: none;
      letter-spacing: 0;
    }

    .detail-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
    }

    .detail-table tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .detail-th {
      width: 28%;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
      font-size: 10px;
      font-weight: 600;
      color: #475569;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
    }

    .detail-td {
      width: 72%;
      padding: 6px 8px;
      vertical-align: top;
      font-size: 10.5px;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      white-space: pre-wrap;
    }

    /* 5. Precautions & Instructions */
    .notes-grid {
      display: grid;
      gap: 10px;
    }

    .notes-grid.two-col { grid-template-columns: 1fr 1fr; }
    .notes-grid.one-col { grid-template-columns: 1fr; }

    .note-card {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 7px 9px;
      background: #ffffff;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .note-title {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #0c4a58;
      margin-bottom: 3px;
    }

    .note-body {
      font-size: 10.5px;
      color: #1e293b;
      white-space: pre-wrap;
      line-height: 1.45;
    }

    /* 6. Sessions Table */
    .session-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      font-size: 10px;
    }

    .session-table thead th {
      padding: 5px 6px;
      text-align: left;
      background: #f8fafc;
      border-bottom: 1.5px solid #0f172a;
      border-right: 1px solid #e2e8f0;
      color: #334155;
      font-size: 9.5px;
      font-weight: 700;
    }

    .session-table thead th:last-child {
      border-right: none;
    }

    .session-table tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .session-table tbody td {
      padding: 5px 6px;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      vertical-align: top;
      color: #1e293b;
    }

    .session-table tbody td:last-child {
      border-right: none;
    }

    .num-cell {
      font-variant-numeric: tabular-nums;
      font-weight: 600;
      color: #334155;
    }

    .sess-status {
      display: inline-block;
      padding: 1px 5px;
      border-radius: 3px;
      border: 1px solid #cbd5e1;
      font-size: 9px;
      font-weight: 600;
      color: #0f172a;
      background: #ffffff;
    }

    .sess-status.is-completed {
      border-color: #aee2e8;
      background: #f0f9fa;
      color: #065b6d;
    }

    .sess-status.is-muted {
      color: #64748b;
      background: #f8fafc;
    }

    /* 7. Signature & Footer */
    .signature-footer {
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .footer-meta {
      font-size: 9px;
      color: #64748b;
      line-height: 1.45;
      font-variant-numeric: tabular-nums;
    }

    .sig-box {
      text-align: right;
      min-width: 190px;
    }

    .sig-img-wrap {
      height: 36px;
      display: flex;
      justify-content: flex-end;
      align-items: flex-end;
      margin-bottom: 4px;
    }

    .sig-img {
      max-height: 36px;
      max-width: 150px;
      object-fit: contain;
    }

    .sig-line {
      border-top: 1px solid #475569;
      padding-top: 4px;
    }

    .sig-name {
      font-size: 10.5px;
      font-weight: 700;
      color: #0f172a;
    }

    .sig-sub {
      font-size: 9px;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <!-- Letterhead -->
    <header class="letterhead">
      <div class="doc-col">
        <h1 class="doc-name">${escapeHtml(doctorDisplayName)}</h1>
        ${qualificationLines.map((q) => `<p class="doc-qual">${escapeHtml(q)}</p>`).join('')}
        ${docSnap.specialization ? `<p class="doc-spec">${escapeHtml(docSnap.specialization)}</p>` : ''}
        ${
          docSnap.designation || docSnap.workplace
            ? `<p class="doc-meta">${escapeHtml(
                [docSnap.designation, docSnap.workplace].filter(Boolean).join(' • ')
              )}</p>`
            : ''
        }
        ${
          regNo
            ? `<span class="reg-badge">${escapeHtml(authorityLabel)} Reg: ${escapeHtml(regNo)}</span>`
            : ''
        }
      </div>
      <div class="clinic-col">
        <div class="clinic-text">
          ${chamberName ? `<p class="clinic-name">${escapeHtml(chamberName)}</p>` : ''}
          ${chamberAddress ? `<p class="clinic-line">${escapeHtml(chamberAddress)}</p>` : ''}
          ${chamberPhone ? `<p class="clinic-line">Phone: ${escapeHtml(chamberPhone)}</p>` : ''}
          ${chamberApptPhone ? `<p class="clinic-line">Serial: ${escapeHtml(chamberApptPhone)}</p>` : ''}
          ${
            chamberHours || chamberDays
              ? `<p class="clinic-line">${escapeHtml(
                  [chamberDays, chamberHours].filter(Boolean).join(' • ')
                )}</p>`
              : ''
          }
          ${chamberRoom ? `<p class="clinic-line">Room: ${escapeHtml(chamberRoom)}</p>` : ''}
          ${chamberWebsite ? `<p class="clinic-line">${escapeHtml(chamberWebsite)}</p>` : ''}
        </div>
        ${
          logoSrc
            ? `<img src="${escapeHtml(logoSrc)}" alt="Clinic Logo" class="clinic-logo" onerror="this.style.display='none'" />`
            : ''
        }
      </div>
    </header>

    <!-- Title Banner -->
    <div class="title-banner">
      <div class="banner-left">
        <span class="banner-label">Date:</span>
        <span class="banner-value">${escapeHtml(planDate)}</span>
      </div>
      <div class="banner-center">
        <div class="banner-title">PATIENT TREATMENT PLAN</div>
        <div class="banner-subtitle">Clinical Therapy Authorization &amp; Session Record</div>
      </div>
      <div class="banner-right">
        <span class="banner-label">Plan Ref:</span>
        <span class="banner-value">${escapeHtml(plan.chartNumber)}</span>
        <span class="status-chip ${
          plan.status === 'FINALIZED' || plan.status === 'ACTIVE' || plan.status === 'COMPLETED'
            ? 'approved'
            : ''
        }">${escapeHtml(plan.status)}</span>
      </div>
    </div>

    <!-- Patient Bar -->
    <div class="patient-bar">
      <div class="patient-cell-left">
        <span class="banner-label">Patient Name:</span>
        <span class="banner-value">${escapeHtml(patSnap.name)}</span>
      </div>
      <div class="patient-cell-center">
        <span class="banner-label">Patient ID:</span>
        <span class="banner-value">${escapeHtml(patSnap.patientId)}</span>
      </div>
      <div class="patient-cell-right">
        <span class="banner-label">Age / Gender:</span>
        <span class="banner-value">${escapeHtml(patSnap.age)} yrs / ${escapeHtml(patSnap.gender)}</span>
      </div>
    </div>

    <!-- Treatment Details -->
    <section class="section-block">
      <div class="section-heading">
        <span>Authorized Therapy &amp; Clinical Plan Details</span>
        <span class="section-heading-sub">Clinician Approval: ${
          plan.clinicianApprovalConfirmed ? 'Confirmed' : 'Pending'
        }</span>
      </div>
      <table class="detail-table">
        <tbody>
          ${parametersHtml}
        </tbody>
      </table>
    </section>

    <!-- Precautions & Patient Instructions -->
    ${precautionsHtml}

    <!-- Sessions Schedule & Tracking -->
    ${sessionsHtml}

    <!-- Signature & Verification Footer -->
    <footer class="signature-footer">
      <div class="footer-meta">
        <div>Plan Ref: ${escapeHtml(plan.chartNumber)} (v${plan.version || 1})</div>
        <div>Status: ${escapeHtml(plan.status)}${
    plan.finalizedAt ? ` on ${escapeHtml(formatDateShort(plan.finalizedAt))}` : ''
  }</div>
        <div>Practitioner: ${escapeHtml(pracSnap.name)}${
    sessions.length > 0 ? ` • Sessions Completed: ${completedCount}/${sessions.length}` : ''
  }</div>
      </div>
      <div class="sig-box">
        <div class="sig-img-wrap">
          ${
            signatureSrc
              ? `<img src="${escapeHtml(signatureSrc)}" alt="Physician Signature" class="sig-img" onerror="this.style.display='none'" />`
              : ''
          }
        </div>
        <div class="sig-line">
          <div class="sig-name">${escapeHtml(doctorDisplayName)}</div>
          ${regNo ? `<div class="sig-sub">${escapeHtml(authorityLabel)} Reg: ${escapeHtml(regNo)}</div>` : ''}
          <div class="sig-sub">Authorizing Clinician Signature &amp; Seal</div>
        </div>
      </div>
    </footer>
  </div>
</body>
</html>`;
};

export const renderTreatmentPlanPdf = async (
  plan: ITreatmentPlan,
  sessions: ITherapySession[] = []
): Promise<Buffer> => {
  const html = buildTreatmentPlanHtml(plan, sessions);

  const headerTemplate = `
    <div style="width: 100%; font-family: Arial, sans-serif; font-size: 8px; color: #64748b; padding: 0 11mm; display: flex; justify-content: space-between; align-items: center;">
      <span>PATIENT TREATMENT PLAN &bull; ${escapeHtml(plan.chartNumber)}</span>
      <span>Patient: ${escapeHtml(plan.patientSnapshot?.name)} (${escapeHtml(plan.patientSnapshot?.patientId)})</span>
    </div>
  `;

  const footerTemplate = `
    <div style="width: 100%; font-family: Arial, sans-serif; font-size: 8px; color: #64748b; padding: 0 11mm; border-top: 0.5px solid #cbd5e1; padding-top: 4px; display: flex; justify-content: space-between; align-items: center;">
      <span>Clinical Treatment Record &bull; ${escapeHtml(plan.chartNumber)}</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>
  `;

  return renderHtmlToA4Pdf({
    html,
    headerTemplate,
    footerTemplate,
  });
};
