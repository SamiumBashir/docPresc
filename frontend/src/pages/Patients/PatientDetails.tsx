import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Calendar,
  AlertCircle,
  Activity,
  FilePlus,
  History,
  Copy,
  Printer,
  Eye,
  ArrowLeft,
  Pill,
  BookmarkCheck,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../../components/ui/Toast';
import { IPatient, IPrescription } from '../../types';

interface PatientHistoryData {
  patient: IPatient;
  prescriptions: IPrescription[];
  pastDiagnoses: string[];
  pastMedicines: Array<{
    brandName: string;
    genericName?: string;
    strength?: string;
    dosageForm: string;
    lastDose: string;
    lastFrequency: string;
    lastPrescribedDate: string;
  }>;
}

export const PatientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PatientHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api<{ success: boolean; data: PatientHistoryData }>(
          `/patients/${id}/history`
        );
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err: any) {
        showToast.error('Failed to load patient history.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [id]);

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Loading patient medical history...</div>;
  }

  if (!data) {
    return <div className="p-12 text-center text-slate-500">Patient record not found.</div>;
  }

  const { patient, prescriptions, pastDiagnoses, pastMedicines } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Back Button & Top Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patient List
        </button>

        <Link
          to={`/prescriptions/new?patientId=${patient._id}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-medical-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <FilePlus className="w-4 h-4" /> Write New Prescription
        </Link>
      </div>

      {/* Patient Profile Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-medical-50 border border-medical-200 flex items-center justify-center text-medical-700 font-black text-2xl shadow-xs">
              {patient.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black text-slate-900">{patient.name}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                  {patient.patientId}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-medical-50 text-medical-800 font-bold border border-medical-200">
                  {patient.bloodGroup ? `Blood: ${patient.bloodGroup}` : 'Blood: Unknown'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {patient.age} years old • {patient.gender} • Registered on{' '}
                {new Date(patient.createdAt).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-600 font-mono">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-sans block uppercase font-bold">Phone Number</span>
              <span className="font-bold text-slate-800">{patient.phone}</span>
            </div>
            {patient.emergencyContact && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-sans block uppercase font-bold">Emergency</span>
                <span className="font-semibold text-slate-800 font-sans">{patient.emergencyContact}</span>
              </div>
            )}
          </div>
        </div>

        {/* Clinical Summary Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
          {/* Allergies */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Drug / Environmental Allergies
            </span>
            {patient.allergies && patient.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {patient.allergies.map((alg, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs"
                  >
                    ⚠️ {alg}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">No known drug allergies reported.</p>
            )}
          </div>

          {/* Medical History */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-medical-600" /> Chronic Medical History
            </span>
            {patient.medicalHistory && patient.medicalHistory.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {patient.medicalHistory.map((hist, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs"
                  >
                    • {hist}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">No chronic medical history recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Past Medicines + Prescriptions Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Past Prescribed Medicines & Diagnoses Summary */}
        <div className="lg:col-span-4 space-y-4">
          {/* Past Diagnoses */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <BookmarkCheck className="w-4 h-4 text-medical-600" /> Past Diagnoses ({pastDiagnoses.length})
            </h3>
            {pastDiagnoses.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No previous diagnoses recorded.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {pastDiagnoses.map((dx, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-medical-50 text-medical-900 border border-medical-200 text-xs font-bold"
                  >
                    {dx}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Past Prescribed Medicines */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-medical-600" /> Previously Prescribed Drugs
            </h3>
            {pastMedicines.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No past medications found.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto divide-y divide-slate-100">
                {pastMedicines.map((med, i) => (
                  <div key={i} className="pt-2 first:pt-0 space-y-0.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{med.brandName}</span>
                      <span className="text-[10px] font-mono text-medical-700 bg-medical-50 px-1.5 py-0.2 rounded font-bold">
                        {med.lastFrequency}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 italic">
                      {med.dosageForm} {med.strength && `• ${med.strength}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Complete Prescriptions Timeline */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <History className="w-4 h-4 text-medical-600" /> Consultation Timeline ({prescriptions.length})
            </h3>
          </div>

          {prescriptions.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-3">
              <p className="text-sm">No prescriptions written for this patient yet.</p>
              <Link
                to={`/prescriptions/new?patientId=${patient._id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-medical-600 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <FilePlus className="w-4 h-4" /> Start First Prescription
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((rx) => (
                <div
                  key={rx._id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4 hover:border-medical-300 transition-all group"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {rx.prescriptionId}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                          rx.status === 'FINALIZED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rx.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(rx.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>

                      {/* Duplicate Prescription Action */}
                      <Link
                        to={`/prescriptions/new?cloneId=${rx._id}&patientId=${patient._id}`}
                        className="px-3 py-1.5 bg-medical-50 hover:bg-medical-100 text-medical-800 font-bold rounded-lg text-xs border border-medical-200/70 transition-colors flex items-center gap-1.5"
                        title="Duplicate as new draft for current visit"
                      >
                        <Copy className="w-3.5 h-3.5" /> Use as Base for New Rx
                      </Link>

                      <Link
                        to={`/prescriptions/${rx._id}`}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View Full Prescription Pad"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Diagnoses & Complaints */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Diagnoses
                      </span>
                      <ul className="space-y-0.5 font-bold text-slate-800">
                        {rx.diagnosis?.map((d, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <span className="text-medical-600">•</span> {d.name}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {rx.vitals && (rx.vitals.bpSystolic || rx.vitals.pulse || rx.vitals.weight) && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Vitals Recorded
                        </span>
                        <p className="text-slate-600">
                          {rx.vitals.bpSystolic && `BP: ${rx.vitals.bpSystolic}/${rx.vitals.bpDiastolic} mmHg • `}
                          {rx.vitals.pulse && `Pulse: ${rx.vitals.pulse} bpm • `}
                          {rx.vitals.weight && `Wt: ${rx.vitals.weight} kg`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Medicines Summary */}
                  <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Prescribed Medicines ({rx.medicines.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {rx.medicines.map((m, i) => (
                        <div key={i} className="flex items-baseline gap-1.5 text-slate-800">
                          <span className="font-bold text-slate-500 font-mono text-[11px]">{i + 1}.</span>
                          <span className="font-bold text-slate-900">{m.brandName}</span>
                          <span className="text-medical-800 font-mono text-[11px] font-bold">({m.frequency})</span>
                          <span className="text-slate-500 text-[11px]">- {m.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
