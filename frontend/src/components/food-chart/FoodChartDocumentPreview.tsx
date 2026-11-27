import React from 'react';
import {
  IChamber,
  IDoctor,
  IFoodChartDoctorSnapshot,
  IFoodChartEntry,
  IFoodChartSupplement,
} from '../../types';

interface FoodChartDocumentPreviewProps {
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
  status: 'DRAFT' | 'FINALIZED';
  version: number;
  date?: string | Date | null;
  allowedFoods: IFoodChartEntry[];
  avoidedFoods: IFoodChartEntry[];
  supplements: IFoodChartSupplement[];
  dietaryInstructions?: string;
  additionalNotes?: string;
}

const formatChartDate = (value?: string | Date | null): string => {
  const dateObj = value ? new Date(value) : new Date();
  if (Number.isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const FoodChartDocumentPreview: React.FC<FoodChartDocumentPreviewProps> = ({
  doctor,
  chamber,
  doctorSnapshot,
  patient,
  chartNumber,
  status,
  version,
  date,
  allowedFoods,
  avoidedFoods,
  supplements,
  dietaryInstructions,
  additionalNotes,
}) => {
  const rawName = doctorSnapshot?.name || doctor?.name || 'Physician';
  const doctorDisplayName = /^Dr\.?/i.test(rawName) ? rawName : `Dr. ${rawName}`;
  const qualLines = (doctorSnapshot?.qualification || doctor?.qualification || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const specialization = doctorSnapshot?.specialization || doctor?.specialization || '';
  const designation = doctorSnapshot?.designation || doctor?.designation || '';
  const workplace = doctorSnapshot?.workplace || doctor?.workplace || '';
  const authority = doctorSnapshot?.healthcareAuthority || doctor?.healthcareAuthority || 'BMDC';
  const regNo =
    doctorSnapshot?.registrationNumber ||
    doctorSnapshot?.bmdcNumber ||
    doctor?.registrationNumber ||
    doctor?.bmdcNumber ||
    '';

  const chamberName = chamber?.name || doctorSnapshot?.chamberName || workplace || '';
  const chamberAddress = chamber?.address || doctorSnapshot?.chamberAddress || '';
  const chamberPhone = chamber?.phone || doctorSnapshot?.phone || doctor?.phone || '';
  const chamberAppt = chamber?.appointmentPhone || doctorSnapshot?.appointmentPhone || '';
  const chamberDays =
    chamber?.visitingDays && chamber.visitingDays.length > 0
      ? chamber.visitingDays.join(', ')
      : doctorSnapshot?.visitingDays && doctorSnapshot.visitingDays.length > 0
      ? doctorSnapshot.visitingDays.join(', ')
      : '';
  const chamberHours = chamber?.visitingHours || doctorSnapshot?.visitingHours || '';
  const chamberRoom = chamber?.roomNo || doctorSnapshot?.roomNo || '';
  const chamberWebsite = chamber?.website || doctorSnapshot?.website || '';

  const logoSrc = doctorSnapshot?.logo || doctor?.logo;
  const signatureSrc = chamber?.signature || doctorSnapshot?.signature || doctor?.signature;

  const rowCount = Math.max(allowedFoods.length, avoidedFoods.length);
  const hasDietary = Boolean(dietaryInstructions && dietaryInstructions.trim());
  const hasNotes = Boolean(additionalNotes && additionalNotes.trim());

  return (
    <article
      aria-label="Live A4 Food Chart Document Preview"
      className="food-chart-print-sheet w-full bg-white border border-slate-300 text-slate-900 p-5 sm:p-7 flex flex-col justify-between min-h-[760px] print:border-none print:p-0 print:min-h-0"
    >
      <div>
        {/* 1. Letterhead (Top-to-top doctor + clinic/logo alignment, zero extra eyebrow tagline) */}
        <header className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-[16px] font-bold text-[#0c4a58] leading-snug">
              {doctorDisplayName}
            </h2>
            {qualLines.map((line, i) => (
              <p key={i} className="text-[11px] font-semibold text-slate-700 leading-snug">
                {line}
              </p>
            ))}
            {specialization && (
              <p className="text-[11px] font-semibold text-[#007086] mt-0.5">{specialization}</p>
            )}
            {(designation || workplace) && (
              <p className="text-[11px] text-slate-600 mt-0.5">
                {[designation, workplace].filter(Boolean).join(' • ')}
              </p>
            )}
            {regNo && (
              <span className="inline-block mt-1.5 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#0c4a58] bg-[#f0f9fa] border border-[#aee2e8] rounded">
                {authority} Reg: {regNo}
              </span>
            )}
          </div>

          <div className="flex items-start justify-end gap-2.5 sm:text-right sm:max-w-[46%]">
            <div className="min-w-0 space-y-0.5">
              {chamberName && (
                <p className="text-[13px] font-bold text-[#0c4a58] leading-snug">{chamberName}</p>
              )}
              {chamberAddress && (
                <p className="text-[11px] text-slate-600 leading-snug">{chamberAddress}</p>
              )}
              {chamberPhone && (
                <p className="text-[11px] text-slate-600 tabular-nums">Phone: {chamberPhone}</p>
              )}
              {chamberAppt && (
                <p className="text-[11px] text-slate-600 tabular-nums">Serial: {chamberAppt}</p>
              )}
              {(chamberDays || chamberHours) && (
                <p className="text-[11px] text-slate-600">
                  {[chamberDays, chamberHours].filter(Boolean).join(' • ')}
                </p>
              )}
              {chamberRoom && <p className="text-[11px] text-slate-600">Room: {chamberRoom}</p>}
              {chamberWebsite && <p className="text-[11px] text-slate-600">{chamberWebsite}</p>}
            </div>
            {logoSrc && (
              <img
                src={logoSrc}
                alt="Clinic Logo"
                className="w-11 h-11 object-contain border border-slate-200 rounded p-0.5 bg-white shrink-0"
              />
            )}
          </div>
        </header>

        {/* 2. Title Banner */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t-2 border-slate-900 border-b border-slate-300 bg-slate-50 px-3 py-2">
          <div className="text-[11px] text-slate-700 tabular-nums whitespace-nowrap">
            <span className="text-slate-500 mr-1">Date:</span>
            <span className="font-semibold text-slate-900">{formatChartDate(date)}</span>
          </div>

          <div className="flex-1 min-w-[160px] text-center px-1">
            <p className="text-[11px] font-bold tracking-[0.05em] uppercase text-slate-900 whitespace-nowrap">
              PATIENT FOOD CHART
            </p>
            <p className="font-bengali text-[11px] font-semibold text-[#007086] whitespace-nowrap">
              রোগীর খাদ্য তালিকা
            </p>
          </div>

          <div className="text-right text-[11px] text-slate-700 tabular-nums whitespace-nowrap flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 ml-auto">
            <div>
              <span className="text-slate-500 mr-1">Chart No:</span>
              <span className="font-mono font-semibold text-slate-900">{chartNumber}</span>
            </div>
            <span
              className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded border leading-tight ${
                status === 'FINALIZED'
                  ? 'bg-[#f0f9fa] border-[#aee2e8] text-[#065b6d]'
                  : 'bg-white border-slate-300 text-slate-700'
              }`}
            >
              {status} • v{version}
            </span>
          </div>
        </div>

        {/* 3. Balanced 3-Item Patient Bar (Patient Name | Patient ID | Age / Gender) */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-x-4 gap-y-2 px-3 py-2 border-b-2 border-slate-900 bg-white mb-3 text-[11px]">
          <div className="min-w-0">
            <span className="text-slate-500 mr-1">Patient:</span>
            <span className="font-semibold text-slate-900 break-words">
              {patient?.name || 'No patient selected'}
            </span>
          </div>

          <div className="tabular-nums whitespace-nowrap">
            <span className="text-slate-500 mr-1">ID:</span>
            <span className="font-mono font-semibold text-slate-900">
              {patient?.patientId || '—'}
            </span>
          </div>

          <div className="tabular-nums whitespace-nowrap">
            <span className="text-slate-500 mr-1">Age / Gender:</span>
            <span className="font-semibold text-slate-900">
              {patient ? `${patient.age} yrs / ${patient.gender}` : '—'}
            </span>
          </div>
        </div>

        {/* 4. Paired 2-Col Clinical Matrix with Open White Closing Below Shorter Column */}
        <table className="w-full border-collapse table-fixed border-b border-slate-300">
          <colgroup>
            <col className="w-1/2" />
            <col className="w-1/2" />
          </colgroup>
          <thead>
            <tr>
              <th className="text-left px-3 py-2 text-xs font-bold text-[#0c4a58] border-r border-slate-300 border-b-2 border-b-[#007086]">
                <span className="text-[#007086] mr-1">✓</span> Allowed Foods /{' '}
                <span className="font-bengali">অনুমোদিত খাবার</span>
              </th>
              <th className="text-left px-3 py-2 text-xs font-bold text-rose-800 border-b-2 border-b-rose-700">
                <span className="text-rose-700 mr-1">✕</span> Avoided Foods /{' '}
                <span className="font-bengali">এড়িয়ে চলার খাবার</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rowCount === 0 ? (
              <tr>
                <td colSpan={2} className="px-3 py-8 text-center text-xs text-slate-400">
                  Select foods from the builder panels to compose the food chart.
                </td>
              </tr>
            ) : (
              Array.from({ length: rowCount }).map((_, idx) => {
                const allowed = allowedFoods[idx];
                const avoided = avoidedFoods[idx];
                const isLastRow = idx === rowCount - 1;

                return (
                  <tr key={idx} className="align-top break-inside-avoid">
                    <td className="p-0 border-r border-slate-300 align-top">
                      {allowed ? (
                        <div
                          className={`px-3 py-1.5 ${
                            isLastRow ? '' : 'border-b border-slate-200/80'
                          }`}
                        >
                          <div className="flex items-start gap-1.5">
                            <span className="text-xs font-semibold text-[#007086] tabular-nums min-w-[20px]">
                              {idx + 1}.
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-bengali text-xs font-medium text-slate-900 leading-snug break-words">
                                {allowed.labelBn}
                              </p>
                              {(allowed.portion || allowed.timing || allowed.prepNote) && (
                                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                                  {[
                                    allowed.portion ? `Portion: ${allowed.portion}` : '',
                                    allowed.timing ? `Timing: ${allowed.timing}` : '',
                                    allowed.prepNote ? `Note: ${allowed.prepNote}` : '',
                                  ]
                                    .filter(Boolean)
                                    .join(' • ')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-3" />
                      )}
                    </td>

                    <td className="p-0 align-top">
                      {avoided ? (
                        <div
                          className={`px-3 py-1.5 ${
                            isLastRow ? '' : 'border-b border-slate-200/80'
                          }`}
                        >
                          <div className="flex items-start gap-1.5">
                            <span className="text-xs font-semibold text-rose-700 tabular-nums min-w-[20px]">
                              {idx + 1}.
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-bengali text-xs font-medium text-slate-900 leading-snug break-words">
                                {avoided.labelBn}
                              </p>
                              {(avoided.portion || avoided.timing || avoided.prepNote) && (
                                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                                  {[
                                    avoided.portion ? `Portion: ${avoided.portion}` : '',
                                    avoided.timing ? `Timing: ${avoided.timing}` : '',
                                    avoided.prepNote ? `Note: ${avoided.prepNote}` : '',
                                  ]
                                    .filter(Boolean)
                                    .join(' • ')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-3" />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* 5. Manual Supplements */}
        {supplements.length > 0 && (
          <div className="mt-4">
            <div className="flex items-baseline justify-between pb-1 mb-1.5 border-b border-slate-900">
              <span className="text-xs font-bold text-slate-900">
                Physician-Prescribed Supplements
              </span>
              <span className="font-bengali text-xs font-semibold text-[#007086]">সাপ্লিমেন্টস</span>
            </div>
            <div className="border border-slate-200 rounded divide-y divide-slate-200">
              {supplements.map((sup, idx) => (
                <div key={idx} className="px-3 py-1.5 text-xs flex flex-wrap gap-x-3 gap-y-0.5">
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {idx + 1}. {sup.name}
                  </span>
                  {sup.dosage && <span className="text-slate-700">Dosage: {sup.dosage}</span>}
                  {sup.frequency && <span className="text-slate-700">Freq: {sup.frequency}</span>}
                  {sup.duration && <span className="text-slate-700">Duration: {sup.duration}</span>}
                  {sup.instructions && (
                    <span className="font-bengali text-slate-600">Note: {sup.instructions}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Dietary Instructions & Additional Notes */}
        {(hasDietary || hasNotes) && (
          <div
            className={`mt-4 grid gap-3 ${
              hasDietary && hasNotes ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {hasDietary && (
              <div className="border border-slate-300 rounded p-2.5 bg-white">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#0c4a58] mb-1">
                  Doctor&apos;s Dietary Instructions
                </p>
                <p className="font-bengali text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {dietaryInstructions}
                </p>
              </div>
            )}
            {hasNotes && (
              <div className="border border-slate-300 rounded p-2.5 bg-white">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#0c4a58] mb-1">
                  Additional Notes
                </p>
                <p className="font-bengali text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {additionalNotes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. Signature & Seal Footer */}
      <footer className="mt-6 pt-3 border-t border-slate-300 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 break-inside-avoid">
        <div className="text-[11px] text-slate-500 tabular-nums leading-snug">
          <p>
            Chart Ref: {chartNumber} (v{version})
          </p>
          <p>Clinical Nutrition Guidance</p>
        </div>

        <div className="sm:text-right ml-auto min-w-[180px]">
          <div className="h-9 flex items-end sm:justify-end mb-1">
            {signatureSrc && (
              <img
                src={signatureSrc}
                alt="Physician Signature"
                className="max-h-9 object-contain"
              />
            )}
          </div>
          <div className="border-t border-slate-500 pt-1">
            <p className="text-xs font-bold text-slate-900">{doctorDisplayName}</p>
            {regNo && (
              <p className="text-[11px] text-slate-600 tabular-nums">
                {authority} Reg: {regNo}
              </p>
            )}
            <p className="text-[11px] text-slate-500">Physician Signature &amp; Seal</p>
          </div>
        </div>
      </footer>
    </article>
  );
};
