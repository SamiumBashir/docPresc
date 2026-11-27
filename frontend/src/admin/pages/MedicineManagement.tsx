import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InfinityLoop } from '@/components/loading-ui/infinity';
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
import { Modal } from '../../components/ui/Modal';

export const MedicineManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<IMedicine | null>(null);
  const [deletingMedicine, setDeletingMedicine] = useState<IMedicine | null>(null);
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
      setDeletingMedicine(null);
      queryClient.invalidateQueries({ queryKey: ['admin-medicines'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
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
      strength: strength.trim() || 'Standard',
      manufacturer: manufacturer.trim() || 'General',
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
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['admin-medicines'] });
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      }
    } catch {
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
          <h1 className="text-xl sm:text-2xl font-medium text-[#eef0f5] tracking-[-0.01em]">
            Medicine Database
          </h1>
          <p className="text-xs text-[#a3a9b8] mt-1">
            Master formulary management: Allopathic, Unani, Ayurvedic, and Herbal medicines
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
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1b2232] hover:bg-[#232c40] text-[#eef0f5] text-xs font-medium border border-white/[0.1] transition-colors"
          >
            <Upload className="w-4 h-4 text-[#a3a9b8]" strokeWidth={1.5} />
            <span>{isImporting ? 'Importing...' : 'Import CSV'}</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#007086] hover:bg-[#088097] text-white text-xs font-medium transition-colors active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            <span>Add medicine</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#757d90] absolute left-3.5 top-2.5" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search by brand name, generic, or manufacturer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#131924] border border-white/[0.1] rounded-lg py-2 pl-10 pr-4 text-xs text-[#eef0f5] placeholder-[#757d90] focus:outline-none focus:border-[#2ab0c7] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#757d90]" strokeWidth={1.5} />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#131924] border border-white/[0.1] rounded-lg py-2 px-3 text-xs text-[#eef0f5] focus:outline-none focus:border-[#2ab0c7] transition-colors"
          >
            <option value="all">All systems</option>
            <option value="Allopathic">Allopathic</option>
            <option value="Unani">Unani</option>
            <option value="Ayurvedic">Ayurvedic</option>
            <option value="Herbal">Herbal</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[#131924] border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#18202e] border-b border-white/[0.08] text-xs font-medium text-[#a3a9b8]">
              <tr>
                <th className="py-3 px-4 sm:px-6">Brand name</th>
                <th className="py-3 px-4">Generic / composition</th>
                <th className="py-3 px-4">Form &amp; strength</th>
                <th className="py-3 px-4">System</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#a3a9b8]">
                    <div className="flex flex-col items-center gap-2">
                      <InfinityLoop className="w-12 h-6 text-[#2ab0c7]" duration="1.6s" />
                      <span>Loading formulary...</span>
                    </div>
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#a3a9b8]">
                    No medicines match the search criteria.
                  </td>
                </tr>
              ) : (
                medicines.map((med) => {
                  const isTrad = med.medicineType === 'Unani' || med.medicineType === 'Ayurvedic' || med.medicineType === 'Herbal';
                  return (
                    <tr key={med._id} className="hover:bg-[#18202e]/60 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          {isTrad ? (
                            <Leaf className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Pill className="w-4 h-4 text-[#2ab0c7] flex-shrink-0" strokeWidth={1.5} />
                          )}
                          <span>{med.brandName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#a3a9b8]">
                        {med.genericName}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs tabular-nums text-[#a3a9b8] bg-[#18202e] px-2 py-0.5 rounded border border-white/[0.08]">
                          {med.dosageForm} {med.strength ? `(${med.strength})` : ''}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded inline-block ${
                            med.medicineType === 'Unani'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : med.medicineType === 'Ayurvedic'
                              ? 'bg-amber-400/12 text-amber-300 border border-amber-400/25'
                              : med.medicineType === 'Herbal'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-[#2ab0c7]/12 text-[#2ab0c7] border border-[#2ab0c7]/25'
                          }`}
                        >
                          {med.medicineType || 'Allopathic'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[#757d90] text-xs">
                        {med.manufacturer || 'General'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(med)}
                            className="p-1.5 rounded-lg text-[#a3a9b8] hover:text-[#2ab0c7] hover:bg-[#1b2232] transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingMedicine(med)}
                            className="p-1.5 rounded-lg text-[#a3a9b8] hover:text-[#f08b8e] hover:bg-rose-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
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
        <div className="fixed inset-0 bg-[#05080f]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131924] border border-white/[0.08] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <h2 className="text-lg font-medium text-[#eef0f5]">
                {editingMedicine ? 'Edit Formulary Medicine' : 'Add New Medicine'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#a3a9b8] hover:text-[#eef0f5] p-1"
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
                  <label className="block text-xs font-medium text-[#a3a9b8] mb-1.5">
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
                  <label className="block text-xs font-medium text-[#a3a9b8] mb-1.5">
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
                  <label className="block text-xs font-medium text-[#a3a9b8] mb-1.5">
                    Medicine System
                  </label>
                  <select
                    value={medicineType}
                    onChange={(e) => setMedicineType(e.target.value as any)}
                    className="w-full bg-[#0d1119] border border-white/[0.1] rounded-lg py-2 px-3 text-xs text-[#eef0f5] placeholder-[#757d90] focus:outline-none focus:border-[#2ab0c7]"
                  >
                    <option value="Allopathic">Allopathic</option>
                    <option value="Unani">Unani</option>
                    <option value="Ayurvedic">Ayurvedic</option>
                    <option value="Herbal">Herbal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#a3a9b8] mb-1.5">
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
                  <label className="block text-xs font-medium text-[#a3a9b8] mb-1.5">
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
                  list="manufacturers-list"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="e.g. Beximco Pharmaceuticals Ltd."
                  className="w-full bg-[#0d1119] border border-white/[0.1] rounded-lg py-2 px-3 text-xs text-[#eef0f5] placeholder-[#757d90] focus:outline-none focus:border-[#2ab0c7]"
                />
                <datalist id="manufacturers-list">
                  {MANUFACTURER_NAMES.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              <div className="pt-4 flex justify-end gap-2.5 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#1b2232] hover:bg-[#232c40] border border-white/[0.1] text-[#a3a9b8] hover:text-[#eef0f5] text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-[#007086] hover:bg-[#088097] text-white text-xs font-medium transition-colors active:scale-[0.98]"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        dark
        isOpen={Boolean(deletingMedicine)}
        onClose={() => setDeletingMedicine(null)}
        title="Delete Medicine Record"
        subtitle={deletingMedicine ? `${deletingMedicine.brandName} (${deletingMedicine.genericName})` : undefined}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs text-[#eef0f5]">
          <p className="text-[#a3a9b8] leading-relaxed">
            This permanently removes{' '}
            <span className="font-medium text-[#eef0f5]">{deletingMedicine?.brandName}</span> from the
            medicine database. Prescriptions already issued retain their saved snapshot.
          </p>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setDeletingMedicine(null)}
              className="px-4 py-2 rounded-lg bg-[#1b2232] hover:bg-[#232c40] border border-white/[0.1] text-[#a3a9b8] hover:text-[#eef0f5] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteMutation.isPending}
              onClick={() => deletingMedicine && deleteMutation.mutate(deletingMedicine._id)}
              className="px-4 py-2 rounded-lg bg-rose-600/85 hover:bg-rose-600 text-white font-medium transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete medicine'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default MedicineManagement;
