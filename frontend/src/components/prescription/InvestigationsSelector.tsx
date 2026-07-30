import React, { useState } from 'react';
import { Plus, X, Microscope } from 'lucide-react';

interface InvestigationsSelectorProps {
  investigations: string[];
  onChange: (investigations: string[]) => void;
}

export const COMMON_INVESTIGATIONS = [
  'CBC with ESR',
  'Fasting Blood Sugar (FBS) & 2 hrs ABF',
  'HbA1c (Glycated Hemoglobin)',
  'Serum Creatinine',
  'Fasting Lipid Profile',
  'Serum SGPT (ALT)',
  'Serum Uric Acid',
  'Serum Electrolytes (Na+, K+, Cl-)',
  'Urine Routine & Microscopic (R/M/E)',
  'Chest X-Ray P/A View',
  'ECG (12-Lead)',
  'USG of Whole Abdomen',
  'Dengue NS1 Antigen & CBC',
  'Thyroid Profile (TSH, FT4)',
  'Serum Bilirubin (Total & Direct)',
  'Serum Calcium & Vitamin D3',
];

export const InvestigationsSelector: React.FC<InvestigationsSelectorProps> = ({
  investigations,
  onChange,
}) => {
  const [customTest, setCustomTest] = useState('');

  const handleAdd = (test: string) => {
    if (!test.trim()) return;
    if (investigations.includes(test.trim())) return;
    onChange([...investigations, test.trim()]);
    setCustomTest('');
  };

  const handleRemove = (index: number) => {
    onChange(investigations.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Microscope className="w-4 h-4 text-medical-600" /> Investigations (Tests Advised)
        </h4>
        <span className="text-[11px] text-slate-400">Click to add diagnostic test</span>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customTest}
          onChange={(e) => setCustomTest(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd(customTest)}
          placeholder="Type custom test name (e.g. MRI Brain, Endoscopy)..."
          className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-medical-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => handleAdd(customTest)}
          className="px-3 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* Common Lab Tests Chips */}
      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
        {COMMON_INVESTIGATIONS.map((test) => {
          const isSelected = investigations.includes(test);
          return (
            <button
              key={test}
              type="button"
              onClick={() => (isSelected ? onChange(investigations.filter((t) => t !== test)) : handleAdd(test))}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                isSelected
                  ? 'bg-medical-700 text-white shadow-2xs'
                  : 'bg-slate-50 hover:bg-medical-50 text-slate-700 hover:text-medical-800 border border-slate-200'
              }`}
            >
              {isSelected ? '✓ ' : '+ '}
              {test}
            </button>
          );
        })}
      </div>

      {/* Selected Tests List */}
      {investigations.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {investigations.map((inv, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-medical-50 border border-medical-200/70 text-medical-950 text-xs font-semibold"
            >
              <span>
                {idx + 1}. {inv}
              </span>
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
