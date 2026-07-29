import React from 'react';
import { ChevronUp, ChevronDown, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { IPrescriptionMedicine } from '../../types';

interface MedicineTableProps {
  medicines: IPrescriptionMedicine[];
  onUpdateMedicine: (index: number, updated: Partial<IPrescriptionMedicine>) => void;
  onRemoveMedicine: (index: number) => void;
  onMoveMedicine: (index: number, direction: 'up' | 'down') => void;
}

export const MedicineTable: React.FC<MedicineTableProps> = ({
  medicines,
  onUpdateMedicine,
  onRemoveMedicine,
  onMoveMedicine,
}) => {
  if (medicines.length === 0) {
    return (
      <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-1">
        <p className="text-sm font-semibold text-slate-600">No medicines added to this prescription yet.</p>
        <p className="text-xs text-slate-400">
          Search medicine above, configure frequency/duration, and click Add.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3 min-w-[180px]">Medicine & Form</th>
              <th className="py-2.5 px-3 min-w-[90px]">Dose</th>
              <th className="py-2.5 px-3 min-w-[100px]">Frequency</th>
              <th className="py-2.5 px-3 min-w-[100px]">Duration</th>
              <th className="py-2.5 px-3 min-w-[140px]">Instruction</th>
              <th className="py-2.5 px-3 w-20 text-center">Order / Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {medicines.map((med, index) => (
              <tr key={index} className="hover:bg-slate-50/60 transition-colors group">
                {/* Index */}
                <td className="py-2.5 px-3 text-center text-slate-400 font-mono font-bold">
                  {index + 1}
                </td>

                {/* Medicine info */}
                <td className="py-2.5 px-3 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      {med.dosageForm}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{med.brandName}</span>
                    {med.strength && (
                      <span className="text-medical-700 font-semibold">{med.strength}</span>
                    )}
                  </div>
                  {med.genericName && (
                    <p className="text-[11px] text-slate-400 italic">{med.genericName}</p>
                  )}
                </td>

                {/* Dose */}
                <td className="py-2.5 px-3">
                  <input
                    type="text"
                    value={med.dose}
                    onChange={(e) => onUpdateMedicine(index, { dose: e.target.value })}
                    className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-200 focus:border-medical-500 rounded focus:outline-none"
                  />
                </td>

                {/* Frequency */}
                <td className="py-2.5 px-3">
                  <input
                    type="text"
                    value={med.frequency}
                    onChange={(e) => onUpdateMedicine(index, { frequency: e.target.value })}
                    className="w-full px-2 py-1 font-mono font-bold text-medical-800 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-200 focus:border-medical-500 rounded focus:outline-none"
                  />
                </td>

                {/* Duration */}
                <td className="py-2.5 px-3">
                  <input
                    type="text"
                    value={med.duration}
                    onChange={(e) => onUpdateMedicine(index, { duration: e.target.value })}
                    className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-200 focus:border-medical-500 rounded focus:outline-none"
                  />
                </td>

                {/* Instruction */}
                <td className="py-2.5 px-3">
                  <input
                    type="text"
                    value={med.instruction}
                    onChange={(e) => onUpdateMedicine(index, { instruction: e.target.value })}
                    className="w-full px-2 py-1 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-200 focus:border-medical-500 rounded focus:outline-none"
                  />
                </td>

                {/* Order buttons & Delete */}
                <td className="py-2.5 px-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onMoveMedicine(index, 'up')}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400"
                      title="Move Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === medicines.length - 1}
                      onClick={() => onMoveMedicine(index, 'down')}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400"
                      title="Move Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveMedicine(index)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors ml-1"
                      title="Remove Medicine"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
