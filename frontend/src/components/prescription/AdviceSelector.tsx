import React, { useState } from 'react';
import { Plus, X, HeartHandshake } from 'lucide-react';

interface AdviceSelectorProps {
  advice: string[];
  onChange: (advice: string[]) => void;
}

export const COMMON_ADVICE_PRESETS = [
  'প্রতিদিন পর্যাপ্ত বিশুদ্ধ কুসুম গরম পানি (২.৫-৩ লিটার) পান করুন। (Drink plenty of water)',
  'পর্যাপ্ত শারীরিক ও মানসিক বিশ্রাম নিন। (Take adequate rest)',
  'অতিরিক্ত তেল, চর্বি, ঝাল ও ভাজাপোড়া খাবার পরিহার করুন। (Avoid oily & spicy food)',
  'পাতে বাড়তি কাঁচা লবণ একেবারেই খাওয়া নিষেধ। (Strictly avoid extra raw salt)',
  'চিনি, মিষ্টি, কোল্ড ড্রিংকস ও কোমল পানীয় বর্জন করুন। (Avoid sugar and sweets)',
  'প্রতিদিন ৩০-৪০ মিনিট হালকা ব্যায়াম বা দ্রুত হাঁটার অভ্যাস করুন। (Daily 30 mins walking)',
  'লবণ-গরম পানির গার্গল দিনে ৩-৪ বার করুন। (Warm salt water gargle 3-4 times daily)',
  'ধূমপান ও তামাকজাতীয় দ্রব্য পরিহার করুন। (Avoid smoking & tobacco)',
  'খাবার খাওয়ার সাথে সাথে শুয়ে পড়বেন না। (Do not lie down immediately after meals)',
  'চিকিৎসকের পরামর্শ ছাড়া কোনো ঔষধ বন্ধ করবেন না। (Do not stop medicines without advice)',
];

export const AdviceSelector: React.FC<AdviceSelectorProps> = ({ advice, onChange }) => {
  const [customText, setCustomText] = useState('');

  const handleAdd = (text: string) => {
    if (!text.trim()) return;
    if (advice.includes(text.trim())) return;
    onChange([...advice, text.trim()]);
    setCustomText('');
  };

  const handleRemove = (index: number) => {
    onChange(advice.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <HeartHandshake className="w-4 h-4 text-medical-600" /> Patient Advice (পরামর্শ)
        </h4>
        <span className="text-[11px] text-slate-400">Bangla & English clinical advice</span>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd(customText)}
          placeholder="Type custom advice in English or বাংলা..."
          className="flex-1 min-w-0 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-medical-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => handleAdd(customText)}
          className="px-3.5 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shrink-0 shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* Preset Chips */}
      <div className="space-y-1.5 max-h-36 overflow-y-auto">
        <div className="flex flex-wrap gap-1.5">
          {COMMON_ADVICE_PRESETS.map((preset) => {
            const isSelected = advice.includes(preset);
            return (
              <button
                key={preset}
                type="button"
                onClick={() => (isSelected ? onChange(advice.filter((a) => a !== preset)) : handleAdd(preset))}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium text-left transition-colors ${
                  isSelected
                    ? 'bg-medical-700 text-white shadow-2xs'
                    : 'bg-slate-50 hover:bg-medical-50 text-slate-700 hover:text-medical-800 border border-slate-200'
                }`}
              >
                {isSelected ? '✓ ' : '+ '}
                {preset}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Advice List */}
      {advice.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          {advice.map((adv, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-medical-50/60 border border-medical-200/60 text-xs text-slate-800"
            >
              <span className="font-medium">
                {idx + 1}. {adv}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-slate-400 hover:text-rose-600 p-1 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
