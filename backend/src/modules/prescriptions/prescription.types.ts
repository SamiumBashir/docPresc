import { Types } from 'mongoose';
import { IPrescription, IPrescriptionMedicine, IPrescriptionVitals, IPrescriptionChiefComplaint, IPrescriptionDiagnosis } from '../../models/Prescription';

export interface CreatePrescriptionDTO {
  patientId: string;
  chamberId?: string | null;
  vitals?: IPrescriptionVitals | null;
  chiefComplaints?: IPrescriptionChiefComplaint[];
  history?: string | null;
  examination?: string | null;
  diagnosis?: IPrescriptionDiagnosis[];
  medicines?: IPrescriptionMedicine[];
  investigations?: string[];
  advice?: string[];
  followUp?: {
    duration?: string;
    date?: string | null;
    notes?: string | null;
  } | null;
  notes?: string | null;
  attachedFoodChartId?: string | null;
  status?: 'DRAFT' | 'FINALIZED';
}

export interface UpdatePrescriptionDTO extends CreatePrescriptionDTO {}

export interface PrescriptionFilterOptions {
  doctorId?: Types.ObjectId | string;
  patientId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PrescriptionListResult {
  prescriptions: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
