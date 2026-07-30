import React, { useState } from 'react';
import { Plus, X, Stethoscope } from 'lucide-react';
import { IPrescriptionChiefComplaint } from '../../types';

interface ChiefComplaintsInputProps {
  complaints: IPrescriptionChiefComplaint[];
  onChange: (complaints: IPrescriptionChiefComplaint[]) => void;
}

export const ChiefComplaintsInput: React.FC<ChiefComplaintsInputProps> = ({
  complaints,
  onChange,
}) => {
  const [inputText, setInputText] = useState('');
  const [durationText, setDurationText] = useState('');

  const commonSuggestions = [
    'Fever (জ্বর)',
    'Cough (কাশি)',
    'Headache (মাথাব্যথা)',
    'Chest pain (বুকে ব্যথা)',
    'Abdominal pain (পেটে ব্যথা)',
    'Epigastric burning (গ্যাস্ট্রিকের জ্বালাপোড়া)',
    'Body ache (শরীর ব্যথা)',
    'Runny nose (সর্দি)',
    'Weakness (দুর্বলতা)',
    'Shortness of breath (শ্বাসকষ্ট)',
  ];

  const durationPresets = ['1 day', '2 days', '3 days', '5 days', '1 week', '2 weeks', '1 month'];

  const handleAdd = (complaint: string, duration: string) => {
    if (!complaint.trim()) return;
    onChange([...complaints, { complaint: complaint.trim(), duration: duration.trim() || undefined }]);
    setInputText('');
    setDurationText('');
  };

  const handleRemove = (index: number) => {
    onChange(complaints.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Stethoscope className="w-4 h-4 text-medical-600" /> Chief Complaints (C/C)
        </h4>
        <span className="text-[11px] text-slate-400">Click suggestions or type custom</span>
      </div>

      {/* Input controls */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd(inputText, durationText)}
          placeholder="Chief complaint (e.g. Fever, Headache)..."
          className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-medical-500 focus:outline-none"
        />
        <input
          type="text"
          value={durationText}
          onChange={(e) => setDurationText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd(inputText, durationText)}
          placeholder="Duration (e.g. 3 days)..."
          className="w-36 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-medical-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => handleAdd(inputText, durationText)}
          className="px-3 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* Quick Suggestions */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1.5">
          {commonSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleAdd(s, durationText || '3 days')}
              className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-50 hover:bg-medical-50 text-slate-700 hover:text-medical-800 border border-slate-200 transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Complaints Chips */}
      {complaints.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {complaints.map((c, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-medical-50 border border-medical-200/70 text-medical-900 text-xs font-medium"
            >
              <span>{c.complaint}</span>
              {c.duration && (
                <span className="text-[10px] font-semibold text-medical-700 bg-medical-100 px-1.5 py-0.2 rounded">
                  {c.duration}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-medical-400 hover:text-rose-600 p-0.5 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
