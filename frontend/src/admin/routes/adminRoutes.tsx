import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const AdminLayout = lazy(() => import('../layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const DoctorManagement = lazy(() => import('../pages/DoctorManagement'));
const MedicineManagement = lazy(() => import('../pages/MedicineManagement'));
const AuditLogs = lazy(() => import('../pages/AuditLogs'));

export const adminRoutes: RouteObject = {
  path: 'admin',
  element: <AdminLayout />,
  children: [
    { index: true, element: <AdminDashboard /> },
    { path: 'dashboard', element: <AdminDashboard /> },
    { path: 'doctors', element: <DoctorManagement /> },
    { path: 'medicines', element: <MedicineManagement /> },
    { path: 'audit-logs', element: <AuditLogs /> },
  ],
};
