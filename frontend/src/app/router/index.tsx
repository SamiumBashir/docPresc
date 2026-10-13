import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../guards/ProtectedRoute';
import { PageLoader } from '../../components/ui/PageLoader';

// Code-split layouts
const AppLayout = lazy(() => import('../layouts/AppLayout').then((m) => ({ default: m.AppLayout })));
const AdminLayout = lazy(() => import('../../admin/layouts/AdminLayout').then((m) => ({ default: m.AdminLayout })));

// Code-split Public Pages
const Login = lazy(() => import('../../pages/Auth/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('../../pages/Auth/Register').then((m) => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('../../pages/Auth/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('../../pages/Auth/ResetPassword').then((m) => ({ default: m.ResetPassword })));
const PublicPrescriptionView = lazy(() => import('../../pages/Public/PublicPrescriptionView').then((m) => ({ default: m.PublicPrescriptionView })));
const NotFound = lazy(() => import('../../pages/NotFound/NotFound').then((m) => ({ default: m.NotFound })));

// Code-split Doctor Pages
const Dashboard = lazy(() => import('../../pages/Dashboard/Dashboard').then((m) => ({ default: m.Dashboard })));
const PatientList = lazy(() => import('../../pages/Patients/PatientList').then((m) => ({ default: m.PatientList })));
const PatientDetails = lazy(() => import('../../pages/Patients/PatientDetails').then((m) => ({ default: m.PatientDetails })));
const NewPrescription = lazy(() => import('../../pages/Prescriptions/NewPrescription').then((m) => ({ default: m.NewPrescription })));
const PrescriptionHistory = lazy(() => import('../../pages/Prescriptions/PrescriptionHistory').then((m) => ({ default: m.PrescriptionHistory })));
const PrescriptionView = lazy(() => import('../../pages/Prescriptions/PrescriptionView').then((m) => ({ default: m.PrescriptionView })));
const MedicineCatalog = lazy(() => import('../../pages/Medicines/MedicineCatalog').then((m) => ({ default: m.MedicineCatalog })));
const TemplateList = lazy(() => import('../../pages/Templates/TemplateList').then((m) => ({ default: m.TemplateList })));
const ChamberList = lazy(() => import('../../pages/Chambers/ChamberList').then((m) => ({ default: m.ChamberList })));
const DoctorReports = lazy(() => import('../../pages/Reports/DoctorReports').then((m) => ({ default: m.DoctorReports })));
const DoctorProfile = lazy(() => import('../../pages/Profile/DoctorProfile').then((m) => ({ default: m.DoctorProfile })));
const DoctorSettings = lazy(() => import('../../pages/Settings/DoctorSettings').then((m) => ({ default: m.DoctorSettings })));

// Code-split Admin Pages (from frontend/src/admin/pages/)
const AdminDashboard = lazy(() => import('../../admin/pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const DoctorManagement = lazy(() => import('../../admin/pages/DoctorManagement').then((m) => ({ default: m.DoctorManagement })));
const MedicineManagement = lazy(() => import('../../admin/pages/MedicineManagement').then((m) => ({ default: m.MedicineManagement })));
const AuditLogs = lazy(() => import('../../admin/pages/AuditLogs').then((m) => ({ default: m.AuditLogs })));

export const AppRouter: React.FC = () => {
  return (
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
        </Route>

        {/* Authenticated Super Admin Routes (under dedicated AdminLayout) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="doctors" element={<DoctorManagement />} />
          <Route path="medicines" element={<MedicineManagement />} />
          <Route path="audit-logs" element={<AuditLogs />} />
        </Route>

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};
export default AppRouter;
