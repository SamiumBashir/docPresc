import React from 'react';
import { Activity, Heart, Thermometer, Gauge, Scale } from 'lucide-react';
import { IPrescriptionVitals } from '../../types';

interface VitalsWidgetProps {
  vitals: IPrescriptionVitals;
  onChange: (vitals: IPrescriptionVitals) => void;
}

export const VitalsWidget: React.FC<VitalsWidgetProps> = ({ vitals, onChange }) => {
  const updateField = (field: keyof IPrescriptionVitals, value: number | null) => {
    const updated = { ...vitals, [field]: value };
    onChange(updated);
  };

  const getBmiBadge = (bmi?: number | null) => {
    if (!bmi) return null;
    if (bmi < 18.5) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">Underweight</span>;
    if (bmi < 24.9) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">Normal</span>;
    if (bmi < 29.9) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">Overweight</span>;
    return <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200">Obese</span>;
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-medical-600" /> Patient Vitals (O/E)
        </h4>
        {vitals.bmi && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700">BMI: {vitals.bmi}</span>
            {getBmiBadge(vitals.bmi)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5">
        {/* Blood Pressure */}
        <div className="col-span-2 sm:col-span-1 space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Heart className="w-3 h-3 text-rose-500" /> BP (Sys / Dia)
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={vitals.bpSystolic || ''}
              onChange={(e) => updateField('bpSystolic', e.target.value ? Number(e.target.value) : null)}
              placeholder="120"
              className="w-full px-2 py-1.5 text-xs text-center border border-slate-200 rounded-lg focus:ring-1 focus:ring-medical-500 focus:outline-none font-mono font-semibold"
            />
            <span className="text-slate-400 font-bold">/</span>
            <input
              type="number"
              value={vitals.bpDiastolic || ''}
              onChange={(e) => updateField('bpDiastolic', e.target.value ? Number(e.target.value) : null)}
              placeholder="80"
              className="w-full px-2 py-1.5 text-xs text-center border border-slate-200 rounded-lg focus:ring-1 focus:ring-medical-500 focus:outline-none font-mono font-semibold"
            />
          </div>
        </div>

        {/* Pulse */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Activity className="w-3 h-3 text-medical-600" /> Pulse (bpm)
          </label>
          <input
            type="number"
            value={vitals.pulse || ''}
            onChange={(e) => updateField('pulse', e.target.value ? Number(e.target.value) : null)}
            placeholder="72"
            className="w-full px-2 py-1.5 text-xs text-center border border-slate-200 rounded-lg focus:ring-1 focus:ring-medical-500 focus:outline-none font-mono"
          />
        </div>

        {/* Temp */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-amber-500" /> Temp (°F)
          </label>
          <input
            type="number"
            step="0.1"
            value={vitals.temperature || ''}
            onChange={(e) => updateField('temperature', e.target.value ? Number(e.target.value) : null)}
            placeholder="98.4"
            className="w-full px-2 py-1.5 text-xs text-center border border-slate-200 rounded-lg focus:ring-1 focus:ring-medical-500 focus:outline-none font-mono"
          />
        </div>

        {/* SpO2 */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Gauge className="w-3 h-3 text-cyan-600" /> SpO2 (%)
          </label>
          <input
            type="number"
            value={vitals.spo2 || ''}
            onChange={(e) => updateField('spo2', e.target.value ? Number(e.target.value) : null)}
            placeholder="98"
            className="w-full px-2 py-1.5 text-xs text-center border border-slate-200 rounded-lg focus:ring-1 focus:ring-medical-500 focus:outline-none font-mono"
          />
        </div>

        {/* Weight */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Scale className="w-3 h-3 text-slate-500" /> Wt (kg)
          </label>
          <input
            type="number"
            step="0.5"
            value={vitals.weight || ''}
            onChange={(e) => updateField('weight', e.target.value ? Number(e.target.value) : null)}
            placeholder="70"
            className="w-full px-2 py-1.5 text-xs text-center border border-slate-200 rounded-lg focus:ring-1 focus:ring-medical-500 focus:outline-none font-mono"
          />
        </div>
      </div>
    </div>
  );
};
