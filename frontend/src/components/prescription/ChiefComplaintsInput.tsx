import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, X, Stethoscope, Search, Check, Trash2, Clock } from 'lucide-react';
import { IPrescriptionChiefComplaint } from '../../types';
import {
  COMMON_CHIEF_COMPLAINTS_QUICK,
  DURATION_PRESETS,
  searchChiefComplaints,
} from '../../data/chiefComplaints';

interface ChiefComplaintsInputProps {
  complaints: IPrescriptionChiefComplaint[];
  onChange: (complaints: IPrescriptionChiefComplaint[]) => void;
}

/**
 * Smart natural language parser that detects duration in English and Bengali
 * (e.g., "Fever for 3 days", "Fever 3 days", "Fever - 5 days", "জ্বর ৩ দিন")
 */
const parseComplaintAndDuration = (input: string): { complaint: string; duration?: string } => {
  const trimmed = input.trim();
  if (!trimmed) return { complaint: '' };

  // Format: "Fever (3 days)"
  const parenthesized = trimmed.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (parenthesized) {
    return { complaint: parenthesized[1].trim(), duration: parenthesized[2].trim() };
  }

  // Format: "Fever for 3 days", "Fever - 3 days", "Fever x 3 days", "Fever 3 days", "জ্বর ৩ দিন"
  const durationMatch = trimmed.match(
    /^(.+?)(?:\s+(?:for|-|x|since)\s+|\s+)([0-9০-৯]+\s*(?:days?|weeks?|months?|years?|hours?|d|w|m|y|দিন|মাস|সপ্তাহ|বছর|ঘণ্টা)|since\s+[\w\s]+|yesterday|today)$/i
  );
  if (durationMatch) {
    return { complaint: durationMatch[1].trim(), duration: durationMatch[2].trim() };
  }

  return { complaint: trimmed };
};

