import { api } from '../api-client';

export const prescriptionApi = {
  getPrescriptions: (params?: { page?: number; limit?: number; patientId?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.patientId) query.append('patientId', params.patientId);
    if (params?.search) query.append('search', params.search);
    return api(`/prescriptions?${query.toString()}`);
  },

  getPrescriptionById: (id: string) => api(`/prescriptions/${id}`),

  createPrescription: (data: any) =>
    api('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePrescription: (id: string, data: any) =>
    api(`/prescriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  finalizePrescription: (id: string) =>
    api(`/prescriptions/${id}/finalize`, {
      method: 'POST',
    }),

  clonePrescription: (id: string) =>
    api(`/prescriptions/${id}/clone`, {
      method: 'POST',
    }),

  getPublicPrescription: (token: string) => api(`/public/prescriptions/${token}`),
};
