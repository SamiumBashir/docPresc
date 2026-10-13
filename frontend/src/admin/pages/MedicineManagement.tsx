import React, { useState, useRef } from 'react';
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
  Leaf,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../../services/api-client';
import { IMedicine } from '../../types';
import { MANUFACTURER_NAMES } from '../../data/manufacturers';
import { DOSAGE_FORM_NAMES } from '../../data/dosageForms';
import { showToast } from '../../components/ui/Toast';

export const MedicineManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<IMedicine | null>(null);
  const [formError, setFormError] = useState('');

  // CSV import
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [brandName, setBrandName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [medicineType, setMedicineType] = useState<'Allopathic' | 'Unani' | 'Ayurvedic' | 'Herbal'>('Allopathic');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [strength, setStrength] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [systemNameBangla, setSystemNameBangla] = useState('');
  const [defaultDose, setDefaultDose] = useState('1+0+1');
  const [defaultDuration, setDefaultDuration] = useState('7 days');
  const [defaultInstruction, setDefaultInstruction] = useState('After meal');

  const { data: medicines = [], isLoading } = useQuery<IMedicine[]>({
    queryKey: ['admin-medicines', searchTerm, typeFilter],
    queryFn: async () => {
      let query = `/medicines?limit=100`;
      if (searchTerm) query += `&search=${encodeURIComponent(searchTerm)}`;
      if (typeFilter !== 'all') query += `&medicineType=${encodeURIComponent(typeFilter)}`;
      const res = await api<{ success: boolean; data: { medicines: IMedicine[] } }>(query);
      const list = res.data?.medicines || (res as any).medicines || (Array.isArray(res.data) ? res.data : []) || [];
      return list;
    },
  });

  const saveMutation = useMutation({
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
      setIsModalOpen(false);
      resetForm();
      showToast.success(editingMedicine ? 'Medicine updated successfully' : 'New medicine added to database');
    },
    onError: (err: any) => {
      setFormError(err.message || 'Operation failed. Please verify medicine details.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api(`/medicines/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-medicines'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      showToast.success('Medicine removed from database');
    },
    onError: (err: any) => {
      showToast.error(err.message || 'Failed to delete medicine');
    },
  });

  const resetForm = () => {
    setEditingMedicine(null);
    setBrandName('');
    setGenericName('');
    setMedicineType('Allopathic');
    setDosageForm('Tablet');
    setStrength('');
    setManufacturer('');
    setSystemNameBangla('');
    setDefaultDose('1+0+1');
    setDefaultDuration('7 days');
    setDefaultInstruction('After meal');
    setFormError('');
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (med: IMedicine) => {
    setEditingMedicine(med);
    setBrandName(med.brandName || '');
    setGenericName(med.genericName || '');
    setMedicineType((med.medicineType as any) || 'Allopathic');
    setDosageForm(med.dosageForm || 'Tablet');
    setStrength(med.strength || '');
    setManufacturer(med.manufacturer || '');
    setSystemNameBangla((med as any).systemNameBangla || '');
    setDefaultDose(med.defaultDose || '1+0+1');
    setDefaultDuration(med.defaultDuration || '7 days');
    setDefaultInstruction(med.defaultInstruction || 'After meal');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!brandName.trim() || !genericName.trim()) {
      setFormError('Brand Name and Generic Name are required.');
      return;
    }

    saveMutation.mutate({
      brandName: brandName.trim(),
      genericName: genericName.trim(),
      medicineType,
      dosageForm,
      strength: strength.trim(),
      manufacturer: manufacturer.trim(),
      systemNameBangla: systemNameBangla.trim(),
      defaultDose,
      defaultDuration,
      defaultInstruction,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api<{ success: boolean; message: string; count?: number }>('/medicines/import', {
        method: 'POST',
        body: formData,
      });
      showToast.success(res.message || `Imported ${res.count || 0} medicines successfully!`);
      queryClient.invalidateQueries({ queryKey: ['admin-medicines'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch (err: any) {
      showToast.error(err.message || 'Failed to import CSV dataset');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Medicine Database
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Master formulary management: Allopathic, Unani, Ayurvedic, and Herbal medicines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-400" />
            <span>{isImporting ? 'Importing...' : 'Import CSV'}</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by brand name, generic, or manufacturer..."
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
            <option value="all">All Systems</option>
            <option value="Allopathic">Allopathic</option>
            <option value="Unani">Unani</option>
            <option value="Ayurvedic">Ayurvedic</option>
            <option value="Herbal">Herbal</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4 sm:px-6">Brand Name</th>
                <th className="py-3 px-4">Generic / Composition</th>
                <th className="py-3 px-4">Form & Strength</th>
                <th className="py-3 px-4">System</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                      <span>Loading formulary...</span>
                    </div>
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No medicines match the search criteria.
                  </td>
                </tr>
              ) : (
                medicines.map((med) => {
                  const isTrad = med.medicineType === 'Unani' || med.medicineType === 'Ayurvedic' || med.medicineType === 'Herbal';
                  return (
                    <tr key={med._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          {isTrad ? (
                            <Leaf className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Pill className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                          )}
                          <span>{med.brandName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {med.genericName}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700">
                          {med.dosageForm} {med.strength ? `(${med.strength})` : ''}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
                            med.medicineType === 'Unani'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : med.medicineType === 'Ayurvedic'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : med.medicineType === 'Herbal'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}
                        >
                          {med.medicineType || 'Allopathic'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {med.manufacturer || 'General'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(med)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete ${med.brandName}?`)) {
                                deleteMutation.mutate(med._id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">
                {editingMedicine ? 'Edit Formulary Medicine' : 'Add New Medicine'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Napa"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Generic Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={genericName}
                    onChange={(e) => setGenericName(e.target.value)}
                    placeholder="e.g. Paracetamol"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Medicine System
                  </label>
                  <select
                    value={medicineType}
                    onChange={(e) => setMedicineType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Allopathic">Allopathic</option>
                    <option value="Unani">Unani</option>
                    <option value="Ayurvedic">Ayurvedic</option>
                    <option value="Herbal">Herbal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Dosage Form
                  </label>
                  <select
                    value={dosageForm}
                    onChange={(e) => setDosageForm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {DOSAGE_FORM_NAMES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Strength
                  </label>
                  <input
                    type="text"
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    placeholder="e.g. 500 mg"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Manufacturer
                </label>
                <input
                  type="text"
                  list="manufacturers-list"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="e.g. Beximco Pharmaceuticals Ltd."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <datalist id="manufacturers-list">
                  {MANUFACTURER_NAMES.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default MedicineManagement;
