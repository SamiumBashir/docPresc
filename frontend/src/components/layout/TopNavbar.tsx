import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  Building2,
  Globe,
  User,
  LogOut,
  Settings,
  ChevronDown,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface TopNavbarProps {
  onOpenSearch: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenSearch }) => {
  const { user, doctor, chambers, activeChamber, setActiveChamber, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [chamberDropdownOpen, setChamberDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-xs">
      {/* Left: Global Quick Patient Search */}
      <div className="flex items-center gap-3 w-full max-w-md">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 w-full bg-slate-100/80 hover:bg-slate-100 text-slate-500 hover:text-slate-700 px-3.5 py-2 rounded-xl text-sm transition-all border border-slate-200/60 group"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-medical-600 transition-colors" />
          <span className="flex-1 text-left">{t('rx_select_patient')}</span>
          <kbd className="hidden sm:inline-block bg-white text-slate-400 px-2 py-0.5 rounded text-xs border border-slate-200 font-mono shadow-2xs">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Active Chamber Switcher */}
        {user?.role === 'doctor' && chambers.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setChamberDropdownOpen(!chamberDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-medical-50 hover:bg-medical-100/80 text-medical-800 text-xs sm:text-sm font-medium border border-medical-200/60 transition-colors"
            >
              <Building2 className="w-4 h-4 text-medical-600" />
              <span className="max-w-[140px] truncate hidden md:inline">
                {activeChamber?.name || 'Select Chamber'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-medical-600" />
            </button>

            {chamberDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-40 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Select Consulting Chamber
                </div>
                {chambers.map((ch) => (
                  <button
                    key={ch._id}
                    onClick={() => {
                      setActiveChamber(ch);
                      setChamberDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-start gap-2 hover:bg-slate-50 transition-colors ${
                      activeChamber?._id === ch._id
                        ? 'text-medical-700 font-semibold bg-medical-50/50'
                        : 'text-slate-700'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-medical-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="leading-tight">{ch.name}</p>
                      <p className="text-xs text-slate-400 leading-tight mt-0.5 truncate">{ch.address}</p>
                    </div>
                  </button>
                ))}
                <div className="border-t border-slate-100 p-2">
                  <Link
                    to="/chambers"
                    onClick={() => setChamberDropdownOpen(false)}
                    className="text-xs text-medical-600 hover:text-medical-700 font-medium block text-center py-1"
                  >
                    + Manage Chambers
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick New Prescription Button */}
        {user?.role === 'doctor' && (
          <Link
            to="/prescriptions/new"
            className="flex items-center gap-1.5 bg-medical-600 hover:bg-medical-700 text-white px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold shadow-sm shadow-medical-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{t('nav_new_prescription')}</span>
          </Link>
        )}

        {/* Language Switcher */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold border border-slate-200 transition-colors"
          title="Toggle Language (English / বাংলা)"
        >
          <Globe className="w-3.5 h-3.5 text-medical-600" />
          <span>{language === 'en' ? 'বাংলা' : 'English'}</span>
        </button>

        {/* Profile Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-medical-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {user?.name?.charAt(0) || 'D'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-none">{user?.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">
                {doctor?.bmdcNumber ? `BMDC: ${doctor.bmdcNumber}` : user?.role}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-40 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                {doctor && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
                    <ShieldCheck className="w-3 h-3" /> BMDC Verified ({doctor.bmdcNumber})
                  </span>
                )}
              </div>

              {user?.role === 'doctor' && (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-medical-700"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    {t('nav_profile')}
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-medical-700"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    {t('nav_settings')}
                  </Link>
                </>
              )}

              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-medical-700"
                >
                  <Stethoscope className="w-4 h-4 text-slate-400" />
                  {t('nav_admin')}
                </Link>
              )}

              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('nav_logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
