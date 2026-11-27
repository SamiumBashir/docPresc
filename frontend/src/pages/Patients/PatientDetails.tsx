import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { InfinityLoop } from '@/components/loading-ui/infinity';
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
  Utensils,
  Download,
  CalendarClock,
} from 'lucide-react';
import { api, downloadApiFile } from '../../api/client';
import { therapyApi } from '../../services/endpoints/therapy.api';
import {
  PlanStatusBadge,
  SessionStatusBadge,
} from '../../components/therapy/VerificationBadge';
import {
  IFoodChart,
  IPatient,
  IPatientTreatmentHistory,
  IPrescription,
  ITreatmentPlan,
} from '../../types';

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
  const [foodCharts, setFoodCharts] = useState<IFoodChart[]>([]);
  const [therapyHistory, setTherapyHistory] = useState<IPatientTreatmentHistory | null>(null);
  const [downloadingChartId, setDownloadingChartId] = useState<string | null>(null);
  const [downloadingPlanId, setDownloadingPlanId] = useState<string | null>(null);
  const [foodChartError, setFoodChartError] = useState<string | null>(null);
  const [therapyError, setTherapyError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [res, chartsRes, txHistory] = await Promise.all([
          api<{ success: boolean; data: PatientHistoryData }>(`/patients/${id}/history`),
          api<{ success: boolean; data: IFoodChart[] }>(`/patients/${id}/food-charts`).catch(
            () => ({ success: false, data: [] as IFoodChart[] })
          ),
          id ? therapyApi.getPatientTreatmentHistory(id).catch(() => null) : Promise.resolve(null),
        ]);
        if (res.success && res.data) {
          setData(res.data);
        }
        if (chartsRes.success) {
          setFoodCharts(chartsRes.data || []);
        }
        setTherapyHistory(txHistory);
      } catch {
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [id]);

  const handleDownloadTreatmentPlanPdf = async (plan: ITreatmentPlan) => {
    setTherapyError(null);
    setDownloadingPlanId(plan._id);
    try {
      await therapyApi.downloadTreatmentPlanPdf(plan);
    } catch (err: any) {
      setTherapyError(err?.message || 'Unable to download treatment plan PDF.');
    } finally {
      setDownloadingPlanId(null);
    }
  };

  const handleDownloadFoodChartPdf = async (chart: IFoodChart) => {
    setFoodChartError(null);
    setDownloadingChartId(chart._id);
    try {
      const datePart = (chart.finalizedAt || chart.createdAt || '').slice(0, 10) || 'chart';
      await downloadApiFile(
        `/food-charts/${chart._id}/pdf`,
        `Food-Chart-${chart.patientSnapshot?.patientId || chart.chartNumber}-${datePart}.pdf`
      );
    } catch (err: any) {
      setFoodChartError(err?.message || 'Unable to download food chart PDF.');
    } finally {
      setDownloadingChartId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
        <InfinityLoop className="w-16 h-8 text-medical-600" duration="1.8s" strokeWidth={5.5} />
        <p className="text-xs text-slate-500 font-medium">Loading patient medical history...</p>
      </div>
    );
  }

  if (!data) {
    return <div className="p-12 text-center text-slate-500">Patient record not found.</div>;
  }

  const { patient, prescriptions, pastDiagnoses, pastMedicines } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Back Button & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patient List
        </button>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          <Link
            to={`/patients/${patient._id}/therapy-plan`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-medium transition-colors"
          >
            <Activity className="w-4 h-4 text-[#007086]" strokeWidth={1.5} /> New Treatment Plan
          </Link>

          <Link
            to={`/patients/${patient._id}/food-chart`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-medium transition-colors"
          >
            <Utensils className="w-4 h-4 text-[#007086]" strokeWidth={1.5} /> Create Food Chart
          </Link>

          <Link
            to={`/prescriptions/new?patientId=${patient._id}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-medium transition-colors active:scale-[0.98]"
          >
            <FilePlus className="w-4 h-4" /> Write New Prescription
          </Link>
        </div>
      </div>

      {/* Patient Profile Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-medical-50 border border-medical-200 flex items-center justify-center text-medical-700 font-semibold text-xl sm:text-2xl shadow-xs shrink-0">
              {patient.name.charAt(0)}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">{patient.name}</h2>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 text-xs text-slate-600 font-mono w-full md:w-auto">
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
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Drug / Environmental Allergies
            </span>
            {patient.allergies && patient.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {patient.allergies.map((alg, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-medium text-xs"
                  >
                    • {alg}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">No known drug allergies reported.</p>
            )}
          </div>

          {/* Medical History */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
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
            <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
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
            <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
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

          {/* Patient Food Charts */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-[#007086]" strokeWidth={1.5} /> Food Charts ({foodCharts.length})
              </h3>
              <Link
                to={`/patients/${patient._id}/food-chart`}
                className="text-xs font-medium text-[#007086] hover:underline"
              >
                + New
              </Link>
            </div>

            {foodChartError && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">
                {foodChartError}
              </p>
            )}

            {foodCharts.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No dietary food charts created yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto divide-y divide-slate-100">
                {foodCharts.map((chart) => (
                  <div key={chart._id} className="pt-2.5 first:pt-0 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/food-charts/${chart._id}`}
                        className="font-mono font-semibold text-slate-900 hover:text-[#007086] tabular-nums"
                      >
                        {chart.chartNumber}
                      </Link>
                      <span
                        className={`px-1.5 py-0.5 text-[11px] font-medium rounded border tabular-nums ${
                          chart.status === 'FINALIZED'
                            ? 'bg-[#f0f9fa] border-[#aee2e8] text-[#065b6d]'
                            : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {chart.status} • v{chart.version}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 tabular-nums">
                      {chart.allowedFoods?.length || 0} allowed • {chart.avoidedFoods?.length || 0} avoided
                    </p>

                    <div className="flex items-center gap-2 pt-0.5">
                      <Link
                        to={`/food-charts/${chart._id}`}
                        className="px-2.5 py-1 text-xs font-medium border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        disabled={downloadingChartId === chart._id}
                        onClick={() => handleDownloadFoodChartPdf(chart)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>{downloadingChartId === chart._id ? 'PDF...' : 'PDF'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Treatment & Therapy History + Complete Prescriptions Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* Dedicated Treatment & Therapy History Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4 text-[#007086]" strokeWidth={1.5} />
                  <span>Treatment &amp; Therapy History</span>
                </h3>
                {therapyHistory && (
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    {therapyHistory.summary.activePlansCount} active plans •{' '}
                    {therapyHistory.summary.completedSessionsCount} completed sessions •{' '}
                    {therapyHistory.summary.upcomingSessionsCount} upcoming sessions
                  </p>
                )}
              </div>
              <Link
                to={`/patients/${patient._id}/therapy-plan`}
                className="px-3 py-1.5 text-xs font-medium bg-[#007086] hover:bg-[#065b6d] text-white rounded-lg"
              >
                + Assign therapy
              </Link>
            </div>

            {therapyError && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">
                {therapyError}
              </p>
            )}

            {!therapyHistory || therapyHistory.summary.totalPlans === 0 ? (
              <p className="text-xs text-slate-500">
                No therapy treatment plans have been assigned to this patient yet.
              </p>
            ) : (
              <div className="space-y-4">
                {[...therapyHistory.activePlans, ...therapyHistory.previousPlans].map((plan) => (
                  <div
                    key={plan._id}
                    className="p-3.5 border border-slate-200 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/therapies/plans/${plan._id}`}
                          className="font-mono font-semibold text-slate-900 hover:text-[#007086]"
                        >
                          {plan.chartNumber}
                        </Link>
                        <PlanStatusBadge status={plan.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/therapies/plans/${plan._id}`}
                          className="px-2.5 py-1 text-xs font-medium border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg"
                        >
                          Open plan
                        </Link>
                        <button
                          type="button"
                          disabled={downloadingPlanId === plan._id}
                          onClick={() => handleDownloadTreatmentPlanPdf(plan)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>{downloadingPlanId === plan._id ? 'PDF...' : 'PDF'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-slate-800 font-medium">
                      {plan.therapySnapshots && plan.therapySnapshots.length > 0
                        ? plan.therapySnapshots.map((t) => t?.name).filter(Boolean).join(', ')
                        : plan.therapySnapshot?.name}
                      <span className="text-slate-500 font-normal ml-1.5">
                        (
                        {Array.from(
                          new Set(
                            (plan.therapySnapshots && plan.therapySnapshots.length > 0
                              ? plan.therapySnapshots
                              : [plan.therapySnapshot]
                            )
                              .map((t) => t?.categoryName)
                              .filter(Boolean)
                          )
                        ).join(', ')}
                        )
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      Practitioner: {plan.practitionerSnapshot?.name}
                      {plan.plannedSessions ? ` • Planned: ${plan.plannedSessions} sessions` : ''}
                    </div>

                    {plan.precautions && (
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700">
                        <span className="font-semibold text-slate-800">Precautions:</span>{' '}
                        {plan.precautions}
                      </div>
                    )}
                  </div>
                ))}

                {therapyHistory.sessions.length > 0 && (
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="text-xs font-medium text-slate-700">
                      Recent &amp; Upcoming Therapy Sessions ({therapyHistory.sessions.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {therapyHistory.sessions.slice(0, 6).map((sess) => {
                        const planObj =
                          typeof sess.treatmentPlanId === 'object' ? sess.treatmentPlanId : null;
                        return (
                          <div
                            key={sess._id}
                            className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-semibold text-slate-800 tabular-nums">
                                #{sess.sessionNumber} • {planObj?.chartNumber || 'Plan'}
                              </span>
                              <SessionStatusBadge status={sess.status} />
                            </div>
                            <div className="text-slate-600 tabular-nums">
                              {new Date(sess.scheduledAt).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            {sess.practitionerNotes && (
                              <div className="text-slate-700 truncate">{sess.practitionerNotes}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
                    <span className="text-xs font-medium text-slate-500 block">
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
