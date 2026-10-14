import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, X, BookmarkCheck, Search, Check, Trash2, Tag } from 'lucide-react';
import { IPrescriptionDiagnosis } from '../../types';
import {
  COMMON_DIAGNOSES_QUICK,
  searchDiagnoses,
} from '../../data/diagnoses';

interface DiagnosisSelectorProps {
  diagnoses: IPrescriptionDiagnosis[];
  onChange: (diagnoses: IPrescriptionDiagnosis[]) => void;
}

export const DiagnosisSelector: React.FC<DiagnosisSelectorProps> = ({ diagnoses, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [icdCode, setIcdCode] = useState('');
  const [diagType, setDiagType] = useState<'provisional' | 'confirmed' | 'differential'>('provisional');
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

  // Filtered diagnoses based on search term
  const filteredSuggestions = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }
    return searchDiagnoses(searchTerm);
  }, [searchTerm]);

  const handleAdd = (name: string, icd?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Check if already exists
    const exists = diagnoses.some((d) => d.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return;

    const newDiagnosis: IPrescriptionDiagnosis = {
      name: trimmed,
      icdCode: icd || icdCode.trim() || undefined,
      type: diagType,
    };

    onChange([...diagnoses, newDiagnosis]);
    setSearchTerm('');
    setIcdCode('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemove = (index: number) => {
    onChange(diagnoses.filter((_, i) => i !== index));
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
        const item = filteredSuggestions[highlightedIndex];
        handleAdd(item.name, item.icdCode);
      } else if (searchTerm.trim()) {
        handleAdd(searchTerm, icdCode);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Category badge styling for 23 diagnostic categories
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'General Medicine':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Infectious Diseases':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Respiratory Diseases':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Cardiovascular Diseases':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Gastrointestinal Diseases':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Liver and Biliary Diseases':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Kidney and Urinary Diseases':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Endocrine and Metabolic Diseases':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'Hematological Diseases':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Neurological Diseases':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Musculoskeletal and Rheumatological Diseases':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Dermatological Diseases':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'Eye Diseases':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Ear, Nose and Throat Diseases':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Male Reproductive Diseases':
      case 'Female Reproductive and Gynecological Diseases':
        return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
      case 'Pregnancy and Obstetric Conditions':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pediatric Diseases':
        return 'bg-lime-50 text-lime-700 border-lime-200';
      case 'Psychiatric Conditions':
      case 'Mental and Sleep-Related Conditions':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Dental and Oral Diseases':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Common Surgical Conditions':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-medical-50 text-medical-800 border-medical-200';
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-medical-50 border border-medical-200 flex items-center justify-center text-medical-700">
            <BookmarkCheck className="w-4 h-4 text-medical-600" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              Diagnosis (Dx)
            </h4>
            <p className="text-[10px] text-slate-400">23 medical specialties with instant ICD-10 & live taxonomy search</p>
          </div>
        </div>

        {diagnoses.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-medical-700 bg-medical-50 px-2 py-0.5 rounded-full border border-medical-200">
              {diagnoses.length} added
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-0.5 transition-colors"
              title="Clear all diagnoses"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Search Input, ICD-10, Type and Add Controls */}
      <div className="relative">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Diagnosis Search Box */}
          <div className="relative flex-1 min-w-[200px]">
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
              placeholder="Search disease, ICD-10 or acronym (e.g. Hypertension, HTN, T2DM, GERD, I10)..."
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

          {/* ICD-10 Input */}
          <div className="relative w-24 sm:w-28 shrink-0">
            <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={icdCode}
              onChange={(e) => setIcdCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd(searchTerm, icdCode)}
              placeholder="ICD-10"
              className="w-full pl-7 pr-2 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:outline-none font-mono transition-all"
            />
          </div>

          {/* Diagnosis Type Toggle Buttons */}
          <div className="hidden md:flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[10px] font-semibold shrink-0">
            {(['provisional', 'confirmed', 'differential'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDiagType(t)}
                className={`px-2 py-1 rounded capitalize transition-all ${
                  diagType === t
                    ? 'bg-white text-medical-800 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Add Button */}
          <button
            type="button"
            onClick={() => handleAdd(searchTerm, icdCode)}
            disabled={!searchTerm.trim()}
            className="px-3.5 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shrink-0 shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {/* Live Floating Suggestions Dropdown */}
        {isOpen && filteredSuggestions.length > 0 && (
          <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="p-1.5 bg-slate-50/80 px-3 flex items-center justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              <span>Matching Medical Diagnoses ({filteredSuggestions.length})</span>
              <span>Press Enter or click to add</span>
            </div>
            {filteredSuggestions.map((item, idx) => {
              const isSelected = diagnoses.some(
                (d) => d.name.toLowerCase() === item.name.toLowerCase()
              );
              const isHighlighted = idx === highlightedIndex;

              return (
                <button
                  key={`${item.name}-${idx}`}
                  type="button"
                  onClick={() => handleAdd(item.name, item.icdCode)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                    isHighlighted ? 'bg-medical-50/70 text-medical-950' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900 truncate">{item.name}</span>
                      {item.icdCode && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200 font-bold shrink-0">
                          {item.icdCode}
                        </span>
                      )}
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
              No matching clinical diagnosis for <span className="font-bold text-slate-900">"{searchTerm}"</span>
            </p>
            <button
              type="button"
              onClick={() => handleAdd(searchTerm, icdCode)}
              className="mt-2 text-xs font-semibold text-medical-700 bg-medical-50 hover:bg-medical-100 border border-medical-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add as custom diagnosis
            </button>
          </div>
        )}
      </div>

      {/* Quick Common Prescribing Diagnoses Chips */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Frequently Prescribed Diagnoses
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">1-Click quick toggle</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
          {COMMON_DIAGNOSES_QUICK.map((d) => {
            const isSelected = diagnoses.some(
              (item) => item.name.toLowerCase() === d.name.toLowerCase()
            );
            return (
              <button
                key={d.name}
                type="button"
                onClick={() =>
                  isSelected
                    ? onChange(
                        diagnoses.filter(
                          (item) => item.name.toLowerCase() !== d.name.toLowerCase()
                        )
                      )
                    : handleAdd(d.name, d.icdCode)
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-medical-700 text-white shadow-2xs font-semibold'
                    : 'bg-slate-50 hover:bg-medical-50 text-slate-700 hover:text-medical-800 border border-slate-200'
                }`}
              >
                <span>{isSelected ? '✓' : '+'}</span>
                <span>{d.name}</span>
                {d.icdCode && (
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                    ({d.icdCode})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Diagnoses List on the Prescription Pad */}
      {diagnoses.length > 0 && (
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700">
              Diagnoses to be included on Prescription Pad ({diagnoses.length}):
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {diagnoses.map((d, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-medical-50/80 border border-medical-200/90 text-medical-950 text-xs font-semibold shadow-2xs"
              >
                <span className="text-medical-700 font-mono text-[11px] font-bold">{idx + 1}.</span>
                <span>{d.name}</span>
                {d.icdCode && (
                  <span className="text-[10px] font-mono font-semibold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {d.icdCode}
                  </span>
                )}
                {d.type && d.type !== 'provisional' && (
                  <span className="text-[9px] uppercase font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                    {d.type}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="text-medical-400 hover:text-rose-600 p-0.5 rounded transition-colors ml-1"
                  title="Remove diagnosis"
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
