import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Search,
  Calendar,
  Filter,
  Eye,
  Copy,
  Printer,
  ChevronLeft,
  ChevronRight,
  FilePlus,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../../components/ui/Toast';
import { IPrescription } from '../../types';

export const PrescriptionHistory: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<IPrescription[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrescriptions = async (pageNum = 1) => {
    setIsLoading(true);
    try {
      let url = `/prescriptions?page=${pageNum}&limit=15`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;

      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        url += `&startDate=${today}&endDate=${today}`;
      } else if (dateFilter === 'week') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        url += `&startDate=${d.toISOString().split('T')[0]}`;
      } else if (dateFilter === 'month') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        url += `&startDate=${d.toISOString().split('T')[0]}`;
      }

      const res = await api<{
        success: boolean;
        data: {
          prescriptions: IPrescription[];
          pagination: { page: number; totalPages: number; total: number };
        };
      }>(url);

      if (res.success && res.data) {
        setPrescriptions(res.data.prescriptions);
        setTotalPages(res.data.pagination.totalPages);
        setTotalCount(res.data.pagination.total);
      }
    } catch {
      showToast.error('Failed to load prescription history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions(page);
  }, [page, statusFilter, dateFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPrescriptions(1);
  };

  const handleCopyShareLink = (token: string) => {
    const url = `${window.location.origin}/prescription/share/${token}`;
    navigator.clipboard.writeText(url);
    showToast.success('Secure public prescription link copied to clipboard!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Prescription History</h2>
          <p className="text-xs text-slate-500">
            Total records ({totalCount}) with audit trails and quick actions
          </p>
        </div>

        <Link
          to="/prescriptions/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-semibold text-xs shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <FilePlus className="w-4 h-4" />
          <span>Write New Prescription</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Rx ID (RX-2026...), Patient Name, or Phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500"
          />
        </form>

        {/* Date Filter */}
        <select
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="week">Past 7 Days</option>
          <option value="month">Past 30 Days</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="FINALIZED">Finalized Only</option>
          <option value="DRAFT">Drafts Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Rx ID & Date</th>
                <th className="py-3 px-4">Patient Demographics</th>
                <th className="py-3 px-4">Diagnoses & Meds</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading prescription archives...
                  </td>
                </tr>
              ) : prescriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No prescription records found matching criteria.
                  </td>
                </tr>
              ) : (
                prescriptions.map((rx) => (
                  <tr key={rx._id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Rx ID & Date */}
                    <td className="py-3.5 px-4 space-y-0.5">
                      <Link
                        to={`/prescriptions/${rx._id}`}
                        className="font-mono font-bold text-slate-900 hover:text-medical-600 transition-colors block text-sm"
                      >
                        {rx.prescriptionId}
                      </Link>
                      <p className="text-[11px] text-slate-400">
                        {new Date(rx.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </td>

                    {/* Patient */}
                    <td className="py-3.5 px-4 space-y-0.5">
                      <p className="font-bold text-slate-900">{rx.patientSnapshot?.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {rx.patientSnapshot?.age} yrs • {rx.patientSnapshot?.gender} • {rx.patientSnapshot?.phone}
                      </p>
                    </td>

                    {/* Diagnosis & Meds */}
                    <td className="py-3.5 px-4 space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {rx.diagnosis?.map((d, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-medical-50 text-medical-900 border border-medical-200 font-bold text-[10px]"
                          >
                            {d.name}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {rx.medicines.length} Medicines Prescribed
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                          rx.status === 'FINALIZED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {rx.status === 'FINALIZED' && <CheckCircle2 className="w-3 h-3" />}
                        {rx.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          to={`/prescriptions/${rx._id}`}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                        <Link
                          to={`/prescriptions/new?cloneId=${rx._id}&patientId=${rx.patientId}`}
                          className="px-2.5 py-1.5 bg-medical-50 hover:bg-medical-100 text-medical-800 font-semibold rounded-lg text-xs border border-medical-200/70 transition-colors flex items-center gap-1"
                          title="Clone as new prescription draft"
                        >
                          <Copy className="w-3.5 h-3.5" /> Clone
                        </Link>
                        <button
                          onClick={() => handleCopyShareLink(rx.shareToken)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Copy Public Share Link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({totalCount} total prescriptions)
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
