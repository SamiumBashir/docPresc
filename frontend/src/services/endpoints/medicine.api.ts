import { api } from '../api-client';

export const medicineApi = {
  searchMedicines: (query: string, medicineType?: string, limit = 20) => {
    const params = new URLSearchParams({ search: query, limit: limit.toString() });
    if (medicineType && medicineType !== 'all') {
      params.append('medicineType', medicineType);
    }
    return api(`/medicines?${params.toString()}`);
  },

  getMedicines: (params?: { page?: number; limit?: number; search?: string; medicineType?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.medicineType && params.medicineType !== 'all') query.append('medicineType', params.medicineType);
    return api(`/medicines?${query.toString()}`);
  },

  createMedicine: (data: any) =>
    api('/medicines', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMedicine: (id: string, data: any) =>
    api(`/medicines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteMedicine: (id: string) =>
    api(`/medicines/${id}`, {
      method: 'DELETE',
    }),
};
