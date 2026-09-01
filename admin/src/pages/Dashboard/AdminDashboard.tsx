import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  FileText,
  Pill,
  ShieldCheck,
  Building2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { AdminStats } from '../../types';
import { format } from 'date-fns';

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
      to: '/doctors',
    },
    {
      title: 'Prescriptions Issued',
      value: stats?.totalPrescriptions || 0,
      subtext: 'Across all chambers',
      icon: FileText,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Medicine Catalog',
      value: stats?.totalMedicines || 0,
      subtext: 'Allopathic, Unani & Ayurvedic',
      icon: Pill,
      color: 'from-purple-500 to-pink-600',
      to: '/medicines',
    },
    {
      title: 'Active Chambers',
      value: stats?.totalChambers || 0,
      subtext: 'Registered clinics',
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          const CardContent = (
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all duration-300 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-lg`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {card.value.toLocaleString()}
                </span>
                {card.to && (
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">{card.subtext}</p>
            </div>
          );

          return card.to ? (
            <Link key={card.title} to={card.to} className="block">
              {CardContent}
            </Link>
          ) : (
            <div key={card.title}>{CardContent}</div>
          );
        })}
      </div>

      {/* Quick Action & Security Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health / Quick Info */}
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h2 className="font-bold text-white text-base">Security & Health</h2>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              BMDC Standard
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-sm font-medium text-slate-200">Database Connection</span>
              </div>
              <span className="text-xs text-emerald-400 font-mono">Connected</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                <span className="text-sm font-medium text-slate-200">JWT Token Security</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Active (256-bit)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-sm font-medium text-slate-200">Pending Doctors</span>
              </div>
              <span className="text-xs text-amber-400 font-bold">
                {stats?.pendingDoctors || 0} Awaiting
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/doctors"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl text-center block transition-colors"
            >
              Review Registered Doctors
            </Link>
          </div>
        </div>

        {/* Recent Audit Logs Feed */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div>
              <h2 className="font-bold text-white text-base">Recent Audit & Security Logs</h2>
              <p className="text-xs text-slate-400">Live operational trail across all doctor portals</p>
            </div>
            <Link
              to="/audit-logs"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
            >
              <span>View All Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
            {stats?.recentAuditLogs && stats.recentAuditLogs.length > 0 ? (
              stats.recentAuditLogs.slice(0, 7).map((log) => (
                <div
                  key={log._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-2 py-0.5 rounded font-mono font-semibold text-[10px] bg-slate-800 text-indigo-300 border border-slate-700">
                      {log.action}
                    </span>
                    <span className="text-slate-300 font-medium truncate">
                      {typeof log.userId === 'object' && log.userId?.name
                        ? log.userId.name
                        : 'System Operator'}
                    </span>
                    <span className="text-slate-500 hidden sm:inline">• {log.resource}</span>
                  </div>
                  <span className="text-slate-500 font-mono flex-shrink-0 text-[11px]">
                    {log.timestamp ? format(new Date(log.timestamp), 'HH:mm:ss') : 'Just now'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No recent audit logs found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
