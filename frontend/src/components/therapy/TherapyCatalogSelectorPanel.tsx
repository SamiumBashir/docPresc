import React, { useMemo, useState } from 'react';
import { Check, CheckSquare, Search } from 'lucide-react';
import { ITherapy } from '../../types';
import {
  DEFAULT_MAIN_THERAPIES_FALLBACK,
  formatTherapyIndexLabel,
} from '../../constants/defaultTherapyCatalog';

interface TherapyCatalogSelectorPanelProps {
  therapies: ITherapy[];
  selectedTherapyIds: string[];
  disabled?: boolean;
  onToggleTherapy: (therapy: ITherapy) => void;
  onClearSelection?: () => void;
}

export const TherapyCatalogSelectorPanel: React.FC<TherapyCatalogSelectorPanelProps> = ({
  therapies,
  selectedTherapyIds,
  disabled = false,
  onToggleTherapy,
  onClearSelection,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<'all' | 'main' | 'ed'>('all');
  const [approvedOnly, setApprovedOnly] = useState(false);
  const [unapprovedHint, setUnapprovedHint] = useState<string | null>(null);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  // Merge fallback read-only items only when server catalog couldn't load so the 27-item hospital list stays visible cleanly
  const displayList: Array<
    ITherapy & { _isFallback?: boolean; _indexLabel: string }
  > = useMemo(() => {
    if (therapies.length > 0) {
      return therapies.map((t) => ({
        ...t,
        _isFallback: false,
        _indexLabel: formatTherapyIndexLabel(t),
      }));
    }
    return DEFAULT_MAIN_THERAPIES_FALLBACK.map((f, idx) => ({
      _id: `fallback-${f.key}`,
      key: f.key,
      name: f.name,
      englishName: f.name,
      categoryId: 'main-treatments',
      categoryName: 'Main Treatments',
      isEdTreatment: false,
      isActive: true,
      isAvailable: true,
      verificationStatus: 'PENDING_CLINICAL_REVIEW',
      terminologyReviewRequired: false,
      specialReviewFlags: [],
      consentRequired: false,
      sortOrder: idx + 1,
      createdAt: '',
      updatedAt: '',
      _isFallback: true,
      _indexLabel: f.numLabel,
    }));
  }, [therapies]);

  const filteredTherapies = useMemo(() => {
    return displayList.filter((item) => {
      if (sectionFilter === 'main' && item.isEdTreatment) return false;
      if (sectionFilter === 'ed' && !item.isEdTreatment) return false;
      if (
        approvedOnly &&
        (item.verificationStatus !== 'APPROVED' || !item.isActive || !item.isAvailable)
      ) {
        return false;
      }
      if (normalizedSearch) {
        return (
          item.name.toLowerCase().includes(normalizedSearch) ||
          (item.bengaliName || '').toLowerCase().includes(normalizedSearch) ||
          item.categoryName.toLowerCase().includes(normalizedSearch) ||
          item._indexLabel.toLowerCase().includes(normalizedSearch)
        );
      }
      return true;
    });
  }, [displayList, sectionFilter, approvedOnly, normalizedSearch]);

  const selectedIdSet = useMemo(() => new Set(selectedTherapyIds), [selectedTherapyIds]);

  const selectedTherapies = useMemo(
    () =>
      selectedTherapyIds
        .map((id) => therapies.find((t) => t._id === id))
        .filter((t): t is ITherapy => Boolean(t)),
    [therapies, selectedTherapyIds]
  );

  const selectedQuals = useMemo(
    () =>
      Array.from(
        new Set(
          selectedTherapies
            .map((t) => t.requiredProviderQualifications?.trim())
            .filter((v): v is string => Boolean(v))
        )
      ),
    [selectedTherapies]
  );

  const selectedNotices = useMemo(
    () =>
      Array.from(
        new Set(
          selectedTherapies
            .map((t) => t.governanceNotice?.trim())
            .filter((v): v is string => Boolean(v))
        )
      ),
    [selectedTherapies]
  );

  const anySelectedRequiresConsent = useMemo(
    () => selectedTherapies.some((t) => Boolean(t.consentRequired)),
    [selectedTherapies]
  );

  const approvedCount = useMemo(
    () =>
      therapies.filter(
        (t) => t.isActive && t.isAvailable && t.verificationStatus === 'APPROVED'
      ).length,
    [therapies]
  );

  return (
    <section
      aria-label="Therapy services selector"
      className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
    >
      {/* Header matching FoodSectionPanel */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 min-w-0">
          <CheckSquare className="w-4 h-4 text-[#007086] shrink-0" strokeWidth={1.5} />
          <h3 className="text-sm font-medium text-slate-900 truncate">Therapy List</h3>
          <span className="font-bengali text-sm font-medium text-slate-600 truncate">
            থেরাপি তালিকা
          </span>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs font-medium text-slate-600 tabular-nums">
            {selectedTherapies.length > 0
              ? `${selectedTherapies.length} selected`
              : `${approvedCount} approved / ${displayList.length} listed`}
          </span>
          {selectedTherapies.length > 0 && onClearSelection && !disabled && (
            <button
              type="button"
              onClick={onClearSelection}
              className="text-xs font-medium text-[#007086] hover:text-[#065b6d] transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search therapies (e.g. Acupuncture, Physio)..."
            aria-label="Search therapy list"
            className="w-full pl-9 pr-3 py-2 text-xs font-bengali bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086] focus:border-[#007086]"
          />
        </div>

        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value as 'all' | 'main' | 'ed')}
          aria-label="Filter therapies by group"
          className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#007086] focus:border-[#007086]"
        >
          <option value="all">All Categories</option>
          <option value="main">Main &amp; Custom Treatments</option>
          <option value="ed">ED Treatments</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
        <span>
          Only Admin-verified (<span className="font-medium text-slate-700">Approved</span>) therapies can
          be assigned to a patient.
        </span>
        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={approvedOnly}
            onChange={(e) => setApprovedOnly(e.target.checked)}
            className="rounded border-slate-300 text-[#007086] focus:ring-[#007086]"
          />
          <span>Approved only</span>
        </label>
      </div>

      {unapprovedHint && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
          {unapprovedHint}
        </div>
      )}

      {/* Unified 2-Column Numbered Card Grid */}
      {filteredTherapies.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-500">
          No therapies match your search filter.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-0.5">
          {filteredTherapies.map((item) => {
            const isChecked = selectedIdSet.has(item._id);
            const isAssignable =
              !item._isFallback &&
              item.isActive &&
              item.isAvailable &&
              item.verificationStatus === 'APPROVED';

            return (
              <button
                key={item._id}
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                disabled={disabled}
                onClick={() => {
                  if (!isAssignable) {
                    setUnapprovedHint(
                      `"${item.name}" is awaiting clinical approval in Admin Therapy Catalog (/admin/therapies) before it can be assigned.`
                    );
                    return;
                  }
                  setUnapprovedHint(null);
                  onToggleTherapy(item);
                }}
                className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  isChecked
                    ? 'border-[#007086] bg-[#f0f9fa] text-slate-900'
                    : isAssignable
                    ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-900 cursor-pointer'
                    : 'border-slate-200 bg-slate-50/60 text-slate-600 cursor-pointer'
                } ${disabled ? 'opacity-80 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    isChecked
                      ? 'bg-[#007086] border-[#007086] text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isChecked && <Check className="w-3 h-3" strokeWidth={2.2} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-[11px] font-semibold text-slate-400 tabular-nums shrink-0">
                      {item._indexLabel}
                    </span>
                    <span className="text-[13px] font-medium leading-snug break-words">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between gap-1.5">
                    <span className="truncate">{item.categoryName}</span>
                    {!isAssignable ? (
                      <span className="text-[11px] text-amber-700 shrink-0">
                        {item.verificationStatus === 'REJECTED' ? 'Rejected' : 'Pending review'}
                      </span>
                    ) : item.isEdTreatment ? (
                      <span className="text-[11px] text-[#065b6d] font-medium shrink-0">
                        ED group
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Governance & Qualification Summary */}
      {selectedTherapies.length > 0 && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 space-y-1.5">
          {selectedTherapies.length > 1 && (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {selectedTherapies.map((item) => (
                <span
                  key={item._id}
                  className="inline-flex items-center px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800 font-medium"
                >
                  {item.name}
                </span>
              ))}
            </div>
          )}
          {selectedQuals.length > 0 && (
            <div>
              <span className="font-semibold text-slate-900">Required qualification:</span>{' '}
              {selectedQuals.join(' • ')}
            </div>
          )}
          {selectedNotices.map((msg) => (
            <div key={msg}>{msg}</div>
          ))}
          {anySelectedRequiresConsent && (
            <div className="text-[#065b6d] font-medium">
              Patient informed consent must be set to Obtained prior to plan finalization.
            </div>
          )}
        </div>
      )}
    </section>
  );
};
