import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppLayout } from './components/layout/AppLayout';

// Immediate load for entry login page to eliminate initial latency
import { Login } from './pages/Auth/Login';

// Route-level code splitting for non-blocking initial performance
const Register = lazy(() => import('./pages/Auth/Register').then((m) => ({ default: m.Register })));
const ForgotPassword = lazy(() =>
  import('./pages/Auth/ForgotPassword').then((m) => ({ default: m.ForgotPassword }))
);
const ResetPassword = lazy(() =>
  import('./pages/Auth/ResetPassword').then((m) => ({ default: m.ResetPassword }))
);
const PublicPrescriptionView = lazy(() =>
  import('./pages/Public/PublicPrescriptionView').then((m) => ({ default: m.PublicPrescriptionView }))
);

// Doctor Pages (code-split)
const Dashboard = lazy(() =>
  import('./pages/Dashboard/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const PatientList = lazy(() =>
  import('./pages/Patients/PatientList').then((m) => ({ default: m.PatientList }))
);
const PatientDetails = lazy(() =>
  import('./pages/Patients/PatientDetails').then((m) => ({ default: m.PatientDetails }))
);
const NewPrescription = lazy(() =>
  import('./pages/Prescriptions/NewPrescription').then((m) => ({ default: m.NewPrescription }))
);
const PrescriptionHistory = lazy(() =>
  import('./pages/Prescriptions/PrescriptionHistory').then((m) => ({ default: m.PrescriptionHistory }))
);
const PrescriptionView = lazy(() =>
  import('./pages/Prescriptions/PrescriptionView').then((m) => ({ default: m.PrescriptionView }))
);
const MedicineCatalog = lazy(() =>
  import('./pages/Medicines/MedicineCatalog').then((m) => ({ default: m.MedicineCatalog }))
);
const TemplateList = lazy(() =>
  import('./pages/Templates/TemplateList').then((m) => ({ default: m.TemplateList }))
);
const ChamberList = lazy(() =>
  import('./pages/Chambers/ChamberList').then((m) => ({ default: m.ChamberList }))
);
const DoctorReports = lazy(() =>
  import('./pages/Reports/DoctorReports').then((m) => ({ default: m.DoctorReports }))
);
const DoctorProfile = lazy(() =>
  import('./pages/Profile/DoctorProfile').then((m) => ({ default: m.DoctorProfile }))
);
const DoctorSettings = lazy(() =>
  import('./pages/Settings/DoctorSettings').then((m) => ({ default: m.DoctorSettings }))
);

// Admin Pages (code-split)
const AdminDashboard = lazy(() =>
  import('./pages/Admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const AdminDoctors = lazy(() =>
  import('./pages/Admin/AdminDoctors').then((m) => ({ default: m.AdminDoctors }))
);
const AdminMedicines = lazy(() =>
  import('./pages/Admin/AdminMedicines').then((m) => ({ default: m.AdminMedicines }))
);
const AdminAuditLogs = lazy(() =>
  import('./pages/Admin/AdminAuditLogs').then((m) => ({ default: m.AdminAuditLogs }))
);

// Lightweight Accessible Page Loader
const PageLoader: React.FC = () => (
  <div
    className="flex items-center justify-center min-h-[300px] w-full py-12"
    role="status"
    aria-label="Loading page content"
  >
    <div className="w-8 h-8 border-3 border-medical-600 border-t-transparent rounded-full animate-spin" />
    <span className="sr-only">Loading...</span>
  </div>
);

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({
  children,
  requiredRole,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-slate-900 flex items-center justify-center"
        role="status"
        aria-label="Authenticating session"
      >
        <div className="w-8 h-8 border-3 border-medical-500 border-t-transparent rounded-full animate-spin" />
        <span className="sr-only">Loading authentication...</span>
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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
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
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
