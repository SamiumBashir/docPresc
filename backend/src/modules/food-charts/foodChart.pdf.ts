import { IFoodChart, IFoodChartEntry } from '../../models/FoodChart';
import {
  escapeHtml,
  safeMediaSrc,
  loadBundledFontCss,
  renderHtmlToA4Pdf,
  closePdfBrowser,
} from '../../shared/utils/pdfRenderer';

export { closePdfBrowser };

const formatDateShort = (date?: Date | string | null): string => {
  const d = date ? new Date(date) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const renderFoodEntryHtml = (entry: IFoodChartEntry, index: number, variant: 'allowed' | 'avoided'): string => {
  const metaParts: string[] = [];
  if (entry.portion) metaParts.push(`Portion: ${escapeHtml(entry.portion)}`);
  if (entry.timing) metaParts.push(`Timing: ${escapeHtml(entry.timing)}`);
  if (entry.prepNote) metaParts.push(`Note: ${escapeHtml(entry.prepNote)}`);

  const markerClass = variant === 'allowed' ? 'entry-num allowed' : 'entry-num avoided';

  return `
    <div class="matrix-entry">
      <div class="entry-row">
        <span class="${markerClass}">${index + 1}.</span>
        <div class="entry-content">
          <div class="entry-title font-bn">${escapeHtml(entry.labelBn)}</div>
          ${metaParts.length > 0 ? `<div class="entry-meta">${metaParts.join(' &bull; ')}</div>` : ''}
        </div>
      </div>
    </div>
  `;
};

export const buildFoodChartHtml = (chart: IFoodChart): string => {
  const fontCss = loadBundledFontCss();
  const docSnap = chart.doctorSnapshot || ({} as IFoodChart['doctorSnapshot']);
  const patSnap = chart.patientSnapshot || ({} as IFoodChart['patientSnapshot']);
  const chamberPopulated =
    chart.chamberId && typeof chart.chamberId === 'object' && 'name' in chart.chamberId
      ? (chart.chamberId as any)
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

  const chartDate = formatDateShort(chart.finalizedAt || chart.createdAt);
  const versionLabel = `v${chart.version || 1}`;
  const statusLabel = chart.status === 'FINALIZED' ? 'FINALIZED' : 'DRAFT';

  const allowedFoods = Array.isArray(chart.allowedFoods) ? chart.allowedFoods : [];
  const avoidedFoods = Array.isArray(chart.avoidedFoods) ? chart.avoidedFoods : [];
  const supplements = Array.isArray(chart.supplements) ? chart.supplements : [];
  const maxRows = Math.max(allowedFoods.length, avoidedFoods.length);

  let matrixRowsHtml = '';
  if (maxRows === 0) {
    matrixRowsHtml = `
      <tr class="matrix-tr">
        <td colspan="2" class="matrix-empty-row">
          No specific foods selected on this chart.
        </td>
      </tr>
    `;
  } else {
    for (let i = 0; i < maxRows; i++) {
      const allowed = allowedFoods[i];
      const avoided = avoidedFoods[i];
      matrixRowsHtml += `
        <tr class="matrix-tr">
          <td class="matrix-td col-allowed ${allowed ? 'has-item' : 'col-blank'}">
            ${allowed ? renderFoodEntryHtml(allowed, i, 'allowed') : '<div class="empty-spacer"></div>'}
          </td>
          <td class="matrix-td col-avoided ${avoided ? 'has-item' : 'col-blank'}">
            ${avoided ? renderFoodEntryHtml(avoided, i, 'avoided') : '<div class="empty-spacer"></div>'}
          </td>
        </tr>
      `;
    }
  }

  const supplementsHtml =
    supplements.length > 0
      ? `
      <section class="section-block">
        <div class="section-heading">
          <span>Physician-Prescribed Supplements</span>
          <span class="font-bn section-heading-bn">সাপ্লিমেন্টস (চিকিৎসকের পরামর্শ অনুযায়ী)</span>
        </div>
        <table class="supp-table">
          <thead>
            <tr>
              <th style="width: 6%;">#</th>
              <th style="width: 28%;">Supplement Name</th>
              <th style="width: 16%;">Dosage</th>
              <th style="width: 16%;">Frequency</th>
              <th style="width: 14%;">Duration</th>
              <th style="width: 20%;">Instructions</th>
            </tr>
          </thead>
          <tbody>
            ${supplements
              .map(
                (sup, idx) => `
              <tr>
                <td class="num-cell">${idx + 1}.</td>
                <td class="strong-cell font-bn">${escapeHtml(sup.name)}</td>
                <td>${escapeHtml(sup.dosage || '—')}</td>
                <td>${escapeHtml(sup.frequency || '—')}</td>
                <td>${escapeHtml(sup.duration || '—')}</td>
                <td class="font-bn">${escapeHtml(sup.instructions || '—')}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </section>
    `
      : '';

  const hasDietary = Boolean(chart.dietaryInstructions && chart.dietaryInstructions.trim());
  const hasNotes = Boolean(chart.additionalNotes && chart.additionalNotes.trim());
  const notesHtml =
    hasDietary || hasNotes
      ? `
      <section class="section-block notes-section">
        <div class="notes-grid ${hasDietary && hasNotes ? 'two-col' : 'one-col'}">
          ${
            hasDietary
              ? `
            <div class="note-card">
              <div class="note-title">Doctor's Dietary Instructions</div>
              <div class="note-body font-bn">${escapeHtml(chart.dietaryInstructions)}</div>
            </div>
          `
              : ''
          }
          ${
            hasNotes
              ? `
            <div class="note-card">
              <div class="note-title">Additional Notes</div>
              <div class="note-body font-bn">${escapeHtml(chart.additionalNotes)}</div>
            </div>
          `
              : ''
          }
        </div>
      </section>
    `
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Food Chart - ${escapeHtml(chart.chartNumber)}</title>
  <style>
    ${fontCss}

    @page {
      size: A4 portrait;
      margin: 13mm 11mm 14mm 11mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Inter', 'Noto Sans Bengali', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11px;
      line-height: 1.45;
    }

    .font-bn {
      font-family: 'Noto Sans Bengali', 'Inter', sans-serif;
    }

    .sheet {
      width: 100%;
    }

    /* 1. Letterhead (Top-to-Top Doctor + Clinic/Logo alignment, no extra eyebrow tagline) */
    .letterhead {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding-bottom: 10px;
    }

    .doc-col {
      flex: 1 1 56%;
      min-width: 0;
    }

    .doc-name {
      margin: 0 0 2px 0;
      font-size: 16px;
      font-weight: 700;
      color: #0c4a58;
      line-height: 1.2;
      letter-spacing: -0.01em;
    }

    .doc-qual {
      margin: 0;
      font-size: 10.5px;
      font-weight: 600;
      color: #334155;
      line-height: 1.35;
    }

    .doc-spec {
      margin: 2px 0 0 0;
      font-size: 10.5px;
      font-weight: 600;
      color: #007086;
    }

    .doc-meta {
      margin: 2px 0 0 0;
      font-size: 10px;
      color: #475569;
    }

    .reg-badge {
      display: inline-block;
      margin-top: 5px;
      padding: 2px 7px;
      font-size: 9.5px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: #0c4a58;
      background: #f0f9fa;
      border: 1px solid #aee2e8;
      border-radius: 4px;
    }

    .clinic-col {
      flex: 1 1 42%;
      min-width: 0;
      display: flex;
      justify-content: flex-end;
      align-items: flex-start;
      gap: 10px;
      text-align: right;
    }

    .clinic-text {
      min-width: 0;
    }

    .clinic-name {
      margin: 0 0 2px 0;
      font-size: 13px;
      font-weight: 700;
      color: #0c4a58;
      line-height: 1.25;
    }

    .clinic-line {
      margin: 1px 0 0 0;
      font-size: 9.5px;
      color: #475569;
      line-height: 1.35;
    }

    .clinic-logo {
      width: 46px;
      height: 46px;
      object-fit: contain;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 2px;
      background: #ffffff;
      flex-shrink: 0;
    }

    /* 2. 3-Col Title Banner */
    .title-banner {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 10px;
      border-top: 2px solid #0f172a;
      border-bottom: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 7px 10px;
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
      font-size: 12.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #0f172a;
      line-height: 1.2;
    }

    .banner-subtitle {
      margin: 1px 0 0 0;
      font-size: 11.5px;
      font-weight: 600;
      color: #007086;
      line-height: 1.3;
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

    .status-chip.finalized {
      border-color: #aee2e8;
      background: #f0f9fa;
      color: #065b6d;
    }

    /* 3. 3-Col Patient Bar (Patient Name | Patient ID | Age / Gender — No Doctor Column) */
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

    .patient-cell-left {
      text-align: left;
      min-width: 0;
    }

    .patient-cell-center {
      text-align: left;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .patient-cell-right {
      text-align: right;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    /* 4. Paired 2-Column Clinical Matrix */
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      border-bottom: 1.5px solid #cbd5e1;
    }

    .matrix-table thead {
      display: table-header-group;
    }

    .matrix-th {
      padding: 6px 10px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      background: #ffffff;
      vertical-align: middle;
    }

    .matrix-th.allowed-th {
      color: #0c4a58;
      border-right: 1px solid #cbd5e1;
      border-bottom: 2px solid #007086;
    }

    .matrix-th.avoided-th {
      color: #9f1239;
      border-bottom: 2px solid #be123c;
    }

    .mark-allowed {
      display: inline-block;
      color: #007086;
      font-weight: 700;
      margin-right: 4px;
    }

    .mark-avoided {
      display: inline-block;
      color: #be123c;
      font-weight: 700;
      margin-right: 4px;
    }

    .matrix-tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .matrix-td {
      padding: 0;
      vertical-align: top;
    }

    .matrix-td.col-allowed {
      border-right: 1px solid #cbd5e1;
    }

    .matrix-td.col-blank {
      border-bottom: none;
    }

    .matrix-entry {
      padding: 5.5px 10px;
      border-bottom: 1px solid #e2e8f0;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .matrix-tr:last-child .matrix-entry {
      border-bottom: none;
    }

    .entry-row {
      display: flex;
      align-items: flex-start;
      gap: 6px;
    }

    .entry-num {
      font-size: 10px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      min-width: 18px;
      padding-top: 1px;
    }

    .entry-num.allowed {
      color: #007086;
    }

    .entry-num.avoided {
      color: #be123c;
    }

    .entry-content {
      min-width: 0;
      flex: 1;
    }

    .entry-title {
      font-size: 11px;
      font-weight: 500;
      color: #0f172a;
      line-height: 1.4;
      word-break: break-word;
    }

    .entry-meta {
      margin-top: 1.5px;
      font-size: 9.5px;
      color: #475569;
      line-height: 1.35;
    }

    .empty-spacer {
      height: 10px;
    }

    .matrix-empty-row {
      padding: 16px 10px;
      text-align: center;
      font-size: 10.5px;
      color: #64748b;
      font-style: italic;
    }

    /* 5. Manual Supplements */
    .section-block {
      margin-top: 12px;
    }

    .section-heading {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 4px 0;
      margin-bottom: 5px;
      border-bottom: 1.5px solid #0f172a;
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      break-after: avoid;
      page-break-after: avoid;
    }

    .section-heading-bn {
      font-size: 10.5px;
      font-weight: 600;
      color: #007086;
    }

    .supp-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }

    .supp-table thead {
      display: table-header-group;
    }

    .supp-table th {
      text-align: left;
      padding: 5px 6px;
      background: #f8fafc;
      border-bottom: 1px solid #cbd5e1;
      font-weight: 700;
      color: #334155;
      font-size: 9.5px;
    }

    .supp-table tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .supp-table td {
      padding: 5px 6px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
      vertical-align: top;
    }

    .supp-table .num-cell {
      font-variant-numeric: tabular-nums;
      color: #475569;
      font-weight: 600;
    }

    .supp-table .strong-cell {
      font-weight: 600;
      color: #0f172a;
    }

    /* 6. Dietary Instructions & Additional Notes */
    .notes-grid {
      display: grid;
      gap: 10px;
    }

    .notes-grid.two-col {
      grid-template-columns: 1fr 1fr;
    }

    .notes-grid.one-col {
      grid-template-columns: 1fr;
    }

    .note-card {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 7px 9px;
      background: #ffffff;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .note-title {
      font-size: 10px;
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

    /* 7. Signature & Seal Block */
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
      line-height: 1.4;
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

    <!-- 3-Col Title Banner -->
    <div class="title-banner">
      <div class="banner-left">
        <span class="banner-label">Date:</span>
        <span class="banner-value">${escapeHtml(chartDate)}</span>
      </div>
      <div class="banner-center">
        <div class="banner-title">PATIENT FOOD CHART</div>
        <div class="banner-subtitle font-bn">রোগীর খাদ্য তালিকা</div>
      </div>
      <div class="banner-right">
        <span class="banner-label">Chart No:</span>
        <span class="banner-value">${escapeHtml(chart.chartNumber)}</span>
        <span class="status-chip ${chart.status === 'FINALIZED' ? 'finalized' : ''}">${escapeHtml(
    statusLabel
  )} &bull; ${escapeHtml(versionLabel)}</span>
      </div>
    </div>

    <!-- 3-Col Patient Bar -->
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

    <!-- Paired 2-Column Clinical Matrix -->
    <table class="matrix-table">
      <colgroup>
        <col style="width: 50%;" />
        <col style="width: 50%;" />
      </colgroup>
      <thead>
        <tr>
          <th class="matrix-th allowed-th">
            <span class="mark-allowed">✓</span> Allowed Foods / <span class="font-bn">অনুমোদিত খাবার</span>
          </th>
          <th class="matrix-th avoided-th">
            <span class="mark-avoided">✕</span> Avoided Foods / <span class="font-bn">এড়িয়ে চলার খাবার</span>
          </th>
        </tr>
      </thead>
      <tbody>
        ${matrixRowsHtml}
      </tbody>
    </table>

    <!-- Manual Supplements -->
    ${supplementsHtml}

    <!-- Dietary Instructions & Additional Notes -->
    ${notesHtml}

    <!-- Physician Signature & Seal -->
    <footer class="signature-footer">
      <div class="footer-meta">
        <div>Chart Ref: ${escapeHtml(chart.chartNumber)} (${escapeHtml(versionLabel)})</div>
        <div>Status: ${escapeHtml(statusLabel)}${
    chart.finalizedAt ? ` on ${escapeHtml(formatDateShort(chart.finalizedAt))}` : ''
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
          <div class="sig-sub">Physician Signature &amp; Seal</div>
        </div>
      </div>
    </footer>
  </div>
</body>
</html>`;
};

export const renderFoodChartPdf = async (chart: IFoodChart): Promise<Buffer> => {
  const html = buildFoodChartHtml(chart);

  const headerTemplate = `
    <div style="width: 100%; font-family: Arial, sans-serif; font-size: 8px; color: #64748b; padding: 0 11mm; display: flex; justify-content: space-between; align-items: center;">
      <span>PATIENT FOOD CHART &bull; ${escapeHtml(chart.chartNumber)} (v${chart.version || 1})</span>
      <span>Patient: ${escapeHtml(chart.patientSnapshot?.name)} (${escapeHtml(chart.patientSnapshot?.patientId)})</span>
    </div>
  `;

  const footerTemplate = `
    <div style="width: 100%; font-family: Arial, sans-serif; font-size: 8px; color: #64748b; padding: 0 11mm; border-top: 0.5px solid #cbd5e1; padding-top: 4px; display: flex; justify-content: space-between; align-items: center;">
      <span>Clinical Nutrition Guidance &bull; ${escapeHtml(chart.chartNumber)}</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>
  `;

  return renderHtmlToA4Pdf({
    html,
    headerTemplate,
    footerTemplate,
  });
};
