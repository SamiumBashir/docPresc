import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  FilePlus,
  History,
  Building2,
  Search,
  ArrowRight,
  Printer,
  Eye,
  Calendar,
  Sparkles,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../api/client';
import { IPatient, IPrescription } from '../../types';

export const Dashboard: React.FC = () => {
  const { doctor, user, chambers } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    todayPatients: 0,
    todayPrescriptions: 0,
    totalPatients: 0,
    monthPrescriptions: 0,
  });
  const [recentPatients, setRecentPatients] = useState<IPatient[]>([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<IPrescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [reportsRes, patientsRes, prescriptionsRes] = await Promise.all([
          api<{ success: boolean; data: any }>('/admin/reports'),
          api<{ success: boolean; data: { patients: IPatient[] } }>('/patients?limit=5'),
          api<{ success: boolean; data: { prescriptions: IPrescription[] } }>('/prescriptions?limit=5'),
        ]);

        if (reportsRes.success && reportsRes.data?.stats) {
          setStats(reportsRes.data.stats);
        }
        if (patientsRes.success && patientsRes.data?.patients) {
          setRecentPatients(patientsRes.data.patients);
        }
        if (prescriptionsRes.success && prescriptionsRes.data?.prescriptions) {
          setRecentPrescriptions(prescriptionsRes.data.prescriptions);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-medical-800 via-medical-700 to-slate-900 text-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl shadow-medical-900/10">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-medical-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Digital Prescription Management Platform</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight">
            {t('dash_subtitle')} {doctor?.name || user?.name}
          </h2>
          <p className="text-xs sm:text-sm text-medical-100/90 leading-relaxed">
            {doctor?.qualification || 'Consultant Physician'} • BMDC Reg: {doctor?.bmdcNumber || 'A-54321'}
          </p>
        </div>

        {/* Quick Write Prescription Action */}
        <div className="relative z-10 mt-6 flex flex-wrap gap-2.5 sm:gap-3">
          <Link
            to="/prescriptions/new"
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white text-medical-800 hover:bg-medical-50 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <FilePlus className="w-4 h-4 text-medical-600" />
            <span>{t('dash_quick_action_rx')}</span>
          </Link>
          <Link
            to="/patients"
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-all"
          >
            <Users className="w-4 h-4" />
            <span>{t('dash_quick_action_add_patient')}</span>
          </Link>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Today's Prescriptions */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('dash_today_prescriptions')}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-medical-50 text-medical-600 flex items-center justify-center">
              <FilePlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-3xl font-black text-slate-900">
              {stats.todayPrescriptions}
            </span>
            <span className="text-[10px] sm:text-xs text-emerald-600 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> Today
            </span>
          </div>
        </div>

        {/* Today's Patients */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('dash_today_patients')}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-3xl font-black text-slate-900">
              {stats.todayPatients}
            </span>
            <span className="text-xs text-slate-400">Visited</span>
          </div>
        </div>

        {/* Total Registered Patients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('dash_total_patients')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.totalPatients}
            </span>
            <span className="text-xs text-slate-400">Database</span>
          </div>
        </div>

        {/* Active Chambers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('dash_active_chambers')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {chambers.length || 1}
            </span>
            <span className="text-xs text-slate-400">Chambers</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Patients & Recent Prescriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{t('dash_recent_patients')}</h3>
              <p className="text-xs text-slate-400">Last visited patients in your chambers</p>
            </div>
            <Link
              to="/patients"
              className="text-xs font-bold text-medical-600 hover:text-medical-700 flex items-center gap-1"
            >
              {t('dash_view_all')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentPatients.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No patient records found yet.</div>
            ) : (
              recentPatients.map((p) => (
                <div
                  key={p._id}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs group-hover:text-medical-700 transition-colors">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                        {p.patientId}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {p.age} yrs • {p.gender} • Phone: {p.phone}
                    </p>
                    {p.lastDiagnosis && (
                      <p className="text-[10px] text-medical-800 bg-medical-50 px-1.5 py-0.5 rounded inline-block font-medium">
                        Dx: {p.lastDiagnosis}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <Link
                      to={`/patients/${p._id}`}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:text-medical-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                    >
                      History
                    </Link>
                    <Link
                      to={`/prescriptions/new?patientId=${p._id}`}
                      className="px-3 py-1 bg-medical-600 hover:bg-medical-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1"
                    >
                      <FilePlus className="w-3 h-3" /> Write Rx
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Prescriptions Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{t('dash_recent_prescriptions')}</h3>
              <p className="text-xs text-slate-400">Recently generated clinical prescriptions</p>
            </div>
            <Link
              to="/prescriptions"
              className="text-xs font-bold text-medical-600 hover:text-medical-700 flex items-center gap-1"
            >
              {t('dash_view_all')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentPrescriptions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No prescriptions generated yet.</div>
            ) : (
              recentPrescriptions.map((rx) => (
                <div
                  key={rx._id}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {rx.prescriptionId}
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                          rx.status === 'FINALIZED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rx.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      Patient: {rx.patientSnapshot?.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(rx.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      • {rx.medicines.length} Meds
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <Link
                      to={`/prescriptions/${rx._id}`}
                      className="p-2 text-slate-500 hover:text-medical-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="View Prescription"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/prescriptions/new?cloneId=${rx._id}&patientId=${rx.patientId}`}
                      className="px-2.5 py-1 text-xs font-semibold text-medical-700 bg-medical-50 hover:bg-medical-100 rounded-lg border border-medical-200 transition-colors"
                      title="Duplicate as new draft"
                    >
                      Clone Rx
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
