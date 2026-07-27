import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FilePlus,
  History,
  Pill,
  Bookmark,
  Building2,
  BarChart3,
  User,
  Settings,
  ShieldAlert,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

export const Sidebar: React.FC = () => {
  const { user, doctor } = useAuth();
  const { t } = useLanguage();

  const doctorNavItems: NavItem[] = [
    { to: '/dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { to: '/prescriptions/new', label: t('nav_new_prescription'), icon: FilePlus, highlight: true },
    { to: '/patients', label: t('nav_patients'), icon: Users },
    { to: '/prescriptions', label: t('nav_prescriptions'), icon: History },
    { to: '/medicines', label: t('nav_medicines'), icon: Pill },
    { to: '/templates', label: t('nav_templates'), icon: Bookmark },
    { to: '/chambers', label: t('nav_chambers'), icon: Building2 },
    { to: '/reports', label: t('nav_reports'), icon: BarChart3 },
    { to: '/profile', label: t('nav_profile'), icon: User },
    { to: '/settings', label: t('nav_settings'), icon: Settings },
  ];

  const adminNavItems: NavItem[] = [
    { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/doctors', label: 'Manage Doctors', icon: Stethoscope },
    { to: '/admin/medicines', label: 'Medicine Catalog & CSV', icon: Pill },
    { to: '/admin/audit-logs', label: 'System Audit Logs', icon: ShieldAlert },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : doctorNavItems;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-medical-600 to-medical-400 flex items-center justify-center text-white shadow-md shadow-medical-600/30">
          <Stethoscope className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-tight text-base flex items-center gap-1.5">
            DocRx <span className="text-[10px] bg-medical-500/20 text-medical-300 px-1.5 py-0.5 rounded font-mono">PRO</span>
          </h1>
          <p className="text-[11px] text-slate-400 leading-none">Prescription System</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard' || item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  item.highlight
                    ? isActive
                      ? 'bg-medical-500 text-white shadow-md shadow-medical-500/25'
                      : 'bg-medical-950/60 hover:bg-medical-900/80 text-medical-300 border border-medical-700/40'
                    : isActive
                    ? 'bg-medical-600/20 text-medical-300 font-semibold border border-medical-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon
                className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  item.highlight ? 'text-medical-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span className="truncate">{item.label}</span>
              {item.highlight && (
                <Sparkles className="w-3 h-3 text-amber-400 ml-auto animate-pulse shrink-0" />
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Doctor Quick Badge at bottom */}
      {user?.role === 'doctor' && doctor && (
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/30">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <p className="text-xs font-bold text-white truncate">{doctor.name}</p>
            <p className="text-[11px] text-medical-400 truncate mt-0.5">{doctor.qualification}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/40 text-[10px] text-slate-400">
              <span>BMDC: {doctor.bmdcNumber}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
