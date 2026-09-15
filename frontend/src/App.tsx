import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { PageLoader } from './components/ui/PageLoader';
import { TopProgressBar } from './components/ui/TopProgressBar';
import { ToastContainer } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Code-split AppLayout so unauthenticated/public visitors do not load doctor chrome
const AppLayout = lazy(() =>
  import('./components/layout/AppLayout').then((m) => ({ default: m.AppLayout }))
);

// Route-level code splitting for non-blocking initial performance
const Login = lazy(() => import('./pages/Auth/Login').then((m) => ({ default: m.Login })));
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
const NotFound = lazy(() =>
  import('./pages/NotFound/NotFound').then((m) => ({ default: m.NotFound }))
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

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({
  children,
  requiredRole,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <PageLoader
        variant="fullscreen"
        message="Authenticating clinical session..."
        subMessage="DocRx Bangladesh Medical Cloud"
      />
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
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            {/* Luminous Top Route Transition Indicator */}
            <TopProgressBar />

            {/* Global Toast Notification Container across all routes */}
            <ToastContainer />

            <Suspense
              fallback={
                <PageLoader
                  variant="inline"
                  message="Preparing clinical workspace..."
                  subMessage="Loading patient & prescription records"
                />
              }
            >
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ForgotPassword />} />
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

                {/* Catch-all 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;
