import { api } from '../api-client';

export const patientApi = {
  getPatients: (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    return api(`/patients?${query.toString()}`);
  },

  getPatientById: (id: string) => api(`/patients/${id}`),

  createPatient: (data: any) =>
    api('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePatient: (id: string, data: any) =>
    api(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getPatientTimeline: (id: string) => api(`/patients/${id}/timeline`),
};
