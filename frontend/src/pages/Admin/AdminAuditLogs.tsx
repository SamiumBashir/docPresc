import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../../components/ui/Toast';
import { IAuditLog } from '../../types';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async (pageNum = 1) => {
    setIsLoading(true);
    try {
      const res = await api<{
        success: boolean;
        data: {
          logs: IAuditLog[];
          pagination: { page: number; totalPages: number; total: number };
        };
      }>(`/admin/audit-logs?page=${pageNum}&limit=25`);

      if (res.success && res.data) {
        setLogs(res.data.logs);
        setTotalPages(res.data.pagination.totalPages);
        setTotalCount(res.data.pagination.total);
      }
    } catch {
      showToast.error('Failed to load audit logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h2 className="text-xl font-bold text-slate-900">System Security & Audit Trail</h2>
        <p className="text-xs text-slate-500">
          Compliance logs tracking user sessions, patient updates, and prescription finalizations
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action & Resource</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading security audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString('en-GB')}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 space-y-0.5">
                      <span className="font-bold text-slate-900 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded mr-1">
                        {l.action}
                      </span>
                      <span className="text-slate-500 text-[11px]">({l.resource})</span>
                    </td>

                    {/* User */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{l.userName}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-mono">{l.userRole}</p>
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px] max-w-xs truncate">
                      {l.details ? JSON.stringify(l.details) : 'N/A'}
                    </td>

                    {/* IP */}
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {l.ipAddress || '127.0.0.1'}
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
              Page {page} of {totalPages} ({totalCount} total audit events)
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
