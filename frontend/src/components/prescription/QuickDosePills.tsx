import React from 'react';

interface QuickDosePillsProps {
  frequency: string;
  onFrequencyChange: (freq: string) => void;
  dose: string;
  onDoseChange: (dose: string) => void;
  duration: string;
  onDurationChange: (dur: string) => void;
  instruction: string;
  onInstructionChange: (inst: string) => void;
  dosageForm?: string;
}

export const QuickDosePills: React.FC<QuickDosePillsProps> = ({
  frequency,
  onFrequencyChange,
  dose,
  onDoseChange,
  duration,
  onDurationChange,
  instruction,
  onInstructionChange,
  dosageForm = 'Tablet',
}) => {
  const commonFrequencies = [
    { label: '1+0+0', desc: 'Morning' },
    { label: '0+1+0', desc: 'Noon' },
    { label: '0+0+1', desc: 'Night' },
    { label: '1+0+1', desc: 'Morn+Night' },
    { label: '1+1+1', desc: '3 Times' },
    { label: '1+1+1+1', desc: '4 Times' },
  ];

  const commonDurations = [
    '3 days',
    '5 days',
    '7 days',
    '10 days',
    '14 days',
    '1 month',
    'Continue (চলবে)',
  ];

  const commonInstructions = [
    'After meal (খাবার পর)',
    'Before meal (খাবার আগে)',
    'With meal (খাবারের সাথে)',
    'At bedtime (রাতে শোবার আগে)',
    'Empty stomach (খালি পেটে)',
    'When needed for pain/fever (ব্যথা/জ্বর হলে)',
  ];

  const formDosePresets =
    dosageForm === 'Syrup' || dosageForm === 'Suspension'
      ? ['5 ml (1 tsp)', '10 ml (2 tsp)', '15 ml', '2.5 ml (1/2 tsp)']
      : dosageForm === 'Inhaler'
      ? ['1 puff', '2 puffs', '3 puffs']
      : dosageForm === 'Drops'
      ? ['1 drop', '2 drops', '3 drops']
      : ['1/2 tablet', '1 tablet', '2 tablets', '1 capsule'];

  return (
    <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70">
      {/* Frequency Pills */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Frequency (মাত্রা)
        </label>
        <div className="flex flex-wrap gap-1.5">
          {commonFrequencies.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => onFrequencyChange(f.label)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                frequency === f.label
                  ? 'bg-medical-600 text-white shadow-xs scale-105'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
          <input
            type="text"
            value={frequency}
            onChange={(e) => onFrequencyChange(e.target.value)}
            placeholder="Custom..."
            className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white font-mono focus:ring-1 focus:ring-medical-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Dose & Duration Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Dose Preset Pills */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Dose Unit
          </label>
          <div className="flex flex-wrap gap-1.5">
            {formDosePresets.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDoseChange(d)}
                className={`px-2 py-0.5 rounded-md text-xs font-medium transition-all ${
                  dose === d
                    ? 'bg-medical-700 text-white font-semibold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Duration Preset Pills */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Duration (সময়কাল)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {commonDurations.map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => onDurationChange(dur)}
                className={`px-2 py-0.5 rounded-md text-xs font-medium transition-all ${
                  duration === dur
                    ? 'bg-medical-700 text-white font-semibold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {dur}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Meal Instruction Pills */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Instruction (সেবন বিধি)
        </label>
        <div className="flex flex-wrap gap-1.5">
          {commonInstructions.map((inst) => (
            <button
              key={inst}
              type="button"
              onClick={() => onInstructionChange(inst)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                instruction === inst
                  ? 'bg-slate-800 text-white font-medium shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {inst}
            </button>
          ))}
          <input
            type="text"
            value={instruction}
            onChange={(e) => onInstructionChange(e.target.value)}
            placeholder="Custom instruction..."
            className="flex-1 min-w-[140px] px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-medical-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
