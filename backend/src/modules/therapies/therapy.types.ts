import { Types } from 'mongoose';
import { ITherapy, TherapyVerificationStatus } from '../../models/Therapy';
import { ITherapyCategory } from '../../models/TherapyCategory';
import {
  ConsentStatus,
  ITreatmentPlan,
  TreatmentPlanStatus,
} from '../../models/TreatmentPlan';
import { ITherapySession, TherapySessionStatus } from '../../models/TherapySession';

export type {
  TherapyVerificationStatus,
  TreatmentPlanStatus,
  ConsentStatus,
  TherapySessionStatus,
};

export interface TherapyCatalogFilterOptions {
  section?: 'all' | 'main' | 'ed';
  categoryId?: string;
  verificationStatus?: TherapyVerificationStatus;
  isActive?: boolean;
  isAvailable?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TherapyCatalogListResult {
  therapies: ITherapy[];
  categories: ITherapyCategory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateTherapyCategoryDTO {
  name: string;
  nameBn?: string;
  description?: string;
  isSensitiveClinicalGroup?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreateTherapyDTO {
  name: string;
  englishName?: string;
  bengaliName?: string;
  categoryId: string;
  description?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  requiredProviderQualifications?: string;
  requiredEquipment?: string;
  defaultSessionDurationMinutes?: number | null;
  price?: number | null;
  administrativeNotes?: string;
  consentRequired?: boolean;
  terminologyReviewRequired?: boolean;
  specialReviewFlags?: string[];
  governanceNotice?: string;
}

export type UpdateTherapyDTO = Partial<CreateTherapyDTO>;

export interface ToggleTherapyStatusDTO {
  isActive: boolean;
  isAvailable?: boolean;
}

export interface VerifyTherapyDTO {
  verificationStatus: TherapyVerificationStatus;
  verificationNotes?: string;
  terminologyConfirmed?: boolean;
  governanceReviewed?: boolean;
  requiredProviderQualifications?: string;
  consentRequired?: boolean;
  isAvailable?: boolean;
}

export interface CreatePractitionerDTO {
  name: string;
  email: string;
  password: string;
  phone?: string;
  qualification?: string;
  specialization?: string;
  designation?: string;
  registrationNumber?: string;
}

export interface UpdatePractitionerDTO {
  status?: 'active' | 'pending' | 'suspended';
  isAuthorizedPractitioner?: boolean;
  phone?: string;
  qualification?: string;
  specialization?: string;
  designation?: string;
  registrationNumber?: string;
}

export interface AuthorizedPractitionerItem {
  _id: Types.ObjectId | string;
  name: string;
  email: string;
  role: 'doctor' | 'staff';
  status: string;
  phone?: string;
  qualification?: string;
  specialization?: string;
  designation?: string;
  registrationNumber?: string;
  isAuthorizedPractitioner: boolean;
}

export interface TreatmentPlanFilterOptions {
  doctorId?: Types.ObjectId | string;
  assignedPractitionerId?: Types.ObjectId | string;
  patientId?: string;
  therapyId?: string;
  isEdPlan?: boolean;
  status?: TreatmentPlanStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TreatmentPlanListResult {
  plans: ITreatmentPlan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateTreatmentPlanDTO {
  patientId: string;
  chamberId?: string | null;
  therapyId: string;
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

export interface UpdateTreatmentPlanDTO {
  chamberId?: string | null;
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

export interface TherapySessionFilterOptions {
  doctorId?: Types.ObjectId | string;
  assignedPractitionerId?: Types.ObjectId | string;
  treatmentPlanId?: string;
  patientId?: string;
  status?: TherapySessionStatus;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface TherapySessionListResult {
  sessions: ITherapySession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateSessionsDTO {
  sessions: Array<{
    scheduledAt: string;
    sessionNumber?: number;
    assignedPractitionerId?: string;
    practitionerNotes?: string;
  }>;
}

export interface UpdateSessionDTO {
  version: number;
  status?: TherapySessionStatus;
  scheduledAt?: string | null;
  completedAt?: string | null;
  practitionerNotes?: string;
  patientFeedback?: string;
  nextSessionDate?: string | null;
  assignedPractitionerId?: string;
}
