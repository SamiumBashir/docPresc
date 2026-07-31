import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { PublicPrescriptionView } from './pages/Public/PublicPrescriptionView';

// Doctor Pages
import { Dashboard } from './pages/Dashboard/Dashboard';
import { PatientList } from './pages/Patients/PatientList';
import { PatientDetails } from './pages/Patients/PatientDetails';
import { NewPrescription } from './pages/Prescriptions/NewPrescription';
import { PrescriptionHistory } from './pages/Prescriptions/PrescriptionHistory';
import { PrescriptionView } from './pages/Prescriptions/PrescriptionView';
import { MedicineCatalog } from './pages/Medicines/MedicineCatalog';
import { TemplateList } from './pages/Templates/TemplateList';
import { ChamberList } from './pages/Chambers/ChamberList';
import { DoctorReports } from './pages/Reports/DoctorReports';
import { DoctorProfile } from './pages/Profile/DoctorProfile';
import { DoctorSettings } from './pages/Settings/DoctorSettings';

// Admin Pages
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { AdminDoctors } from './pages/Admin/AdminDoctors';
import { AdminMedicines } from './pages/Admin/AdminMedicines';
import { AdminAuditLogs } from './pages/Admin/AdminAuditLogs';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({
  children,
  requiredRole,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-medical-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/prescription/share/:token" element={<PublicPrescriptionView />} />

            {/* Authenticated Doctor & Staff Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="patients" element={<PatientList />} />
              <Route path="patients/:id" element={<PatientDetails />} />
              <Route path="prescriptions/new" element={<NewPrescription />} />
              <Route path="prescriptions" element={<PrescriptionHistory />} />
              <Route path="prescriptions/:id" element={<PrescriptionView />} />
              <Route path="medicines" element={<MedicineCatalog />} />
              <Route path="templates" element={<TemplateList />} />
              <Route path="chambers" element={<ChamberList />} />
              <Route path="reports" element={<DoctorReports />} />
              <Route path="profile" element={<DoctorProfile />} />
              <Route path="settings" element={<DoctorSettings />} />

              {/* Admin-only Routes */}
              <Route
                path="admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/doctors"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDoctors />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/medicines"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminMedicines />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/audit-logs"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminAuditLogs />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
