import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Pill,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  Stethoscope,
  Activity,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    {
      to: '/admin',
      label: 'Overview',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      to: '/admin/doctors',
      label: 'Doctors & BMDC',
      icon: Users,
    },
    {
      to: '/admin/medicines',
      label: 'Medicine catalog',
      icon: Pill,
    },
    {
      to: '/admin/therapies',
      label: 'Therapy governance',
      icon: Activity,
    },
    {
      to: '/admin/audit-logs',
      label: 'Audit logs',
      icon: ShieldAlert,
    },
  ];

  const currentSectionTitle = location.pathname.includes('/doctors')
    ? 'Doctors & BMDC'
    : location.pathname.includes('/medicines')
    ? 'Medicine catalog'
    : location.pathname.includes('/therapies')
    ? 'Therapy governance'
    : location.pathname.includes('/audit-logs')
    ? 'Audit logs'
    : 'Overview';

  return (
    <div className="h-screen supports-[height:100dvh]:h-dvh overflow-hidden flex bg-[#0d1119] text-[#eef0f5] font-sans antialiased">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 lg:static lg:h-full z-50 w-64 shrink-0 bg-[#080b11] border-r border-white/[0.08] flex flex-col transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Flat Clinical Brand Header */}
        <div className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#007086] flex items-center justify-center text-white shrink-0">
              <Activity className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="font-semibold text-base tracking-[-0.01em] text-[#eef0f5]">
                  DocRx
                </span>
                <span className="text-[11px] font-mono text-[#757d90]">Admin</span>
              </div>
              <p className="text-xs text-[#757d90] leading-none mt-0.5">Clinical governance</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="lg:hidden text-[#757d90] hover:text-[#eef0f5] p-1 rounded-lg"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          <div className="px-3 pb-2 text-xs font-medium text-[#757d90]">Administration</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === '/admin' ||
                location.pathname === '/admin/' ||
                location.pathname === '/admin/dashboard'
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 h-9 px-3 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#1b2232] text-[#eef0f5] border border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                    : 'text-[#a3a9b8] border border-transparent hover:bg-white/[0.04] hover:text-[#eef0f5]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#2ab0c7]' : 'text-[#757d90]'
                  }`}
                  strokeWidth={1.5}
                />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}

          <div className="pt-6 px-3 pb-2 text-xs font-medium text-[#757d90]">
            Clinical workspace
          </div>
          <NavLink
            to="/dashboard"
            className="flex items-center justify-between h-9 px-3 rounded-lg text-[13px] font-medium text-[#a3a9b8] border border-transparent hover:bg-white/[0.04] hover:text-[#eef0f5] transition-colors duration-150"
          >
            <div className="flex items-center gap-2.5">
              <Stethoscope className="w-4 h-4 text-[#757d90] shrink-0" strokeWidth={1.5} />
              <span>Doctor portal</span>
            </div>
            <ExternalLink className="w-4 h-4 text-[#757d90] shrink-0" strokeWidth={1.5} />
          </NavLink>
        </div>

        {/* User Footer */}
        <div className="shrink-0 p-3 border-t border-white/[0.08]">
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#131924] border border-white/[0.08]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-md bg-[#1b2232] border border-white/[0.08] text-[#eef0f5] flex items-center justify-center font-medium text-xs shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#eef0f5] truncate">
                  {user?.name || 'Administrator'}
                </p>
                <p className="text-[11px] text-[#757d90] truncate">
                  {user?.email || 'admin@prescription.com'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
              className="p-1.5 rounded-md text-[#757d90] hover:text-[#e5484d] hover:bg-white/[0.04] transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-16 shrink-0 border-b border-white/[0.08] bg-[#0d1119] px-4 sm:px-8 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-1.5 rounded-lg text-[#a3a9b8] hover:text-[#eef0f5] hover:bg-white/[0.06]"
            >
              <Menu className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <div className="flex items-center gap-2 text-xs text-[#757d90]">
              <span>Admin</span>
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-[#eef0f5] font-medium">{currentSectionTitle}</span>
            </div>
          </div>

          <span className="hidden sm:inline-block text-xs font-mono text-[#757d90]">
            v1 API • Registry active
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#0d1119]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
export default AdminLayout;
