import React, { useState, useEffect } from 'react';
import { Pill, Search, Star, Filter, Plus, ChevronLeft, ChevronRight, Leaf } from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../../components/ui/Toast';
import { IMedicine } from '../../types';

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
      </div>

      {/* System Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex-wrap">
        {[
          { id: 'all', label: 'All Systems (সকল ওষুধ)', icon: Pill },
          { id: 'Allopathic', label: 'Allopathic (অ্যালোপ্যাথিক)', icon: Pill },
          { id: 'Unani', label: '🌿 Unani (ইউনানি চিকিৎসা)', icon: Leaf },
          { id: 'Ayurvedic', label: '🌱 Ayurvedic (আয়ুর্বেদিক)', icon: Leaf },
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
    </div>
  );
};
