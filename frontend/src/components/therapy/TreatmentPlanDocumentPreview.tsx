import React from 'react';
import {
  ConsentStatus,
  IChamber,
  IDoctor,
  IFoodChartDoctorSnapshot,
  ITherapySession,
  TreatmentPlanStatus,
} from '../../types';

interface TreatmentPlanDocumentPreviewProps {
  doctor: IDoctor | null;
  chamber: IChamber | null;
  doctorSnapshot?: IFoodChartDoctorSnapshot | null;
  patient: {
    patientId?: string;
    name?: string;
    age?: number | string;
    gender?: string;
  } | null;
  chartNumber: string;
  status: TreatmentPlanStatus;
  date?: string | Date | null;
  therapyName: string;
  therapyNameBn?: string;
  categoryName: string;
  therapiesList?: Array<{
    name: string;
    bengaliName?: string;
    categoryName: string;
  }>;
  practitionerSummary: string;
  treatmentObjective?: string;
  clinicalIndication?: string;
  plannedSessions?: number | null;
  sessionDuration?: string;
  frequency?: string;
  scheduleSummary?: string;
  startDate?: string | null;
  endDate?: string | null;
  consentStatus: ConsentStatus;
  consentNotes?: string;
  clinicianApprovalConfirmed: boolean;
  precautions?: string;
  patientInstructions?: string;
  sessions?: ITherapySession[];
}

