import { api } from '../api-client';

export const adminApi = {
  getStats: () => api('/admin/stats'),

  getDoctors: () => api('/admin/doctors'),

  updateDoctorStatus: (doctorId: string, status: string) =>
    api(`/admin/doctors/${doctorId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  getAuditLogs: (params?: { page?: number; limit?: number; action?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.action && params.action !== 'all') query.append('action', params.action);
    if (params?.search) query.append('search', params.search);
    return api(`/admin/audit-logs?${query.toString()}`);
  },
};
