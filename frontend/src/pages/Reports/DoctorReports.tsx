import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, FilePlus, Calendar, Pill, BookmarkCheck } from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../../components/ui/Toast';

export const DoctorReports: React.FC = () => {
  const [data, setData] = useState<{
    stats: {
      totalPatients: number;
      todayPatients: number;
      totalPrescriptions: number;
      todayPrescriptions: number;
      monthPrescriptions: number;
    };
    topMedicines: Array<{ name: string; count: number }>;
    topDiagnoses: Array<{ name: string; count: number }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api<{ success: boolean; data: any }>('/admin/reports');
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch {
        showToast.error('Failed to load reports.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Loading clinical analytics...</div>;
  }

  const stats = data?.stats || {
    totalPatients: 0,
    todayPatients: 0,
    totalPrescriptions: 0,
    todayPrescriptions: 0,
    monthPrescriptions: 0,
  };
  const topMedicines = data?.topMedicines || [];
  const topDiagnoses = data?.topDiagnoses || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Reports & Clinical Analytics</h2>
        <p className="text-xs text-slate-500">
          Overview of patient visits, top prescribed medications, and frequent clinical diagnoses
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">Total Consultations</span>
          <p className="text-2xl font-black text-slate-900">{stats.totalPrescriptions}</p>
          <span className="text-[11px] text-medical-600 font-medium">All Time Prescriptions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">This Month</span>
          <p className="text-2xl font-black text-slate-900">{stats.monthPrescriptions}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Current Month Consultations</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">Registered Patients</span>
          <p className="text-2xl font-black text-slate-900">{stats.totalPatients}</p>
          <span className="text-[11px] text-slate-500 font-medium">In Patient Roster</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-bold uppercase">Today's Visits</span>
          <p className="text-2xl font-black text-slate-900">{stats.todayPrescriptions}</p>
          <span className="text-[11px] text-cyan-600 font-medium">Active Today</span>
        </div>
      </div>

      {/* Two Column: Top Medicines vs Top Diagnoses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Frequently Prescribed Medicines */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-medical-600" /> Most Prescribed Medicines
            </h3>
            <span className="text-xs text-slate-400">Frequency Count</span>
          </div>

          {topMedicines.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">No prescription data yet.</p>
          ) : (
            <div className="space-y-3">
              {topMedicines.map((m, i) => {
                const maxCount = topMedicines[0]?.count || 1;
                const percentage = Math.round((m.count / maxCount) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">
                        {i + 1}. {m.name}
                      </span>
                      <span className="text-medical-800 font-mono font-bold">
                        {m.count} times
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-medical-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Most Frequent Diagnoses */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <BookmarkCheck className="w-4 h-4 text-medical-600" /> Frequent Clinical Diagnoses
            </h3>
            <span className="text-xs text-slate-400">Cases Diagnosed</span>
          </div>

          {topDiagnoses.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">No diagnosis data yet.</p>
          ) : (
            <div className="space-y-3">
              {topDiagnoses.map((d, i) => {
                const maxCount = topDiagnoses[0]?.count || 1;
                const percentage = Math.round((d.count / maxCount) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">
                        {i + 1}. {d.name}
                      </span>
                      <span className="text-emerald-800 font-mono font-bold">
                        {d.count} patients
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
