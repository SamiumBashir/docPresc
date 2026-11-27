import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { InfinityLoop } from '@/components/loading-ui/infinity';
import { Search, RefreshCw } from 'lucide-react';
import { api } from '../../services/api-client';
import { format } from 'date-fns';

export interface AuditLog {
  _id: string;
  userId?: any;
  userName?: string;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export const AuditLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const { data: logs = [], isLoading, refetch, isFetching } = useQuery<AuditLog[]>({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const res = await api<{ success: boolean; data: { logs: AuditLog[] } }>(
        '/admin/audit-logs?limit=100'
      );
      const list =
        res.data?.logs ||
        (res as any).logs ||
        (Array.isArray(res.data) ? res.data : []) ||
        [];
      return list;
    },
  });

  const filteredLogs = logs.filter((log: any) => {
    const actorName =
      typeof log.userId === 'object' && log.userId?.name
        ? log.userId.name
        : log.userName || '';
    const actorEmail =
      typeof log.userId === 'object' && log.userId?.email ? log.userId.email : '';
    const actorRole =
      typeof log.userId === 'object' && log.userId?.role
        ? log.userId.role
        : log.userRole || '';

    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      actorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      actorRole.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-[#eef0f5] tracking-[-0.01em]">
            Security &amp; Audit Logs
          </h1>
          <p className="text-xs text-[#a3a9b8] mt-1">
            Immutable operational activity and clinical metadata trail
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-[#1b2232] hover:bg-[#232c40] text-[#eef0f5] text-xs font-medium border border-white/[0.1] transition-colors w-fit disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 text-[#757d90] ${isFetching ? 'animate-spin' : ''}`}
            strokeWidth={1.5}
          />
          <span>Refresh logs</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search
            className="w-4 h-4 text-[#757d90] absolute left-3 top-2.5 pointer-events-none"
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="Search by action, operator, or resource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 bg-[#131924] border border-white/[0.1] rounded-lg pl-9 pr-3 text-[13px] text-[#eef0f5] placeholder-[#757d90] focus:outline-none focus:border-[#007086] transition-colors"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          aria-label="Filter by audit action"
          className="h-9 bg-[#131924] border border-white/[0.1] rounded-lg px-3 text-xs text-[#eef0f5] focus:outline-none focus:border-[#007086] transition-colors"
        >
          <option value="all">All action types</option>
          {uniqueActions.map((act) => (
            <option key={act} value={act}>
              {act}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[#131924] border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#18202e] border-b border-white/[0.08] text-xs font-medium text-[#a3a9b8]">
              <tr>
                <th className="py-3 px-4 sm:px-5">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4 sm:px-5">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#a3a9b8]">
                    <div className="flex flex-col items-center gap-2">
                      <InfinityLoop className="w-12 h-6 text-[#2ab0c7]" duration="1.6s" />
                      <span>Loading audit trail...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#757d90]">
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => {
                  const actorName =
                    typeof log.userId === 'object' && log.userId?.name
                      ? log.userId.name
                      : log.userName || 'System';
                  const actorRole =
                    typeof log.userId === 'object' && log.userId?.role
                      ? log.userId.role
                      : log.userRole || 'system';

                  return (
                    <tr key={log._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 sm:px-5 text-[#a3a9b8] font-mono tabular-nums whitespace-nowrap">
                        {log.createdAt
                          ? format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')
                          : 'N/A'}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] font-medium text-[#2ab0c7] bg-[#1b2232] px-2 py-0.5 rounded border border-white/[0.08]">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[#eef0f5]">
                        <span className="font-medium">{log.resource}</span>
                        {log.resourceId && (
                          <span className="text-[11px] text-[#757d90] ml-1.5 font-mono tabular-nums">
                            ({log.resourceId.slice(-6)})
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-[#eef0f5] font-medium">{actorName}</div>
                        <div className="text-[11px] text-[#757d90]">{actorRole}</div>
                      </td>

                      <td className="py-3 px-4 sm:px-5 text-[#757d90] font-mono text-[11px] max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AuditLogs;
