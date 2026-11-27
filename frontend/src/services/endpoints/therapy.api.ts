import { api, downloadApiFile } from '../../api/client';
import {
  ConsentStatus,
  IPatientTreatmentHistory,
  IPractitioner,
  ITherapy,
  ITherapyCategory,
  ITherapyOverview,
  ITherapySession,
  ITreatmentPlan,
  TherapySessionStatus,
  TherapyVerificationStatus,
  TreatmentPlanStatus,
} from '../../types';

export interface CatalogQueryParams {
  section?: 'all' | 'main' | 'ed';
  categoryId?: string;
  verificationStatus?: TherapyVerificationStatus;
  isActive?: boolean;
  isAvailable?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CatalogListResponse {
  therapies: ITherapy[];
  categories: ITherapyCategory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PlanQueryParams {
  patientId?: string;
  therapyId?: string;
  status?: TreatmentPlanStatus;
  isEdPlan?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PlanListResponse {
  plans: ITreatmentPlan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PlanDetailResponse {
  plan: ITreatmentPlan;
  sessions: ITherapySession[];
  summary: {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    missed: number;
    rescheduled: number;
  };
}

export interface SessionQueryParams {
  treatmentPlanId?: string;
  patientId?: string;
  status?: TherapySessionStatus;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface SessionListResponse {
  sessions: ITherapySession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateTreatmentPlanPayload {
  patientId: string;
  chamberId?: string | null;
  therapyId?: string;
  therapyIds?: string[];
  assignedPractitionerId: string;
  treatmentObjective?: string;
  clinicalIndication?: string;
  clinicianApprovalConfirmed: boolean;
  plannedSessions?: number | null;
  sessionDuration?: string;
  frequency?: string;
  scheduleSummary?: string;
  startDate?: string | null;
  endDate?: string | null;
  precautions?: string;
  patientInstructions?: string;
  consentStatus?: ConsentStatus;
  consentNotes?: string;
  status?: 'DRAFT' | 'FINALIZED' | 'ACTIVE';
  initialSessions?: Array<{
    scheduledAt: string;
    assignedPractitionerId?: string;
    practitionerNotes?: string;
  }>;
}

export interface UpdateTreatmentPlanPayload {
  chamberId?: string | null;
  therapyId?: string;
  therapyIds?: string[];
  assignedPractitionerId?: string;
  treatmentObjective?: string;
  clinicalIndication?: string;
  clinicianApprovalConfirmed?: boolean;
  plannedSessions?: number | null;
  sessionDuration?: string;
  frequency?: string;
  scheduleSummary?: string;
  startDate?: string | null;
  endDate?: string | null;
  precautions?: string;
  patientInstructions?: string;
  consentStatus?: ConsentStatus;
  consentNotes?: string;
  status?: TreatmentPlanStatus;
}

export interface UpdateSessionPayload {
  version: number;
  status?: TherapySessionStatus;
  scheduledAt?: string | null;
  completedAt?: string | null;
  practitionerNotes?: string;
  patientFeedback?: string;
  nextSessionDate?: string | null;
  assignedPractitionerId?: string;
}

export const therapyApi = {
  getOverview: async (): Promise<ITherapyOverview> => {
    const res = await api<{ success: boolean; data: ITherapyOverview }>('/therapies/overview');
    return res.data;
  },

  getCategories: async (onlyActive = false): Promise<ITherapyCategory[]> => {
    const res = await api<{ success: boolean; data: ITherapyCategory[] }>(
      `/therapies/categories${onlyActive ? '?onlyActive=true' : ''}`
    );
    return res.data || [];
  },

  createCategory: async (payload: {
    name: string;
    nameBn?: string;
    description?: string;
    isSensitiveClinicalGroup?: boolean;
  }): Promise<ITherapyCategory> => {
    const res = await api<{ success: boolean; data: ITherapyCategory }>('/therapies/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  getCatalog: async (params: CatalogQueryParams = {}): Promise<CatalogListResponse> => {
    const qs = new URLSearchParams();
    if (params.section && params.section !== 'all') qs.set('section', params.section);
    if (params.categoryId) qs.set('categoryId', params.categoryId);
    if (params.verificationStatus) qs.set('verificationStatus', params.verificationStatus);
    if (params.isActive !== undefined) qs.set('isActive', String(params.isActive));
    if (params.isAvailable !== undefined) qs.set('isAvailable', String(params.isAvailable));
    if (params.search?.trim()) qs.set('search', params.search.trim());
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    const qStr = qs.toString();
    const res = await api<{ success: boolean; data: CatalogListResponse }>(
      `/therapies/catalog${qStr ? `?${qStr}` : ''}`
    );
    return res.data;
  },

  createTherapy: async (payload: Record<string, any>): Promise<ITherapy> => {
    const res = await api<{ success: boolean; data: ITherapy }>('/therapies/catalog', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updateTherapy: async (id: string, payload: Record<string, any>): Promise<ITherapy> => {
    const res = await api<{ success: boolean; data: ITherapy }>(`/therapies/catalog/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  toggleTherapyStatus: async (
    id: string,
    payload: { isActive: boolean; isAvailable?: boolean }
  ): Promise<ITherapy> => {
    const res = await api<{ success: boolean; data: ITherapy }>(
      `/therapies/catalog/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  verifyTherapy: async (
    id: string,
    payload: {
      verificationStatus: TherapyVerificationStatus;
      verificationNotes?: string;
      terminologyConfirmed?: boolean;
      governanceReviewed?: boolean;
      requiredProviderQualifications?: string;
      consentRequired?: boolean;
      isAvailable?: boolean;
    }
  ): Promise<ITherapy> => {
    const res = await api<{ success: boolean; data: ITherapy }>(
      `/therapies/catalog/${id}/verify`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  getPractitioners: async (includeInactive = false): Promise<IPractitioner[]> => {
    const res = await api<{ success: boolean; data: IPractitioner[] }>(
      `/therapies/practitioners${includeInactive ? '?includeInactive=true' : ''}`
    );
    return res.data || [];
  },

  createPractitioner: async (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    qualification?: string;
    specialization?: string;
    designation?: string;
    registrationNumber?: string;
  }): Promise<IPractitioner> => {
    const res = await api<{ success: boolean; data: IPractitioner }>('/therapies/practitioners', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updatePractitioner: async (
    id: string,
    payload: Partial<IPractitioner>
  ): Promise<IPractitioner> => {
    const res = await api<{ success: boolean; data: IPractitioner }>(
      `/therapies/practitioners/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  getTreatmentPlans: async (params: PlanQueryParams = {}): Promise<PlanListResponse> => {
    const qs = new URLSearchParams();
    if (params.patientId) qs.set('patientId', params.patientId);
    if (params.therapyId) qs.set('therapyId', params.therapyId);
    if (params.status) qs.set('status', params.status);
    if (params.isEdPlan !== undefined) qs.set('isEdPlan', String(params.isEdPlan));
    if (params.search?.trim()) qs.set('search', params.search.trim());
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    const qStr = qs.toString();
    const res = await api<{ success: boolean; data: PlanListResponse }>(
      `/therapies/plans${qStr ? `?${qStr}` : ''}`
    );
    return res.data;
  },

  getPatientTreatmentPlans: async (patientId: string): Promise<ITreatmentPlan[]> => {
    const res = await api<{ success: boolean; data: ITreatmentPlan[] }>(
      `/patients/${patientId}/treatment-plans`
    );
    return res.data || [];
  },

  getPatientTreatmentHistory: async (patientId: string): Promise<IPatientTreatmentHistory> => {
    const res = await api<{ success: boolean; data: IPatientTreatmentHistory }>(
      `/patients/${patientId}/treatment-history`
    );
    return res.data;
  },

  getTreatmentPlanById: async (id: string): Promise<PlanDetailResponse> => {
    const res = await api<{ success: boolean; data: PlanDetailResponse }>(
      `/therapies/plans/${id}`
    );
    return res.data;
  },

  createTreatmentPlan: async (
    payload: CreateTreatmentPlanPayload
  ): Promise<{ plan: ITreatmentPlan; sessions: ITherapySession[] }> => {
    const res = await api<{
      success: boolean;
      data: { plan: ITreatmentPlan; sessions: ITherapySession[] };
    }>('/therapies/plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updateTreatmentPlan: async (
    id: string,
    payload: UpdateTreatmentPlanPayload
  ): Promise<ITreatmentPlan> => {
    const res = await api<{ success: boolean; data: ITreatmentPlan }>(`/therapies/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  finalizeTreatmentPlan: async (id: string): Promise<ITreatmentPlan> => {
    const res = await api<{ success: boolean; data: ITreatmentPlan }>(
      `/therapies/plans/${id}/finalize`,
      { method: 'POST' }
    );
    return res.data;
  },

  downloadTreatmentPlanPdf: async (plan: Pick<ITreatmentPlan, '_id' | 'chartNumber' | 'patientSnapshot' | 'finalizedAt' | 'createdAt'>): Promise<void> => {
    const patientCode = plan.patientSnapshot?.patientId || plan.chartNumber;
    const datePart = (plan.finalizedAt || plan.createdAt || '').slice(0, 10) || 'plan';
    await downloadApiFile(
      `/therapies/plans/${plan._id}/pdf`,
      `Treatment-Plan-${patientCode}-${datePart}.pdf`
    );
  },

  getSessions: async (params: SessionQueryParams = {}): Promise<SessionListResponse> => {
    const qs = new URLSearchParams();
    if (params.treatmentPlanId) qs.set('treatmentPlanId', params.treatmentPlanId);
    if (params.patientId) qs.set('patientId', params.patientId);
    if (params.status) qs.set('status', params.status);
    if (params.fromDate) qs.set('fromDate', params.fromDate);
    if (params.toDate) qs.set('toDate', params.toDate);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    const qStr = qs.toString();
    const res = await api<{ success: boolean; data: SessionListResponse }>(
      `/therapies/sessions${qStr ? `?${qStr}` : ''}`
    );
    return res.data;
  },

  createSessionsForPlan: async (
    planId: string,
    sessions: Array<{
      scheduledAt: string;
      assignedPractitionerId?: string;
      practitionerNotes?: string;
    }>
  ): Promise<ITherapySession[]> => {
    const res = await api<{ success: boolean; data: ITherapySession[] }>(
      `/therapies/plans/${planId}/sessions`,
      {
        method: 'POST',
        body: JSON.stringify({ sessions }),
      }
    );
    return res.data || [];
  },

  updateSession: async (id: string, payload: UpdateSessionPayload): Promise<ITherapySession> => {
    const res = await api<{ success: boolean; data: ITherapySession }>(
      `/therapies/sessions/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },

  deleteSession: async (id: string): Promise<void> => {
    await api(`/therapies/sessions/${id}`, { method: 'DELETE' });
  },
};
