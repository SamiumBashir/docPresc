import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  FileText,
  Pill,
  Building2,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api-client';
import { format } from 'date-fns';

export interface AdminStats {
  totalDoctors: number;
  activeDoctors: number;
  pendingDoctors: number;
  totalPrescriptions: number;
  totalPatients: number;
  totalMedicines: number;
  totalChambers: number;
  recentAuditLogs?: any[];
}

export const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading, refetch, isFetching } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api<{ success: boolean; data: { stats: AdminStats; recentLogs: any[] } }>('/admin/stats');
      if (res.data?.stats) {
        return {
          ...res.data.stats,
          recentAuditLogs: res.data.recentLogs || [],
        };
      }
      return (res as any).stats || {};
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading enterprise analytics...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Doctors',
      value: stats?.totalDoctors || 0,
      subtext: `${stats?.pendingDoctors || 0} Pending Approvals`,
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      to: '/admin/doctors',
    },
    {
      title: 'Prescriptions Issued',
      value: stats?.totalPrescriptions || 0,
      subtext: 'Across all clinical chambers',
      icon: FileText,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Medicine Catalog',
      value: stats?.totalMedicines || 0,
      subtext: 'Allopathic, Unani & Ayurvedic',
      icon: Pill,
      color: 'from-purple-500 to-pink-600',
      to: '/admin/medicines',
    },
    {
      title: 'Active Chambers',
      value: stats?.totalChambers || 0,
      subtext: 'Registered clinical facilities',
      icon: Building2,
      color: 'from-amber-500 to-orange-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Executive Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time digital prescription ecosystem monitoring & master management.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl hover:border-slate-700 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className="text-3xl font-extrabold text-white mt-2">
                    {card.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">{card.subtext}</p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              {card.to && (
                <Link
                  to={card.to}
                  className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <span>Manage records</span>
                  <span>&rarr;</span>
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Recent Security & Activity Trail</h2>
          </div>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all logs &rarr;
          </Link>
        </div>

        <div className="divide-y divide-slate-800/60">
          {stats?.recentAuditLogs && stats.recentAuditLogs.length > 0 ? (
            stats.recentAuditLogs.slice(0, 5).map((log: any, idx: number) => (
              <div key={idx} className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {log.action} <span className="text-xs font-normal text-slate-400">on {log.resource}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Operator: {log.userName || (typeof log.userId === 'object' ? log.userId?.name : 'System')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-mono">
                    {log.createdAt ? format(new Date(log.createdAt), 'MMM d, HH:mm') : 'Recent'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              No recent audit logs recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