export const ChiefComplaintsInput: React.FC<ChiefComplaintsInputProps> = ({
  complaints,
  onChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [durationText, setDurationText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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

  // Filtered symptoms based on search term
  const filteredSuggestions = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }
    return searchChiefComplaints(searchTerm);
  }, [searchTerm]);

  // Update duration for a specific complaint by index
  const handleUpdateDuration = (index: number, newDuration: string) => {
    if (index < 0 || index >= complaints.length) return;
    const updated = [...complaints];
    updated[index] = {
      ...updated[index],
      duration: newDuration.trim() || undefined,
    };
    onChange(updated);
  };

  // When duration text input changes
  const handleDurationInputChange = (val: string) => {
    setDurationText(val);
    const targetIdx =
      activeIndex !== null && complaints[activeIndex]
        ? activeIndex
        : complaints.length > 0
        ? complaints.length - 1
        : null;

    if (targetIdx !== null) {
      handleUpdateDuration(targetIdx, val);
    }
  };

  // When doctor clicks a duration preset chip
  const handlePresetClick = (dp: string) => {
    setDurationText(dp);
    const targetIdx =
      activeIndex !== null && complaints[activeIndex]
        ? activeIndex
        : complaints.length > 0
        ? complaints.length - 1
        : null;

    if (targetIdx !== null) {
      handleUpdateDuration(targetIdx, dp);
      setActiveIndex(targetIdx);
    }
  };

  const handleAdd = (complaintRaw: string, explicitDuration?: string) => {
    const parsed = parseComplaintAndDuration(complaintRaw);
    const complaintName = parsed.complaint.trim();
    if (!complaintName) return;

    const finalDuration =
      explicitDuration?.trim() || parsed.duration?.trim() || durationText.trim() || undefined;

    // Check if complaint already exists
    const existingIdx = complaints.findIndex(
      (c) => c.complaint.toLowerCase() === complaintName.toLowerCase()
    );

    if (existingIdx >= 0) {
      // If complaint exists, update its duration
      const updated = [...complaints];
      updated[existingIdx] = {
        ...updated[existingIdx],
        duration: finalDuration || updated[existingIdx].duration,
      };
      onChange(updated);
      setActiveIndex(existingIdx);
      if (finalDuration) setDurationText(finalDuration);
      setSearchTerm('');
      setIsOpen(false);
      return;
    }

    // Add new complaint
    const newComplaint: IPrescriptionChiefComplaint = {
      complaint: complaintName,
      duration: finalDuration,
    };

    const nextComplaints = [...complaints, newComplaint];
    onChange(nextComplaints);
    setActiveIndex(nextComplaints.length - 1);
    if (finalDuration) setDurationText(finalDuration);
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemove = (index: number) => {
    const nextComplaints = complaints.filter((_, i) => i !== index);
    onChange(nextComplaints);
    if (activeIndex === index) {
      setActiveIndex(nextComplaints.length > 0 ? nextComplaints.length - 1 : null);
      setDurationText(nextComplaints.length > 0 ? nextComplaints[nextComplaints.length - 1].duration || '' : '');
    } else if (activeIndex !== null && activeIndex > index) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const handleClearAll = () => {
    onChange([]);
    setActiveIndex(null);
    setDurationText('');
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
        handleAdd(filteredSuggestions[highlightedIndex].name, durationText);
      } else if (searchTerm.trim()) {
        handleAdd(searchTerm, durationText);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Category badge styling for 19 symptom categories
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'General Symptoms':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Head and Neurological Symptoms':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Eye Symptoms':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Ear, Nose and Throat Symptoms':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Respiratory Symptoms':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Cardiovascular Symptoms':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Gastrointestinal Symptoms':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Urinary Symptoms':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Musculoskeletal Symptoms':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Skin and Hair Symptoms':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'Endocrine and Metabolic Symptoms':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'Male Reproductive Symptoms':
      case 'Female Reproductive and Gynecological Symptoms':
        return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
      case 'Pregnancy-Related Complaints':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pediatric Complaints':
        return 'bg-lime-50 text-lime-700 border-lime-200';
      case 'Dental and Oral Symptoms':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Mental Health and Behavioral Symptoms':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Common Symptoms in Clinical Practice':
        return 'bg-medical-50 text-medical-800 border-medical-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-medical-50 border border-medical-200 flex items-center justify-center text-medical-700">
            <Stethoscope className="w-4 h-4 text-medical-600" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              Chief Complaints (C/C)
            </h4>
            <p className="text-[10px] text-slate-400">Clinical symptom reference with instant live search</p>
          </div>
        </div>

        {complaints.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-medical-700 bg-medical-50 px-2 py-0.5 rounded-full border border-medical-200">
              {complaints.length} added
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-0.5 transition-colors cursor-pointer"
              title="Clear all chief complaints"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Search Input and Duration Controls */}
      <div className="relative">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Symptom Search Box */}
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
              placeholder="Search symptom or type (e.g. Fever, Cough, Chest pain, বমি, পেটে ব্যথা)..."
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

          {/* Duration Input */}
          <div className="relative w-36 sm:w-44 shrink-0">
            <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={durationText}
              onChange={(e) => handleDurationInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (searchTerm.trim()) {
                    handleAdd(searchTerm, durationText);
                  } else {
                    const targetIdx =
                      activeIndex !== null && complaints[activeIndex]
                        ? activeIndex
                        : complaints.length > 0
                        ? complaints.length - 1
                        : null;
                    if (targetIdx !== null) {
                      handleUpdateDuration(targetIdx, durationText);
                    }
                  }
                }
              }}
              placeholder="Duration (e.g. 3 days)"
              className="w-full pl-8 pr-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Live Floating Suggestions Dropdown */}
        {isOpen && filteredSuggestions.length > 0 && (
          <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="p-1.5 bg-slate-50/80 px-3 flex items-center justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              <span>Matching Symptoms ({filteredSuggestions.length})</span>
              <span>Press Enter or click to add</span>
            </div>
            {filteredSuggestions.map((item, idx) => {
              const isSelected = complaints.some(
                (c) => c.complaint.toLowerCase() === item.name.toLowerCase()
              );
              const isHighlighted = idx === highlightedIndex;

              return (
                <button
                  key={`${item.name}-${idx}`}
                  type="button"
                  onClick={() => handleAdd(item.name, durationText)}
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
              No matching clinical symptom for <span className="font-bold text-slate-900">"{searchTerm}"</span>
            </p>
            <button
              type="button"
              onClick={() => handleAdd(searchTerm, durationText)}
              className="mt-2 text-xs font-semibold text-medical-700 bg-medical-50 hover:bg-medical-100 border border-medical-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add as custom complaint
            </button>
          </div>
        )}
      </div>

      {/* Quick Duration Presets */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
          Duration Presets:
        </span>
        {DURATION_PRESETS.map((dp) => {
          const activeDuration =
            activeIndex !== null && complaints[activeIndex]
              ? complaints[activeIndex].duration
              : durationText;
          const isCurrent = activeDuration === dp;

          return (
            <button
              key={dp}
              type="button"
              onClick={() => handlePresetClick(dp)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors cursor-pointer ${
                isCurrent
                  ? 'bg-medical-600 text-white border-medical-600 font-semibold shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-medical-50 hover:text-medical-700 hover:border-medical-200'
              }`}
            >
              {dp}
            </button>
          );
        })}
      </div>

      {/* Quick Common Symptoms Chips */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Frequently Advised Chief Complaints
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">1-Click quick toggle</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
          {COMMON_CHIEF_COMPLAINTS_QUICK.map((symptom) => {
            const isSelected = complaints.some(
              (c) => c.complaint.toLowerCase() === symptom.toLowerCase()
            );
            return (
              <button
                key={symptom}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    const existing = complaints.find(
                      (c) => c.complaint.toLowerCase() === symptom.toLowerCase()
                    );
                    // If user has entered a new duration, update it instead of removing
                    if (durationText && existing && existing.duration !== durationText) {
                      handleAdd(symptom, durationText);
                    } else {
                      onChange(
                        complaints.filter(
                          (c) => c.complaint.toLowerCase() !== symptom.toLowerCase()
                        )
                      );
                    }
                  } else {
                    handleAdd(symptom, durationText || '3 days');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-medical-700 text-white shadow-2xs font-semibold'
                    : 'bg-slate-50 hover:bg-medical-50 text-slate-700 hover:text-medical-800 border border-slate-200'
                }`}
              >
                <span>{isSelected ? '✓' : '+'}</span>
                <span>{symptom}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Complaints List on the Prescription Pad */}
      {complaints.length > 0 && (
        <div className="pt-2.5 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700">
              Complaints to be included on Prescription Pad ({complaints.length}):
            </span>
            <span className="text-[10px] text-slate-400">
              Click complaint to customize duration or edit inline
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {complaints.map((c, idx) => {
              const isActive = activeIndex === idx;

              return (
                <div
                  key={`${c.complaint}-${idx}`}
                  onClick={() => {
                    setActiveIndex(idx);
                    setDurationText(c.duration || '');
                  }}
                  className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-medical-50/90 border-medical-400 ring-2 ring-medical-500/20 text-medical-950 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800'
                  }`}
                >
                  <span className="font-mono text-[11px] font-bold text-medical-700">{idx + 1}.</span>
                  <span className="font-semibold text-slate-900">{c.complaint}</span>

                  {/* Inline Editable Duration Field */}
                  <div
                    className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5 focus-within:border-medical-500 focus-within:ring-1 focus-within:ring-medical-500/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Clock className="w-3 h-3 text-medical-600 shrink-0" />
                    <input
                      type="text"
                      value={c.duration || ''}
                      placeholder="Add duration"
                      onChange={(e) => {
                        handleUpdateDuration(idx, e.target.value);
                        setDurationText(e.target.value);
                        setActiveIndex(idx);
                      }}
                      className="w-20 sm:w-24 bg-transparent text-[11px] font-semibold text-medical-900 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(idx);
                    }}
                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors ml-0.5 cursor-pointer"
                    title="Remove complaint"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
