import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Plus,
  Search,
} from 'lucide-react';
import { api, downloadApiFile } from '../../api/client';
import { InfinityLoop } from '@/components/loading-ui/infinity';
import { IFoodChart } from '../../types';

interface ListResponse {
  charts: IFoodChart[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const FoodChartDirectory: React.FC = () => {
  const [charts, setCharts] = useState<IFoodChart[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'FINALIZED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', '12');
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        if (search.trim()) params.set('search', search.trim());

        const res = await api<{ success: boolean; data: ListResponse }>(
          `/food-charts?${params.toString()}`
        );
        if (active && res.success && res.data) {
          setCharts(res.data.charts || []);
          setTotalPages(res.data.pagination?.totalPages || 1);
          setTotal(res.data.pagination?.total || 0);
        }
      } catch (err: any) {
        if (active) {
          setErrorMessage(err?.message || 'Unable to load food charts.');
          setCharts([]);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [page, statusFilter, search]);

  const handleDownloadPdf = async (chart: IFoodChart) => {
    setErrorMessage(null);
    setDownloadingId(chart._id);
    try {
      const datePart = (chart.finalizedAt || chart.createdAt || '').slice(0, 10) || 'chart';
      const fallback = `Food-Chart-${chart.patientSnapshot?.patientId || chart.chartNumber}-${datePart}.pdf`;
      await downloadApiFile(`/food-charts/${chart._id}/pdf`, fallback);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to generate food chart PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-lg font-semibold text-slate-900">Patient Food Charts</h1>
            <span className="font-bengali text-sm font-medium text-[#007086]">রোগীর খাদ্য তালিকা</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {total} {total === 1 ? 'chart' : 'charts'} in your practice directory
          </p>
        </div>

        <Link
          to="/food-charts/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#007086] hover:bg-[#065b6d] text-white text-xs font-medium rounded-lg transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          <span>New Food Chart</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by chart number, patient name, or ID..."
            aria-label="Search food charts"
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086]"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start">
          {(['ALL', 'DRAFT', 'FINALIZED'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === status
                  ? 'bg-white text-slate-900 border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status === 'ALL' ? 'All' : status === 'DRAFT' ? 'Draft' : 'Finalized'}
            </button>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800"
        >
          {errorMessage}
        </div>
      )}

      {/* Directory List */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center gap-3">
          <InfinityLoop className="w-16 h-8 text-[#007086]" duration="1.8s" strokeWidth={5.5} />
          <p className="text-xs text-slate-500">Loading patient food charts...</p>
        </div>
      ) : charts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" strokeWidth={1.5} />
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-800">No food charts found</p>
            <p className="text-xs text-slate-500">
              Create a clean Bengali dietary chart for a patient or adjust your search filter.
            </p>
          </div>
          <Link
            to="/food-charts/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#007086] hover:bg-[#065b6d] text-white rounded-lg"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            Create Food Chart
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Chart No</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Status &amp; Version</th>
                  <th className="py-3 px-4">Composition</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {charts.map((chart) => (
                  <tr key={chart._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                      <Link
                        to={`/food-charts/${chart._id}`}
                        className="hover:text-[#007086] transition-colors"
                      >
                        {chart.chartNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">{chart.patientSnapshot?.name}</p>
                      <p className="text-slate-500 font-mono tabular-nums">
                        {chart.patientSnapshot?.patientId} • {chart.patientSnapshot?.age}y{' '}
                        {chart.patientSnapshot?.gender}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded border tabular-nums ${
                          chart.status === 'FINALIZED'
                            ? 'bg-[#f0f9fa] border-[#aee2e8] text-[#065b6d]'
                            : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {chart.status} • v{chart.version}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 tabular-nums">
                      {chart.allowedFoods?.length || 0} allowed • {chart.avoidedFoods?.length || 0}{' '}
                      avoided
                      {chart.supplements?.length ? ` • ${chart.supplements.length} supp.` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-600 tabular-nums">
                      {new Date(chart.finalizedAt || chart.updatedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/food-charts/${chart._id}`}
                          className="px-3 py-1.5 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-colors"
                        >
                          {chart.status === 'FINALIZED' ? 'Open' : 'Edit'}
                        </Link>
                        <button
                          type="button"
                          disabled={downloadingId === chart._id}
                          onClick={() => handleDownloadPdf(chart)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 rounded-lg disabled:opacity-50"
                        >
                          <Download className="w-4 h-4" strokeWidth={1.5} />
                          <span>{downloadingId === chart._id ? 'PDF...' : 'PDF'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards */}
          <div className="md:hidden divide-y divide-slate-200">
            {charts.map((chart) => (
              <div key={chart._id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/food-charts/${chart._id}`}
                      className="text-xs font-mono font-semibold text-slate-900 tabular-nums"
                    >
                      {chart.chartNumber}
                    </Link>
                    <p className="text-sm font-medium text-slate-900 mt-0.5">
                      {chart.patientSnapshot?.name}
                    </p>
                    <p className="text-xs text-slate-500 font-mono tabular-nums">
                      {chart.patientSnapshot?.patientId}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded border tabular-nums ${
                      chart.status === 'FINALIZED'
                        ? 'bg-[#f0f9fa] border-[#aee2e8] text-[#065b6d]'
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {chart.status} • v{chart.version}
                  </span>
                </div>

                <p className="text-xs text-slate-600 tabular-nums">
                  {chart.allowedFoods?.length || 0} allowed • {chart.avoidedFoods?.length || 0}{' '}
                  avoided
                  {chart.supplements?.length ? ` • ${chart.supplements.length} supplements` : ''}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <Link
                    to={`/food-charts/${chart._id}`}
                    className="flex-1 text-center px-3 py-2 text-xs font-medium border border-slate-300 bg-white text-slate-800 rounded-lg"
                  >
                    {chart.status === 'FINALIZED' ? 'Open Chart' : 'Edit Draft'}
                  </Link>
                  <button
                    type="button"
                    disabled={downloadingId === chart._id}
                    onClick={() => handleDownloadPdf(chart)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-300 bg-white text-slate-800 rounded-lg disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" strokeWidth={1.5} />
                    <span>{downloadingId === chart._id ? 'PDF...' : 'PDF'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
              <span className="tabular-nums">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 bg-white rounded-lg disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.5} /> Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 bg-white rounded-lg disabled:opacity-40"
                >
                  Next <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
