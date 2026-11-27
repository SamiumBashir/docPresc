import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Lock,
  Plus,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { InfinityLoop } from '@/components/loading-ui/infinity';
import { therapyApi } from '../../services/endpoints/therapy.api';
import {
  ConsentStatusBadge,
  PlanStatusBadge,
  SessionStatusBadge,
  VerificationBadge,
} from '../../components/therapy/VerificationBadge';
import { formatTherapyIndexLabel } from '../../constants/defaultTherapyCatalog';
import { SessionUpdateModal } from '../../components/therapy/SessionUpdateModal';
import {
  ITherapy,
  ITherapyCategory,
  ITherapySession,
  ITreatmentPlan,
  TherapySessionStatus,
  TreatmentPlanStatus,
} from '../../types';

interface TherapyWorkspaceProps {
  initialTab?: 'plans' | 'sessions' | 'catalog';
}

const normalizeApiError = (err: any, fallback: string): string => {
  const msg = String(err?.message || '');
  if (err?.code === 'ROUTE_NOT_FOUND' || msg.includes('not found')) {
    return 'Therapy API endpoint was not found on the connected backend server. If running locally, restart the backend server; if using production preview, push and deploy the updated backend first.';
  }
  return msg || fallback;
};

export const TherapyWorkspace: React.FC<TherapyWorkspaceProps> = ({ initialTab = 'plans' }) => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const isStaff = user?.role === 'staff';
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'plans' | 'sessions' | 'catalog'>(initialTab);
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Plans Tab State (matches FoodChartDirectory cleanly)
  const [plans, setPlans] = useState<ITreatmentPlan[]>([]);
  const [planPage, setPlanPage] = useState(1);
  const [planTotalPages, setPlanTotalPages] = useState(1);
  const [planTotal, setPlanTotal] = useState(0);
  const [planSearch, setPlanSearch] = useState('');
  const [planStatus, setPlanStatus] = useState<'ALL' | TreatmentPlanStatus>('ALL');
  const [edFilter, setEdFilter] = useState<'ALL' | 'MAIN' | 'ED'>('ALL');
  const [plansLoading, setPlansLoading] = useState(true);
  const [downloadingPlanId, setDownloadingPlanId] = useState<string | null>(null);

  // Sessions Tab State
  const [sessions, setSessions] = useState<ITherapySession[]>([]);
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionTotalPages, setSessionTotalPages] = useState(1);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [sessionStatusFilter, setSessionStatusFilter] = useState<'ALL' | TherapySessionStatus>('ALL');
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [editingSession, setEditingSession] = useState<ITherapySession | null>(null);

  // Catalog Tab State
  const [catalogItems, setCatalogItems] = useState<ITherapy[]>([]);
  const [categories, setCategories] = useState<ITherapyCategory[]>([]);
  const [catalogSection, setCatalogSection] = useState<'all' | 'main' | 'ed'>('all');
  const [catalogCategoryId, setCatalogCategoryId] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [onlyApproved, setOnlyApproved] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load Plans
  useEffect(() => {
    if (activeTab !== 'plans') return;
    if (isAdmin) {
      setPlansLoading(false);
      setPlans([]);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setPlansLoading(true);
      setErrorMessage(null);
      try {
        const res = await therapyApi.getTreatmentPlans({
          page: planPage,
          limit: 12,
          status: planStatus !== 'ALL' ? planStatus : undefined,
          isEdPlan: edFilter === 'ED' ? true : edFilter === 'MAIN' ? false : undefined,
          search: planSearch,
        });
        if (active) {
          setPlans(res.plans || []);
          setPlanTotalPages(res.pagination?.totalPages || 1);
          setPlanTotal(res.pagination?.total || 0);
        }
      } catch (err: any) {
        if (active) {
          setErrorMessage(normalizeApiError(err, 'Unable to load treatment plans.'));
          setPlans([]);
        }
      } finally {
        if (active) setPlansLoading(false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [activeTab, isAdmin, planPage, planStatus, edFilter, planSearch]);

  // Load Sessions
  const loadSessions = useCallback(async () => {
    if (isAdmin) {
      setSessionsLoading(false);
      setSessions([]);
      return;
    }
    setSessionsLoading(true);
    setErrorMessage(null);
    try {
      const res = await therapyApi.getSessions({
        page: sessionPage,
        limit: 20,
        status: sessionStatusFilter !== 'ALL' ? sessionStatusFilter : undefined,
      });
      setSessions(res.sessions || []);
      setSessionTotalPages(res.pagination?.totalPages || 1);
      setSessionTotal(res.pagination?.total || 0);
    } catch (err: any) {
      setErrorMessage(normalizeApiError(err, 'Unable to load therapy sessions.'));
    } finally {
      setSessionsLoading(false);
    }
  }, [isAdmin, sessionPage, sessionStatusFilter]);

  useEffect(() => {
    if (activeTab === 'sessions') {
      loadSessions();
    }
  }, [activeTab, loadSessions]);

  // Load Service Catalog
  useEffect(() => {
    if (activeTab !== 'catalog') return;
    let active = true;
    const timer = setTimeout(async () => {
      setCatalogLoading(true);
      setErrorMessage(null);
      try {
        const res = await therapyApi.getCatalog({
          section: catalogSection,
          categoryId: catalogCategoryId || undefined,
          verificationStatus: onlyApproved ? 'APPROVED' : undefined,
          isActive: onlyApproved ? true : undefined,
          search: catalogSearch,
          limit: 200,
        });
        if (active) {
          setCatalogItems(res.therapies || []);
          setCategories(res.categories || []);
        }
      } catch (err: any) {
        if (active) {
          setErrorMessage(normalizeApiError(err, 'Unable to load therapy catalog.'));
        }
      } finally {
        if (active) setCatalogLoading(false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [activeTab, catalogSection, catalogCategoryId, catalogSearch, onlyApproved]);

  const handleDownloadPdf = async (plan: ITreatmentPlan) => {
    setErrorMessage(null);
    setDownloadingPlanId(plan._id);
    try {
      await therapyApi.downloadTreatmentPlanPdf(plan);
    } catch (err: any) {
      setErrorMessage(normalizeApiError(err, 'Failed to generate Treatment Plan PDF.'));
    } finally {
      setDownloadingPlanId(null);
    }
  };

  const headerSubtitle =
    activeTab === 'sessions'
      ? `${sessionTotal} ${sessionTotal === 1 ? 'session' : 'sessions'} scheduled`
      : activeTab === 'catalog'
      ? `${catalogItems.length} clinical therapy modalities in catalog`
      : `${planTotal} ${planTotal === 1 ? 'treatment plan' : 'treatment plans'} in your directory`;

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Clean Bilingual Header matching FoodChartDirectory */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-lg font-semibold text-slate-900">
              {isStaff ? 'Assigned Therapy Schedule' : 'Patient Treatment Plans'}
            </h1>
            <span className="font-bengali text-sm font-medium text-[#007086]">
              রোগীর থেরাপি ও চিকিৎসা তালিকা
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">{headerSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Sub-navigation switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {!isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('plans')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'plans'
                      ? 'bg-white text-slate-900 border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Plans
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('sessions')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === 'sessions'
                      ? 'bg-white text-slate-900 border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sessions
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'catalog'
                  ? 'bg-white text-slate-900 border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Service Catalog
            </button>
          </div>

          {isAdmin && (
            <Link
              to="/admin/therapies"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#007086] hover:bg-[#065b6d] text-white text-xs font-medium rounded-lg transition-colors"
            >
              <ShieldAlert className="w-4 h-4" strokeWidth={1.5} />
              <span>Admin Governance</span>
            </Link>
          )}

          {isDoctor && (
            <Link
              to="/therapies/plans/new"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#007086] hover:bg-[#065b6d] text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              <span>New Treatment Plan</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filters Row matching FoodChartDirectory */}
      {activeTab === 'plans' && !isAdmin && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              strokeWidth={1.5}
            />
            <input
              type="text"
              value={planSearch}
              onChange={(e) => {
                setPlanSearch(e.target.value);
                setPlanPage(1);
              }}
              placeholder="Search by plan number, patient name, or therapy..."
              aria-label="Search treatment plans"
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={edFilter}
              onChange={(e) => {
                setEdFilter(e.target.value as 'ALL' | 'MAIN' | 'ED');
                setPlanPage(1);
              }}
              aria-label="Filter category group"
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#007086]"
            >
              <option value="ALL">All Categories</option>
              <option value="MAIN">Main &amp; Custom</option>
              <option value="ED">ED Treatments</option>
            </select>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              {(['ALL', 'DRAFT', 'FINALIZED', 'ACTIVE', 'COMPLETED'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setPlanStatus(status);
                    setPlanPage(1);
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    planStatus === status
                      ? 'bg-white text-slate-900 border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status === 'ALL'
                    ? 'All'
                    : status === 'DRAFT'
                    ? 'Draft'
                    : status === 'FINALIZED'
                    ? 'Finalized'
                    : status === 'ACTIVE'
                    ? 'Active'
                    : 'Completed'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sessions' && !isAdmin && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-600">
            Completed therapy sessions are preserved permanently in clinical history.
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {(['ALL', 'Scheduled', 'Completed', 'Rescheduled', 'Missed', 'Cancelled'] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setSessionStatusFilter(st);
                    setSessionPage(1);
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    sessionStatusFilter === st
                      ? 'bg-white text-slate-900 border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {activeTab === 'catalog' && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              strokeWidth={1.5}
            />
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Search therapy modalities..."
              aria-label="Search therapy catalog"
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              {(['all', 'main', 'ed'] as const).map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    setCatalogSection(sec);
                    setCatalogCategoryId('');
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    catalogSection === sec
                      ? 'bg-white text-slate-900 border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sec === 'all' ? 'All Groups' : sec === 'main' ? 'Main Treatments' : 'ED Treatments'}
                </button>
              ))}
            </div>

            {categories.length > 0 && (
              <select
                value={catalogCategoryId}
                onChange={(e) => setCatalogCategoryId(e.target.value)}
                aria-label="Filter catalog category"
                className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-700"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}

            <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 px-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyApproved}
                onChange={(e) => setOnlyApproved(e.target.checked)}
                className="rounded border-slate-300 text-[#007086] focus:ring-[#007086]"
              />
              <span>Approved only</span>
            </label>
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800"
        >
          {errorMessage}
        </div>
      )}

      {/* DIRECTORY 1: TREATMENT PLANS */}
      {activeTab === 'plans' && !isAdmin && (
        <>
          {plansLoading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center gap-3">
              <InfinityLoop className="w-16 h-8 text-[#007086]" duration="1.8s" strokeWidth={5.5} />
              <p className="text-xs text-slate-500">Loading patient treatment plans...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-800">No treatment plans found</p>
                <p className="text-xs text-slate-500">
                  {isStaff
                    ? 'Assigned patient treatment plans will appear here when scheduled by a doctor.'
                    : 'Create an individualized treatment plan for a patient or adjust your search filter.'}
                </p>
              </div>
              {isDoctor && (
                <Link
                  to="/therapies/plans/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#007086] hover:bg-[#065b6d] text-white rounded-lg"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                  Create Treatment Plan
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Plan No</th>
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Therapy Service</th>
                      <th className="py-3 px-4">Practitioner &amp; Consent</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {plans.map((plan) => (
                      <tr key={plan._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          <Link
                            to={`/therapies/plans/${plan._id}`}
                            className="hover:text-[#007086] transition-colors"
                          >
                            {plan.chartNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">{plan.patientSnapshot?.name}</p>
                          <p className="text-slate-500 font-mono tabular-nums">
                            {plan.patientSnapshot?.patientId} • {plan.patientSnapshot?.age}y{' '}
                            {plan.patientSnapshot?.gender}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          {(() => {
                            const list =
                              plan.therapySnapshots && plan.therapySnapshots.length > 0
                                ? plan.therapySnapshots
                                : [plan.therapySnapshot];
                            const cats = Array.from(
                              new Set(list.map((t) => t?.categoryName).filter(Boolean))
                            );
                            return (
                              <>
                                <p className="font-medium text-slate-900">
                                  {list.map((t) => t?.name).filter(Boolean).join(', ')}
                                </p>
                                <p className="text-slate-500 flex items-center gap-1.5">
                                  <span>{cats.join(', ')}</span>
                                  {plan.isEdPlan && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                                      <Lock className="w-3.5 h-3.5" strokeWidth={1.5} /> ED group
                                    </span>
                                  )}
                                </p>
                              </>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-4 space-y-1">
                          <p className="text-slate-700">{plan.practitionerSnapshot?.name}</p>
                          <ConsentStatusBadge status={plan.consentStatus} />
                        </td>
                        <td className="py-3 px-4">
                          <PlanStatusBadge status={plan.status} />
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              to={`/therapies/plans/${plan._id}`}
                              className="px-3 py-1.5 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-colors"
                            >
                              {plan.status === 'DRAFT' && isDoctor ? 'Edit' : 'Open'}
                            </Link>
                            <button
                              type="button"
                              disabled={downloadingPlanId === plan._id}
                              onClick={() => handleDownloadPdf(plan)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 rounded-lg disabled:opacity-50"
                            >
                              <Download className="w-4 h-4" strokeWidth={1.5} />
                              <span>{downloadingPlanId === plan._id ? 'PDF...' : 'PDF'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Cards matching FoodChartDirectory */}
              <div className="md:hidden divide-y divide-slate-200">
                {plans.map((plan) => (
                  <div key={plan._id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={`/therapies/plans/${plan._id}`}
                          className="text-xs font-mono font-semibold text-slate-900 tabular-nums"
                        >
                          {plan.chartNumber}
                        </Link>
                        <p className="text-sm font-medium text-slate-900 mt-0.5">
                          {plan.patientSnapshot?.name}
                        </p>
                        <p className="text-xs text-slate-500 font-mono tabular-nums">
                          {plan.patientSnapshot?.patientId}
                        </p>
                      </div>
                      <PlanStatusBadge status={plan.status} />
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      {(plan.therapySnapshots && plan.therapySnapshots.length > 0
                        ? plan.therapySnapshots.map((t) => t?.name).filter(Boolean).join(', ')
                        : plan.therapySnapshot?.name) || 'Therapy'}{' '}
                      • {plan.practitionerSnapshot?.name}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        to={`/therapies/plans/${plan._id}`}
                        className="flex-1 text-center px-3 py-2 text-xs font-medium border border-slate-300 bg-white text-slate-800 rounded-lg"
                      >
                        Open Plan
                      </Link>
                      <button
                        type="button"
                        disabled={downloadingPlanId === plan._id}
                        onClick={() => handleDownloadPdf(plan)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-300 bg-white text-slate-800 rounded-lg disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" strokeWidth={1.5} />
                        <span>{downloadingPlanId === plan._id ? 'PDF...' : 'PDF'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {planTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
                  <span className="tabular-nums">
                    Page {planPage} of {planTotalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={planPage <= 1}
                      onClick={() => setPlanPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 bg-white rounded-lg disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" strokeWidth={1.5} /> Previous
                    </button>
                    <button
                      type="button"
                      disabled={planPage >= planTotalPages}
                      onClick={() => setPlanPage((p) => Math.min(planTotalPages, p + 1))}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 bg-white rounded-lg disabled:opacity-40"
                    >
                      Next <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* DIRECTORY 2: SESSIONS TRACKER */}
      {activeTab === 'sessions' && !isAdmin && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {sessionsLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <InfinityLoop className="w-16 h-8 text-[#007086]" duration="1.8s" strokeWidth={5.5} />
              <p className="text-xs text-slate-500">Loading therapy sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              No therapy sessions match this filter.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-3 px-4">Session</th>
                      <th className="py-3 px-4">Scheduled Date</th>
                      <th className="py-3 px-4">Patient &amp; Therapy</th>
                      <th className="py-3 px-4">Practitioner</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Notes &amp; Feedback</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sessions.map((sess) => {
                      const planObj =
                        typeof sess.treatmentPlanId === 'object' ? sess.treatmentPlanId : null;
                      return (
                        <tr key={sess._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-mono font-semibold text-slate-900 tabular-nums">
                              #{sess.sessionNumber}
                            </div>
                            {planObj?.chartNumber && (
                              <Link
                                to={`/therapies/plans/${planObj._id}`}
                                className="text-[11px] font-mono text-[#007086] hover:underline"
                              >
                                {planObj.chartNumber}
                              </Link>
                            )}
                          </td>
                          <td className="py-3 px-4 tabular-nums whitespace-nowrap text-slate-700">
                            {new Date(sess.scheduledAt).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-900">
                              {planObj?.patientSnapshot?.name || 'Patient'}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {(planObj?.therapySnapshots && planObj.therapySnapshots.length > 0
                                ? planObj.therapySnapshots.map((t) => t?.name).filter(Boolean).join(', ')
                                : planObj?.therapySnapshot?.name) || 'Therapy'}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {sess.assignedPractitionerName}
                          </td>
                          <td className="py-3 px-4">
                            <SessionStatusBadge status={sess.status} />
                          </td>
                          <td className="py-3 px-4 max-w-xs text-slate-600 font-bengali">
                            {[sess.practitionerNotes, sess.patientFeedback]
                              .filter(Boolean)
                              .join(' • ') || '—'}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setEditingSession(sess)}
                              className="px-3 py-1.5 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 rounded-lg"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {sessionTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
                  <span className="tabular-nums">
                    Page {sessionPage} of {sessionTotalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={sessionPage <= 1}
                      onClick={() => setSessionPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 bg-white rounded-lg disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" strokeWidth={1.5} /> Previous
                    </button>
                    <button
                      type="button"
                      disabled={sessionPage >= sessionTotalPages}
                      onClick={() => setSessionPage((p) => Math.min(sessionTotalPages, p + 1))}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 bg-white rounded-lg disabled:opacity-40"
                    >
                      Next <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* DIRECTORY 3: READ-ONLY CLINICAL CATALOG */}
      {activeTab === 'catalog' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {catalogLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <InfinityLoop className="w-16 h-8 text-[#007086]" duration="1.8s" strokeWidth={5.5} />
              <p className="text-xs text-slate-500">Loading service catalog...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Therapy Service</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Governance &amp; Qualifications</th>
                    <th className="py-3 px-4">Status</th>
                    {isDoctor && <th className="py-3 px-4 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {catalogItems.map((item) => {
                    const canAssign =
                      item.isActive &&
                      item.isAvailable &&
                      item.verificationStatus === 'APPROVED';
                    return (
                      <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900 flex items-baseline gap-2">
                            <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                              {formatTherapyIndexLabel(item)}
                            </span>
                            <span>{item.name}</span>
                          </p>
                          {item.bengaliName && (
                            <p className="text-[11px] text-[#007086] font-bengali">
                              {item.bengaliName}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <p>{item.categoryName}</p>
                          {item.isEdTreatment && (
                            <p className="text-[11px] text-slate-500">Sensitive group</p>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-sm">
                          {item.requiredProviderQualifications && (
                            <p className="text-slate-700">{item.requiredProviderQualifications}</p>
                          )}
                          {item.governanceNotice && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {item.governanceNotice}
                            </p>
                          )}
                          {item.terminologyReviewRequired && (
                            <p className="text-[11px] text-amber-800 mt-0.5">
                              Flagged for source label terminology verification
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 space-y-1">
                          <div>
                            <VerificationBadge status={item.verificationStatus} />
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {item.isActive ? 'Enabled' : 'Disabled'}
                            {item.consentRequired ? ' • Consent req.' : ''}
                          </p>
                        </td>
                        {isDoctor && (
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {canAssign ? (
                              <Link
                                to={`/therapies/plans/new?therapyId=${item._id}`}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-[#007086] hover:bg-[#065b6d] rounded-lg"
                              >
                                Create Plan
                              </Link>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                {!item.isActive ? 'Disabled' : 'Awaiting approval'}
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <SessionUpdateModal
        session={editingSession}
        isOpen={Boolean(editingSession)}
        onClose={() => setEditingSession(null)}
        onUpdated={() => {
          loadSessions();
        }}
      />
    </div>
  );
};
