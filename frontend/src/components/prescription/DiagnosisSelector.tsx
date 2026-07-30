import React, { useState } from 'react';
import { Plus, X, Search, BookmarkCheck } from 'lucide-react';
import { IPrescriptionDiagnosis } from '../../types';

interface DiagnosisSelectorProps {
  diagnoses: IPrescriptionDiagnosis[];
  onChange: (diagnoses: IPrescriptionDiagnosis[]) => void;
}

export const COMMON_DIAGNOSES = [
  { name: 'Viral Upper Respiratory Tract Infection (URTI)', icdCode: 'J06.9' },
  { name: 'Acute Bronchitis', icdCode: 'J20.9' },
  { name: 'Essential (Primary) Hypertension', icdCode: 'I10' },
  { name: 'Type 2 Diabetes Mellitus', icdCode: 'E11.9' },
  { name: 'Gastro-esophageal Reflux Disease (GERD)', icdCode: 'K21.9' },
  { name: 'Peptic Ulcer Disease (PUD)', icdCode: 'K27.9' },
  { name: 'Allergic Rhinitis', icdCode: 'J30.4' },
  { name: 'Bronchial Asthma', icdCode: 'J45.9' },
  { name: 'Urinary Tract Infection (UTI)', icdCode: 'N39.0' },
  { name: 'Mixed Dyslipidemia', icdCode: 'E78.2' },
  { name: 'Osteoarthritis', icdCode: 'M19.9' },
  { name: 'Enteric Fever (Typhoid)', icdCode: 'A01.0' },
  { name: 'Dengue Fever', icdCode: 'A90' },
];

export const DiagnosisSelector: React.FC<DiagnosisSelectorProps> = ({ diagnoses, onChange }) => {
  const [inputText, setInputText] = useState('');
  const [icdCode, setIcdCode] = useState('');

  const handleAdd = (name: string, icd?: string) => {
    if (!name.trim()) return;
    if (diagnoses.some((d) => d.name.toLowerCase() === name.trim().toLowerCase())) return;
    onChange([...diagnoses, { name: name.trim(), icdCode: icd || undefined, type: 'provisional' }]);
    setInputText('');
    setIcdCode('');
  };

  const handleRemove = (index: number) => {
    onChange(diagnoses.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <BookmarkCheck className="w-4 h-4 text-medical-600" /> Diagnosis (Dx)
        </h4>
        <span className="text-[11px] text-slate-400">Search ICD-10 or common diagnosis</span>
      </div>

      {/* Input controls */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd(inputText, icdCode)}
          placeholder="Diagnosis name (e.g. Hypertension, Dengue)..."
          className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-medical-500 focus:outline-none"
        />
        <input
          type="text"
          value={icdCode}
          onChange={(e) => setIcdCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd(inputText, icdCode)}
          placeholder="ICD-10 (e.g. I10)..."
          className="w-28 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-medical-500 focus:outline-none font-mono"
        />
        <button
          type="button"
          onClick={() => handleAdd(inputText, icdCode)}
          className="px-3 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* Common Prescribing Diagnoses */}
      <div className="flex flex-wrap gap-1.5">
        {COMMON_DIAGNOSES.map((d) => (
          <button
            key={d.name}
            type="button"
            onClick={() => handleAdd(d.name, d.icdCode)}
            className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-50 hover:bg-medical-50 text-slate-700 hover:text-medical-800 border border-slate-200 transition-colors"
          >
            + {d.name} <span className="text-[10px] text-slate-400 font-mono">({d.icdCode})</span>
          </button>
        ))}
      </div>

      {/* Selected Diagnoses */}
      {diagnoses.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {diagnoses.map((d, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-medical-50 border border-medical-200/70 text-medical-950 text-xs font-bold"
            >
              <span>{d.name}</span>
              {d.icdCode && (
                <span className="text-[10px] font-mono text-slate-500 font-normal bg-white px-1.5 py-0.2 rounded border border-slate-200">
                  {d.icdCode}
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
