import { api } from '../../services/api-client';

export const adminService = {
  getStats: () => api('/admin/stats'),

  getDoctors: () => api('/admin/doctors'),

  updateDoctorStatus: (doctorId: string, status: string) =>
    api(`/admin/doctors/${doctorId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  getAuditLogs: (limit = 100) => api(`/admin/audit-logs?limit=${limit}`),
};
