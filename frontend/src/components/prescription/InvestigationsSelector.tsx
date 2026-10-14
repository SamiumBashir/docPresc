import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, X, Microscope, Search, Check, Trash2 } from 'lucide-react';
import {
  COMMON_INVESTIGATIONS_QUICK,
  searchInvestigations,
} from '../../data/investigations';

interface InvestigationsSelectorProps {
  investigations: string[];
  onChange: (investigations: string[]) => void;
}

export const InvestigationsSelector: React.FC<InvestigationsSelectorProps> = ({
  investigations,
  onChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered investigations based on search term
  const filteredSuggestions = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }
    return searchInvestigations(searchTerm);
  }, [searchTerm]);

  const handleAdd = (testName: string) => {
    const trimmed = testName.trim();
    if (!trimmed) return;
    if (investigations.includes(trimmed)) return;
    onChange([...investigations, trimmed]);
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemove = (index: number) => {
    onChange(investigations.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && filteredSuggestions.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && filteredSuggestions.length > 0 && filteredSuggestions[highlightedIndex]) {
        handleAdd(filteredSuggestions[highlightedIndex].name);
      } else if (searchTerm.trim()) {
        handleAdd(searchTerm);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Helper for category badge styling
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Hematology':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Biochemistry':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Liver Function Tests':
      case 'Lipid Profile':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Radiology and Imaging':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Cardiac Tests':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Urine Tests':
      case 'Stool Tests':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Hormone Tests':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Infectious Disease Tests':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-sky-50 text-sky-700 border-sky-200';
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-medical-50 border border-medical-200 flex items-center justify-center text-medical-700">
            <Microscope className="w-4 h-4 text-medical-600" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              Investigations (Tests Advised)
            </h4>
            <p className="text-[10px] text-slate-400">335 diagnostic lab & imaging tests with instant live search</p>
          </div>
        </div>

        {investigations.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-medical-700 bg-medical-50 px-2 py-0.5 rounded-full border border-medical-200">
              {investigations.length} advised
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-0.5 transition-colors"
              title="Clear all investigations"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Search Input with Auto-Suggestion Dropdown */}
      <div className="relative">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(0);
            }}
            onFocus={() => {
              if (searchTerm.trim()) {
                setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type test name or acronym (e.g. CBC, USG, FBS, Creatinine, X-Ray, LFT, CT, MRI)..."
            className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:outline-none transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setIsOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Floating Suggestions Dropdown */}
        {isOpen && filteredSuggestions.length > 0 && (
          <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="p-1.5 bg-slate-50/80 px-3 flex items-center justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              <span>Matching Diagnostic Tests ({filteredSuggestions.length})</span>
              <span>Press Enter or click to add</span>
            </div>
            {filteredSuggestions.map((item, idx) => {
              const isSelected = investigations.includes(item.name);
              const isHighlighted = idx === highlightedIndex;

              return (
                <button
                  key={`${item.name}-${idx}`}
                  type="button"
                  onClick={() => handleAdd(item.name)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                    isHighlighted ? 'bg-medical-50/70 text-medical-950' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900 truncate">{item.name}</span>
                      {item.aliases && item.aliases.length > 0 && (
                        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline truncate">
                          ({item.aliases.slice(0, 2).join(', ')})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(
                        item.category
                      )}`}
                    >
                      {item.category}
                    </span>

                    {isSelected ? (
                      <span className="text-emerald-600 flex items-center gap-0.5 text-[11px] font-bold">
                        <Check className="w-3.5 h-3.5" /> Added
                      </span>
                    ) : (
                      <span className="text-medical-600 text-xs font-semibold hover:underline">
                        + Add
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {isOpen && searchTerm.trim() && filteredSuggestions.length === 0 && (
          <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-center">
            <p className="text-xs text-slate-600">
              No matching standard test for <span className="font-bold text-slate-900">"{searchTerm}"</span>
            </p>
            <button
              type="button"
              onClick={() => handleAdd(searchTerm)}
              className="mt-2 text-xs font-semibold text-medical-700 bg-medical-50 hover:bg-medical-100 border border-medical-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add as custom investigation
            </button>
          </div>
        )}
      </div>

      {/* Quick Common Diagnostic Tests Chips */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Frequently Advised Lab & Diagnostic Tests
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">1-Click quick toggle</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
          {COMMON_INVESTIGATIONS_QUICK.map((test) => {
            const isSelected = investigations.includes(test);
            return (
              <button
                key={test}
                type="button"
                onClick={() =>
                  isSelected
                    ? onChange(investigations.filter((t) => t !== test))
                    : handleAdd(test)
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-medical-700 text-white shadow-2xs font-semibold'
                    : 'bg-slate-50 hover:bg-medical-50 text-slate-700 hover:text-medical-800 border border-slate-200'
                }`}
              >
                <span>{isSelected ? '✓' : '+'}</span>
                <span>{test}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Investigations List on the Prescription */}
      {investigations.length > 0 && (
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700">
              Tests to be included on Prescription Pad ({investigations.length}):
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {investigations.map((inv, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-medical-50/80 border border-medical-200/90 text-medical-950 text-xs font-semibold shadow-2xs"
              >
                <span className="text-medical-700 font-mono text-[11px] font-bold">{idx + 1}.</span>
                <span>{inv}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="text-medical-400 hover:text-rose-600 p-0.5 rounded transition-colors ml-1"
                  title="Remove test"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
