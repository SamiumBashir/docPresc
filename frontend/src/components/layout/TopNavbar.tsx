import React, { useState, useRef, useEffect } from 'react';
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
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface TopNavbarProps {
  onOpenSearch: () => void;
  onToggleSidebar?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenSearch, onToggleSidebar }) => {
  const { user, doctor, chambers, activeChamber, setActiveChamber, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [chamberDropdownOpen, setChamberDropdownOpen] = useState(false);
  const chamberDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chamberDropdownRef.current && !chamberDropdownRef.current.contains(event.target as Node)) {
        setChamberDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 shadow-xs gap-2">
      {/* Left: Mobile Menu Toggle & Global Quick Patient Search */}
      <div className="flex items-center gap-2 sm:gap-3 w-full max-w-md">
        <button
          onClick={onToggleSidebar}
          aria-label="Open Navigation Menu"
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition-colors shrink-0"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        <button
          onClick={onOpenSearch}
          aria-label="Quick patient search (Ctrl + K)"
          className="flex items-center gap-2 w-full bg-slate-100/80 hover:bg-slate-100 text-slate-500 hover:text-slate-700 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all border border-slate-200/60 group truncate"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-medical-600 transition-colors shrink-0" aria-hidden="true" />
          <span className="flex-1 text-left truncate">{t('rx_select_patient')}</span>
          <kbd className="hidden md:inline-block bg-white text-slate-400 px-2 py-0.5 rounded text-xs border border-slate-200 font-mono shadow-2xs">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Active Chamber Switcher */}
        {user?.role === 'doctor' && chambers.length > 0 && (
          <div className="relative" ref={chamberDropdownRef}>
            <button
              onClick={() => setChamberDropdownOpen(!chamberDropdownOpen)}
              aria-label="Select Consulting Chamber"
              aria-expanded={chamberDropdownOpen}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-medical-50 hover:bg-medical-100/80 text-medical-800 text-xs sm:text-sm font-medium border border-medical-200/60 transition-colors shrink-0"
            >
              <Building2 className="w-4 h-4 text-medical-600 shrink-0" aria-hidden="true" />
              <span className="max-w-[160px] sm:max-w-[240px] md:max-w-[320px] lg:max-w-[400px] truncate inline-block">
                {activeChamber?.name || 'Select Chamber'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-medical-600 shrink-0 transition-transform duration-200 ${
                  chamberDropdownOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {chamberDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-40 animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-2 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Select Consulting Chamber</span>
                  <span className="text-[11px] font-normal text-slate-400">({chambers.length})</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {chambers.map((ch) => {
                    const isSelected = activeChamber?._id === ch._id;
                    return (
                      <button
                        key={ch._id}
                        onClick={() => {
                          setActiveChamber(ch);
                          setChamberDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 text-sm flex items-start gap-3 hover:bg-slate-50 transition-colors ${
                          isSelected
                            ? 'text-medical-800 font-semibold bg-medical-50/60'
                            : 'text-slate-700'
                        }`}
                      >
                        <Building2
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            isSelected ? 'text-medical-600' : 'text-slate-400'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="leading-snug font-medium text-slate-900 break-words">{ch.name}</p>
                            {isSelected && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-medical-700 bg-medical-100/80 px-1.5 py-0.5 rounded shrink-0">
                                Active
                              </span>
                            )}
                          </div>
                          {ch.address && (
                            <p className="text-xs text-slate-500 leading-snug mt-1 break-words">
                              {ch.address}
                            </p>
                          )}
                          {ch.visitingHours && (
                            <p className="text-[11px] text-medical-600 font-medium leading-snug mt-0.5">
                              {ch.visitingHours}
                            </p>
                          )}
                          {ch.website && (
                            <p className="text-[11px] text-slate-500 font-medium leading-snug mt-0.5 truncate">
                              Appointment: {ch.website}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-slate-100 p-2">
                  <Link
                    to="/chambers"
                    onClick={() => setChamberDropdownOpen(false)}
                    className="text-xs text-medical-600 hover:text-medical-700 font-medium block text-center py-1.5 hover:bg-medical-50/50 rounded-lg transition-colors"
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
          aria-label="Toggle Language between English and Bengali"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold border border-slate-200 transition-colors"
          title="Toggle Language (English / বাংলা)"
        >
          <Globe className="w-3.5 h-3.5 text-medical-600" aria-hidden="true" />
          <span>{language === 'en' ? 'বাংলা' : 'English'}</span>
        </button>

        {/* Profile Avatar & Menu */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            aria-label="User profile and account settings menu"
            aria-expanded={profileDropdownOpen}
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
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                profileDropdownOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
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
