import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { IDoctor, IChamber, IPatient, IPrescriptionMedicine, IPrescriptionChiefComplaint, IPrescriptionDiagnosis, IPrescriptionVitals } from '../../types';

interface LivePrescriptionPadProps {
  doctor: IDoctor | null;
  chamber: IChamber | null;
  patient: IPatient | null;
  vitals?: IPrescriptionVitals;
  chiefComplaints: IPrescriptionChiefComplaint[];
  history?: string;
  examination?: string;
  diagnosis: IPrescriptionDiagnosis[];
  medicines: IPrescriptionMedicine[];
  investigations: string[];
  advice: string[];
  followUp?: { duration: string; date?: string; notes?: string };
  prescriptionId?: string;
  shareToken?: string;
  paperSize?: 'A4' | 'Letter' | 'A5';
  createdAt?: string | Date;
}

export const LivePrescriptionPad: React.FC<LivePrescriptionPadProps> = ({
  doctor,
  chamber,
  patient,
  vitals,
  chiefComplaints,
  history,
  examination,
  diagnosis,
  medicines,
  investigations,
  advice,
  followUp,
  prescriptionId = 'RX-PREVIEW',
  shareToken = 'preview_token',
  paperSize = 'A4',
  createdAt = new Date(),
}) => {
  const formattedDate = new Date(createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const publicUrl = `${window.location.origin}/prescription/share/${shareToken}`;

  const chamberName =
    chamber?.name ||
    (typeof doctor?.defaultChamberId === 'object'
      ? (doctor.defaultChamberId as any).name
      : (doctor as any)?.chamberName) ||
    '';

  const formatDoctorName = (name?: string) => {
    if (!name) return 'Dr. Moshfiqur Rahman';
    const trimmed = name.trim();
    if (/^dr\.?/i.test(trimmed)) {
      return trimmed.replace(/^dr\.?\s*/i, 'Dr. ');
    }
    return `Dr. ${trimmed}`;
  };

  const doctorDisplayName = formatDoctorName(doctor?.name);

  return (
    <div
      id="prescription-pad"
      className={`prescription-print-container relative bg-white text-slate-900 shadow-xl border border-slate-200/80 rounded-xl overflow-hidden mx-auto transition-all duration-300 flex flex-col justify-between p-4 sm:p-6 md:p-8 print:p-8 ${
        paperSize === 'Letter'
          ? 'w-full max-w-[816px] min-h-[1056px] text-xs'
          : paperSize === 'A5'
          ? 'w-full max-w-[560px] min-h-[792px] text-[11px]'
          : 'w-full max-w-[794px] min-h-[1123px] text-xs'
      }`}
      style={{ fontFamily: "'Inter', 'Hind Siliguri', sans-serif" }}
    >
      {/* Background Chamber Name Watermark */}
      {doctor?.settings?.showWatermark !== false && (
        <div className="rx-pad-watermark">
          {chamberName || 'Rx'}
        </div>
      )}

      {/* TOP SECTION: Header + Patient Bar */}
      <div>
        {/* HEADER: Doctor & Chamber Branding */}
        <div className="relative z-10 border-b-2 border-slate-800 pb-4 mb-4">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 print:!flex-row print:!items-start print:!justify-between print:!gap-4">
            {/* Doctor Info */}
            <div className="rx-doctor-header space-y-1 flex-1 min-w-0 max-w-[440px] print:!max-w-[440px] break-words">
              <h2 className="text-lg sm:text-xl print:!text-lg font-black text-medical-800 tracking-tight leading-tight">
                {doctorDisplayName}
              </h2>
              {doctor?.qualification ? (
                <div className="rx-qualifications font-semibold text-slate-700 leading-snug text-xs break-words whitespace-pre-wrap">
                  {doctor.qualification.split(/\r?\n/).map((line, idx) => (
                    <p key={idx} className="min-h-[1.25em] break-words whitespace-pre-wrap">
                      {line || '\u00A0'}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="font-semibold text-slate-700 leading-snug text-xs break-words">
                  MBBS (DMC), FCPS (Medicine), CCD (BIRDEM)
                </p>
              )}
              {doctor?.designation && (
                <div className="text-slate-600 text-xs font-medium leading-snug break-words whitespace-pre-wrap">
                  {doctor.designation.split(/\r?\n/).map((line, idx) => (
                    <p key={idx} className="min-h-[1.25em] break-words whitespace-pre-wrap">
                      {line || '\u00A0'}
                    </p>
                  ))}
                </div>
              )}
              {doctor?.specialization && (
                <div className="text-medical-600 font-medium leading-snug text-xs break-words whitespace-pre-wrap">
                  {doctor.specialization.split(/\r?\n/).map((line, idx) => (
                    <p key={idx} className="min-h-[1.25em] break-words whitespace-pre-wrap">
                      {line || '\u00A0'}
                    </p>
                  ))}
                </div>
              )}
              {doctor?.workplace && (
                <div className="text-slate-500 text-[11px] leading-snug break-words whitespace-pre-wrap">
                  {doctor.workplace.split(/\r?\n/).map((line, idx) => (
                    <p key={idx} className="min-h-[1.25em] break-words whitespace-pre-wrap">
                      {line || '\u00A0'}
                    </p>
                  ))}
                </div>
              )}
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] tracking-wide mt-1">
                <span>{(doctor?.healthcareAuthority || (doctor?.healthcareInstitutions && doctor.healthcareInstitutions[0]) || 'BMDC')} REG. NO:</span>
                <span className="text-medical-700">{doctor?.registrationNumber || doctor?.bmdcNumber || 'A-54321'}</span>
              </div>
            </div>

            {/* Chamber Info */}
            <div className="rx-chamber-header text-right sm:text-right print:!text-right space-y-1 w-auto max-w-[280px] sm:max-w-[320px] print:!max-w-[320px] shrink-0">
              <h2 className="text-lg sm:text-xl print:!text-base font-black text-medical-800 tracking-tight leading-tight whitespace-nowrap print:!whitespace-nowrap">
                {chamberName || 'Consultation Chamber'}
              </h2>
              <p className="text-slate-600 text-[11px] leading-snug break-words">
                {chamber?.address ||
                  (typeof doctor?.defaultChamberId === 'object'
                    ? (doctor.defaultChamberId as any).address
                    : (doctor as any)?.chamberAddress) ||
                  doctor?.workplace ||
                  'Medical Plaza, Dhanmondi, Dhaka'}
              </p>
              {(chamber?.phone || doctor?.phone) && (
                <p className="text-slate-500 text-[11px] font-mono leading-tight whitespace-nowrap">
                  Phone: {chamber?.phone || doctor?.phone}
                </p>
              )}
              {(chamber?.visitingHours || (typeof doctor?.defaultChamberId === 'object' && (doctor.defaultChamberId as any).visitingHours)) && (
                <p className="text-medical-700 text-[11px] font-medium leading-tight whitespace-nowrap">
                  Time: {chamber?.visitingHours || (doctor?.defaultChamberId as any)?.visitingHours}
                </p>
              )}
              {((chamber as any)?.website ||
                (typeof doctor?.defaultChamberId === 'object' && (doctor.defaultChamberId as any).website) ||
                (doctor as any)?.chamberWebsite) && (
                <p className="text-slate-600 text-[11px] leading-snug break-words">
                  <span className="font-semibold text-slate-700">Appointment:</span>{' '}
                  <span className="text-medical-700 font-medium">
                    {(chamber as any)?.website ||
                      (doctor?.defaultChamberId as any)?.website ||
                      (doctor as any)?.chamberWebsite}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* PATIENT BAR (Clean 3 Columns: Name, Age/Gender, Date) */}
        <div className="relative z-10 bg-slate-50/90 border border-slate-200/80 rounded-lg p-2.5 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-slate-800">
          <div>
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Patient Name</span>
            <span className="font-bold truncate block">{patient?.name || '____________________'}</span>
          </div>
          <div className="sm:text-center">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Age / Gender</span>
            <span className="font-medium">
              {patient ? `${patient.age} yrs • ${patient.gender}` : '__ yrs • ___'}
            </span>
          </div>
          <div className="sm:text-right">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Date</span>
            <span className="font-mono font-bold text-medical-800">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN BODY */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 flex-1 min-h-[480px] border-t-2 border-slate-800">
        {/* LEFT COLUMN: Clinical Notes, Vitals, Investigations (Width: 4/12) */}
        <div className="rx-pad-left-col col-span-1 md:col-span-4 border-b-2 md:border-b-0 md:border-r-2 border-slate-800 p-3 sm:p-3.5 space-y-4">
          {/* Empty State / Diagnosis Placeholder matching user specification */}
          {chiefComplaints.length === 0 &&
            !vitals?.bpSystolic &&
            !vitals?.pulse &&
            !vitals?.temperature &&
            !vitals?.weight &&
            !history &&
            !examination &&
            diagnosis.length === 0 &&
            investigations.length === 0 && (
              <div className="text-slate-500/80 text-xs font-medium tracking-wide">
                Diagnosis...
              </div>
            )}

          {/* Vitals */}
          {vitals && (vitals.bpSystolic || vitals.pulse || vitals.temperature || vitals.weight) && (
            <div className="space-y-1.5 rx-avoid-break">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-emerald-300/80 pb-1">
                Clinical Vitals (O/E)
              </h4>
              <div className="space-y-0.5 text-[11px] text-slate-700">
                {vitals.bpSystolic && vitals.bpDiastolic && (
                  <p>
                    <span className="font-semibold text-slate-500">BP:</span>{' '}
                    <span className="font-mono font-bold text-slate-900">
                      {vitals.bpSystolic}/{vitals.bpDiastolic}
                    </span>{' '}
                    mmHg
                  </p>
                )}
                {vitals.pulse && (
                  <p>
                    <span className="font-semibold text-slate-500">Pulse:</span>{' '}
                    <span className="font-mono">{vitals.pulse}</span> bpm
                  </p>
                )}
                {vitals.temperature && (
                  <p>
                    <span className="font-semibold text-slate-500">Temp:</span>{' '}
                    <span className="font-mono">{vitals.temperature}</span> °F
                  </p>
                )}
                {vitals.spo2 && (
                  <p>
                    <span className="font-semibold text-slate-500">SpO2:</span>{' '}
                    <span className="font-mono">{vitals.spo2}</span> %
                  </p>
                )}
                {vitals.weight && (
                  <p>
                    <span className="font-semibold text-slate-500">Weight:</span>{' '}
                    <span className="font-mono">{vitals.weight}</span> kg
                    {vitals.bmi && (
                      <span className="text-slate-500 text-[10px] ml-1.5">(BMI: {vitals.bmi.toFixed(1)})</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Chief Complaints (C/C) */}
          {chiefComplaints.length > 0 && (
            <div className="space-y-1 rx-avoid-break">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-emerald-300/80 pb-1">
                Chief Complaints (C/C)
              </h4>
              <ul className="list-disc list-inside space-y-0.5 text-slate-800">
                {chiefComplaints.map((cc, i) => (
                  <li key={i} className="leading-snug">
                    <span className="font-medium">{cc.complaint}</span>
                    {cc.duration && <span className="text-slate-500 text-[10px] ml-1">({cc.duration})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Examination & History */}
          {(history || examination) && (
            <div className="space-y-1.5 rx-avoid-break">
              {history && (
                <div>
                  <h5 className="font-semibold text-slate-600 text-[10px] uppercase">History</h5>
                  <p className="text-slate-800 text-[11px] leading-snug">{history}</p>
                </div>
              )}
              {examination && (
                <div>
                  <h5 className="font-semibold text-slate-600 text-[10px] uppercase">On Examination</h5>
                  <p className="text-slate-800 text-[11px] leading-snug">{examination}</p>
                </div>
              )}
            </div>
          )}

          {/* Diagnosis */}
          {diagnosis.length > 0 && (
            <div className="space-y-1 rx-avoid-break">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-emerald-300/80 pb-1">
                Diagnosis (Dx)
              </h4>
              <ul className="space-y-1 text-slate-900 font-semibold">
                {diagnosis.map((dx, i) => (
                  <li key={i} className="leading-snug flex items-start gap-1">
                    <span className="text-medical-600">•</span>
                    <span>
                      {dx.name}
                      {dx.icdCode && (
                        <span className="text-[10px] font-mono text-slate-400 font-normal ml-1">
                          [{dx.icdCode}]
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Investigations Advised */}
          {investigations.length > 0 && (
            <div className="space-y-1 rx-avoid-break">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-emerald-300/80 pb-1">
                Investigations (Tests)
              </h4>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-800">
                {investigations.map((inv, i) => (
                  <li key={i} className="leading-snug font-medium">
                    {inv}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Rx Medicines, Advice, Follow-up (Width: 8/12) */}
        <div className="col-span-1 md:col-span-8 p-3 sm:p-4 sm:pl-6 flex flex-col justify-between pt-3">
          <div className="space-y-6">
            {/* Rx Emblem */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
              <span className="text-2xl font-black text-medical-800 font-serif italic tracking-wider">
                ℞
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                Prescription
              </span>
            </div>

            {/* Medicine Items List */}
            {medicines.length === 0 ? (
              <div className="py-12 text-center text-slate-300 italic text-sm">
                No medicines added yet. Use medicine search on the left to add prescribed drugs.
              </div>
            ) : (
              <div className="space-y-3.5">
                {medicines.map((med, index) => (
                  <div key={index} className="rx-avoid-break space-y-0.5">
                    {/* Medicine Name & Strength */}
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-slate-500 font-mono text-xs">
                        {index + 1}.
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase px-1.5 py-0.2 bg-slate-100 rounded">
                        {med.dosageForm}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {med.brandName}
                      </span>
                      {med.strength && (
                        <span className="font-medium text-slate-700 text-xs">
                          ({med.strength})
                        </span>
                      )}
                      {med.genericName && (
                        <span className="text-[10px] text-slate-400 italic">
                          - {med.genericName}
                        </span>
                      )}
                    </div>

                    {/* Dosage, Frequency, Duration, Meal Timing */}
                    <div className="pl-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-800 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-slate-400 font-normal">Dose:</span> {med.dose || '1 tablet'}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-medical-800 bg-medical-50/60 px-1.5 py-0.5 rounded">
                        {med.frequency}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="text-slate-400 font-normal">Duration:</span> {med.duration}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-700 italic">
                        ({med.instruction})
                      </span>
                    </div>

                    {med.customNote && (
                      <p className="pl-6 text-[11px] text-amber-800 italic">
                        * {med.customNote}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Advice Section */}
            {advice.length > 0 && (
              <div className="border-t border-slate-200 pt-3 space-y-1 rx-avoid-break">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Advice (পরামর্শ):
                </h4>
                <ul className="list-disc list-inside space-y-0.5 text-slate-800">
                  {advice.map((adv, i) => (
                    <li key={i} className="leading-snug">
                      {adv}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow-up recommendation */}
            {followUp?.duration && (
              <div className="border-t border-slate-200 pt-2 text-slate-800 rx-avoid-break">
                <span className="font-bold text-medical-800">Follow-up:</span>{' '}
                <span className="font-medium">
                  After {followUp.duration} {followUp.notes ? `(${followUp.notes})` : 'with reports or if symptoms persist.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER: Signature, Chamber Schedule, QR Code Verification */}
      <div className="relative z-10 border-t-2 border-slate-800 pt-3 mt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          {/* Left: QR Code Verification Token */}
          <div className="flex items-center gap-2.5">
            {doctor?.settings?.showQrCode !== false && (
              <div className="p-1 bg-white border border-slate-200 rounded shrink-0">
                <QRCodeSVG value={publicUrl} size={48} level="M" />
              </div>
            )}
            <div className="text-[10px] text-slate-500 space-y-0.5 leading-tight">
              <p className="font-semibold text-slate-700">Digital Prescription</p>
              <p>Scan to verify original record</p>
            </div>
          </div>

          {/* Right: Signature Area */}
          <div className="text-left sm:text-right print:!text-right space-y-1 w-full sm:w-auto ml-auto shrink-0">
            <div className="h-10 flex items-end justify-start sm:justify-end">
              {doctor?.signature || chamber?.signature ? (
                <img
                  src={doctor?.signature || chamber?.signature}
                  alt="Doctor Signature"
                  className="max-h-12 object-contain"
                />
              ) : (
                <div className="w-36 border-b border-dashed border-slate-400"></div>
              )}
            </div>
            <p className="font-bold text-slate-900 text-xs">{doctorDisplayName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
