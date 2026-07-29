import React, { useState, useEffect, useRef } from 'react';
import { Search, Pill, Sparkles, Star, Plus, Leaf } from 'lucide-react';
import { api } from '../../api/client';
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchResults = async (qStr: string, type: string) => {
    setIsLoading(true);
    try {
      let url = `/medicines/search?limit=15`;
      if (qStr.trim()) url += `&q=${encodeURIComponent(qStr.trim())}`;
      if (type !== 'all') url += `&medicineType=${encodeURIComponent(type)}`;

      const res = await api<{ success: boolean; data: IMedicine[] }>(url);
      if (res.success && res.data) {
        setResults(res.data);
        setSelectedIndex(0);
        if (res.data.length > 0) setIsOpen(true);
      }
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search (280ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (query.trim() || selectedType !== 'all') {
        fetchResults(query, selectedType);
      } else {
        setResults([]);
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(handler);
  }, [query, selectedType]);

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

                    {/* Unani / Ayurvedic / Allopathic System Badge */}
                    {isUnani ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-0.5">
                        <Leaf className="w-2.5 h-2.5" /> Unani (ইউনানি)
                      </span>
                    ) : isAyurvedic ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-0.5">
                        🌱 Ayurvedic (আয়ুর্বেদিক)
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
        </div>
      )}
    </div>
  );
};
