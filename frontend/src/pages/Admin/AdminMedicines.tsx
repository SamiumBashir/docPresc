import React, { useState, useEffect, useRef } from 'react';
import { Pill, Plus, Upload, Trash2, Edit2, Search, FileSpreadsheet, Leaf } from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { IMedicine } from '../../types';

export const AdminMedicines: React.FC = () => {
  const [medicines, setMedicines] = useState<IMedicine[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // CSV Import state
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<IMedicine | null>(null);
  const [formData, setFormData] = useState({
    brandName: '',
    genericName: '',
    strength: '',
    dosageForm: 'Tablet',
    manufacturer: '',
    category: 'General',
    medicineType: 'Allopathic' as 'Allopathic' | 'Unani' | 'Ayurvedic' | 'Herbal',
  });

  const fetchMedicines = async (pageNum = 1) => {
    setIsLoading(true);
    try {
      let url = `/medicines?page=${pageNum}&limit=15`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      if (selectedType !== 'all') url += `&medicineType=${encodeURIComponent(selectedType)}`;

      const res = await api<{
        success: boolean;
        data: {
          medicines: IMedicine[];
          pagination: { page: number; totalPages: number; total: number };
        };
      }>(url);

      if (res.success && res.data) {
        setMedicines(res.data.medicines);
        setTotalPages(res.data.pagination.totalPages);
        setTotalCount(res.data.pagination.total);
      }
    } catch {
      showToast.error('Failed to load medicines.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines(page);
  }, [page, selectedType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMedicines(1);
  };

  const handleOpenCreate = () => {
    setEditingMed(null);
    setFormData({
      brandName: '',
      genericName: '',
      strength: '',
      dosageForm: 'Tablet',
      manufacturer: '',
      category: 'General',
      medicineType: 'Allopathic',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (med: IMedicine) => {
    setEditingMed(med);
    setFormData({
      brandName: med.brandName,
      genericName: med.genericName,
      strength: med.strength,
      dosageForm: med.dosageForm,
      manufacturer: med.manufacturer,
      category: med.category,
      medicineType: med.medicineType || 'Allopathic',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brandName || !formData.genericName || !formData.strength || !formData.manufacturer) {
      showToast.error('Please fill all mandatory fields.');
      return;
    }

    try {
      if (editingMed) {
        await api(`/medicines/${editingMed._id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        showToast.success('Medicine updated.');
      } else {
        await api('/medicines', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        showToast.success('Medicine added to database.');
      }

      setIsModalOpen(false);
      fetchMedicines(page);
    } catch (err: any) {
      showToast.error(err.message || 'Failed to save medicine.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) return;
    try {
      await api(`/medicines/${id}`, { method: 'DELETE' });
      showToast.success('Medicine removed.');
      fetchMedicines(page);
    } catch (err: any) {
      showToast.error(err.message || 'Failed to delete medicine.');
    }
  };

  const handleCsvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    setIsImporting(true);
    showToast.info('Parsing CSV file and importing drugs...');

    try {
      const res = await api<{ success: boolean; message: string; data: { importedCount: number } }>(
        '/medicines/import-csv',
        {
          method: 'POST',
          body: data,
        }
      );

      if (res.success) {
        showToast.success(res.message);
        fetchMedicines(1);
      }
    } catch (err: any) {
      showToast.error(err.message || 'CSV Import failed.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Medicine Master Database (Admin)</h2>
          <p className="text-xs text-slate-500">
            Total active catalog ({totalCount} items) across Allopathic, Unani, and Ayurvedic categories
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* CSV File Upload Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCsvFileUpload}
            className="hidden"
          />
          <button
            disabled={isImporting}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-semibold text-xs border border-emerald-200 shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isImporting ? 'Importing CSV...' : 'Bulk CSV Import'}</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-semibold text-xs shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* System Tabs Filter */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex-wrap">
        {[
          { id: 'all', label: 'All Systems' },
          { id: 'Allopathic', label: 'Allopathic' },
          { id: 'Unani', label: '🌿 Unani' },
          { id: 'Ayurvedic', label: '🌱 Ayurvedic' },
          { id: 'Herbal', label: '🍀 Herbal' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setSelectedType(tab.id);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedType === tab.id
                ? 'bg-medical-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Brand Name (Napa, Cinkara), Generic Name (Paracetamol), or Manufacturer..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Brand & Strength</th>
                <th className="py-3 px-4">System</th>
                <th className="py-3 px-4">Generic Name</th>
                <th className="py-3 px-4">Form</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading medicine database...
                  </td>
                </tr>
              ) : (
                medicines.map((m) => {
                  const isUnani = m.medicineType === 'Unani';
                  const isAyurvedic = m.medicineType === 'Ayurvedic';

                  return (
                    <tr key={m._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 space-y-0.5">
                        <span className="font-bold text-slate-900 text-sm">{m.brandName}</span>
                        <span className="text-medical-700 font-semibold ml-1.5">{m.strength}</span>
                      </td>
                      <td className="py-3 px-4">
                        {isUnani ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            🌿 Unani
                          </span>
                        ) : isAyurvedic ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            🌱 Ayurvedic
                          </span>
                        ) : m.medicineType === 'Herbal' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                            🍀 Herbal
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Allopathic
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 italic font-medium">{m.genericName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[10px] uppercase">
                          {m.dosageForm}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{m.manufacturer}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-medical-50 text-medical-800 font-bold text-[10px]">
                          {m.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(m._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Medicine Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMed ? 'Edit Medicine' : 'Add Medicine to Database'}
        subtitle="Medicine details will be instantly indexed for doctor autocomplete"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Medicine System *
              </label>
              <select
                value={formData.medicineType}
                onChange={(e) => setFormData({ ...formData, medicineType: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-semibold focus:outline-none"
              >
                <option value="Allopathic">Allopathic (Conventional)</option>
                <option value="Unani">Unani (ইউনানি)</option>
                <option value="Ayurvedic">Ayurvedic (আয়ুর্বেদিক)</option>
                <option value="Herbal">Herbal (হারবাল)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                required
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                placeholder="e.g. Cinkara, Safi, Napa Extra"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Strength / Volume *
              </label>
              <input
                type="text"
                required
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                placeholder="e.g. 450 ml, 500 mg, 100 g"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Dosage Form *
              </label>
              <select
                value={formData.dosageForm}
                onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Suspension">Suspension</option>
                <option value="Avaleha">Avaleha / Paste</option>
                <option value="Majun">Majun / Confection</option>
                <option value="Arishta">Arishta / Ferment</option>
                <option value="Asava">Asava</option>
                <option value="Churna">Churna / Powder</option>
                <option value="Taila">Taila / Medicated Oil</option>
                <option value="Khamira">Khamira</option>
                <option value="Liquid">Liquid / Distillate</option>
                <option value="Injection">Injection</option>
                <option value="Inhaler">Inhaler</option>
                <option value="Cream">Cream</option>
                <option value="Drops">Drops</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Generic / Composition Name *
            </label>
            <input
              type="text"
              required
              value={formData.genericName}
              onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
              placeholder="e.g. Emblica Officinalis + 40 Herbs (চ্যাবনাপ্রাশ)"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Manufacturer *
              </label>
              <input
                type="text"
                required
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="e.g. Hamdard Laboratories / Sadhana Aushadhalaya"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Therapeutic Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. General Tonic & Immunity"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-medical-600 hover:bg-medical-700 text-white rounded-xl shadow-xs"
            >
              Save Medicine
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
