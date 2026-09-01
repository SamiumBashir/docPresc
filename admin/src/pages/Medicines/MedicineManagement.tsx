import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pill,
  Search,
  Plus,
  Trash2,
  Edit2,
  Filter,
  Upload,
  AlertCircle,
  X,
  CheckCircle,
} from 'lucide-react';
import { api } from '../../api/client';
import { Medicine } from '../../types';
import { MANUFACTURER_NAMES } from '../../data/manufacturers';
import { DOSAGE_FORM_NAMES } from '../../data/dosageForms';

export const MedicineManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [formError, setFormError] = useState('');
  const [importMessage, setImportMessage] = useState('');

  // Form state
  const [brandName, setBrandName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [medicineType, setMedicineType] = useState<'Allopathic' | 'Unani' | 'Ayurvedic'>('Allopathic');
  const [formType, setFormType] = useState('Tablet');
  const [strength, setStrength] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [systemNameBangla, setSystemNameBangla] = useState('');
  const [defaultDose, setDefaultDose] = useState('1+0+1');
  const [defaultDuration, setDefaultDuration] = useState('7 days');
  const [defaultInstruction, setDefaultInstruction] = useState('After meal');

  const { data: medicines = [], isLoading } = useQuery<Medicine[]>({
    queryKey: ['admin-medicines', searchTerm, typeFilter],
    queryFn: async () => {
      let query = `/medicines?limit=200`;
      if (searchTerm) query += `&search=${encodeURIComponent(searchTerm)}`;
      if (typeFilter !== 'all') query += `&medicineType=${typeFilter}`;
      const res = await api<{ success: boolean; data: { medicines: Medicine[] } }>(query);
      const list = res.data?.medicines || (res as any).medicines || (Array.isArray(res.data) ? res.data : []) || [];
      return list;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingMedicine) {
        return api(`/medicines/${editingMedicine._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }
      return api('/medicines', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-medicines'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to save medicine');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api(`/medicines/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-medicines'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const handleOpenCreate = () => {
    setEditingMedicine(null);
    setBrandName('');
    setGenericName('');
    setMedicineType('Allopathic');
    setFormType('Tablet');
    setStrength('');
    setManufacturer('');
    setSystemNameBangla('');
    setDefaultDose('1+0+1');
    setDefaultDuration('7 days');
    setDefaultInstruction('After meal');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (med: any) => {
    setEditingMedicine(med);
    setBrandName(med.brandName || '');
    setGenericName(med.genericName || '');
    setMedicineType(med.medicineType || med.type || 'Allopathic');
    setFormType(med.dosageForm || med.form || 'Tablet');
    setStrength(med.strength || '');
    setManufacturer(med.manufacturer || med.manufacture || '');
    setSystemNameBangla(med.systemNameBangla || '');
    setDefaultDose(med.defaultDose || '1+0+1');
    setDefaultDuration(med.defaultDuration || '7 days');
    setDefaultInstruction(med.defaultInstruction || 'After meal');
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMedicine(null);
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || !genericName.trim() || !strength.trim() || !manufacturer.trim()) {
      setFormError('Please fill out Brand Name, Generic Name, Strength, and Manufacturer');
      return;
    }

    createMutation.mutate({
      brandName: brandName.trim(),
      genericName: genericName.trim(),
      strength: strength.trim(),
      medicineType,
      type: medicineType,
      dosageForm: formType.trim() || 'Tablet',
      form: formType.trim() || 'Tablet',
      manufacturer: manufacturer.trim(),
      manufacture: manufacturer.trim(),
      category: 'General',
      systemNameBangla,
      defaultDose,
      defaultDuration,
      defaultInstruction,
    });
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api('/medicines/import-csv', {
        method: 'POST',
        body: formData,
      });
      setImportMessage(`Successfully imported ${res.insertedCount || res.count || 0} medicines.`);
      queryClient.invalidateQueries({ queryKey: ['admin-medicines'] });
      setTimeout(() => setImportMessage(''), 5000);
    } catch (err: any) {
      setImportMessage(`Import failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Medicine Database Catalog
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage Bangladesh national medicine registry (Allopathic, Unani, Ayurvedic).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors">
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Import CSV</span>
            <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
          </label>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {importMessage && (
        <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{importMessage}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search brand, generic name, manufacturer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="all">All Medicine Types</option>
            <option value="Allopathic">Allopathic</option>
            <option value="Unani">Unani (ইউনানি)</option>
            <option value="Ayurvedic">Ayurvedic (আয়ুর্বেদিক)</option>
          </select>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
            Loading medicines database...
          </div>
        ) : medicines.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <Pill className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            No medicines found matching query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Brand & Strength</th>
                  <th className="py-3.5 px-4">Generic Name</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Form</th>
                  <th className="py-3.5 px-4">Manufacturer</th>
                  <th className="py-3.5 px-4">Default Rx Dose</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {medicines.map((med) => (
                  <tr key={med._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-white text-sm">{med.brandName}</span>
                        <span className="ml-2 text-xs font-mono text-indigo-400">
                          {med.strength}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-medium">{med.genericName}</td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                          med.medicineType === 'Allopathic'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : med.medicineType === 'Unani'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {med.medicineType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                      {(med as any).dosageForm || med.form || 'Tablet'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 text-xs">
                      {med.manufacturer || (med as any).manufacture || 'General'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                      {med.defaultDose || '1+0+1'} • {med.defaultInstruction || 'After meal'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(med)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(`Delete ${med.brandName} from master medicine catalog?`)
                            ) {
                              deleteMutation.mutate(med._id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">
                {editingMedicine ? 'Edit Medicine Entry' : 'Add New Medicine Entry'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Brands & Strength */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Napa Extra / Monas"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Strength *
                  </label>
                  <input
                    type="text"
                    required
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    placeholder="e.g. 500mg, 10mg, 120ml"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Generic Name */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Generic Name *
                </label>
                <input
                  type="text"
                  required
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  placeholder="e.g. Paracetamol + Caffeine / Montelukast Sodium"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Type & Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Type *
                  </label>
                  <select
                    value={medicineType}
                    onChange={(e: any) => setMedicineType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Allopathic">Allopathic (অ্যালোপ্যাথিক)</option>
                    <option value="Unani">Unani (ইউনানি)</option>
                    <option value="Ayurvedic">Ayurvedic (আয়ুর্বেদিক)</option>
                    <option value="Herbal">Herbal (হারবাল)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Form *
                  </label>
                  <input
                    type="text"
                    list="dosageFormList"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    placeholder="Tablet, Syrup, Capsule..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <datalist id="dosageFormList">
                    {DOSAGE_FORM_NAMES.map((form) => (
                      <option key={form} value={form} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Manufacture / Company */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Manufacture (Company) *
                </label>
                <input
                  type="text"
                  required
                  list="manufacturerList"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="e.g. Beximco Pharma, Square, Incepta, Hamdard..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <datalist id="manufacturerList">
                  {MANUFACTURER_NAMES.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              {/* Default Rx Advice (Optional) */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Default Dose
                  </label>
                  <input
                    type="text"
                    value={defaultDose}
                    onChange={(e) => setDefaultDose(e.target.value)}
                    placeholder="1+0+1"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={defaultDuration}
                    onChange={(e) => setDefaultDuration(e.target.value)}
                    placeholder="7 days"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Instruction
                  </label>
                  <input
                    type="text"
                    value={defaultInstruction}
                    onChange={(e) => setDefaultInstruction(e.target.value)}
                    placeholder="After meal"
                    className="w-full bg-slate-950 border border-slate-750 rounded-xl py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