const formatShortDate = (value?: string | Date | null): string => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTimeShort = (value?: string | Date | null): string => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const TreatmentPlanDocumentPreview: React.FC<TreatmentPlanDocumentPreviewProps> = ({
  doctor,
  chamber,
  doctorSnapshot,
  patient,
  chartNumber,
  status,
  date,
  therapyName,
  therapyNameBn,
  categoryName,
  therapiesList,
  practitionerSummary,
  treatmentObjective,
  clinicalIndication,
  plannedSessions,
  sessionDuration,
  frequency,
  scheduleSummary,
  startDate,
  endDate,
  consentStatus,
  consentNotes,
  clinicianApprovalConfirmed,
  precautions,
  patientInstructions,
  sessions = [],
}) => {
  const rawName = doctorSnapshot?.name || doctor?.name || 'Physician';
  const doctorDisplayName = /^Dr\.?/i.test(rawName) ? rawName : `Dr. ${rawName}`;
  const qualLines = (doctorSnapshot?.qualification || doctor?.qualification || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const specialization = doctorSnapshot?.specialization || doctor?.specialization || '';
  const authority = doctorSnapshot?.healthcareAuthority || doctor?.healthcareAuthority || 'BMDC';
  const regNo =
    doctorSnapshot?.registrationNumber ||
    doctorSnapshot?.bmdcNumber ||
    doctor?.registrationNumber ||
    doctor?.bmdcNumber ||
    '';
  const chamberName = chamber?.name || doctorSnapshot?.chamberName || doctor?.workplace || '';
  const chamberAddress = chamber?.address || doctorSnapshot?.chamberAddress || '';
  const chamberPhone = chamber?.phone || doctorSnapshot?.phone || doctor?.phone || '';
  const logoSrc = doctorSnapshot?.logo || doctor?.logo || '';
  const signatureSrc = chamber?.signature || doctorSnapshot?.signature || doctor?.signature || '';

  const effectiveTherapies =
    therapiesList && therapiesList.length > 0
      ? therapiesList
      : therapyName
        ? [{ name: therapyName, bengaliName: therapyNameBn, categoryName }]
        : [];

  const uniqueCategories = Array.from(
    new Set(effectiveTherapies.map((t) => t.categoryName).filter(Boolean))
  );

  const rows: Array<{ label: string; value: string }> = [
    {
      label:
        effectiveTherapies.length > 1
          ? `Prescribed Therapies (${effectiveTherapies.length})`
          : 'Prescribed Therapy',
      value:
        effectiveTherapies.length > 1
          ? effectiveTherapies
            .map((t, i) => {
              const nameText = t.bengaliName ? `${t.name} (${t.bengaliName})` : t.name;
              return `${i + 1}. ${nameText}`;
            })
            .join('\n')
          : effectiveTherapies[0]?.bengaliName
            ? `${effectiveTherapies[0].name} (${effectiveTherapies[0].bengaliName})`
            : effectiveTherapies[0]?.name || 'Not selected',
    },
    {
      label: uniqueCategories.length > 1 ? 'Therapy Categories' : 'Therapy Category',
      value: uniqueCategories.join(', ') || '—',
    },
    { label: 'Assigned Practitioner', value: practitionerSummary || 'Not assigned' },
  ];

  if (treatmentObjective?.trim()) {
    rows.push({ label: 'Treatment Objective', value: treatmentObjective.trim() });
  }
  if (clinicalIndication?.trim()) {
    rows.push({ label: 'Clinical Indication', value: clinicalIndication.trim() });
  }
  if (plannedSessions) {
    rows.push({ label: 'Planned Sessions', value: `${plannedSessions} session(s)` });
  }
  if (sessionDuration?.trim()) {
    rows.push({ label: 'Session Duration', value: sessionDuration.trim() });
  }
  if (frequency?.trim()) {
    rows.push({ label: 'Frequency', value: frequency.trim() });
  }
  if (scheduleSummary?.trim()) {
    rows.push({ label: 'Schedule Summary', value: scheduleSummary.trim() });
  }
  if (startDate || endDate) {
    rows.push({
      label: 'Treatment Period',
      value: `${startDate ? formatShortDate(startDate) : 'TBD'} to ${endDate ? formatShortDate(endDate) : 'Ongoing'
        }`,
    });
  }
  if (consentStatus !== 'NOT_REQUIRED') {
    const labelMap: Record<ConsentStatus, string> = {
      OBTAINED: 'Consent Obtained',
      PENDING: 'Consent Pending',
      DECLINED: 'Consent Declined',
      NOT_REQUIRED: 'Not Specified',
    };
    rows.push({
      label: 'Patient Consent',
      value: consentNotes?.trim()
        ? `${labelMap[consentStatus]} — ${consentNotes.trim()}`
        : labelMap[consentStatus],
    });
  }

  return (
    <div className="treatment-plan-print-sheet bg-white border border-slate-200 rounded-xl p-5 sm:p-7 text-slate-900 text-xs">
      {/* Letterhead */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b-2 border-[#007086]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#005b6d] leading-tight">
            {doctorDisplayName}
          </h2>
          {qualLines.map((line, i) => (
            <p key={i} className="text-[11px] text-slate-600 mt-0.5">
              {line}
            </p>
          ))}
          {specialization && (
            <p className="text-[11px] font-semibold text-slate-900 mt-0.5">{specialization}</p>
          )}
          {regNo && (
            <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold bg-slate-50 border border-slate-300 rounded tabular-nums">
              {authority} Reg: {regNo}
            </span>
          )}
        </div>

        <div className="flex items-start gap-2.5 sm:text-right">
          <div>
            {chamberName && <p className="font-bold text-slate-900 text-xs">{chamberName}</p>}
            {chamberAddress && <p className="text-[11px] text-slate-500 mt-0.5">{chamberAddress}</p>}
            {chamberPhone && <p className="text-[11px] text-slate-500">Phone: {chamberPhone}</p>}
          </div>
          {logoSrc && (
            <img src={logoSrc} alt="Clinic Logo" className="h-10 w-auto object-contain shrink-0" />
          )}
        </div>
      </div>

      {/* Title Banner */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2 bg-slate-50 border-b border-slate-300 text-[11px]">
        <div className="tabular-nums whitespace-nowrap">
          <span className="text-slate-500 mr-1">Date:</span>
          <span className="font-semibold text-slate-900">
            {formatShortDate(date || new Date())}
          </span>
        </div>
        <div className="flex-1 min-w-[180px] text-center">
          <div className="font-bold text-slate-900 tracking-wide uppercase text-xs whitespace-nowrap">
            PATIENT TREATMENT PLAN
          </div>
          <div className="text-[10px] font-medium text-[#007086]">
            Clinical Therapy Authorization &amp; Session Record
          </div>
        </div>
        <div className="tabular-nums whitespace-nowrap ml-auto">
          <span className="text-slate-500 mr-1">Plan Ref:</span>
          <span className="font-bold text-slate-900 whitespace-nowrap">{chartNumber}</span>
          <span className="ml-1.5 inline-block px-1.5 py-0.5 text-[10px] font-semibold border border-[#aee2e8] bg-[#f0f9fa] text-[#065b6d] rounded">
            {status}
          </span>
        </div>
      </div>

      {/* Patient Bar */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-x-4 gap-y-2 px-3 py-2 border-b-2 border-slate-900 text-[11px] mb-4">
        <div className="min-w-0">
          <span className="text-slate-500 mr-1">Patient Name:</span>
          <span className="font-semibold text-slate-900">{patient?.name || 'Not selected'}</span>
        </div>
        <div className="tabular-nums whitespace-nowrap">
          <span className="text-slate-500 mr-1">Patient ID:</span>
          <span className="font-semibold text-slate-900">{patient?.patientId || '—'}</span>
        </div>
        <div className="tabular-nums whitespace-nowrap">
          <span className="text-slate-500 mr-1">Age / Gender:</span>
          <span className="font-semibold text-slate-900">
            {patient?.age ? `${patient.age} yrs` : '—'} / {patient?.gender || '—'}
          </span>
        </div>
      </div>

      {/* Parameters Table */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between border-b border-slate-900 pb-1 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-900">
            Authorized Therapy &amp; Clinical Plan Details
          </span>
          <span className="text-[10px] font-semibold text-[#007086]">
            Clinician Approval: {clinicianApprovalConfirmed ? 'Confirmed' : 'Pending'}
          </span>
        </div>
        <table className="w-full border border-slate-300 border-collapse text-[11px]">
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-slate-200 last:border-b-0">
                <th className="w-1/3 bg-slate-50 text-left px-2.5 py-1.5 font-semibold text-slate-600 border-r border-slate-200 align-top">
                  {r.label}
                </th>
                <td className="px-2.5 py-1.5 text-slate-900 font-bengali whitespace-pre-wrap align-top">
                  {r.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Precautions & Instructions */}
      {(precautions?.trim() || patientInstructions?.trim()) && (
        <div
          className={`grid gap-3 mb-4 ${precautions?.trim() && patientInstructions?.trim() ? 'sm:grid-cols-2' : 'grid-cols-1'
            }`}
        >
          {precautions?.trim() && (
            <div className="border border-slate-300 rounded p-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#0c4a58] mb-1">
                Contraindications &amp; Clinical Precautions
              </div>
              <p className="text-[11px] text-slate-800 whitespace-pre-wrap">{precautions.trim()}</p>
            </div>
          )}
          {patientInstructions?.trim() && (
            <div className="border border-slate-300 rounded p-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#0c4a58] mb-1">
                Patient Instructions &amp; Preparation
              </div>
              <p className="text-[11px] text-slate-800 font-bengali whitespace-pre-wrap">
                {patientInstructions.trim()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sessions */}
      {sessions.length > 0 && (
        <div className="mb-4">
          <div className="border-b border-slate-900 pb-1 mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-900">
            Scheduled &amp; Completed Therapy Sessions ({sessions.length})
          </div>
          <table className="w-full border border-slate-300 border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-900 text-slate-700">
                <th className="px-2 py-1 text-left w-8">#</th>
                <th className="px-2 py-1 text-left">Scheduled Date</th>
                <th className="px-2 py-1 text-left">Practitioner</th>
                <th className="px-2 py-1 text-left">Status</th>
                <th className="px-2 py-1 text-left">Notes / Feedback</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s._id} className="border-b border-slate-200 last:border-b-0">
                  <td className="px-2 py-1.5 font-semibold tabular-nums">{s.sessionNumber}</td>
                  <td className="px-2 py-1.5 tabular-nums">{formatDateTimeShort(s.scheduledAt)}</td>
                  <td className="px-2 py-1.5">{s.assignedPractitionerName}</td>
                  <td className="px-2 py-1.5 font-medium">{s.status}</td>
                  <td className="px-2 py-1.5 font-bengali text-slate-700">
                    {[s.practitionerNotes, s.patientFeedback].filter(Boolean).join(' • ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Signature Footer */}
      <div className="pt-3 border-t border-slate-300 flex items-end justify-between gap-4">
        <div className="text-[10px] text-slate-500 tabular-nums space-y-0.5">
          <div>Plan Ref: {chartNumber}</div>
          <div>Practitioner: {practitionerSummary || '—'}</div>
        </div>
        <div className="text-right min-w-[160px]">
          {signatureSrc && (
            <img
              src={signatureSrc}
              alt="Physician Signature"
              className="h-8 ml-auto mb-1 object-contain"
            />
          )}
          <div className="border-t border-slate-500 pt-1">
            <div className="font-bold text-slate-900 text-[11px]">{doctorDisplayName}</div>
            {regNo && (
              <div className="text-[10px] text-slate-500">
                {authority} Reg: {regNo}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
