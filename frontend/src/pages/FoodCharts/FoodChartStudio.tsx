import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Columns2,
  Download,
  Eye,
  FilePlus2,
  GitBranch,
  History,
  LayoutGrid,
  Lock,
  Printer,
  Save,
  Search,
  Trash2,
  User,
} from 'lucide-react';
import { api, downloadApiFile } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/ui/Modal';
import { InfinityLoop } from '@/components/loading-ui/infinity';
import { FoodSectionPanel } from '../../components/food-chart/FoodSectionPanel';
import { SupplementEditor } from '../../components/food-chart/SupplementEditor';
import { FoodChartDocumentPreview } from '../../components/food-chart/FoodChartDocumentPreview';
import {
  DEFAULT_ALLOWED_CATALOG_FALLBACK,
  DEFAULT_AVOIDED_CATALOG_FALLBACK,
} from '../../constants/defaultFoodCatalog';
import {
  IFoodCatalogItem,
  IFoodChart,
  IFoodChartDoctorSnapshot,
  IFoodChartEntry,
  IFoodChartSupplement,
  IFoodChartVersionSummary,
  IPatient,
} from '../../types';

export const FoodChartStudio: React.FC = () => {
  const { id, patientId: routePatientId } = useParams<{ id?: string; patientId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { doctor, activeChamber } = useAuth();

  // Catalog State
  const [allowedCatalog, setAllowedCatalog] = useState<IFoodCatalogItem[]>([]);
  const [avoidedCatalog, setAvoidedCatalog] = useState<IFoodCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Patient Search / Selection State
  const [selectedPatient, setSelectedPatient] = useState<IPatient | null>(null);
  const [changingPatient, setChangingPatient] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<IPatient[]>([]);

  // Active Chart State (Clinical safety rule: starts completely empty on new charts)
  const [chartId, setChartId] = useState<string | null>(null);
  const loadedChartIdRef = useRef<string | null>(null);
  const [chartNumber, setChartNumber] = useState('FC-NEW-DRAFT');
  const [status, setStatus] = useState<'DRAFT' | 'FINALIZED'>('DRAFT');
  const [version, setVersion] = useState(1);
  const [chartDate, setChartDate] = useState<string | null>(null);
  const [doctorSnapshot, setDoctorSnapshot] = useState<IFoodChartDoctorSnapshot | null>(null);

  const [allowedFoods, setAllowedFoods] = useState<IFoodChartEntry[]>([]);
  const [avoidedFoods, setAvoidedFoods] = useState<IFoodChartEntry[]>([]);
  const [supplements, setSupplements] = useState<IFoodChartSupplement[]>([]);
  const [dietaryInstructions, setDietaryInstructions] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [versions, setVersions] = useState<IFoodChartVersionSummary[]>([]);

  // UI Layout & Feedback State
  const [desktopLayout, setDesktopLayout] = useState<'split' | 'two-col'>('split');
  const [mobileTab, setMobileTab] = useState<'builder' | 'preview'>('builder');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const isLocked = status === 'FINALIZED';
  const queryPatientId = searchParams.get('patientId') || routePatientId;

  const applyChartRecord = (c: IFoodChart) => {
    loadedChartIdRef.current = c._id;
    setChartId(c._id);
    setChartNumber(c.chartNumber);
    setStatus(c.status);
    setVersion(c.version);
    setChartDate(c.finalizedAt || c.createdAt);
    setDoctorSnapshot(c.doctorSnapshot || null);
    setAllowedFoods(c.allowedFoods || []);
    setAvoidedFoods(c.avoidedFoods || []);
    setSupplements(c.supplements || []);
    setDietaryInstructions(c.dietaryInstructions || '');
    setAdditionalNotes(c.additionalNotes || '');
    setSelectedPatient({
      _id: c.patientId,
      patientId: c.patientSnapshot?.patientId || '',
      doctorId: c.doctorId,
      name: c.patientSnapshot?.name || '',
      phone: c.patientSnapshot?.phone || '',
      age: c.patientSnapshot?.age || 0,
      gender: (c.patientSnapshot?.gender as any) || 'Other',
      allergies: [],
      medicalHistory: [],
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    });
    setChangingPatient(false);
  };

  const resetForBlankChart = (patientToKeep: IPatient | null) => {
    loadedChartIdRef.current = null;
    setChartId(null);
    setChartNumber('FC-NEW-DRAFT');
    setStatus('DRAFT');
    setVersion(1);
    setChartDate(null);
    setDoctorSnapshot(null);
    setAllowedFoods([]);
    setAvoidedFoods([]);
    setSupplements([]);
    setDietaryInstructions('');
    setAdditionalNotes('');
    setVersions([]);
    setSelectedPatient(patientToKeep);
    setChangingPatient(!patientToKeep);
    setErrorMessage(null);
    setStatusNotice(null);
  };

  // Load reference catalog + either existing chart or patient target
  useEffect(() => {
    // Avoid showing loading flash when saving/revising just updated state in-memory before URL changed
    if (id && loadedChartIdRef.current === id && allowedCatalog.length > 0) {
      return;
    }

    let active = true;
    const init = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        if (allowedCatalog.length === 0 && avoidedCatalog.length === 0) {
          try {
            const catRes = await api<{
              success: boolean;
              data: { allowed: IFoodCatalogItem[]; avoided: IFoodCatalogItem[] };
            }>('/food-charts/catalog');
            if (active && catRes.success && catRes.data) {
              setAllowedCatalog(
                catRes.data.allowed?.length ? catRes.data.allowed : DEFAULT_ALLOWED_CATALOG_FALLBACK
              );
              setAvoidedCatalog(
                catRes.data.avoided?.length ? catRes.data.avoided : DEFAULT_AVOIDED_CATALOG_FALLBACK
              );
            } else if (active) {
              setAllowedCatalog(DEFAULT_ALLOWED_CATALOG_FALLBACK);
              setAvoidedCatalog(DEFAULT_AVOIDED_CATALOG_FALLBACK);
            }
          } catch {
            if (active) {
              setAllowedCatalog(DEFAULT_ALLOWED_CATALOG_FALLBACK);
              setAvoidedCatalog(DEFAULT_AVOIDED_CATALOG_FALLBACK);
            }
          }
        }

        if (id) {
          const [chartRes, versionsRes] = await Promise.all([
            api<{ success: boolean; data: IFoodChart }>(`/food-charts/${id}`),
            api<{ success: boolean; data: IFoodChartVersionSummary[] }>(
              `/food-charts/${id}/versions`
            ).catch(() => ({ success: false, data: [] as IFoodChartVersionSummary[] })),
          ]);

          if (active && chartRes.success && chartRes.data) {
            applyChartRecord(chartRes.data);
          }

          if (active && versionsRes.success) {
            setVersions(versionsRes.data || []);
          }
        } else {
          let initialPatient: IPatient | null = null;
          if (queryPatientId) {
            const pRes = await api<{ success: boolean; data: IPatient }>(
              `/patients/${queryPatientId}`
            ).catch(() => null);
            if (pRes?.success && pRes.data) {
              initialPatient = pRes.data;
            }
          }
          if (active) {
            resetForBlankChart(initialPatient);
          }
        }
      } catch (err: any) {
        if (active) {
          setErrorMessage(err?.message || 'Failed to load food chart workspace.');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    init();
    return () => {
      active = false;
    };
  }, [id, queryPatientId]);

  // Doctor-scoped Patient Search for Patient Strip
  useEffect(() => {
    if (!changingPatient && selectedPatient) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await api<{ success: boolean; data: { patients: IPatient[] } }>(
          `/patients?search=${encodeURIComponent(patientSearch)}&limit=10`
        );
        if (active && res.success && res.data) {
          setPatientResults(res.data.patients || []);
        }
      } catch {
        if (active) setPatientResults([]);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [patientSearch, changingPatient, selectedPatient]);

  const toggleCatalogItem = (section: 'allowed' | 'avoided', item: IFoodCatalogItem) => {
    if (isLocked) return;
    const setter = section === 'allowed' ? setAllowedFoods : setAvoidedFoods;
    setter((prev) => {
      const existsIdx = prev.findIndex(
        (entry) =>
          entry.catalogItemId === item._id ||
          (!entry.isCustom && entry.labelBn.trim() === item.labelBn.trim())
      );
      if (existsIdx >= 0) {
        return prev
          .filter((_, idx) => idx !== existsIdx)
          .map((entry, idx) => ({ ...entry, order: idx }));
      }
      return [
        ...prev,
        {
          catalogItemId: /^[a-f0-9]{24}$/i.test(item._id) ? item._id : null,
          labelBn: item.labelBn,
          category: item.category,
          isCustom: false,
          order: prev.length,
        },
      ];
    });
  };

  const addCustomFoodItem = (
    section: 'allowed' | 'avoided',
    custom: { labelBn: string; portion?: string; timing?: string; prepNote?: string }
  ) => {
    if (isLocked) return;
    const setter = section === 'allowed' ? setAllowedFoods : setAvoidedFoods;
    setter((prev) => [
      ...prev,
      {
        catalogItemId: null,
        labelBn: custom.labelBn,
        category: 'Custom',
        isCustom: true,
        portion: custom.portion,
        timing: custom.timing,
        prepNote: custom.prepNote,
        order: prev.length,
      },
    ]);
  };

  const removeFoodAtIndex = (section: 'allowed' | 'avoided', index: number) => {
    if (isLocked) return;
    const setter = section === 'allowed' ? setAllowedFoods : setAvoidedFoods;
    setter((prev) =>
      prev.filter((_, idx) => idx !== index).map((entry, idx) => ({ ...entry, order: idx }))
    );
  };

  const saveDraftOrFinal = async (targetStatus: 'DRAFT' | 'FINALIZED'): Promise<IFoodChart | null> => {
    setErrorMessage(null);
    setStatusNotice(null);

    if (!selectedPatient) {
      setIsFinalizeModalOpen(false);
      setErrorMessage('Select a patient before saving this food chart.');
      return null;
    }

    setIsSaving(true);
    try {
      const payload = {
        patientId: selectedPatient._id,
        chamberId: activeChamber?._id || null,
        allowedFoods,
        avoidedFoods,
        supplements,
        dietaryInstructions,
        additionalNotes,
        status: targetStatus,
      };

      const res = chartId
        ? await api<{ success: boolean; data: IFoodChart }>(`/food-charts/${chartId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })
        : await api<{ success: boolean; data: IFoodChart }>('/food-charts', {
            method: 'POST',
            body: JSON.stringify(payload),
          });

      if (res.success && res.data) {
        const saved = res.data;
        loadedChartIdRef.current = saved._id;
        setChartId(saved._id);
        setChartNumber(saved.chartNumber);
        setStatus(saved.status);
        setVersion(saved.version);
        setChartDate(saved.finalizedAt || saved.updatedAt);
        setDoctorSnapshot(saved.doctorSnapshot || null);
        setIsFinalizeModalOpen(false);
        setStatusNotice(
          saved.status === 'FINALIZED' ? 'Chart finalized and locked' : 'Draft saved'
        );

        const vRes = await api<{ success: boolean; data: IFoodChartVersionSummary[] }>(
          `/food-charts/${saved._id}/versions`
        ).catch(() => null);
        if (vRes?.success) {
          setVersions(vRes.data || []);
        }

        if (!id || id !== saved._id) {
          navigate(`/food-charts/${saved._id}`, { replace: true });
        }
        return saved;
      }
      return null;
    } catch (err: any) {
      setIsFinalizeModalOpen(false);
      setErrorMessage(err?.message || 'Unable to save food chart.');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    setErrorMessage(null);
    if (!selectedPatient) {
      setErrorMessage('Select a patient first to generate a food chart PDF.');
      return;
    }

    setIsDownloadingPdf(true);
    try {
      let targetId = chartId;
      let targetChartNumber = chartNumber;
      let targetDate = chartDate;

      if (!targetId || status === 'DRAFT') {
        const saved = await saveDraftOrFinal('DRAFT');
        if (!saved) return;
        targetId = saved._id;
        targetChartNumber = saved.chartNumber;
        targetDate = saved.finalizedAt || saved.createdAt;
      }

      const datePart = (targetDate || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
      const fallbackFilename = `Food-Chart-${selectedPatient.patientId || targetChartNumber}-${datePart}.pdf`;
      await downloadApiFile(`/food-charts/${targetId}/pdf`, fallbackFilename);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to download food chart PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCreateRevision = async () => {
    if (!chartId) return;
    setErrorMessage(null);
    setIsSaving(true);
    try {
      const res = await api<{ success: boolean; data: IFoodChart }>(
        `/food-charts/${chartId}/revise`,
        { method: 'POST' }
      );
      if (res.success && res.data) {
        const revised = res.data;
        applyChartRecord(revised);
        setStatusNotice(`Revision v${revised.version} created`);
        const vRes = await api<{ success: boolean; data: IFoodChartVersionSummary[] }>(
          `/food-charts/${revised._id}/versions`
        ).catch(() => null);
        if (vRes?.success) {
          setVersions(vRes.data || []);
        }
        navigate(`/food-charts/${revised._id}`);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to create new revision.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!chartId || isLocked) return;
    setErrorMessage(null);
    setIsSaving(true);
    try {
      await api(`/food-charts/${chartId}`, { method: 'DELETE' });
      setIsDeleteModalOpen(false);
      navigate('/food-charts');
    } catch (err: any) {
      setIsDeleteModalOpen(false);
      setErrorMessage(err?.message || 'Unable to delete draft.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const previewNode = useMemo(
    () => (
      <FoodChartDocumentPreview
        doctor={doctor}
        chamber={activeChamber}
        doctorSnapshot={doctorSnapshot}
        patient={selectedPatient}
        chartNumber={chartNumber}
        status={status}
        version={version}
        date={chartDate}
        allowedFoods={allowedFoods}
        avoidedFoods={avoidedFoods}
        supplements={supplements}
        dietaryInstructions={dietaryInstructions}
        additionalNotes={additionalNotes}
      />
    ),
    [
      doctor,
      activeChamber,
      doctorSnapshot,
      selectedPatient,
      chartNumber,
      status,
      version,
      chartDate,
      allowedFoods,
      avoidedFoods,
      supplements,
      dietaryInstructions,
      additionalNotes,
    ]
  );

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <InfinityLoop className="w-16 h-8 text-[#007086]" duration="1.8s" strokeWidth={5.5} />
        <p className="text-xs text-slate-500">Loading Food Chart Studio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1440px] mx-auto pb-10">
      {/* Quiet Single-Line Top Bar */}
      <div className="no-print bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 flex flex-wrap xl:flex-nowrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/food-charts')}
            aria-label="Back to Food Charts"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-sm sm:text-base font-semibold text-slate-900 whitespace-nowrap">
                Patient Food Chart
              </h1>
              <span className="font-bengali text-sm font-medium text-[#007086] whitespace-nowrap">
                রোগীর খাদ্য তালিকা
              </span>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded border tabular-nums whitespace-nowrap ${
                  isLocked
                    ? 'bg-[#f0f9fa] border-[#aee2e8] text-[#065b6d]'
                    : 'bg-slate-100 border-slate-300 text-slate-700'
                }`}
              >
                {status} • v{version}
              </span>
              <span className="text-xs font-mono font-semibold text-slate-600 tabular-nums whitespace-nowrap">
                {chartNumber}
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

          <button
            type="button"
            disabled={isDownloadingPdf || isSaving || !selectedPatient}
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" strokeWidth={1.5} />
            <span>{isDownloadingPdf ? 'PDF...' : 'Download PDF'}</span>
          </button>

          {isLocked ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleCreateRevision}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#007086] hover:bg-[#065b6d] text-white rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <GitBranch className="w-4 h-4" strokeWidth={1.5} />
              <span>Edit as New Revision</span>
            </button>
          ) : (
            <>
              {chartId && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsDeleteModalOpen(true)}
                  aria-label="Delete draft"
                  title="Delete draft"
                  className="inline-flex items-center justify-center p-1.5 text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg disabled:opacity-50 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}

              <button
                type="button"
                disabled={isSaving || !selectedPatient}
                onClick={() => saveDraftOrFinal('DRAFT')}
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
                <span>Finalize Chart</span>
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

      {isLocked && (
        <div className="no-print p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#007086] shrink-0" strokeWidth={1.5} />
            <span>
              This chart is finalized and locked as an immutable record. Click{' '}
              <strong>Edit as New Revision</strong> to create draft v{version + 1}.
            </span>
          </div>
        </div>
      )}

      {/* Patient Strip + Desktop Layout Toggle */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {selectedPatient && !changingPatient ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  <User className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedPatient.name}
                    </span>
                    <span className="text-xs font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded tabular-nums">
                      {selectedPatient.patientId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {selectedPatient.age} yrs • {selectedPatient.gender}
                    {selectedPatient.phone ? ` • ${selectedPatient.phone}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!chartId && (
                  <button
                    type="button"
                    onClick={() => setChangingPatient(true)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
                  >
                    Change patient
                  </button>
                )}
                {chartId && (
                  <button
                    type="button"
                    onClick={() => navigate('/food-charts/new')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#007086] bg-[#f0f9fa] border border-[#aee2e8] hover:bg-[#d5f0f3] rounded-lg"
                  >
                    <FilePlus2 className="w-4 h-4" strokeWidth={1.5} />
                    <span>Create New Chart</span>
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

      {/* Mobile / Tablet View Switcher (< xl) */}
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
          Food Chart Builder
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

      {/* Main Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Builder Column */}
        <div
          className={`no-print space-y-4 ${
            desktopLayout === 'two-col' ? 'xl:col-span-12' : 'xl:col-span-6'
          } ${mobileTab === 'builder' ? 'block' : 'hidden xl:block'}`}
        >
          <div
            className={`grid grid-cols-1 gap-4 ${
              desktopLayout === 'two-col' ? 'lg:grid-cols-2' : ''
            }`}
          >
            <FoodSectionPanel
              variant="allowed"
              title="Allowed Foods"
              titleBn="অনুমোদিত খাবার"
              catalogItems={allowedCatalog}
              selectedItems={allowedFoods}
              disabled={isLocked}
              onToggleCatalogItem={(item) => toggleCatalogItem('allowed', item)}
              onAddCustomItem={(entry) => addCustomFoodItem('allowed', entry)}
              onRemoveSelectedByIndex={(idx) => removeFoodAtIndex('allowed', idx)}
            />

            <FoodSectionPanel
              variant="avoided"
              title="Avoided Foods"
              titleBn="এড়িয়ে চলার খাবার"
              catalogItems={avoidedCatalog}
              selectedItems={avoidedFoods}
              disabled={isLocked}
              onToggleCatalogItem={(item) => toggleCatalogItem('avoided', item)}
              onAddCustomItem={(entry) => addCustomFoodItem('avoided', entry)}
              onRemoveSelectedByIndex={(idx) => removeFoodAtIndex('avoided', idx)}
            />
          </div>

          <SupplementEditor
            supplements={supplements}
            disabled={isLocked}
            onChange={setSupplements}
          />

          {/* Side-by-Side Dietary Instructions & Additional Notes */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="dietary-instructions"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                Doctor&apos;s Dietary Instructions
              </label>
              <textarea
                id="dietary-instructions"
                rows={4}
                disabled={isLocked}
                value={dietaryInstructions}
                onChange={(e) => setDietaryInstructions(e.target.value)}
                placeholder="Write patient-specific meal timing or preparation advice..."
                className="w-full px-3 py-2 text-xs font-bengali bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086] disabled:bg-slate-50"
              />
            </div>

            <div>
              <label
                htmlFor="additional-notes"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                Additional Notes
              </label>
              <textarea
                id="additional-notes"
                rows={4}
                disabled={isLocked}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Optional hydration, allergen precautions, or follow-up notes..."
                className="w-full px-3 py-2 text-xs font-bengali bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086] disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* Chart History & Versions */}
          {versions.length > 0 && (
            <section
              aria-label="Chart history and versions"
              className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <History className="w-4 h-4 text-slate-600" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold text-slate-900">
                  Chart History &amp; Versions
                </h3>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                {versions.map((v) => {
                  const isCurrent = v._id === chartId;
                  return (
                    <div
                      key={v._id}
                      className={`p-3 flex flex-wrap items-center justify-between gap-2 text-xs ${
                        isCurrent ? 'bg-[#f0f9fa]' : 'bg-white'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-900 tabular-nums">
                            v{v.version} • {v.chartNumber}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-xs font-medium rounded border ${
                              v.status === 'FINALIZED'
                                ? 'bg-white border-[#aee2e8] text-[#065b6d]'
                                : 'bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            {v.status}
                          </span>
                          {isCurrent && (
                            <span className="text-xs font-medium text-[#007086]">Current</span>
                          )}
                        </div>
                        <p className="text-slate-500 tabular-nums">
                          {new Date(v.finalizedAt || v.createdAt).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      {!isCurrent && (
                        <Link
                          to={`/food-charts/${v._id}`}
                          className="px-3 py-1.5 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg"
                        >
                          Open v{v.version}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Sticky Live A4 Hospital Food Chart Preview Column */}
        <div
          className={`food-chart-print-parent ${
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
              Live A4 Hospital Food Chart Preview
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              {allowedFoods.length} allowed • {avoidedFoods.length} avoided
            </span>
          </div>

          <div className="w-full overflow-x-auto bg-slate-100 border border-slate-200 rounded-xl p-2 sm:p-4 max-h-[82vh] overflow-y-auto print:bg-transparent print:border-none print:p-0 print:max-h-none print:overflow-visible">
            {previewNode}
          </div>
        </div>
      </div>

      {/* Full Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={`Food Chart Preview — ${chartNumber}`}
        subtitle={
          selectedPatient
            ? `${selectedPatient.name} (${selectedPatient.patientId})`
            : 'No patient selected'
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
            <button
              type="button"
              disabled={isDownloadingPdf || !selectedPatient}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#007086] hover:bg-[#065b6d] text-white rounded-lg disabled:opacity-50"
            >
              <Download className="w-4 h-4" strokeWidth={1.5} />
              <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden">{previewNode}</div>
        </div>
      </Modal>

      {/* Finalize Chart Confirmation Modal */}
      <Modal
        isOpen={isFinalizeModalOpen}
        onClose={() => setIsFinalizeModalOpen(false)}
        title="Finalize Food Chart"
        subtitle="Confirm permanent locking of clinical food chart"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1">
            <p className="font-semibold text-slate-900">Record Immutability Notice</p>
            <p className="leading-relaxed">
              Once finalized, this food chart cannot be edited or deleted directly. Any subsequent
              updates will create a numbered revision (v{version + 1}) while preserving this
              version verbatim.
            </p>
          </div>

          <div className="text-xs text-slate-700 space-y-1 tabular-nums">
            <p>
              Patient: <strong className="text-slate-900">{selectedPatient?.name}</strong>
            </p>
            <p>
              Allowed foods: <strong className="text-slate-900">{allowedFoods.length}</strong> •
              Avoided foods: <strong className="text-slate-900">{avoidedFoods.length}</strong>
            </p>
            <p>
              Supplements: <strong className="text-slate-900">{supplements.length}</strong>
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
              onClick={() => saveDraftOrFinal('FINALIZED')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#007086] hover:bg-[#065b6d] text-white rounded-lg disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
              <span>{isSaving ? 'Finalizing...' : 'Confirm & Finalize'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Draft Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Food Chart Draft"
        subtitle={`Chart ${chartNumber}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-700 leading-relaxed">
            Are you sure you want to delete this draft food chart? This action removes the
            unpublished draft permanently.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleDeleteDraft}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-rose-700 hover:bg-rose-800 text-white rounded-lg disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              <span>{isSaving ? 'Deleting...' : 'Confirm Delete'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
