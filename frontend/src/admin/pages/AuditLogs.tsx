import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User as UserIcon,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
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
      const res = await api<{ success: boolean; data: { logs: AuditLog[] } }>('/admin/audit-logs?limit=100');
      const list = res.data?.logs || (res as any).logs || (Array.isArray(res.data) ? res.data : []) || [];
      return list;
    },
  });

  const filteredLogs = logs.filter((log: any) => {
    const actorName =
      typeof log.userId === 'object' && log.userId?.name
        ? log.userId.name
        : log.userName || '';
    const actorEmail =
      typeof log.userId === 'object' && log.userId?.email
        ? log.userId.email
        : '';
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Security & Audit Logs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable operational activity trail and compliance record.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by action, operator name, email, or target resource..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="all">All Action Types</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4 sm:px-6">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                      <span>Loading security trail...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
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
                    <tr key={log._id} className="hover:bg-slate-800/30 transition-colors font-mono text-xs">
                      <td className="py-3 px-4 sm:px-6 text-slate-400 whitespace-nowrap">
                        {log.createdAt ? format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-300 font-sans">
                        <span className="font-medium text-white">{log.resource}</span>
                        {log.resourceId && (
                          <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                            ({log.resourceId.slice(-6)})
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-sans">
                        <div className="text-white font-medium">{actorName}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{actorRole}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px] max-w-xs truncate">
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
