import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { InfinityLoop } from '@/components/loading-ui/infinity';
import {
  Users,
  FileText,
  Pill,
  Building2,
  RefreshCw,
  Clock,
  ShieldCheck,
  ArrowRight,
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
      const res = await api<{ success: boolean; data: { stats: AdminStats; recentLogs: any[] } }>(
        '/admin/stats'
      );
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
      <div className="flex items-center justify-center min-h-[360px]">
        <div className="flex flex-col items-center gap-3">
          <InfinityLoop className="w-14 h-7 text-[#2ab0c7]" duration="1.6s" />
          <p className="text-xs text-[#a3a9b8]">Loading system metrics...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Registered doctors',
      value: stats?.totalDoctors || 0,
      subtext: `${stats?.pendingDoctors || 0} pending approvals`,
      icon: Users,
      to: '/admin/doctors',
    },
    {
      title: 'Prescriptions issued',
      value: stats?.totalPrescriptions || 0,
      subtext: 'Across all chambers',
      icon: FileText,
    },
    {
      title: 'Medicine catalog',
      value: stats?.totalMedicines || 0,
      subtext: 'Allopathic, Unani & Ayurvedic',
      icon: Pill,
      to: '/admin/medicines',
    },
    {
      title: 'Active chambers',
      value: stats?.totalChambers || 0,
      subtext: 'Verified practice locations',
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-[#eef0f5] tracking-[-0.01em]">
            Clinical Operations Overview
          </h1>
          <p className="text-xs text-[#a3a9b8] mt-1">
            Platform registry counts, verification queues, and recent governance events
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
          <span>Refresh metrics</span>
        </button>
      </div>

      {/* Stat Cards Grid (Quiet Dark Ramp — Numbers Only, No Rainbow Gradients) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="rounded-xl bg-[#131924] border border-white/[0.08] p-5 flex flex-col justify-between transition-colors hover:border-white/[0.14]"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-[#a3a9b8]">{card.title}</p>
                  <Icon className="w-4 h-4 text-[#757d90] shrink-0" strokeWidth={1.5} />
                </div>
                <p className="text-2xl font-medium text-[#eef0f5] mt-2 tabular-nums">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-xs text-[#757d90] mt-1 tabular-nums">{card.subtext}</p>
              </div>

              {card.to && (
                <Link
                  to={card.to}
                  className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-medium text-[#2ab0c7] hover:text-[#4bc5da] transition-colors"
                >
                  <span>Open registry</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl bg-[#131924] border border-white/[0.08] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#757d90]" strokeWidth={1.5} />
            <h2 className="text-sm font-medium text-[#eef0f5]">Recent audit activity</h2>
          </div>
          <Link
            to="/admin/audit-logs"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#2ab0c7] hover:text-[#4bc5da] transition-colors"
          >
            <span>View all logs</span>
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {stats?.recentAuditLogs && stats.recentAuditLogs.length > 0 ? (
            stats.recentAuditLogs.slice(0, 6).map((log: any, idx: number) => (
              <div
                key={idx}
                className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#1b2232] border border-white/[0.08] text-[#757d90] flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#eef0f5] truncate">
                      {log.action}{' '}
                      <span className="font-normal text-[#a3a9b8]">on {log.resource}</span>
                    </p>
                    <p className="text-xs text-[#757d90] truncate">
                      Operator:{' '}
                      {log.userName ||
                        (typeof log.userId === 'object' ? log.userId?.name : 'System')}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[#757d90] font-mono tabular-nums shrink-0">
                  {log.createdAt ? format(new Date(log.createdAt), 'MMM d, HH:mm') : 'Recent'}
                </span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-[#757d90] text-xs">
              No recent audit events recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
