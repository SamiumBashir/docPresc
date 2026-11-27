import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  CheckCircle2,
  Columns2,
  Download,
  Eye,
  FilePlus2,
  LayoutGrid,
  Lock,
  Plus,
  Printer,
  Save,
  Search,
  Trash2,
  User,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/ui/Modal';
import { InfinityLoop } from '@/components/loading-ui/infinity';
import { therapyApi } from '../../services/endpoints/therapy.api';
import { TherapyCatalogSelectorPanel } from '../../components/therapy/TherapyCatalogSelectorPanel';
import { TreatmentPlanDocumentPreview } from '../../components/therapy/TreatmentPlanDocumentPreview';
import {
  ConsentStatusBadge,
  SessionStatusBadge,
} from '../../components/therapy/VerificationBadge';
import { SessionUpdateModal } from '../../components/therapy/SessionUpdateModal';
import {
  ConsentStatus,
  IPatient,
  IPractitioner,
  ITherapy,
  ITherapySession,
  ITreatmentPlan,
  TreatmentPlanStatus,
} from '../../types';

export const TreatmentPlanStudio: React.FC = () => {
  const { id, patientId: routePatientId } = useParams<{ id?: string; patientId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, doctor, activeChamber } = useAuth();

  const isDoctor = user?.role === 'doctor';
  const queryPatientId = searchParams.get('patientId') || routePatientId;
  const queryTherapyId = searchParams.get('therapyId');

  const [isLoading, setIsLoading] = useState(true);
  const [allCatalogTherapies, setAllCatalogTherapies] = useState<ITherapy[]>([]);
  const [practitioners, setPractitioners] = useState<IPractitioner[]>([]);

  // Loaded Existing Plan
  const [loadedPlan, setLoadedPlan] = useState<ITreatmentPlan | null>(null);
  const [sessions, setSessions] = useState<ITherapySession[]>([]);
  const [summary, setSummary] = useState({ total: 0, scheduled: 0, completed: 0 });

  // Patient Selector (matches FoodChartStudio)
  const [selectedPatient, setSelectedPatient] = useState<IPatient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<IPatient[]>([]);
  const [changingPatient, setChangingPatient] = useState(false);

  // Clinical Form State (never auto-selects therapy or fabricates schedule/dosage)
  const [selectedTherapyId, setSelectedTherapyId] = useState('');
  const [assignedPractitionerId, setAssignedPractitionerId] = useState('');
  const [treatmentObjective, setTreatmentObjective] = useState('');
  const [clinicalIndication, setClinicalIndication] = useState('');
  const [plannedSessions, setPlannedSessions] = useState('');
  const [sessionDuration, setSessionDuration] = useState('');
  const [frequency, setFrequency] = useState('');
  const [scheduleSummary, setScheduleSummary] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [precautions, setPrecautions] = useState('');
  const [patientInstructions, setPatientInstructions] = useState('');
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>('PENDING');
  const [consentNotes, setConsentNotes] = useState('');
  const [clinicianApprovalConfirmed, setClinicianApprovalConfirmed] = useState(false);
  const [planStatus, setPlanStatus] = useState<TreatmentPlanStatus>('DRAFT');
  const [initialSessionDates, setInitialSessionDates] = useState<string[]>([]);

  // Studio Layout & Modals matching FoodChartStudio
  const [desktopLayout, setDesktopLayout] = useState<'split' | 'two-col'>('split');
  const [mobileTab, setMobileTab] = useState<'builder' | 'preview'>('builder');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newSessionDates, setNewSessionDates] = useState<string[]>(['']);
  const [editingSession, setEditingSession] = useState<ITherapySession | null>(null);
  const [deletingSession, setDeletingSession] = useState<ITherapySession | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const loadPlanDetail = useCallback(async (planId: string) => {
    const detail = await therapyApi.getTreatmentPlanById(planId);
    const p = detail.plan;
    setLoadedPlan(p);
    setSessions(detail.sessions || []);
    setSummary({
      total: detail.summary?.total || 0,
      scheduled: detail.summary?.scheduled || 0,
      completed: detail.summary?.completed || 0,
    });
    setSelectedTherapyId(p.therapyId);
    setAssignedPractitionerId(p.assignedPractitionerId);
    setTreatmentObjective(p.treatmentObjective || '');
    setClinicalIndication(p.clinicalIndication || '');
    setPlannedSessions(p.plannedSessions ? String(p.plannedSessions) : '');
    setSessionDuration(p.sessionDuration || '');
    setFrequency(p.frequency || '');
    setScheduleSummary(p.scheduleSummary || '');
    setStartDate(p.startDate ? p.startDate.slice(0, 10) : '');
    setEndDate(p.endDate ? p.endDate.slice(0, 10) : '');
    setPrecautions(p.precautions || '');
    setPatientInstructions(p.patientInstructions || '');
    setConsentStatus(p.consentStatus);
    setConsentNotes(p.consentNotes || '');
    setClinicianApprovalConfirmed(Boolean(p.clinicianApprovalConfirmed));
    setPlanStatus(p.status);
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [catRes, pracList] = await Promise.all([
          therapyApi.getCatalog({
            isActive: true,
            isAvailable: true,
            limit: 200,
          }),
          therapyApi.getPractitioners(),
        ]);

        if (!active) return;
        const catalogList = catRes.therapies || [];
        setAllCatalogTherapies(catalogList);
        setPractitioners(pracList || []);

        if (id) {
          await loadPlanDetail(id);
        } else {
          setLoadedPlan(null);
          setSessions([]);
          setSelectedTherapyId(
            queryTherapyId &&
              catalogList.some(
                (t) =>
                  t._id === queryTherapyId &&
                  t.isActive &&
                  t.isAvailable &&
                  t.verificationStatus === 'APPROVED'
              )
              ? queryTherapyId
              : ''
          );
          if (pracList.length > 0) {
            const selfDoctor = pracList.find((p) => p._id === user?.id);
            setAssignedPractitionerId(selfDoctor?._id || pracList[0]._id);
          }
          if (queryPatientId) {
            try {
              const pRes = await api<{ success: boolean; data: IPatient }>(
                `/patients/${queryPatientId}`
              );
              if (active && pRes.success && pRes.data) {
                setSelectedPatient(pRes.data);
              }
            } catch {
              // ignore unaccessible patient
            }
          }
        }
      } catch (err: any) {
        if (active) {
          const msg = String(err?.message || '');
          setErrorMessage(
            err?.code === 'ROUTE_NOT_FOUND' || msg.includes('not found')
              ? 'Therapy API endpoint is not active on the connected backend server. Restart local backend (`npm run dev`) on port 5000 or deploy updated backend.'
              : msg || 'Unable to load treatment plan studio.'
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    init();
    return () => {
      active = false;
    };
  }, [id, queryPatientId, queryTherapyId, user?.id, loadPlanDetail]);

  // Search doctor-scoped patients ONLY after the clinician enters a search term
  useEffect(() => {
    if (!isDoctor || id) return;
    const trimmed = patientSearch.trim();
    if (!trimmed) {
      setPatientResults([]);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        const q = `?search=${encodeURIComponent(trimmed)}&limit=8`;
        const res = await api<{ success: boolean; data: { patients: IPatient[] } }>(
          `/patients${q}`
        );
        if (active && res.success) {
          setPatientResults(res.data?.patients || []);
        }
      } catch {
        // ignore
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isDoctor, id, patientSearch]);

  const selectedTherapy = useMemo(
    () => allCatalogTherapies.find((t) => t._id === selectedTherapyId) || null,
    [allCatalogTherapies, selectedTherapyId]
  );

  useEffect(() => {
    if (!id && selectedTherapy) {
      setConsentStatus(selectedTherapy.consentRequired ? 'PENDING' : 'NOT_REQUIRED');
    }
  }, [id, selectedTherapy]);

  const selectedPractitioner = useMemo(
    () => practitioners.find((p) => p._id === assignedPractitionerId) || null,
    [practitioners, assignedPractitionerId]
  );

  const handleSaveNew = async (targetStatus: 'DRAFT' | 'FINALIZED') => {
    setErrorMessage(null);
    setStatusNotice(null);

    if (!selectedPatient) {
      setIsFinalizeModalOpen(false);
      setErrorMessage('Select a patient before saving the treatment plan.');
      return;
    }
    if (!selectedTherapyId) {
      setIsFinalizeModalOpen(false);
      setErrorMessage('Select an approved therapy service from the catalog first.');
      return;
    }
    if (!assignedPractitionerId) {
      setIsFinalizeModalOpen(false);
      setErrorMessage('Assign an authorized practitioner.');
      return;
    }
    if (targetStatus === 'FINALIZED' && !clinicianApprovalConfirmed) {
      setIsFinalizeModalOpen(false);
      setErrorMessage('Confirm clinician suitability review before finalizing this plan.');
      return;
    }

    setIsSaving(true);
    try {
      const cleanInitialSessions = initialSessionDates
        .filter((d) => Boolean(d))
        .map((d) => ({ scheduledAt: new Date(d).toISOString() }));

      const res = await therapyApi.createTreatmentPlan({
        patientId: selectedPatient._id,
        chamberId: activeChamber?._id || null,
        therapyId: selectedTherapyId,
        assignedPractitionerId,
        treatmentObjective,
        clinicalIndication,
        clinicianApprovalConfirmed,
        plannedSessions: plannedSessions ? parseInt(plannedSessions, 10) : null,
        sessionDuration,
        frequency,
        scheduleSummary,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        precautions,
        patientInstructions,
        consentStatus,
        consentNotes,
        status: targetStatus,
        initialSessions: cleanInitialSessions,
      });
      setIsFinalizeModalOpen(false);
      setStatusNotice(
        targetStatus === 'FINALIZED' ? 'Treatment plan finalized' : 'Draft saved'
      );
      navigate(`/therapies/plans/${res.plan._id}`, { replace: true });
    } catch (err: any) {
      setIsFinalizeModalOpen(false);
      setErrorMessage(err?.message || 'Unable to save treatment plan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateExisting = async (overrideStatus?: TreatmentPlanStatus) => {
    if (!loadedPlan) return;
    setErrorMessage(null);
    setStatusNotice(null);
    setIsSaving(true);
    try {
      const updated = await therapyApi.updateTreatmentPlan(loadedPlan._id, {
        assignedPractitionerId: assignedPractitionerId || undefined,
        treatmentObjective,
        clinicalIndication,
        clinicianApprovalConfirmed,
        plannedSessions: plannedSessions ? parseInt(plannedSessions, 10) : null,
        sessionDuration,
        frequency,
        scheduleSummary,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        precautions,
        patientInstructions,
        consentStatus,
        consentNotes,
        status: overrideStatus || planStatus,
      });
      setLoadedPlan(updated);
      setPlanStatus(updated.status);
      setIsFinalizeModalOpen(false);
      setStatusNotice(overrideStatus === 'FINALIZED' ? 'Plan finalized' : 'Changes saved');
    } catch (err: any) {
      setIsFinalizeModalOpen(false);
      setErrorMessage(err?.message || 'Unable to update treatment plan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSessionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loadedPlan) return;
    const validDates = newSessionDates.filter((d) => Boolean(d.trim()));
    if (validDates.length === 0) return;

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await therapyApi.createSessionsForPlan(
        loadedPlan._id,
        validDates.map((d) => ({ scheduledAt: new Date(d).toISOString() }))
      );
      setIsScheduleModalOpen(false);
      setNewSessionDates(['']);
      await loadPlanDetail(loadedPlan._id);
      setStatusNotice(`${validDates.length} session(s) scheduled`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to schedule sessions.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSessionConfirm = async () => {
    if (!deletingSession || !loadedPlan) return;
    setErrorMessage(null);
    try {
      await therapyApi.deleteSession(deletingSession._id);
      setDeletingSession(null);
      await loadPlanDetail(loadedPlan._id);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to remove scheduled session.');
      setDeletingSession(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!loadedPlan) return;
    setErrorMessage(null);
    setIsDownloadingPdf(true);
    try {
      await therapyApi.downloadTreatmentPlanPdf(loadedPlan);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to generate Treatment Plan PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const activePatient = loadedPlan ? loadedPlan.patientSnapshot : selectedPatient;
  const chartNumberDisplay = loadedPlan?.chartNumber || 'TP-NEW-DRAFT';
  const currentStatusDisplay = loadedPlan?.status || planStatus;
  const versionDisplay = loadedPlan?.version || 1;
  const activeTherapyName = loadedPlan
    ? loadedPlan.therapySnapshot.name
    : selectedTherapy?.name || '';
  const activeTherapyNameBn = loadedPlan
    ? loadedPlan.therapySnapshot.bengaliName
    : selectedTherapy?.bengaliName;
  const activeCategoryName = loadedPlan
    ? loadedPlan.therapySnapshot.categoryName
    : selectedTherapy?.categoryName || '';
  const activePractitionerSummary = loadedPlan
    ? [
        loadedPlan.practitionerSnapshot.name,
        loadedPlan.practitionerSnapshot.designation || loadedPlan.practitionerSnapshot.role,
      ]
        .filter(Boolean)
        .join(' — ')
    : selectedPractitioner
    ? [selectedPractitioner.name, selectedPractitioner.designation || selectedPractitioner.role]
        .filter(Boolean)
        .join(' — ')
    : '';

  const previewNode = useMemo(
    () => (
      <TreatmentPlanDocumentPreview
        doctor={doctor}
        chamber={activeChamber}
        doctorSnapshot={loadedPlan?.doctorSnapshot}
        patient={activePatient}
        chartNumber={chartNumberDisplay}
        status={currentStatusDisplay}
        date={loadedPlan?.finalizedAt || loadedPlan?.createdAt}
        therapyName={activeTherapyName}
        therapyNameBn={activeTherapyNameBn}
        categoryName={activeCategoryName}
        practitionerSummary={activePractitionerSummary}
        treatmentObjective={treatmentObjective}
        clinicalIndication={clinicalIndication}
        plannedSessions={plannedSessions ? parseInt(plannedSessions, 10) : null}
        sessionDuration={sessionDuration}
        frequency={frequency}
        scheduleSummary={scheduleSummary}
        startDate={startDate}
        endDate={endDate}
        consentStatus={consentStatus}
        consentNotes={consentNotes}
        clinicianApprovalConfirmed={clinicianApprovalConfirmed}
        precautions={precautions}
        patientInstructions={patientInstructions}
        sessions={sessions}
      />
    ),
    [
      doctor,
      activeChamber,
      loadedPlan,
      activePatient,
      chartNumberDisplay,
      currentStatusDisplay,
      activeTherapyName,
      activeTherapyNameBn,
      activeCategoryName,
      activePractitionerSummary,
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
      sessions,
    ]
  );

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <InfinityLoop className="w-16 h-8 text-[#007086]" duration="1.8s" strokeWidth={5.5} />
        <p className="text-xs text-slate-500">Loading Treatment Plan Studio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1440px] mx-auto pb-10">
      {/* Quiet Single-Line Top Bar matching FoodChartStudio */}
      <div className="no-print bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 flex flex-wrap xl:flex-nowrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/therapies')}
            aria-label="Back to Therapies"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-sm sm:text-base font-semibold text-slate-900 whitespace-nowrap">
                Patient Treatment Plan
              </h1>
              <span className="font-bengali text-sm font-medium text-[#007086] whitespace-nowrap">
                রোগীর থেরাপি পরিকল্পনা
              </span>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded border tabular-nums whitespace-nowrap ${
                  currentStatusDisplay === 'FINALIZED' ||
                  currentStatusDisplay === 'ACTIVE' ||
                  currentStatusDisplay === 'COMPLETED'
                    ? 'bg-[#f0f9fa] border-[#aee2e8] text-[#065b6d]'
                    : 'bg-slate-100 border-slate-300 text-slate-700'
                }`}
              >
                {currentStatusDisplay} • v{versionDisplay}
              </span>
              <span className="text-xs font-mono font-semibold text-slate-600 tabular-nums whitespace-nowrap">
                {chartNumberDisplay}
              </span>
              {statusNotice && (
                <span className="text-xs font-medium text-[#007086] whitespace-nowrap">
                  {statusNotice}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap xl:flex-nowrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Eye className="w-4 h-4" strokeWidth={1.5} />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Printer className="w-4 h-4" strokeWidth={1.5} />
            <span>Print</span>
          </button>

          {loadedPlan && (
            <button
              type="button"
              disabled={isDownloadingPdf}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" strokeWidth={1.5} />
              <span>{isDownloadingPdf ? 'PDF...' : 'Download PDF'}</span>
            </button>
          )}

          {isDoctor && !loadedPlan && (
            <>
              <button
                type="button"
                disabled={isSaving || !selectedPatient}
                onClick={() => handleSaveNew('DRAFT')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                <Save className="w-4 h-4" strokeWidth={1.5} />
                <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
              </button>

              <button
                type="button"
                disabled={isSaving || !selectedPatient}
                onClick={() => setIsFinalizeModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#007086] hover:bg-[#065b6d] text-white rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                <span>Finalize Plan</span>
              </button>
            </>
          )}

          {isDoctor && loadedPlan && (
            <>
              {loadedPlan.status === 'DRAFT' && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsFinalizeModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#065b6d] bg-[#f0f9fa] border border-[#aee2e8] hover:bg-[#d5f0f3] rounded-lg disabled:opacity-50 whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                  <span>Finalize Plan</span>
                </button>
              )}

              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleUpdateExisting()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#007086] hover:bg-[#065b6d] text-white rounded-lg disabled:opacity-50 whitespace-nowrap"
              >
                <Save className="w-4 h-4" strokeWidth={1.5} />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="no-print p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800"
        >
          {errorMessage}
        </div>
      )}

      {/* Patient Strip + Desktop Layout Toggle matching FoodChartStudio */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {activePatient && !changingPatient ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  <User className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900">
                      {activePatient.name}
                    </span>
                    <span className="text-xs font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded tabular-nums">
                      {activePatient.patientId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {activePatient.age} yrs • {activePatient.gender}
                    {activePatient.phone ? ` • ${activePatient.phone}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!loadedPlan && isDoctor && (
                  <button
                    type="button"
                    onClick={() => setChangingPatient(true)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
                  >
                    Change patient
                  </button>
                )}
                {loadedPlan && isDoctor && (
                  <button
                    type="button"
                    onClick={() => navigate('/therapies/plans/new')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#007086] bg-[#f0f9fa] border border-[#aee2e8] hover:bg-[#d5f0f3] rounded-lg"
                  >
                    <FilePlus2 className="w-4 h-4" strokeWidth={1.5} />
                    <span>Create New Plan</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    strokeWidth={1.5}
                  />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Search patient by name, phone, or PAT ID..."
                    aria-label="Search doctor patients"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086]"
                  />
                </div>
                {selectedPatient && (
                  <button
                    type="button"
                    onClick={() => setChangingPatient(false)}
                    className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg self-start"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {patientResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pt-1">
                  {patientResults.map((patient) => (
                    <button
                      key={patient._id}
                      type="button"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setChangingPatient(false);
                      }}
                      className="flex items-center justify-between gap-2 p-2.5 text-left border border-slate-200 hover:border-[#007086] hover:bg-[#f0f9fa] rounded-lg transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {patient.name}
                        </p>
                        <p className="text-xs text-slate-500 tabular-nums">
                          {patient.age}y • {patient.gender}
                        </p>
                      </div>
                      <span className="text-xs font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                        {patient.patientId}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Layout Toggle */}
        <div className="hidden xl:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setDesktopLayout('split')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              desktopLayout === 'split'
                ? 'bg-white text-slate-900 border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns2 className="w-4 h-4" strokeWidth={1.5} />
            <span>Split Preview</span>
          </button>
          <button
            type="button"
            onClick={() => setDesktopLayout('two-col')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              desktopLayout === 'two-col'
                ? 'bg-white text-slate-900 border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
            <span>2-Col Builder</span>
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Switcher */}
      <div className="xl:hidden no-print grid grid-cols-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
        <button
          type="button"
          onClick={() => setMobileTab('builder')}
          className={`py-2 text-xs font-medium rounded-md transition-colors ${
            mobileTab === 'builder'
              ? 'bg-white text-slate-900 border border-slate-200'
              : 'text-slate-600'
          }`}
        >
          Treatment Builder
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`py-2 text-xs font-medium rounded-md transition-colors ${
            mobileTab === 'preview'
              ? 'bg-white text-slate-900 border border-slate-200'
              : 'text-slate-600'
          }`}
        >
          Live A4 Sheet
        </button>
      </div>

      {/* Main Split Studio */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Builder Column */}
        <div
          className={`no-print space-y-4 ${
            desktopLayout === 'two-col' ? 'xl:col-span-12' : 'xl:col-span-6'
          } ${mobileTab === 'builder' ? 'block' : 'hidden xl:block'}`}
        >
          {/* 1. Therapy Service Selection */}
          {loadedPlan ? (
            <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">Assigned Therapy Service</h3>
                {loadedPlan.isEdPlan && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                    <Lock className="w-3.5 h-3.5" strokeWidth={1.5} /> ED privacy group
                  </span>
                )}
              </div>
              <div className="p-3 bg-[#f0f9fa] border border-[#aee2e8] rounded-lg text-xs">
                <div className="font-semibold text-slate-900">{loadedPlan.therapySnapshot.name}</div>
                <div className="text-slate-600 mt-0.5">{loadedPlan.therapySnapshot.categoryName}</div>
              </div>
            </section>
          ) : (
            <TherapyCatalogSelectorPanel
              therapies={allCatalogTherapies}
              selectedTherapyId={selectedTherapyId}
              disabled={!isDoctor}
              onSelectTherapy={(t) => setSelectedTherapyId(t._id)}
            />
          )}

          {/* 2. Authorized Practitioner Selection Card Grid */}
          <section
            aria-label="Assigned practitioner"
            className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-semibold text-slate-900">Assigned Practitioner</h3>
              <span className="text-xs text-slate-500">
                {practitioners.length} authorized
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {practitioners.map((p) => {
                const isSelected = p._id === assignedPractitionerId;
                return (
                  <button
                    key={p._id}
                    type="button"
                    disabled={!isDoctor}
                    onClick={() => setAssignedPractitionerId(p._id)}
                    className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'border-[#007086] bg-[#f0f9fa] text-slate-900'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                    } ${!isDoctor ? 'opacity-85 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#007086] border-[#007086] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" strokeWidth={2.2} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-900 truncate">{p.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {p.designation || p.role}
                        {p.qualification ? ` • ${p.qualification}` : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. Clinical Parameters & Schedule Details */}
          <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Clinical Parameters &amp; Schedule
              </h3>
              {loadedPlan && isDoctor && (
                <select
                  value={planStatus}
                  onChange={(e) => setPlanStatus(e.target.value as TreatmentPlanStatus)}
                  aria-label="Plan status"
                  className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="FINALIZED">Finalized</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Treatment Objective
                </label>
                <textarea
                  rows={2}
                  disabled={!isDoctor}
                  value={treatmentObjective}
                  onChange={(e) => setTreatmentObjective(e.target.value)}
                  placeholder="Clinician-defined goal..."
                  className="w-full px-3 py-2 text-xs font-bengali bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086] disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Clinical Indication
                </label>
                <textarea
                  rows={2}
                  disabled={!isDoctor}
                  value={clinicalIndication}
                  onChange={(e) => setClinicalIndication(e.target.value)}
                  placeholder="Diagnosis / clinical context..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086] disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Planned sessions
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  disabled={!isDoctor}
                  value={plannedSessions}
                  onChange={(e) => setPlannedSessions(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg tabular-nums disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Session duration
                </label>
                <input
                  type="text"
                  disabled={!isDoctor}
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(e.target.value)}
                  placeholder="Optional (e.g. 30 min)"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Frequency</label>
                <input
                  type="text"
                  disabled={!isDoctor}
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Start date</label>
                <input
                  type="date"
                  disabled={!isDoctor}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg tabular-nums disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">End date</label>
                <input
                  type="date"
                  disabled={!isDoctor}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg tabular-nums disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Schedule summary
                </label>
                <input
                  type="text"
                  disabled={!isDoctor}
                  value={scheduleSummary}
                  onChange={(e) => setScheduleSummary(e.target.value)}
                  placeholder="Days / hours"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg disabled:bg-slate-50"
                />
              </div>
            </div>
          </section>

          {/* 4. Side-by-Side Precautions & Patient Instructions matching FoodChartStudio */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Contraindications &amp; Precautions
              </label>
              <textarea
                rows={4}
                disabled={!isDoctor}
                value={precautions}
                onChange={(e) => setPrecautions(e.target.value)}
                placeholder="Clinician-entered contraindications or safety precautions..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086] disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Patient Instructions (English / Bengali)
              </label>
              <textarea
                rows={4}
                disabled={!isDoctor}
                value={patientInstructions}
                onChange={(e) => setPatientInstructions(e.target.value)}
                placeholder="রোগীর জন্য থেরাপি-পূর্ব বা পরবর্তী নির্দেশনা..."
                className="w-full px-3 py-2 text-xs font-bengali bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086] disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* 5. Consent & Clinician Affirmation */}
          <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Patient Informed Consent
                </label>
                <select
                  value={consentStatus}
                  disabled={!isDoctor}
                  onChange={(e) => setConsentStatus(e.target.value as ConsentStatus)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg disabled:bg-slate-50"
                >
                  <option value="PENDING">Consent pending</option>
                  <option value="OBTAINED">Consent obtained</option>
                  <option value="DECLINED">Consent declined</option>
                  <option value="NOT_REQUIRED">Standard consent not required</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Consent Reference Note
                </label>
                <input
                  type="text"
                  disabled={!isDoctor}
                  value={consentNotes}
                  onChange={(e) => setConsentNotes(e.target.value)}
                  placeholder="Consent date / form reference"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg disabled:bg-slate-50"
                />
              </div>
            </div>

            <label className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isDoctor}
                checked={clinicianApprovalConfirmed}
                onChange={(e) => setClinicianApprovalConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#007086] focus:ring-[#007086]"
              />
              <span>
                I confirm clinical review and approval of this therapy plan for this patient.
              </span>
            </label>
          </section>

          {/* 6. Session Scheduling & Tracking Log */}
          {!loadedPlan && isDoctor ? (
            <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Initial Scheduled Sessions (Optional)
                </h3>
                <button
                  type="button"
                  onClick={() => setInitialSessionDates((prev) => [...prev, ''])}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#007086] hover:underline"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                  <span>Add session date</span>
                </button>
              </div>
              {initialSessionDates.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No sessions scheduled yet. You can add dates now or after saving the plan.
                </p>
              ) : (
                initialSessionDates.map((dt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500 w-7">#{idx + 1}</span>
                    <input
                      type="datetime-local"
                      value={dt}
                      onChange={(e) =>
                        setInitialSessionDates((prev) =>
                          prev.map((v, i) => (i === idx ? e.target.value : v))
                        )
                      }
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086] focus:border-[#007086] tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setInitialSessionDates((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="p-1.5 text-slate-500 hover:text-rose-700"
                      title="Remove row"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                ))
              )}
            </section>
          ) : loadedPlan ? (
            <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Treatment Sessions ({summary.total})
                  </h3>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {summary.completed} completed • {summary.scheduled} scheduled
                  </p>
                </div>

                {isDoctor &&
                  loadedPlan.status !== 'CANCELLED' &&
                  loadedPlan.status !== 'COMPLETED' && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewSessionDates(['']);
                        setIsScheduleModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#007086] hover:bg-[#065b6d] rounded-lg"
                    >
                      <CalendarPlus className="w-4 h-4" strokeWidth={1.5} />
                      <span>Schedule sessions</span>
                    </button>
                  )}
              </div>

              <div className="flex items-center gap-2">
                <ConsentStatusBadge status={loadedPlan.consentStatus} />
              </div>

              {sessions.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">No therapy sessions scheduled yet.</p>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                  {sessions.map((sess) => (
                    <div key={sess._id} className="p-3 space-y-1.5 text-xs bg-white">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          Session #{sess.sessionNumber}
                        </span>
                        <SessionStatusBadge status={sess.status} />
                      </div>
                      <p className="text-slate-600 tabular-nums">
                        {new Date(sess.scheduledAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        • {sess.assignedPractitionerName}
                      </p>
                      {sess.practitionerNotes && (
                        <p className="text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100">
                          Notes: {sess.practitionerNotes}
                        </p>
                      )}
                      {sess.patientFeedback && (
                        <p className="text-slate-700 font-bengali bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100">
                          Feedback: {sess.patientFeedback}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          v{sess.version}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingSession(sess)}
                            className="px-2.5 py-1 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 rounded-lg"
                          >
                            Update
                          </button>
                          {isDoctor && sess.status !== 'Completed' ? (
                            <button
                              type="button"
                              onClick={() => setDeletingSession(sess)}
                              className="p-1.5 text-slate-400 hover:text-rose-700 border border-slate-200 rounded-lg"
                              title="Remove scheduled session"
                            >
                              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                            </button>
                          ) : isDoctor ? (
                            <span
                              title="Completed sessions are locked against deletion"
                              className="p-1.5 text-slate-300"
                            >
                              <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </div>

        {/* Sticky Live A4 Sheet Column matching FoodChartStudio */}
        <div
          className={`treatment-plan-print-parent ${
            desktopLayout === 'two-col'
              ? 'hidden print:block'
              : 'xl:col-span-6 xl:sticky xl:top-20'
          } ${
            mobileTab === 'preview'
              ? 'block'
              : desktopLayout === 'split'
              ? 'hidden xl:block'
              : 'hidden'
          } print:!block print:!static print:!w-full`}
        >
          <div className="no-print flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-medium text-slate-600">
              Live A4 Treatment Plan Preview
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              {activeTherapyName || 'No therapy selected'}
            </span>
          </div>

          <div className="w-full overflow-x-auto bg-slate-100 border border-slate-200 rounded-xl p-2 sm:p-4 max-h-[82vh] overflow-y-auto print:bg-transparent print:border-none print:p-0 print:max-h-none print:overflow-visible">
            {previewNode}
          </div>
        </div>
      </div>

      {/* Preview Modal matching FoodChartStudio */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={`Treatment Plan Preview — ${chartNumberDisplay}`}
        subtitle={
          activePatient ? `${activePatient.name} (${activePatient.patientId})` : 'No patient selected'
        }
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 rounded-lg"
            >
              <Printer className="w-4 h-4" strokeWidth={1.5} /> Print
            </button>
            {loadedPlan && (
              <button
                type="button"
                disabled={isDownloadingPdf}
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#007086] hover:bg-[#065b6d] text-white rounded-lg disabled:opacity-50"
              >
                <Download className="w-4 h-4" strokeWidth={1.5} />
                <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
              </button>
            )}
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden">{previewNode}</div>
        </div>
      </Modal>

      {/* Finalize Plan Confirmation Modal matching FoodChartStudio */}
      <Modal
        isOpen={isFinalizeModalOpen}
        onClose={() => setIsFinalizeModalOpen(false)}
        title="Finalize Treatment Plan"
        subtitle="Confirm clinical approval & authorization"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <p className="font-semibold text-slate-900">Clinical Authorization Notice</p>
            <p className="leading-relaxed">
              Once finalized, this plan becomes an official authorized clinical therapy record
              ready for practitioner scheduling and patient A4 printout.
            </p>
          </div>
          <div className="space-y-1 tabular-nums">
            <p>
              Patient: <strong className="text-slate-900">{activePatient?.name || '—'}</strong>
            </p>
            <p>
              Therapy: <strong className="text-slate-900">{activeTherapyName || '—'}</strong>
            </p>
            <p>
              Practitioner:{' '}
              <strong className="text-slate-900">{selectedPractitioner?.name || '—'}</strong>
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsFinalizeModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() =>
                loadedPlan ? handleUpdateExisting('FINALIZED') : handleSaveNew('FINALIZED')
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#007086] hover:bg-[#065b6d] text-white rounded-lg disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
              <span>{isSaving ? 'Finalizing...' : 'Confirm & Finalize'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Schedule Additional Sessions Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Therapy Sessions"
        subtitle={loadedPlan ? `${loadedPlan.chartNumber} • ${loadedPlan.therapySnapshot.name}` : ''}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddSessionsSubmit} className="space-y-3">
          {newSessionDates.map((dt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="datetime-local"
                required
                value={dt}
                onChange={(e) =>
                  setNewSessionDates((prev) =>
                    prev.map((v, i) => (i === idx ? e.target.value : v))
                  )
                }
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg tabular-nums"
              />
              {newSessionDates.length > 1 && (
                <button
                  type="button"
                  onClick={() => setNewSessionDates((prev) => prev.filter((_, i) => i !== idx))}
                  className="p-1.5 text-slate-500 hover:text-rose-700"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setNewSessionDates((prev) => [...prev, ''])}
            className="text-xs font-medium text-[#007086] hover:underline"
          >
            + Add another date
          </button>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium text-white bg-[#007086] hover:bg-[#065b6d] rounded-lg disabled:opacity-50"
            >
              {isSaving ? 'Scheduling...' : 'Save sessions'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Scheduled Session Confirmation */}
      <Modal
        isOpen={Boolean(deletingSession)}
        onClose={() => setDeletingSession(null)}
        title="Remove Scheduled Session"
        subtitle={`Session #${deletingSession?.sessionNumber || ''}`}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <p>Are you sure you want to remove this scheduled session from the treatment plan?</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeletingSession(null)}
              className="px-3.5 py-2 font-medium border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteSessionConfirm}
              className="px-4 py-2 font-medium bg-rose-700 hover:bg-rose-800 text-white rounded-lg"
            >
              Remove session
            </button>
          </div>
        </div>
      </Modal>

      <SessionUpdateModal
        session={editingSession}
        isOpen={Boolean(editingSession)}
        onClose={() => setEditingSession(null)}
        onUpdated={() => {
          if (loadedPlan) loadPlanDetail(loadedPlan._id);
        }}
      />
    </div>
  );
};
