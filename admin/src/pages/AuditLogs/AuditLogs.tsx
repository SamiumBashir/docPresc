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
import { api } from '../../api/client';
import { AuditLog } from '../../types';
import { format } from 'date-fns';

export const AuditLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const { data: logs = [], isLoading, refetch, isFetching } = useQuery<AuditLog[]>({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const res = await api<{ success: boolean; data: { logs: AuditLog[] } }>('/admin/audit-logs?limit=50');
      const list = res.data?.logs || (res as any).logs || (Array.isArray(res.data) ? res.data : []) || [];
      return list;
    },
  });

  const filteredLogs = logs.filter((log) => {
    const userName =
      typeof log.userId === 'object' && log.userId?.name ? log.userId.name : '';
    const userEmail =
      typeof log.userId === 'object' && log.userId?.email ? log.userId.email : '';

    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase());

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
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
            Loading security audit trail...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            No audit logs match current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Actor / User</th>
                  <th className="py-3.5 px-4">Resource Target</th>
                  <th className="py-3.5 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => {
                  const actor = typeof log.userId === 'object' ? log.userId : null;
                  return (
                    <tr key={log._id} className="hover:bg-slate-800/40 transition-colors text-xs">
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {log.timestamp
                              ? format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')
                              : '—'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono font-semibold">
                          <FileCheck className="w-3 h-3" />
                          <span>{log.action}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {actor ? (
                          <div>
                            <span className="font-semibold text-white block">{actor.name}</span>
                            <span className="text-slate-500 font-mono text-[11px]">
                              {actor.email} ({actor.role})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">System / Anonymous</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {log.resource}
                        {log.resourceId && (
                          <span className="text-slate-500 ml-1">#{String(log.resourceId).slice(-6)}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
