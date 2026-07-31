import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Users,
  FileText,
  Pill,
  ShieldCheck,
  Activity,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../api/client';
import { IAuditLog } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<{
    stats: {
      totalDoctors: number;
      activeDoctors: number;
      pendingDoctors: number;
      totalPatients: number;
      totalPrescriptions: number;
      todayPrescriptions: number;
      totalMedicines: number;
    };
    recentLogs: IAuditLog[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await api<{ success: boolean; data: any }>('/admin/stats');
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load admin stats', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Loading admin oversight...</div>;
  }

  const stats = data?.stats || {
    totalDoctors: 0,
    activeDoctors: 0,
    pendingDoctors: 0,
    totalPatients: 0,
    totalPrescriptions: 0,
    todayPrescriptions: 0,
    totalMedicines: 0,
  };
  const recentLogs = data?.recentLogs || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h2 className="text-xl font-bold text-slate-900">System Administration & Oversight</h2>
        <p className="text-xs text-slate-500">
          Platform health, doctor verification, medicine database, and security audit logs
        </p>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">Doctors</span>
          <p className="text-2xl font-black text-slate-900">{stats.totalDoctors}</p>
          <span className="text-[11px] text-emerald-600 font-semibold">
            {stats.activeDoctors} Active • {stats.pendingDoctors} Pending
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">Total Patients</span>
          <p className="text-2xl font-black text-slate-900">{stats.totalPatients}</p>
          <span className="text-[11px] text-slate-500 font-medium">Across all doctor chambers</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">Prescriptions Issued</span>
          <p className="text-2xl font-black text-slate-900">{stats.totalPrescriptions}</p>
          <span className="text-[11px] text-medical-600 font-semibold">
            +{stats.todayPrescriptions} generated today
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">Medicine Database</span>
          <p className="text-2xl font-black text-slate-900">{stats.totalMedicines}</p>
          <span className="text-[11px] text-slate-500 font-medium">Verified catalog items</span>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/doctors"
          className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-medical-400 hover:shadow-md transition-all space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-medical-50 text-medical-700 flex items-center justify-center">
            <Stethoscope className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm group-hover:text-medical-700 transition-colors">
            Manage Doctors & Registrations
          </h3>
          <p className="text-xs text-slate-500">
            Review BMDC registration credentials, approve new doctor accounts, or suspend profiles.
          </p>
        </Link>

        <Link
          to="/admin/medicines"
          className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-medical-400 hover:shadow-md transition-all space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Pill className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
            Medicine Database & CSV Import
          </h3>
          <p className="text-xs text-slate-500">
            Maintain Bangladesh medicine catalog and bulk-upload thousands of drugs via CSV.
          </p>
        </Link>

        <Link
          to="/admin/audit-logs"
          className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-medical-400 hover:shadow-md transition-all space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm group-hover:text-slate-700 transition-colors">
            System Security & Audit Logs
          </h3>
          <p className="text-xs text-slate-500">
            View compliance history for logins, prescription finalizations, and modifications.
          </p>
        </Link>
      </div>

      {/* Recent Audit Activity */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-medical-600" /> Recent System Audit Events
          </h3>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-bold text-medical-600 hover:text-medical-700 flex items-center gap-1"
          >
            Full Audit Logs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentLogs.map((log) => (
            <div key={log._id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded mr-2">
                  {log.action}
                </span>
                <span className="text-slate-600">
                  by <span className="font-bold">{log.userName}</span> ({log.userRole})
                </span>
              </div>
              <span className="text-slate-400 text-[11px] font-mono">
                {new Date(log.createdAt).toLocaleString('en-GB')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
