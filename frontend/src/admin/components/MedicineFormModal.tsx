import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { DOSAGE_FORM_NAMES } from '../../data/dosageForms';
import { MANUFACTURER_NAMES } from '../../data/manufacturers';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  isPending: boolean;
  formError: string;
  brandName: string;
  setBrandName: (val: string) => void;
  genericName: string;
  setGenericName: (val: string) => void;
  medicineType: string;
  setMedicineType: (val: any) => void;
  dosageForm: string;
  setDosageForm: (val: string) => void;
  strength: string;
  setStrength: (val: string) => void;
  manufacturer: string;
  setManufacturer: (val: string) => void;
}

export const MedicineFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  isPending,
  formError,
  brandName,
  setBrandName,
  genericName,
  setGenericName,
  medicineType,
  setMedicineType,
  dosageForm,
  setDosageForm,
  strength,
  setStrength,
  manufacturer,
  setManufacturer,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#05080f]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#131924] border border-white/[0.08] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <h2 className="text-lg font-medium text-[#eef0f5]">
            {isEditing ? 'Edit Formulary Medicine' : 'Add New Medicine'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Napa"
                className="w-full bg-[#0d1119] border border-white/[0.1] rounded-lg py-2 px-3 text-xs text-[#eef0f5] placeholder-[#757d90] focus:outline-none focus:border-[#2ab0c7]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Generic Name *
              </label>
              <input
                type="text"
                required
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                placeholder="e.g. Paracetamol"
                className="w-full bg-[#0d1119] border border-white/[0.1] rounded-lg py-2 px-3 text-xs text-[#eef0f5] placeholder-[#757d90] focus:outline-none focus:border-[#2ab0c7]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Medicine System
              </label>
              <select
                value={medicineType}
                onChange={(e) => setMedicineType(e.target.value)}
                className="w-full bg-[#0d1119] border border-white/[0.1] rounded-lg py-2 px-3 text-xs text-[#eef0f5] placeholder-[#757d90] focus:outline-none focus:border-[#2ab0c7]"
              >
                <option value="Allopathic">Allopathic</option>
                <option value="Unani">Unani</option>
                <option value="Ayurvedic">Ayurvedic</option>
                <option value="Herbal">Herbal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Dosage Form
              </label>
              <select
                value={dosageForm}
                onChange={(e) => setDosageForm(e.target.value)}
                className="w-full bg-[#0d1119] border border-white/[0.1] rounded-lg py-2 px-3 text-xs text-[#eef0f5] placeholder-[#757d90] focus:outline-none focus:border-[#2ab0c7]"
              >
                {DOSAGE_FORM_NAMES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Strength
              </label>
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="e.g. 500 mg"
                className="w-full bg-[#0d1119] border border-white/[0.1] rounded-lg py-2 px-3 text-xs text-[#eef0f5] placeholder-[#757d90] focus:outline-none focus:border-[#2ab0c7]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a3a9b8] mb-1.5">
              Manufacturer
            </label>
            <input
              type="text"
              list="manufacturers-modal-list"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="e.g. Beximco Pharmaceuticals Ltd."
              className="w-full bg-[#0d1119] border border-white/[0.1] rounded-lg py-2 px-3 text-xs text-[#eef0f5] placeholder-[#757d90] focus:outline-none focus:border-[#2ab0c7]"
            />
            <datalist id="manufacturers-modal-list">
              {MANUFACTURER_NAMES.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>

          <div className="pt-4 flex justify-end gap-2.5 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#1b2232] hover:bg-[#232c40] border border-white/[0.1] text-[#a3a9b8] hover:text-[#eef0f5] text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-[#007086] hover:bg-[#088097] text-white text-xs font-medium transition-colors active:scale-[0.98]"
            >
              {isPending ? 'Saving...' : 'Save Medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
