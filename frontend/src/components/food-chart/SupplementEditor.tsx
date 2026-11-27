import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { IFoodChartSupplement } from '../../types';

interface SupplementEditorProps {
  supplements: IFoodChartSupplement[];
  disabled?: boolean;
  onChange: (next: IFoodChartSupplement[]) => void;
}

export const SupplementEditor: React.FC<SupplementEditorProps> = ({
  supplements,
  disabled = false,
  onChange,
}) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [instructions, setInstructions] = useState('');

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<IFoodChartSupplement>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    order: 0,
  });

  const handleAdd = () => {
    const trimmedName = name.trim();
    if (!trimmedName || disabled) return;

    const next: IFoodChartSupplement[] = [
      ...supplements,
      {
        name: trimmedName,
        dosage: dosage.trim() || undefined,
        frequency: frequency.trim() || undefined,
        duration: duration.trim() || undefined,
        instructions: instructions.trim() || undefined,
        order: supplements.length,
      },
    ];
    onChange(next);
    setName('');
    setDosage('');
    setFrequency('');
    setDuration('');
    setInstructions('');
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    if (disabled) return;
    const target = index + direction;
    if (target < 0 || target >= supplements.length) return;
    const copy = [...supplements];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    onChange(copy.map((item, idx) => ({ ...item, order: idx })));
  };

  const handleRemove = (index: number) => {
    if (disabled) return;
    const copy = supplements
      .filter((_, idx) => idx !== index)
      .map((item, idx) => ({ ...item, order: idx }));
    onChange(copy);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const startEdit = (index: number) => {
    if (disabled) return;
    const target = supplements[index];
    setEditingIndex(index);
    setEditDraft({
      name: target.name,
      dosage: target.dosage || '',
      frequency: target.frequency || '',
      duration: target.duration || '',
      instructions: target.instructions || '',
      order: index,
    });
  };

  const saveEdit = () => {
    if (editingIndex === null || !editDraft.name.trim()) return;
    const copy = supplements.map((item, idx) =>
      idx === editingIndex
        ? {
            name: editDraft.name.trim(),
            dosage: editDraft.dosage?.trim() || undefined,
            frequency: editDraft.frequency?.trim() || undefined,
            duration: editDraft.duration?.trim() || undefined,
            instructions: editDraft.instructions?.trim() || undefined,
            order: idx,
          }
        : item
    );
    onChange(copy);
    setEditingIndex(null);
  };

  return (
    <section
      aria-label="Manual supplements"
      className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-baseline gap-2 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">Doctor-Prescribed Supplements</h3>
          <span className="font-bengali text-sm font-medium text-slate-600 truncate">
            সাপ্লিমেন্টস
          </span>
        </div>
        <span className="text-xs font-medium text-slate-600 tabular-nums shrink-0">
          {supplements.length} added
        </span>
      </div>

      {/* Compact Responsive Entry Bar (Zero Horizontal Overflow) */}
      {!disabled && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2">
            <div className="lg:col-span-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Supplement Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name manually"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086]"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Dosage</label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="Dosage"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086]"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Frequency</label>
              <input
                type="text"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="Frequency"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086]"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Duration"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086]"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-2 flex items-end">
              <button
                type="button"
                disabled={!name.trim()}
                onClick={handleAdd}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#007086] hover:bg-[#065b6d] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} />
                <span>Add</span>
              </button>
            </div>
          </div>

          <div>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Optional instructions (e.g. after meal)"
              aria-label="Supplement instructions"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086]"
            />
          </div>
        </div>
      )}

      {/* Responsive Stacked Cards */}
      {supplements.length === 0 ? (
        <p className="text-xs text-slate-500 py-2">
          No supplements entered. Supplements are optional and entered manually by the physician.
        </p>
      ) : (
        <div className="space-y-2">
          {supplements.map((sup, idx) => {
            const isEditing = editingIndex === idx;
            return (
              <div
                key={`${sup.name}-${idx}`}
                className="border border-slate-200 rounded-lg p-3 bg-white"
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editDraft.name}
                        onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                        placeholder="Supplement Name"
                        className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={editDraft.dosage || ''}
                        onChange={(e) => setEditDraft({ ...editDraft, dosage: e.target.value })}
                        placeholder="Dosage"
                        className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={editDraft.frequency || ''}
                        onChange={(e) => setEditDraft({ ...editDraft, frequency: e.target.value })}
                        placeholder="Frequency"
                        className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={editDraft.duration || ''}
                        onChange={(e) => setEditDraft({ ...editDraft, duration: e.target.value })}
                        placeholder="Duration"
                        className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={editDraft.instructions || ''}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, instructions: e.target.value })
                        }
                        placeholder="Instructions"
                        className="sm:col-span-2 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingIndex(null)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        <X className="w-4 h-4" strokeWidth={1.5} /> Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!editDraft.name.trim()}
                        onClick={saveEdit}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#007086] text-white rounded-lg disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" strokeWidth={1.5} /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-slate-500 tabular-nums">
                          {idx + 1}.
                        </span>
                        <span className="text-xs font-semibold text-slate-900 break-words">
                          {sup.name}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 pl-4">
                        {sup.dosage && <span>Dosage: {sup.dosage}</span>}
                        {sup.frequency && <span>Frequency: {sup.frequency}</span>}
                        {sup.duration && <span>Duration: {sup.duration}</span>}
                        {sup.instructions && <span>Note: {sup.instructions}</span>}
                      </div>
                    </div>

                    {!disabled && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMove(idx, -1)}
                          disabled={idx === 0}
                          aria-label="Move supplement up"
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(idx, 1)}
                          disabled={idx === supplements.length - 1}
                          aria-label="Move supplement down"
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(idx)}
                          aria-label="Edit supplement"
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                        >
                          <Pencil className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(idx)}
                          aria-label="Remove supplement"
                          className="p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
