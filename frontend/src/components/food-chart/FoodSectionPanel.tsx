import React, { useMemo, useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import { FoodSectionType, IFoodCatalogItem, IFoodChartEntry } from '../../types';

interface FoodSectionPanelProps {
  variant: FoodSectionType;
  title: string;
  titleBn: string;
  catalogItems: IFoodCatalogItem[];
  selectedItems: IFoodChartEntry[];
  disabled?: boolean;
  onToggleCatalogItem: (item: IFoodCatalogItem) => void;
  onAddCustomItem: (entry: {
    labelBn: string;
    portion?: string;
    timing?: string;
    prepNote?: string;
  }) => void;
  onRemoveSelectedByIndex: (index: number) => void;
}

export const FoodSectionPanel: React.FC<FoodSectionPanelProps> = ({
  variant,
  title,
  titleBn,
  catalogItems,
  selectedItems,
  disabled = false,
  onToggleCatalogItem,
  onAddCustomItem,
  onRemoveSelectedByIndex,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const [customLabel, setCustomLabel] = useState('');
  const [customPortion, setCustomPortion] = useState('');
  const [customTiming, setCustomTiming] = useState('');
  const [customPrepNote, setCustomPrepNote] = useState('');

  const categories = useMemo(() => {
    const set = new Set<string>();
    catalogItems.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [catalogItems]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredCatalog = useMemo(() => {
    return catalogItems.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (normalizedSearch) {
        return (
          item.labelBn.toLowerCase().includes(normalizedSearch) ||
          item.category.toLowerCase().includes(normalizedSearch)
        );
      }
      return true;
    });
  }, [catalogItems, selectedCategory, normalizedSearch]);

  const customSelectedEntries = useMemo(() => {
    return selectedItems
      .map((entry, idx) => ({ entry, index: idx }))
      .filter(({ entry }) => {
        const isCatalogMatch =
          !entry.isCustom &&
          Boolean(entry.catalogItemId) &&
          catalogItems.some((c) => c._id === entry.catalogItemId);
        if (isCatalogMatch) return false;

        if (selectedCategory !== 'ALL' && selectedCategory !== 'Custom') {
          return false;
        }
        if (normalizedSearch) {
          return entry.labelBn.toLowerCase().includes(normalizedSearch);
        }
        return true;
      });
  }, [selectedItems, catalogItems, selectedCategory, normalizedSearch]);

  const isAllowed = variant === 'allowed';
  const accentText = isAllowed ? 'text-[#007086]' : 'text-rose-700';
  const checkedCardClass = isAllowed
    ? 'border-[#007086] bg-[#f0f9fa] text-slate-900'
    : 'border-rose-700 bg-rose-50/70 text-slate-900';
  const checkedBoxClass = isAllowed
    ? 'bg-[#007086] border-[#007086] text-white'
    : 'bg-rose-700 border-rose-700 text-white';

  const handleSubmitCustom = () => {
    const trimmedName = customLabel.trim();
    if (!trimmedName || disabled) return;

    onAddCustomItem({
      labelBn: trimmedName,
      portion: customPortion.trim() || undefined,
      timing: customTiming.trim() || undefined,
      prepNote: customPrepNote.trim() || undefined,
    });

    setCustomLabel('');
    setCustomPortion('');
    setCustomTiming('');
    setCustomPrepNote('');
    setShowCustomForm(false);
  };

  return (
    <section
      aria-label={`${title} selector`}
      className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className={`text-sm font-bold ${accentText}`} aria-hidden="true">
            {isAllowed ? '✓' : '✕'}
          </span>
          <h3 className="text-sm font-semibold text-slate-900 truncate">{title}</h3>
          <span className="font-bengali text-sm font-semibold text-slate-600 truncate">
            {titleBn}
          </span>
        </div>
        <span className="text-xs font-medium text-slate-600 tabular-nums shrink-0">
          {selectedItems.length} selected
        </span>
      </div>

      {/* Filter & Custom Trigger Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="খাবারের নাম খুঁজুন..."
            aria-label={`Search ${title}`}
            className="w-full pl-9 pr-3 py-2 text-xs font-bengali bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086] focus:border-[#007086]"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label={`Filter ${title} by category`}
          className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#007086] focus:border-[#007086]"
        >
          <option value="ALL">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {!disabled && (
          <button
            type="button"
            onClick={() => setShowCustomForm((prev) => !prev)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shrink-0"
          >
            {showCustomForm ? (
              <>
                <X className="w-4 h-4" strokeWidth={1.5} />
                <span>Close</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" strokeWidth={1.5} />
                <span>Custom</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Inline Custom Food Form */}
      {showCustomForm && !disabled && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Food name / খাবারের নাম *
              </label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmitCustom();
                  }
                }}
                placeholder="যেমন: কুসুম গরম লেবু পানি"
                className="w-full px-3 py-2 text-xs font-bengali bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Portion (optional)
              </label>
              <input
                type="text"
                value={customPortion}
                onChange={(e) => setCustomPortion(e.target.value)}
                placeholder="e.g. 1 cup / ১ কাপ"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Timing (optional)
              </label>
              <input
                type="text"
                value={customTiming}
                onChange={(e) => setCustomTiming(e.target.value)}
                placeholder="e.g. Morning empty stomach"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Prep note (optional)
              </label>
              <input
                type="text"
                value={customPrepNote}
                onChange={(e) => setCustomPrepNote(e.target.value)}
                placeholder="e.g. Low salt, boiled without skin"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowCustomForm(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/70 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!customLabel.trim()}
              onClick={handleSubmitCustom}
              className="px-3 py-1.5 text-xs font-medium bg-[#007086] hover:bg-[#065b6d] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Item
            </button>
          </div>
        </div>
      )}

      {/* Unified Unclipped Checkbox Grid (Bengali Labels Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filteredCatalog.map((item) => {
          const isChecked = selectedItems.some(
            (entry) =>
              entry.catalogItemId === item._id ||
              (!entry.isCustom && entry.labelBn.trim() === item.labelBn.trim())
          );

          return (
            <button
              key={item._id}
              type="button"
              role="checkbox"
              aria-checked={isChecked}
              disabled={disabled}
              onClick={() => onToggleCatalogItem(item)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                isChecked
                  ? checkedCardClass
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-800'
              } ${disabled ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  isChecked ? checkedBoxClass : 'border-slate-300 bg-white'
                }`}
              >
                {isChecked && <Check className="w-3 h-3" strokeWidth={2.2} />}
              </span>
              <span className="font-bengali text-[13px] font-medium leading-snug break-words">
                {item.labelBn}
              </span>
            </button>
          );
        })}

        {customSelectedEntries.map(({ entry, index }) => (
          <button
            key={`custom-${index}-${entry.labelBn}`}
            type="button"
            role="checkbox"
            aria-checked={true}
            disabled={disabled}
            onClick={() => onRemoveSelectedByIndex(index)}
            className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-colors ${checkedCardClass} ${
              disabled ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <span
              className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checkedBoxClass}`}
            >
              <Check className="w-3 h-3" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="font-bengali text-[13px] font-medium leading-snug break-words">
                {entry.labelBn}
              </div>
              {(entry.portion || entry.timing || entry.prepNote) && (
                <div className="text-xs text-slate-600 leading-snug break-words">
                  {[entry.portion, entry.timing, entry.prepNote].filter(Boolean).join(' • ')}
                </div>
              )}
            </div>
          </button>
        ))}

        {filteredCatalog.length === 0 && customSelectedEntries.length === 0 && (
          <div className="sm:col-span-2 py-6 text-center text-xs text-slate-500">
            No matching food items found.
          </div>
        )}
      </div>
    </section>
  );
};
