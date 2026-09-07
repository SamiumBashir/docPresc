import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  Building2,
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
  const { t } = useLanguage();
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
    setProfileDropdownOpen(false);
    await logout();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-2.5 xs:px-3 sm:px-6 shadow-xs gap-1.5 sm:gap-4">
      {/* Left: Mobile Menu Toggle & Global Quick Patient Search */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 sm:flex-1 sm:min-w-0 sm:max-w-md">
        <button
          onClick={onToggleSidebar}
          aria-label="Open Navigation Menu"
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition-colors shrink-0"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Mobile Search Icon Button (< sm) */}
        <button
          onClick={onOpenSearch}
          aria-label="Quick patient search"
          className="sm:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition-colors shrink-0"
          title="Search Patient (Ctrl + K)"
        >
          <Search className="w-5 h-5 text-slate-500" aria-hidden="true" />
        </button>

        {/* Desktop/Tablet Search Input Pill (>= sm) */}
        <button
          onClick={onOpenSearch}
          aria-label="Quick patient search (Ctrl + K)"
          className="hidden sm:flex items-center gap-2 w-full bg-slate-100/80 hover:bg-slate-100 text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-all border border-slate-200/60 group truncate"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-medical-600 transition-colors shrink-0" aria-hidden="true" />
          <span className="flex-1 text-left truncate">{t('rx_select_patient')}</span>
          <kbd className="hidden md:inline-block bg-white text-slate-400 px-2 py-0.5 rounded text-xs border border-slate-200 font-mono shadow-2xs">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 shrink-0">
        {/* Active Chamber Switcher */}
        {user?.role === 'doctor' && chambers.length > 0 && (
          <div className="relative" ref={chamberDropdownRef}>
            <button
              onClick={() => setChamberDropdownOpen(!chamberDropdownOpen)}
              aria-label="Select Consulting Chamber"
              aria-expanded={chamberDropdownOpen}
              className="flex items-center gap-1.5 px-2 xs:px-2.5 sm:px-3 py-1.5 rounded-xl bg-medical-50 hover:bg-medical-100/80 text-medical-800 text-xs sm:text-sm font-semibold border border-medical-200/70 transition-colors shrink-0"
            >
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-medical-600 shrink-0" aria-hidden="true" />
              <span className="max-w-[100px] xs:max-w-[140px] sm:max-w-[200px] md:max-w-[300px] lg:max-w-[380px] truncate inline-block">
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
              <>
                {/* Mobile Backdrop to tap outside */}
                <div
                  className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xs z-40 lg:hidden"
                  onClick={() => setChamberDropdownOpen(false)}
                />

                {/* Dropdown Container: fixed & centered on mobile/tablet (< lg), anchored under button on lg */}
                <div className="fixed left-3 right-3 top-16 mx-auto max-w-md lg:absolute lg:left-auto lg:right-0 lg:top-full lg:mt-2 lg:w-96 lg:mx-0 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2.5 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Select Consulting Chamber</span>
                    <span className="text-[11px] font-medium text-medical-700 bg-medical-50 px-2 py-0.5 rounded-full">
                      {chambers.length} {chambers.length === 1 ? 'Chamber' : 'Chambers'}
                    </span>
                  </div>
                  <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {chambers.map((ch) => {
                      const isSelected = activeChamber?._id === ch._id;
                      return (
                        <button
                          key={ch._id}
                          onClick={() => {
                            setActiveChamber(ch);
                            setChamberDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm flex items-start gap-3 hover:bg-slate-50 transition-colors ${
                            isSelected
                              ? 'text-medical-900 font-semibold bg-medical-50/70'
                              : 'text-slate-700'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${isSelected ? 'bg-medical-100 text-medical-700' : 'bg-slate-100 text-slate-500'}`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="leading-snug font-bold text-slate-900 break-words">{ch.name}</p>
                              {isSelected && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-medical-700 bg-medical-100 px-2 py-0.5 rounded-full shrink-0">
                                  Active
                                </span>
                              )}
                            </div>
                            {ch.address && (
                              <p className="text-xs text-slate-500 leading-snug mt-1 break-words">
                                {ch.address}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {ch.visitingHours && (
                                <p className="text-[11px] text-medical-700 font-medium leading-snug">
                                  🕒 {ch.visitingHours}
                                </p>
                              )}
                              {ch.phone && (
                                <p className="text-[11px] text-slate-500 font-medium leading-snug">
                                  📞 {ch.phone}
                                </p>
                              )}
                            </div>
                            {ch.website && (
                              <p className="text-[11px] text-medical-600 font-medium leading-snug mt-0.5 truncate">
                                🌐 Appointment: {ch.website}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-100 p-2.5 bg-slate-50/50">
                    <Link
                      to="/chambers"
                      onClick={() => setChamberDropdownOpen(false)}
                      className="text-xs text-medical-700 hover:text-medical-800 font-bold block text-center py-2 hover:bg-medical-50 rounded-xl transition-colors"
                    >
                      + Manage Chambers
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Quick New Prescription Button */}
        {user?.role === 'doctor' && (
          <Link
            to="/prescriptions/new"
            aria-label="Write New Prescription"
            className="flex items-center gap-1.5 bg-medical-600 hover:bg-medical-700 text-white p-2 sm:px-3.5 sm:py-1.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-medical-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            title="Write New Prescription (Ctrl + N)"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden md:inline">{t('nav_new_prescription')}</span>
          </Link>
        )}

        {/* Profile Avatar & Menu */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            aria-label="User profile and account settings menu"
            aria-expanded={profileDropdownOpen}
            className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-medical-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {user?.name?.charAt(0) || 'D'}
            </div>
            <div className="hidden lg:block text-left max-w-[140px]">
              <p className="text-xs font-bold text-slate-800 leading-none truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide truncate">
                {doctor?.registrationNumber || doctor?.bmdcNumber
                  ? `${doctor?.healthcareAuthority || 'BMDC'}: ${doctor.registrationNumber || doctor.bmdcNumber}`
                  : user?.role}
              </p>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden sm:block ${
                profileDropdownOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {profileDropdownOpen && (
            <>
              {/* Mobile Backdrop */}
              <div
                className="fixed inset-0 bg-slate-900/10 z-40 sm:hidden"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  {doctor && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
                      <ShieldCheck className="w-3 h-3" /> {doctor?.healthcareAuthority || 'BMDC'} Verified ({doctor.registrationNumber || doctor.bmdcNumber})
                    </span>
                  )}
                </div>

                {user?.role === 'doctor' && (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-medical-700 font-medium"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      {t('nav_profile')}
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-medical-700 font-medium"
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
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-medical-700 font-medium"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    {t('nav_admin')}
                  </Link>
                )}

                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    {t('nav_logout')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
