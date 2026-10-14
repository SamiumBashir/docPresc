import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { QuickPatientSearchModal } from './QuickPatientSearchModal';

export const AppLayout: React.FC = () => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isRxWorkspace = location.pathname.startsWith('/prescriptions/new');

  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Ctrl + K -> Open Quick Patient Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
      // Ctrl + N -> New Prescription
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n' && !e.shiftKey) {
        e.preventDefault();
        navigate('/prescriptions/new');
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [navigate]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Navigation (with Mobile Drawer support) */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNavbar
          onOpenSearch={() => setIsSearchModalOpen(true)}
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        <main
          className={`flex-1 overflow-y-auto px-2 sm:px-3 lg:px-4 ${
            isRxWorkspace ? 'pt-0 pb-4' : 'py-2 sm:py-3 lg:py-4'
          } bg-slate-50/70`}
        >
          <div className="page-enter-transition min-h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Quick Patient Search Modal (Ctrl+K) */}
      <QuickPatientSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </div>
  );
};
