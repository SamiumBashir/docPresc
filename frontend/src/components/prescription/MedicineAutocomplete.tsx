import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Pill, Sparkles, Star, Plus, Leaf, X, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../ui/Toast';
import { IMedicine } from '../../types';

interface MedicineAutocompleteProps {
  onSelect: (medicine: IMedicine) => void;
  favorites?: IMedicine[];
  onToggleFavorite?: (medicineId: string) => void;
}

export const MedicineAutocomplete: React.FC<MedicineAutocompleteProps> = ({
  onSelect,
  favorites = [],
  onToggleFavorite,
}) => {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [results, setResults] = useState<IMedicine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchSeqRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchCacheRef = useRef<Map<string, IMedicine[]>>(new Map());

  // Quick New Medicine Entry Modal State (loaded lazily on modal open)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [brandName, setBrandName] = useState('');
  const [strength, setStrength] = useState('');
  const [genericName, setGenericName] = useState('');
  const [medicineType, setMedicineType] = useState<'Allopathic' | 'Unani' | 'Ayurvedic' | 'Herbal'>('Allopathic');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [manufacturer, setManufacturer] = useState('');
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [dosageForms, setDosageForms] = useState<string[]>([]);

  const handleOpenAddModal = (presetName = '') => {
    setBrandName(presetName || query.trim());
    setStrength('');
    setGenericName('');
    setMedicineType(selectedType !== 'all' ? (selectedType as any) : 'Allopathic');
    setDosageForm('Tablet');
    setManufacturer('');
    setFormError('');
    setIsOpen(false);
    setIsModalOpen(true);

    // On-demand lazy import of 500+ manufacturer & dosage form names (avoids 30+ kB in initial bundle)
    if (manufacturers.length === 0) {
      Promise.all([
        import('../../data/manufacturers'),
        import('../../data/dosageForms'),
      ])
        .then(([mfgModule, formModule]) => {
          setManufacturers(mfgModule.MANUFACTURER_NAMES);
          setDosageForms(formModule.DOSAGE_FORM_NAMES);
        })
        .catch(() => {});
    }
  };

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || !genericName.trim() || !strength.trim() || !manufacturer.trim()) {
      setFormError('Please fill out Brand Name, Generic Name, Strength, and Manufacturer');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const res = await api<{ success: boolean; message: string; data: IMedicine }>('/medicines', {
        method: 'POST',
        body: JSON.stringify({
          brandName: brandName.trim(),
          genericName: genericName.trim(),
          strength: strength.trim(),
          medicineType,
          type: medicineType,
          dosageForm: dosageForm.trim() || 'Tablet',
          form: dosageForm.trim() || 'Tablet',
          manufacturer: manufacturer.trim(),
          manufacture: manufacturer.trim(),
          category: 'General',
        }),
      });

      if (res.success && res.data) {
        showToast.success(`Added ${res.data.brandName} to medicine database! 💊`);
        setIsModalOpen(false);
        setQuery('');
        onSelect(res.data);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to add medicine entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchResults = async (qStr: string, type: string) => {
    const trimmedQ = qStr.trim();
    const cacheKey = `${type}:${trimmedQ.toLowerCase()}`;

    // Instant 0ms cache hit
    if (searchCacheRef.current.has(cacheKey)) {
      const cached = searchCacheRef.current.get(cacheKey)!;
      setResults(cached);
      setSelectedIndex(0);
      if (cached.length > 0 || trimmedQ) setIsOpen(true);
      setIsLoading(false);
      return;
    }

    // Cancel any previous in-flight HTTP request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const currentSeq = ++searchSeqRef.current;
    setIsLoading(true);
    setSearchError(null);

    try {
      let url = `/medicines/search?limit=15`;
      if (trimmedQ) url += `&q=${encodeURIComponent(trimmedQ)}`;
      if (type !== 'all') url += `&medicineType=${encodeURIComponent(type)}`;

      const res = await api<{ success: boolean; data: IMedicine[] }>(url, {
        signal: abortControllerRef.current.signal,
      });

      // Discard out-of-order responses if user continued typing
      if (currentSeq !== searchSeqRef.current) return;

      if (res.success && res.data) {
        // Cache up to 100 queries
        if (searchCacheRef.current.size > 100) {
          const firstKey = searchCacheRef.current.keys().next().value;
          if (firstKey) searchCacheRef.current.delete(firstKey);
        }
        searchCacheRef.current.set(cacheKey, res.data);

        setResults(res.data);
        setSelectedIndex(0);
        if (res.data.length > 0 || trimmedQ) setIsOpen(true);
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || abortControllerRef.current?.signal.aborted) {
        return;
      }
      if (currentSeq !== searchSeqRef.current) return;
      setResults([]);
      setSearchError(err.message || 'Unable to load medicines from database.');
      if (trimmedQ) setIsOpen(true);
    } finally {
      if (currentSeq === searchSeqRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Debounced search (280ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (query.trim() || selectedType !== 'all') {
        fetchResults(query, selectedType);
      } else {
        searchSeqRef.current++;
        setResults([]);
        setSearchError(null);
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(handler);
  }, [query, selectedType]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (med: IMedicine) => {
    onSelect(med);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Helper to highlight search term
  const highlightMatch = (text: string, search: string) => {
    if (!search.trim()) return text;
    const parts = text.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <span key={i} className="bg-amber-100 text-amber-900 font-bold px-0.5 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative space-y-2" ref={dropdownRef}>
      {/* Medicine System Selector Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
          System:
        </span>
        {[
          { id: 'all', label: 'All Systems (সব)' },
          { id: 'Allopathic', label: 'Allopathic (অ্যালোপ্যাথিক)' },
          { id: 'Unani', label: '🌿 Unani (ইউনানি)' },
          { id: 'Ayurvedic', label: '🌱 Ayurvedic (আয়ুর্বেদিক)' },
          { id: 'Herbal', label: '🍀 Herbal (হারবাল)' },
        ].map((sys) => {
          const isActive = selectedType === sys.id;
          return (
            <button
              key={sys.id}
              type="button"
              onClick={() => {
                setSelectedType(sys.id);
                fetchResults(query, sys.id);
                setIsOpen(true);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-medical-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {sys.label}
            </button>
          );
        })}
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || selectedType !== 'all') {
              if (results.length === 0) fetchResults(query, selectedType);
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedType === 'Unani'
              ? 'Search Unani medicines (e.g. Cinkara, Safi, Sualin, Carmina)...'
              : selectedType === 'Ayurvedic'
              ? 'Search Ayurvedic medicines (e.g. Chyawanprash, Draksharishta, Triphala)...'
              : 'Type brand name or generic (e.g. Napa, Seclo, Cinkara, Chyawanprash)...'
          }
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 shadow-xs transition-all"
        />
        {isLoading && (
          <div className="absolute right-3.5 top-3">
            <div className="w-4 h-4 border-2 border-medical-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 max-h-84 overflow-y-auto animate-in fade-in zoom-in-95">
          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Matching Medicines ({results.length})</span>
            <span className="font-mono">Use ↑↓ keys & Enter</span>
          </div>

          {results.map((med, index) => {
            const isSelected = index === selectedIndex;
            const isUnani = med.medicineType === 'Unani';
            const isAyurvedic = med.medicineType === 'Ayurvedic';
            const isHerbal = med.medicineType === 'Herbal';

            return (
              <div
                key={med._id}
                onClick={() => handleSelect(med)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${
                  isSelected ? 'bg-medical-50/80 text-medical-950' : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="space-y-0.5 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Dosage Form Badge */}
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/80">
                      {med.dosageForm}
                    </span>

                    {/* Unani / Ayurvedic / Herbal / Allopathic System Badge */}
                    {isUnani ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-0.5">
                        <Leaf className="w-2.5 h-2.5" /> Unani (ইউনানি)
                      </span>
                    ) : isAyurvedic ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-0.5">
                        🌱 Ayurvedic (আয়ুর্বেদিক)
                      </span>
                    ) : isHerbal ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-0.5">
                        🍀 Herbal
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200">
                        Allopathic
                      </span>
                    )}

                    {/* Brand Name */}
                    <span className="font-bold text-sm text-slate-900">
                      {highlightMatch(med.brandName, query)}
                    </span>

                    {/* Strength */}
                    {med.strength && (
                      <span className="font-semibold text-medical-700 text-xs">
                        ({med.strength})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                    <span className="italic">{highlightMatch(med.genericName, query)}</span>
                    <span>•</span>
                    <span className="truncate text-slate-600 font-medium">{med.manufacturer}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite?.(med._id);
                    }}
                    className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
                    title="Toggle Favorite"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="px-2.5 py-1 rounded-lg bg-medical-600 text-white text-xs font-semibold hover:bg-medical-700 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Select
                  </button>
                </div>
              </div>
            );
          })}

          {/* Quick Add at bottom of results */}
          <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Can't find what you're looking for?</span>
            <button
              type="button"
              onClick={() => handleOpenAddModal(query)}
              className="text-xs font-bold text-medical-700 hover:text-medical-800 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Medicine Entry
            </button>
          </div>
        </div>
      )}

      {/* When search error occurs */}
      {isOpen && searchError && !isLoading && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-rose-200 p-4 z-50 text-center space-y-2 animate-in fade-in">
          <div className="flex items-center justify-center gap-1.5 text-rose-600 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{searchError}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchResults(query, selectedType)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-medium transition-colors"
          >
            Retry Search
          </button>
        </div>
      )}

      {/* When no results found */}
      {isOpen && !searchError && results.length === 0 && !isLoading && query.trim() && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 text-center space-y-2 animate-in fade-in">
          <p className="text-xs text-slate-500">
            No medicine found matching "<span className="font-semibold text-slate-800">{query}</span>"
          </p>
          <button
            type="button"
            onClick={() => handleOpenAddModal(query)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Medicine Entry: "{query}"</span>
          </button>
        </div>
      )}

      {/* Quick New Medicine Entry Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white border border-slate-100 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-medical-50 text-medical-600 flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Medicine Entry</h3>
                  <p className="text-[11px] text-slate-500">Add to master database & prescribe immediately</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Brands & Strength */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Napa Extra / Monas"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Strength *
                  </label>
                  <input
                    type="text"
                    required
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    placeholder="e.g. 500mg, 10mg, 120ml"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Generic Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Generic Name *
                </label>
                <input
                  type="text"
                  required
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  placeholder="e.g. Paracetamol + Caffeine / Montelukast Sodium"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:bg-white"
                />
              </div>

              {/* Type & Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={medicineType}
                    onChange={(e: any) => setMedicineType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-medical-500 focus:bg-white"
                  >
                    <option value="Allopathic">Allopathic (অ্যালোপ্যাথিক)</option>
                    <option value="Unani">Unani (ইউনানি)</option>
                    <option value="Ayurvedic">Ayurvedic (আয়ুর্বেদিক)</option>
                    <option value="Herbal">Herbal (হারবাল)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Form *
                  </label>
                  <input
                    type="text"
                    required
                    list="autocompleteDosageFormList"
                    value={dosageForm}
                    onChange={(e) => setDosageForm(e.target.value)}
                    placeholder="Tablet, Capsule, Syrup..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:bg-white"
                  />
                  <datalist id="autocompleteDosageFormList">
                    {dosageForms.map((form) => (
                      <option key={form} value={form} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Manufacture / Company */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Manufacture (Company) *
                </label>
                <input
                  type="text"
                  required
                  list="autocompleteManufacturerList"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="e.g. Beximco Pharma, Square, Incepta, Hamdard..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:bg-white"
                />
                <datalist id="autocompleteManufacturerList">
                  {manufacturers.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-medical-600 hover:bg-medical-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    'Saving...'
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Save & Prescribe
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
