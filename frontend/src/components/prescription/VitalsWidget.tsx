import React from 'react';
import { Activity, Heart, Scale, Thermometer } from 'lucide-react';
import { IPrescriptionVitals } from '../../types';

interface VitalsWidgetProps {
  vitals: IPrescriptionVitals;
  onChange: (vitals: IPrescriptionVitals) => void;
}

export const VitalsWidget: React.FC<VitalsWidgetProps> = ({ vitals, onChange }) => {
  const updateField = (field: keyof IPrescriptionVitals, value: number | null) => {
    onChange({ ...vitals, [field]: value });
  };

  const getBmiStatus = (bmi?: number | null) => {
    if (!bmi) return null;
    if (bmi < 18.5) {
      return (
        <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200">
          Underweight
        </span>
      );
    }
    if (bmi < 24.9) {
      return (
        <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
          Normal
        </span>
      );
    }
    if (bmi < 29.9) {
      return (
        <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200">
          Overweight
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-medium border border-rose-200">
        Obese
      </span>
    );
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#007086]" strokeWidth={1.5} />
          <span>Patient vitals (O/E)</span>
        </h4>
        {vitals.bmi && (
          <div className="flex items-center gap-2 tabular-nums">
            <span className="text-xs font-medium text-slate-700">BMI: {vitals.bmi}</span>
            {getBmiStatus(vitals.bmi)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Blood Pressure */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
            <Heart className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.5} />
            <span>BP (Sys / Dia)</span>
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              aria-label="Systolic blood pressure"
              value={vitals.bpSystolic || ''}
              onChange={(e) =>
                updateField('bpSystolic', e.target.value ? Number(e.target.value) : null)
              }
              placeholder="120"
              className="w-full min-w-0 px-2.5 py-2 text-xs text-center border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#007086] focus:border-[#007086] focus:outline-none font-mono tabular-nums font-medium text-slate-900"
            />
            <span className="text-slate-400 font-medium shrink-0">/</span>
            <input
              type="text"
              aria-label="Diastolic blood pressure"
              value={vitals.bpDiastolic || ''}
              onChange={(e) =>
                updateField('bpDiastolic', e.target.value ? Number(e.target.value) : null)
              }
              placeholder="80"
              className="w-full min-w-0 px-2.5 py-2 text-xs text-center border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#007086] focus:border-[#007086] focus:outline-none font-mono tabular-nums font-medium text-slate-900"
            />
          </div>
        </div>

        {/* Pulse */}
        <div className="space-y-1">
          <label
            htmlFor="vital-pulse"
            className="text-xs font-medium text-slate-600 flex items-center gap-1.5"
          >
            <Activity className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.5} />
            <span>Pulse (bpm)</span>
          </label>
          <input
            id="vital-pulse"
            type="text"
            value={vitals.pulse || ''}
            onChange={(e) => updateField('pulse', e.target.value ? Number(e.target.value) : null)}
            placeholder="72"
            className="w-full px-2.5 py-2 text-xs text-center border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#007086] focus:border-[#007086] focus:outline-none font-mono tabular-nums font-medium text-slate-900"
          />
        </div>

        {/* Temp */}
        <div className="space-y-1">
          <label
            htmlFor="vital-temp"
            className="text-xs font-medium text-slate-600 flex items-center gap-1.5"
          >
            <Thermometer className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.5} />
            <span>Temp (°F)</span>
          </label>
          <input
            id="vital-temp"
            type="number"
            step="0.1"
            value={vitals.temperature || ''}
            onChange={(e) =>
              updateField('temperature', e.target.value ? Number(e.target.value) : null)
            }
            placeholder="98.4"
            className="w-full px-2.5 py-2 text-xs text-center border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#007086] focus:border-[#007086] focus:outline-none font-mono tabular-nums font-medium text-slate-900"
          />
        </div>

        {/* Weight */}
        <div className="space-y-1">
          <label
            htmlFor="vital-weight"
            className="text-xs font-medium text-slate-600 flex items-center gap-1.5"
          >
            <Scale className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.5} />
            <span>Weight (kg)</span>
          </label>
          <input
            id="vital-weight"
            type="text"
            step="0.5"
            value={vitals.weight || ''}
            onChange={(e) => updateField('weight', e.target.value ? Number(e.target.value) : null)}
            placeholder="70"
            className="w-full px-2.5 py-2 text-xs text-center border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#007086] focus:border-[#007086] focus:outline-none font-mono tabular-nums font-medium text-slate-900"
          />
        </div>
      </div>
    </div>
  );
};
