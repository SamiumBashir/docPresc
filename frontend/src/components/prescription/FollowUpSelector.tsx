import React from 'react';
import { Calendar, Clock } from 'lucide-react';

interface FollowUpSelectorProps {
  followUp: { duration: string; date?: string; notes?: string };
  onChange: (followUp: { duration: string; date?: string; notes?: string }) => void;
}

export const FollowUpSelector: React.FC<FollowUpSelectorProps> = ({ followUp, onChange }) => {
  const commonDurations = [
    '3 days',
    '5 days',
    '7 days',
    '10 days',
    '14 days',
    '1 month',
    '3 months',
    'If symptoms worsen / প্রয়োজন হলে',
  ];

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-medical-600" /> Follow-up (পরবর্তী সাক্ষাৎ)
        </h4>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {commonDurations.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onChange({ ...followUp, duration: d })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                followUp.duration === d
                  ? 'bg-medical-700 text-white font-semibold shadow-xs'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <input
            type="text"
            value={followUp.duration}
            onChange={(e) => onChange({ ...followUp, duration: e.target.value })}
            placeholder="Custom duration (e.g. 10 days)..."
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-medical-500 focus:outline-none"
          />
          <input
            type="text"
            value={followUp.notes || ''}
            onChange={(e) => onChange({ ...followUp, notes: e.target.value })}
            placeholder="Follow-up instructions (e.g. With report)..."
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-medical-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
