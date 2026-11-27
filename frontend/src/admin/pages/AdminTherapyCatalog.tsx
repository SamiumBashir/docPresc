import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Edit2,
  FolderPlus,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { InfinityLoop } from '@/components/loading-ui/infinity';
import { Modal } from '../../components/ui/Modal';
import { therapyApi } from '../../services/endpoints/therapy.api';
import { VerificationBadge } from '../../components/therapy/VerificationBadge';
import {
  IPractitioner,
  ITherapy,
  ITherapyCategory,
  ITherapyOverview,
  TherapyVerificationStatus,
} from '../../types';

const formatReviewFlag = (flag: string): string => {
  const labels: Record<string, string> = {
    PROVIDER_QUALIFICATION_REQUIRED: 'Provider qualification',
    SAFETY_DOCUMENTATION_REQUIRED: 'Safety documentation',
    TERMINOLOGY_VERIFICATION: 'Terminology confirmation',
    DEVICE_SPECIFICATION_REQUIRED: 'Device specification',
    EVIDENCE_GOVERNANCE_REVIEW: 'Evidence governance',
    PROCEDURE_CONSENT_REQUIRED: 'Procedure consent',
    LEGAL_AUTHORIZATION_REVIEW: 'Legal authorization',
    NO_UNVERIFIED_CLAIMS: 'No unverified claims',
  };
  if (labels[flag]) return labels[flag];
  const lower = flag.replace(/_/g, ' ').toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

export const AdminTherapyCatalog: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'main' | 'ed' | 'practitioners'>('main');
  const [overview, setOverview] = useState<ITherapyOverview | null>(null);
  const [categories, setCategories] = useState<ITherapyCategory[]>([]);
  const [therapies, setTherapies] = useState<ITherapy[]>([]);
  const [practitioners, setPractitioners] = useState<IPractitioner[]>([]);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'ALL' | TherapyVerificationStatus>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Verify Modal State
  const [verifyingTherapy, setVerifyingTherapy] = useState<ITherapy | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<TherapyVerificationStatus>('APPROVED');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyQuals, setVerifyQuals] = useState('');
  const [verifyConsentReq, setVerifyConsentReq] = useState(false);
  const [verifyTermConfirmed, setVerifyTermConfirmed] = useState(false);
  const [verifyGovReviewed, setVerifyGovReviewed] = useState(false);

  // Add/Edit Therapy Modal State
  const [therapyModalOpen, setTherapyModalOpen] = useState(false);
  const [editingTherapy, setEditingTherapy] = useState<ITherapy | null>(null);
  const [formName, setFormName] = useState('');
  const [formNameBn, setFormNameBn] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formQuals, setFormQuals] = useState('');
  const [formEquipment, setFormEquipment] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formConsentReq, setFormConsentReq] = useState(false);
  const [formAdminNotes, setFormAdminNotes] = useState('');

  // Create Category Modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catNameBn, setCatNameBn] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catSensitive, setCatSensitive] = useState(false);

  // Create Staff Practitioner Modal
  const [pracModalOpen, setPracModalOpen] = useState(false);
  const [pracName, setPracName] = useState('');
  const [pracEmail, setPracEmail] = useState('');
  const [pracPassword, setPracPassword] = useState('');
  const [pracPhone, setPracPhone] = useState('');
  const [pracQual, setPracQual] = useState('');
  const [pracDesignation, setPracDesignation] = useState('');
  const [pracRegNo, setPracRegNo] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, catList, pracList] = await Promise.all([
        therapyApi.getOverview(),
        therapyApi.getCatalog({
          section: activeTab === 'ed' ? 'ed' : activeTab === 'main' ? 'main' : 'all',
          categoryId: categoryFilter || undefined,
          verificationStatus: verificationFilter !== 'ALL' ? verificationFilter : undefined,
          search: search || undefined,
          limit: 200,
        }),
        therapyApi.getPractitioners(true),
      ]);
      setOverview(ov);
      setTherapies(catList.therapies || []);
      setCategories(catList.categories || []);
      setPractitioners(pracList || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load therapy governance data.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, categoryFilter, verificationFilter, search]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadData();
    }, 120);
    return () => clearTimeout(t);
  }, [loadData]);

  const openVerifyModal = (therapy: ITherapy) => {
    setVerifyingTherapy(therapy);
    setVerifyStatus(therapy.verificationStatus === 'APPROVED' ? 'APPROVED' : 'APPROVED');
    setVerifyNotes(therapy.verificationNotes || '');
    setVerifyQuals(therapy.requiredProviderQualifications || '');
    setVerifyConsentReq(Boolean(therapy.consentRequired));
    setVerifyTermConfirmed(!therapy.terminologyReviewRequired);
    setVerifyGovReviewed(therapy.specialReviewFlags.length === 0);
    setModalError(null);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingTherapy) return;
    setModalError(null);
    setIsSubmitting(true);
    try {
      await therapyApi.verifyTherapy(verifyingTherapy._id, {
        verificationStatus: verifyStatus,
        verificationNotes: verifyNotes,
        requiredProviderQualifications: verifyQuals,
        consentRequired: verifyConsentReq,
        terminologyConfirmed: verifyTermConfirmed,
        governanceReviewed: verifyGovReviewed,
      });
      setVerifyingTherapy(null);
      setNotice(`Verification updated for "${verifyingTherapy.name}".`);
      await loadData();
    } catch (err: any) {
      setModalError(err?.message || 'Failed to update clinical verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTherapyModal = (therapy?: ITherapy) => {
    setModalError(null);
    if (therapy) {
      setEditingTherapy(therapy);
      setFormName(therapy.name);
      setFormNameBn(therapy.bengaliName || '');
      setFormCategoryId(therapy.categoryId);
      setFormDesc(therapy.description || '');
      setFormQuals(therapy.requiredProviderQualifications || '');
      setFormEquipment(therapy.requiredEquipment || '');
      setFormDuration(
        therapy.defaultSessionDurationMinutes ? String(therapy.defaultSessionDurationMinutes) : ''
      );
      setFormPrice(therapy.price !== null && therapy.price !== undefined ? String(therapy.price) : '');
      setFormConsentReq(Boolean(therapy.consentRequired));
      setFormAdminNotes(therapy.administrativeNotes || '');
    } else {
      setEditingTherapy(null);
      setFormName('');
      setFormNameBn('');
      const edCat = categories.find((c) => c.isSensitiveClinicalGroup || c.key === 'ed-treatments');
      const mainCat = categories.find((c) => c.key === 'main-treatments') || categories[0];
      setFormCategoryId(activeTab === 'ed' && edCat ? edCat._id : mainCat?._id || '');
      setFormDesc('');
      setFormQuals('');
      setFormEquipment('');
      setFormDuration('');
      setFormPrice('');
      setFormConsentReq(activeTab === 'ed');
      setFormAdminNotes('');
    }
    setTherapyModalOpen(true);
  };

  const handleTherapySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        name: formName,
        bengaliName: formNameBn || undefined,
        categoryId: formCategoryId,
        description: formDesc,
        requiredProviderQualifications: formQuals,
        requiredEquipment: formEquipment,
        defaultSessionDurationMinutes: formDuration ? parseInt(formDuration, 10) : null,
        price: formPrice ? parseFloat(formPrice) : null,
        consentRequired: formConsentReq,
        administrativeNotes: formAdminNotes,
      };
      if (editingTherapy) {
        await therapyApi.updateTherapy(editingTherapy._id, payload);
        setNotice(`Updated "${formName}".`);
      } else {
        await therapyApi.createTherapy(payload);
        setNotice(`Added "${formName}" (pending clinical verification).`);
      }
      setTherapyModalOpen(false);
      await loadData();
    } catch (err: any) {
      setModalError(err?.message || 'Unable to save therapy service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (therapy: ITherapy) => {
    setError(null);
    try {
      await therapyApi.toggleTherapyStatus(therapy._id, { isActive: !therapy.isActive });
      setNotice(
        !therapy.isActive
          ? `Enabled "${therapy.name}".`
          : `Disabled "${therapy.name}". New patient plans can no longer assign it.`
      );
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Unable to toggle therapy status.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);
    try {
      await therapyApi.createCategory({
        name: catName,
        nameBn: catNameBn || undefined,
        description: catDesc || undefined,
        isSensitiveClinicalGroup: catSensitive,
      });
      setCatModalOpen(false);
      setCatName('');
      setCatNameBn('');
      setCatDesc('');
      setCatSensitive(false);
      setNotice(`Category "${catName}" created.`);
      await loadData();
    } catch (err: any) {
      setModalError(err?.message || 'Unable to create category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePractitioner = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);
    try {
      await therapyApi.createPractitioner({
        name: pracName,
        email: pracEmail,
        password: pracPassword,
        phone: pracPhone || undefined,
        qualification: pracQual || undefined,
        designation: pracDesignation || undefined,
        registrationNumber: pracRegNo || undefined,
      });
      setPracModalOpen(false);
      setPracName('');
      setPracEmail('');
      setPracPassword('');
      setPracPhone('');
      setPracQual('');
      setPracDesignation('');
      setPracRegNo('');
      setNotice(`Practitioner account created for "${pracName}".`);
      await loadData();
    } catch (err: any) {
      setModalError(err?.message || 'Unable to create practitioner.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePractitionerAuth = async (prac: IPractitioner) => {
    if (prac.role !== 'staff') return;
    setError(null);
    try {
      await therapyApi.updatePractitioner(prac._id, {
        isAuthorizedPractitioner: !prac.isAuthorizedPractitioner,
      });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Unable to update practitioner authorization.');
    }
  };

  const darkInputCls =
    'w-full px-3 py-2 text-xs bg-[#0d1119] border border-white/[0.1] text-[#eef0f5] placeholder-[#757d90] rounded-lg focus:outline-none focus:border-[#2ab0c7] transition-colors';
  const darkLabelCls = 'block text-xs font-medium text-[#a3a9b8] mb-1.5';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-[#eef0f5] tracking-[-0.01em]">
            Therapy Catalog &amp; Clinical Governance
          </h1>
          <p className="text-xs text-[#a3a9b8] mt-1">
            Verify source labels, manage ED treatments separately, and authorize practitioners.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setModalError(null);
              setCatModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1b2232] hover:bg-[#232c40] border border-white/[0.1] text-[#eef0f5] text-xs font-medium rounded-lg transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-[#a3a9b8]" strokeWidth={1.5} />
            <span>Add category</span>
          </button>
          <button
            type="button"
            onClick={() => openTherapyModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#007086] hover:bg-[#088097] text-white text-xs font-medium rounded-lg transition-colors active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            <span>Add therapy</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#131924] border border-white/[0.08] rounded-xl p-4">
            <p className="text-xs text-[#a3a9b8]">Catalog entries</p>
            <p className="text-2xl font-medium text-[#eef0f5] mt-1.5 tabular-nums">
              {overview.metrics.totalTherapies}
            </p>
          </div>
          <div className="bg-[#131924] border border-white/[0.08] rounded-xl p-4">
            <p className="text-xs text-[#a3a9b8]">Approved &amp; active</p>
            <p className="text-2xl font-medium text-[#4cc38a] mt-1.5 tabular-nums">
              {overview.metrics.approvedTherapies}
            </p>
          </div>
          <div className="bg-[#131924] border border-white/[0.08] rounded-xl p-4">
            <p className="text-xs text-[#a3a9b8]">Pending clinical review</p>
            <p className="text-2xl font-medium text-amber-300 mt-1.5 tabular-nums">
              {overview.metrics.pendingClinicalReview}
            </p>
          </div>
          <div className="bg-[#131924] border border-white/[0.08] rounded-xl p-4">
            <p className="text-xs text-[#a3a9b8]">ED treatments category</p>
            <p className="text-2xl font-medium text-[#2ab0c7] mt-1.5 tabular-nums">
              {overview.metrics.edTherapiesCount}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab('main');
            setCategoryFilter('');
          }}
          className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'main'
              ? 'bg-[#007086] text-white'
              : 'bg-[#1b2232] text-[#a3a9b8] border border-white/[0.08] hover:text-[#eef0f5] hover:bg-[#232c40]'
          }`}
        >
          Main &amp; custom therapies
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('ed');
            setCategoryFilter('');
          }}
          className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'ed'
              ? 'bg-[#007086] text-white'
              : 'bg-[#1b2232] text-[#a3a9b8] border border-white/[0.08] hover:text-[#eef0f5] hover:bg-[#232c40]'
          }`}
        >
          ED treatments (dedicated)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('practitioners')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'practitioners'
              ? 'bg-[#007086] text-white'
              : 'bg-[#1b2232] text-[#a3a9b8] border border-white/[0.08] hover:text-[#eef0f5] hover:bg-[#232c40]'
          }`}
        >
          <Users className="w-4 h-4" strokeWidth={1.5} />
          <span>Authorized practitioners</span>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-[#f08b8e]"
        >
          {error}
        </div>
      )}

      {notice && (
        <div className="p-3 bg-[#4cc38a]/10 border border-[#4cc38a]/25 rounded-xl text-xs text-[#4cc38a] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <span>{notice}</span>
        </div>
      )}

      {/* Main or ED Catalog Table */}
      {activeTab !== 'practitioners' && (
        <div className="space-y-4">
          {activeTab === 'ed' && (
            <div className="p-3.5 bg-[#131924] border border-white/[0.08] rounded-xl text-xs text-[#a3a9b8] flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                ED Treatments are managed in a privacy-protected sensitive group. Informed patient
                consent and clinician qualification verification are recommended prior to approval.
              </div>
            </div>
          )}

          <div className="bg-[#131924] border border-white/[0.08] rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search
                className="w-4 h-4 text-[#757d90] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                strokeWidth={1.5}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search catalog services..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#0d1119] border border-white/[0.1] text-[#eef0f5] placeholder-[#757d90] rounded-lg focus:outline-none focus:border-[#2ab0c7] transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeTab === 'main' && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-[#0d1119] border border-white/[0.1] text-[#eef0f5] rounded-lg focus:outline-none focus:border-[#2ab0c7]"
                >
                  <option value="">All non-ED categories</option>
                  {categories
                    .filter((c) => !c.isSensitiveClinicalGroup)
                    .map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              )}

              <select
                value={verificationFilter}
                onChange={(e) =>
                  setVerificationFilter(e.target.value as 'ALL' | TherapyVerificationStatus)
                }
                className="px-3 py-2 text-xs bg-[#0d1119] border border-white/[0.1] text-[#eef0f5] rounded-lg focus:outline-none focus:border-[#2ab0c7]"
              >
                <option value="ALL">All review states</option>
                <option value="PENDING_CLINICAL_REVIEW">Pending review</option>
                <option value="NEEDS_TERMINOLOGY_REVIEW">Terminology review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="bg-[#131924] border border-white/[0.08] rounded-xl p-12 flex justify-center">
              <InfinityLoop className="w-12 h-6 text-[#2ab0c7]" />
            </div>
          ) : (
            <div className="bg-[#131924] border border-white/[0.08] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#18202e] border-b border-white/[0.08] text-[#a3a9b8] font-medium">
                      <th className="px-4 py-3">Service name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Review flags &amp; qualifications</th>
                      <th className="px-4 py-3">Verification</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-[#eef0f5]">
                    {therapies.map((t) => (
                      <tr key={t._id} className="hover:bg-[#18202e]/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#eef0f5]">{t.name}</div>
                          {t.bengaliName && (
                            <div className="text-[11px] text-[#a3a9b8] font-bengali mt-0.5">
                              {t.bengaliName}
                            </div>
                          )}
                          <div className="text-[11px] text-[#757d90] font-mono mt-0.5">{t.key}</div>
                        </td>
                        <td className="px-4 py-3 text-[#a3a9b8]">
                          <div className="text-[#eef0f5]">{t.categoryName}</div>
                          <div className="text-[11px] text-[#757d90] mt-0.5">
                            {t.isActive ? 'Enabled' : 'Disabled'}
                            {t.consentRequired ? ' • Consent req.' : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-sm">
                          {t.terminologyReviewRequired && (
                            <div className="text-[11px] text-[#2ab0c7] font-medium">
                              Terminology confirmation required
                            </div>
                          )}
                          {(() => {
                            const visibleFlags = t.specialReviewFlags.filter(
                              (f) => !(t.terminologyReviewRequired && f === 'TERMINOLOGY_VERIFICATION')
                            );
                            return (
                              visibleFlags.length > 0 && (
                                <div className="text-[11px] text-amber-300 mt-0.5">
                                  {visibleFlags.map(formatReviewFlag).join(' · ')}
                                </div>
                              )
                            );
                          })()}
                          {t.requiredProviderQualifications && (
                            <div className="text-[11px] text-[#a3a9b8] mt-0.5">
                              {t.requiredProviderQualifications}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 space-y-1">
                          <VerificationBadge status={t.verificationStatus} dark />
                          {t.verifiedByName && (
                            <div className="text-[11px] text-[#757d90]">by {t.verifiedByName}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openVerifyModal(t)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#007086]/15 hover:bg-[#007086]/25 border border-[#2ab0c7]/30 text-[#2ab0c7] font-medium rounded-lg transition-colors"
                            >
                              <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                              <span>Verify</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openTherapyModal(t)}
                              className="p-1.5 text-[#a3a9b8] hover:text-[#eef0f5] hover:bg-[#1b2232] border border-white/[0.1] rounded-lg transition-colors"
                              title="Edit therapy"
                            >
                              <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(t)}
                              className="px-2.5 py-1.5 bg-[#1b2232] hover:bg-[#232c40] border border-white/[0.1] text-[#a3a9b8] hover:text-[#eef0f5] rounded-lg transition-colors"
                            >
                              {t.isActive ? 'Disable' : 'Enable'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Practitioners Tab */}
      {activeTab === 'practitioners' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#131924] border border-white/[0.08] rounded-xl p-4">
            <p className="text-xs text-[#a3a9b8]">
              Doctors and authorized staff practitioners can be assigned to patient treatment plans.
            </p>
            <button
              type="button"
              onClick={() => {
                setModalError(null);
                setPracModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#007086] hover:bg-[#088097] text-white text-xs font-medium rounded-lg transition-colors active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" strokeWidth={1.5} />
              <span>Add staff practitioner</span>
            </button>
          </div>

          <div className="bg-[#131924] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#18202e] border-b border-white/[0.08] text-[#a3a9b8] font-medium">
                    <th className="px-4 py-3">Practitioner</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Qualifications &amp; Reg.</th>
                    <th className="px-4 py-3">Authorization</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-[#eef0f5]">
                  {practitioners.map((p) => (
                    <tr key={p._id} className="hover:bg-[#18202e]/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#eef0f5]">{p.name}</div>
                        <div className="text-[11px] text-[#a3a9b8] mt-0.5">{p.email}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#a3a9b8] capitalize">{p.role}</td>
                      <td className="px-4 py-3 text-[#a3a9b8]">
                        <div className="text-[#eef0f5]">{p.qualification || p.designation || '—'}</div>
                        {p.registrationNumber && (
                          <div className="text-[11px] text-[#757d90] font-mono tabular-nums mt-0.5">
                            Reg: {p.registrationNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded border ${
                            p.isAuthorizedPractitioner && p.status === 'active'
                              ? 'bg-[#4cc38a]/12 border-[#4cc38a]/30 text-[#4cc38a]'
                              : 'bg-[#1b2232] border-white/[0.1] text-[#a3a9b8]'
                          }`}
                        >
                          {p.isAuthorizedPractitioner && p.status === 'active'
                            ? 'Authorized'
                            : 'Suspended / Revoked'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.role === 'staff' ? (
                          <button
                            type="button"
                            onClick={() => handleTogglePractitionerAuth(p)}
                            className="px-2.5 py-1.5 bg-[#1b2232] hover:bg-[#232c40] border border-white/[0.1] text-[#a3a9b8] hover:text-[#eef0f5] rounded-lg transition-colors"
                          >
                            {p.isAuthorizedPractitioner ? 'Revoke' : 'Authorize'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#757d90]">Doctor profile</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Verify / Governance Review Modal */}
      <Modal
        dark
        isOpen={Boolean(verifyingTherapy)}
        onClose={() => setVerifyingTherapy(null)}
        title="Clinical Verification & Governance"
        subtitle={verifyingTherapy?.name}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleVerifySubmit} className="space-y-4 text-xs text-[#eef0f5]">
          {modalError && (
            <div
              role="alert"
              className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-[#f08b8e]"
            >
              {modalError}
            </div>
          )}

          {verifyingTherapy?.governanceNotice && (
            <div className="p-3 bg-amber-400/10 border border-amber-400/25 rounded-lg text-amber-200 leading-relaxed">
              {verifyingTherapy.governanceNotice}
            </div>
          )}

          <div>
            <label className={darkLabelCls}>Verification decision</label>
            <select
              value={verifyStatus}
              onChange={(e) => setVerifyStatus(e.target.value as TherapyVerificationStatus)}
              className={darkInputCls}
            >
              <option value="APPROVED">Approved — Allow clinician assignment</option>
              <option value="PENDING_CLINICAL_REVIEW">Pending clinical review</option>
              <option value="NEEDS_TERMINOLOGY_REVIEW">Needs terminology review</option>
              <option value="REJECTED">Rejected — Do not allow assignment</option>
            </select>
          </div>

          <div>
            <label className={darkLabelCls}>Required provider qualifications</label>
            <input
              type="text"
              value={verifyQuals}
              onChange={(e) => setVerifyQuals(e.target.value)}
              placeholder="e.g. Licensed Physiotherapist / MD"
              className={darkInputCls}
            />
          </div>

          <div>
            <label className={darkLabelCls}>Verification notes</label>
            <textarea
              rows={2}
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
              placeholder="Document governance decision and scope..."
              className={darkInputCls}
            />
          </div>

          <div className="space-y-2.5 p-3 bg-[#18202e] border border-white/[0.08] rounded-lg">
            <label className="flex items-center gap-2.5 cursor-pointer text-[#eef0f5]">
              <input
                type="checkbox"
                checked={verifyConsentReq}
                onChange={(e) => setVerifyConsentReq(e.target.checked)}
                className="accent-[#007086] rounded"
              />
              <span>Require obtained patient consent on treatment plans</span>
            </label>

            {verifyingTherapy?.terminologyReviewRequired && (
              <label className="flex items-center gap-2.5 cursor-pointer font-medium text-[#2ab0c7]">
                <input
                  type="checkbox"
                  checked={verifyTermConfirmed}
                  onChange={(e) => setVerifyTermConfirmed(e.target.checked)}
                  className="accent-[#007086] rounded"
                />
                <span>Confirm source label terminology (CVFT / Touliao / CFT) verified</span>
              </label>
            )}

            {verifyingTherapy && verifyingTherapy.specialReviewFlags.length > 0 && (
              <label className="flex items-center gap-2.5 cursor-pointer font-medium text-amber-200">
                <input
                  type="checkbox"
                  checked={verifyGovReviewed}
                  onChange={(e) => setVerifyGovReviewed(e.target.checked)}
                  className="accent-[#007086] rounded"
                />
                <span>Acknowledge clinical governance and evidence safeguards reviewed</span>
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setVerifyingTherapy(null)}
              className="px-3.5 py-2 bg-[#1b2232] hover:bg-[#232c40] border border-white/[0.1] text-[#a3a9b8] hover:text-[#eef0f5] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#007086] hover:bg-[#088097] text-white font-medium rounded-lg transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save verification'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Therapy Modal */}
      <Modal
        dark
        isOpen={therapyModalOpen}
        onClose={() => setTherapyModalOpen(false)}
        title={editingTherapy ? 'Edit Therapy Service' : 'Add New Therapy Service'}
        subtitle="New services start unapproved until clinically verified."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleTherapySubmit} className="space-y-3 text-xs text-[#eef0f5]">
          {modalError && (
            <div
              role="alert"
              className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-[#f08b8e]"
            >
              {modalError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={darkLabelCls}>Service name *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className={darkInputCls}
              />
            </div>
            <div>
              <label className={darkLabelCls}>Bengali name</label>
              <input
                type="text"
                value={formNameBn}
                onChange={(e) => setFormNameBn(e.target.value)}
                className={`${darkInputCls} font-bengali`}
              />
            </div>
          </div>

          <div>
            <label className={darkLabelCls}>Category *</label>
            <select
              required
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
              className={darkInputCls}
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={darkLabelCls}>Description</label>
            <textarea
              rows={2}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className={darkInputCls}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={darkLabelCls}>Required qualifications</label>
              <input
                type="text"
                value={formQuals}
                onChange={(e) => setFormQuals(e.target.value)}
                className={darkInputCls}
              />
            </div>
            <div>
              <label className={darkLabelCls}>Required equipment</label>
              <input
                type="text"
                value={formEquipment}
                onChange={(e) => setFormEquipment(e.target.value)}
                className={darkInputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={darkLabelCls}>Configured duration (min)</label>
              <input
                type="number"
                min={1}
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                className={`${darkInputCls} tabular-nums`}
              />
            </div>
            <div>
              <label className={darkLabelCls}>Fee (optional)</label>
              <input
                type="number"
                min={0}
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className={`${darkInputCls} tabular-nums`}
              />
            </div>
          </div>

          <div>
            <label className={darkLabelCls}>Administrative notes</label>
            <input
              type="text"
              value={formAdminNotes}
              onChange={(e) => setFormAdminNotes(e.target.value)}
              className={darkInputCls}
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-1 text-[#eef0f5]">
            <input
              type="checkbox"
              checked={formConsentReq}
              onChange={(e) => setFormConsentReq(e.target.checked)}
              className="accent-[#007086] rounded"
            />
            <span>Patient informed consent required</span>
          </label>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setTherapyModalOpen(false)}
              className="px-3.5 py-2 bg-[#1b2232] hover:bg-[#232c40] border border-white/[0.1] text-[#a3a9b8] hover:text-[#eef0f5] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#007086] hover:bg-[#088097] text-white font-medium rounded-lg transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingTherapy ? 'Save changes' : 'Create service'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Category Modal */}
      <Modal
        dark
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title="Create Therapy Category"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateCategory} className="space-y-3 text-xs text-[#eef0f5]">
          {modalError && (
            <div
              role="alert"
              className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-[#f08b8e]"
            >
              {modalError}
            </div>
          )}
          <div>
            <label className={darkLabelCls}>Category name *</label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className={darkInputCls}
            />
          </div>
          <div>
            <label className={darkLabelCls}>Bengali name</label>
            <input
              type="text"
              value={catNameBn}
              onChange={(e) => setCatNameBn(e.target.value)}
              className={`${darkInputCls} font-bengali`}
            />
          </div>
          <div>
            <label className={darkLabelCls}>Description</label>
            <textarea
              rows={2}
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              className={darkInputCls}
            />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer pt-1 text-[#eef0f5]">
            <input
              type="checkbox"
              checked={catSensitive}
              onChange={(e) => setCatSensitive(e.target.checked)}
              className="accent-[#007086] rounded"
            />
            <span>Mark as sensitive clinical group</span>
          </label>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setCatModalOpen(false)}
              className="px-3.5 py-2 bg-[#1b2232] hover:bg-[#232c40] border border-white/[0.1] text-[#a3a9b8] hover:text-[#eef0f5] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#007086] hover:bg-[#088097] text-white font-medium rounded-lg transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              Create category
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Staff Practitioner Modal */}
      <Modal
        dark
        isOpen={pracModalOpen}
        onClose={() => setPracModalOpen(false)}
        title="Create Authorized Staff Practitioner"
        subtitle="Staff practitioners can view assigned plans and update session records."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreatePractitioner} className="space-y-3 text-xs text-[#eef0f5]">
          {modalError && (
            <div
              role="alert"
              className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-[#f08b8e]"
            >
              {modalError}
            </div>
          )}
          <div>
            <label className={darkLabelCls}>Full name *</label>
            <input
              type="text"
              required
              value={pracName}
              onChange={(e) => setPracName(e.target.value)}
              className={darkInputCls}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={darkLabelCls}>Email *</label>
              <input
                type="email"
                required
                value={pracEmail}
                onChange={(e) => setPracEmail(e.target.value)}
                className={darkInputCls}
              />
            </div>
            <div>
              <label className={darkLabelCls}>Password *</label>
              <input
                type="password"
                required
                minLength={8}
                value={pracPassword}
                onChange={(e) => setPracPassword(e.target.value)}
                className={darkInputCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={darkLabelCls}>Qualification</label>
              <input
                type="text"
                value={pracQual}
                onChange={(e) => setPracQual(e.target.value)}
                placeholder="e.g. BPT, MPT"
                className={darkInputCls}
              />
            </div>
            <div>
              <label className={darkLabelCls}>Designation</label>
              <input
                type="text"
                value={pracDesignation}
                onChange={(e) => setPracDesignation(e.target.value)}
                placeholder="e.g. Physiotherapist"
                className={darkInputCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={darkLabelCls}>Registration no.</label>
              <input
                type="text"
                value={pracRegNo}
                onChange={(e) => setPracRegNo(e.target.value)}
                className={`${darkInputCls} tabular-nums`}
              />
            </div>
            <div>
              <label className={darkLabelCls}>Phone</label>
              <input
                type="text"
                value={pracPhone}
                onChange={(e) => setPracPhone(e.target.value)}
                className={`${darkInputCls} tabular-nums`}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setPracModalOpen(false)}
              className="px-3.5 py-2 bg-[#1b2232] hover:bg-[#232c40] border border-white/[0.1] text-[#a3a9b8] hover:text-[#eef0f5] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#007086] hover:bg-[#088097] text-white font-medium rounded-lg transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              Create practitioner
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
