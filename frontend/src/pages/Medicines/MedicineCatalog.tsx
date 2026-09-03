import React, { useState, useEffect } from 'react';
import { Pill, Search, Star, Filter, Plus, ChevronLeft, ChevronRight, Leaf, X, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../../components/ui/Toast';
import { IMedicine } from '../../types';
import { MANUFACTURER_NAMES } from '../../data/manufacturers';
import { DOSAGE_FORM_NAMES } from '../../data/dosageForms';

export const MedicineCatalog: React.FC = () => {
  const [medicines, setMedicines] = useState<IMedicine[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [dosageForms, setDosageForms] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedForm, setSelectedForm] = useState('all');
  const [selectedManufacturer, setSelectedManufacturer] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Favorite medicines state
  const [favorites, setFavorites] = useState<string[]>([]);

  // New Medicine Entry Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [brandName, setBrandName] = useState('');
  const [strength, setStrength] = useState('');
  const [genericName, setGenericName] = useState('');
  const [medicineType, setMedicineType] = useState<'Allopathic' | 'Unani' | 'Ayurvedic' | 'Herbal'>('Allopathic');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [manufacturer, setManufacturer] = useState('');

  const handleOpenAddModal = () => {
    setBrandName('');
    setStrength('');
    setGenericName('');
    setMedicineType('Allopathic');
    setDosageForm('Tablet');
    setManufacturer('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || !genericName.trim() || !strength.trim() || !manufacturer.trim()) {
      setFormError('Please fill out Brand Name, Generic Name, Strength, and Manufacturer');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const res = await api<{ success: boolean; message: string; data: IMedicine }>('/medicines', {
        method: 'POST',
        body: JSON.stringify({
          brandName: brandName.trim(),
          genericName: genericName.trim(),
          strength: strength.trim(),
          medicineType,
          type: medicineType,
          dosageForm: dosageForm.trim() || 'Tablet',
          form: dosageForm.trim() || 'Tablet',
          manufacturer: manufacturer.trim(),
          manufacture: manufacturer.trim(),
          category: 'General',
        }),
      });

      if (res.success) {
        showToast.success('New medicine added successfully! 💊');
        setIsModalOpen(false);
        fetchMedicines(1);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to add medicine entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchMedicines = async (pageNum = 1) => {
    setIsLoading(true);
    try {
      let url = `/medicines?page=${pageNum}&limit=20`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      if (selectedType !== 'all') url += `&medicineType=${encodeURIComponent(selectedType)}`;
      if (selectedCategory !== 'all') url += `&category=${encodeURIComponent(selectedCategory)}`;
      if (selectedForm !== 'all') url += `&dosageForm=${encodeURIComponent(selectedForm)}`;
      if (selectedManufacturer !== 'all') url += `&manufacturer=${encodeURIComponent(selectedManufacturer)}`;

      const res = await api<{
        success: boolean;
        data: {
          medicines: IMedicine[];
          categories: string[];
          dosageForms: string[];
          manufacturers: string[];
          pagination: { page: number; totalPages: number; total: number };
        };
      }>(url);

      if (res.success && res.data) {
        setMedicines(res.data.medicines);
        setCategories(res.data.categories);
        setDosageForms(res.data.dosageForms);
        setManufacturers(res.data.manufacturers);
        setTotalPages(res.data.pagination.totalPages);
        setTotalCount(res.data.pagination.total);
      }
    } catch {
      showToast.error('Failed to load medicines.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await api<{ success: boolean; data: IMedicine[] }>('/medicines/favorites');
      if (res.success && res.data) {
        setFavorites(res.data.map((m) => m._id));
      }
    } catch {}
  };

  useEffect(() => {
    fetchMedicines(page);
  }, [page, selectedType, selectedCategory, selectedForm, selectedManufacturer]);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMedicines(1);
  };

  const handleToggleFavorite = async (medicineId: string) => {
    try {
      const res = await api<{ success: boolean; message: string; data: { isFavorite: boolean } }>(
        `/medicines/favorites/${medicineId}`,
        { method: 'POST' }
      );
      if (res.success) {
        if (res.data.isFavorite) {
          setFavorites([...favorites, medicineId]);
          showToast.success('Added to favorite medicines ⭐');
        } else {
          setFavorites(favorites.filter((id) => id !== medicineId));
          showToast.info('Removed from favorites.');
        }
      }
    } catch {
      showToast.error('Failed to update favorite.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Medicines Master Catalog</h2>
          <p className="text-xs text-slate-500">
            Comprehensive directory of {totalCount} verified Bangladeshi medicines across Allopathic, Unani, and Ayurvedic medical systems
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Medicine Entry</span>
        </button>
      </div>

      {/* System Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex-wrap">
        {[
          { id: 'all', label: 'All Systems (সকল ওষুধ)', icon: Pill },
          { id: 'Allopathic', label: 'Allopathic (অ্যালোপ্যাথিক)', icon: Pill },
          { id: 'Unani', label: '🌿 Unani (ইউনানি চিকিৎসা)', icon: Leaf },
          { id: 'Ayurvedic', label: '🌱 Ayurvedic (আয়ুর্বেদিক)', icon: Leaf },
          { id: 'Herbal', label: '🍀 Herbal & Nutra (হারবাল)', icon: Leaf },
        ].map((tab) => {
          const isActive = selectedType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedType(tab.id);
                setSelectedCategory('all');
                setSelectedForm('all');
                setSelectedManufacturer('all');
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-medical-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Brand Name (Napa, Cinkara, Chyawanprash...), Generic Name, or Company..."
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

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Dosage Form Filter */}
          <select
            value={selectedForm}
            onChange={(e) => {
              setSelectedForm(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Dosage Forms</option>
            {dosageForms.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          {/* Manufacturer Filter */}
          <select
            value={selectedManufacturer}
            onChange={(e) => {
              setSelectedManufacturer(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Manufacturers</option>
            {manufacturers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 w-10 text-center">⭐</th>
                <th className="py-3 px-4">Brand Name & Strength</th>
                <th className="py-3 px-4">System</th>
                <th className="py-3 px-4">Generic / Botanical Composition</th>
                <th className="py-3 px-4">Form</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Searching medicine database...
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No medicines found matching criteria.
                  </td>
                </tr>
              ) : (
                medicines.map((m) => {
                  const isFav = favorites.includes(m._id);
                  const isUnani = m.medicineType === 'Unani';
                  const isAyurvedic = m.medicineType === 'Ayurvedic';

                  return (
                    <tr key={m._id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Favorite Button */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(m._id)}
                          className={`p-1 rounded-md transition-colors ${
                            isFav
                              ? 'text-amber-500 hover:text-amber-600'
                              : 'text-slate-200 group-hover:text-slate-400 hover:text-amber-400'
                          }`}
                          title={isFav ? 'Remove Favorite' : 'Mark Favorite'}
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                        </button>
                      </td>

                      {/* Brand & Strength */}
                      <td className="py-3 px-4 space-y-0.5">
                        <span className="font-bold text-slate-900 text-sm">{m.brandName}</span>
                        {m.strength && (
                          <span className="text-medical-700 font-semibold ml-1.5">
                            ({m.strength})
                          </span>
                        )}
                      </td>

                      {/* System Badge */}
                      <td className="py-3 px-4">
                        {isUnani ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                            🌿 Unani
                          </span>
                        ) : isAyurvedic ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 whitespace-nowrap">
                            🌱 Ayurvedic
                          </span>
                        ) : m.medicineType === 'Herbal' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200 whitespace-nowrap">
                            🍀 Herbal
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                            Allopathic
                          </span>
                        )}
                      </td>

                      {/* Generic Name */}
                      <td className="py-3 px-4 font-medium text-slate-700 italic">
                        {m.genericName}
                      </td>

                      {/* Dosage Form */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[10px] uppercase tracking-wider">
                          {m.dosageForm}
                        </span>
                      </td>

                      {/* Manufacturer */}
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                        {m.manufacturer}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-medical-50 text-medical-800 text-[10px] font-bold">
                          {m.category}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({totalCount} total medicines)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Medicine Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-medical-50 text-medical-600 flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Medicine Entry</h3>
                  <p className="text-[11px] text-slate-500">Register new brand or formula into prescription master database</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Brands & Strength */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Napa Extra / Monas"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Strength *
                  </label>
                  <input
                    type="text"
                    required
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    placeholder="e.g. 500mg, 10mg, 120ml"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Generic Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Generic Name *
                </label>
                <input
                  type="text"
                  required
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  placeholder="e.g. Paracetamol + Caffeine / Montelukast Sodium"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:bg-white"
                />
              </div>

              {/* Type & Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={medicineType}
                    onChange={(e: any) => setMedicineType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-medical-500 focus:bg-white"
                  >
                    <option value="Allopathic">Allopathic (অ্যালোপ্যাথিক)</option>
                    <option value="Unani">Unani (ইউনানি)</option>
                    <option value="Ayurvedic">Ayurvedic (আয়ুর্বেদিক)</option>
                    <option value="Herbal">Herbal (হারবাল)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Form *
                  </label>
                  <input
                    type="text"
                    list="doctorDosageFormList"
                    value={dosageForm}
                    onChange={(e) => setDosageForm(e.target.value)}
                    placeholder="Tablet, Capsule, Syrup..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:bg-white"
                  />
                  <datalist id="doctorDosageFormList">
                    {DOSAGE_FORM_NAMES.map((form) => (
                      <option key={form} value={form} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Manufacture / Company */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Manufacture (Company) *
                </label>
                <input
                  type="text"
                  required
                  list="doctorManufacturerList"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="e.g. Beximco Pharma, Square, Incepta, Hamdard..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:bg-white"
                />
                <datalist id="doctorManufacturerList">
                  {MANUFACTURER_NAMES.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-medical-600 hover:bg-medical-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    'Saving...'
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Save Medicine Entry
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
