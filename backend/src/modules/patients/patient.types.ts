import { Types } from 'mongoose';
import { IPatient } from '../../models/Patient';

export interface CreatePatientDTO {
  name: string;
  phone?: string;
  email?: string;
  dob?: Date | string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  address?: string;
  emergencyContact?: string;
  allergies?: string[];
  medicalHistory?: string[];
  notes?: string;
}

export interface UpdatePatientDTO extends Partial<CreatePatientDTO> {}

export interface PatientFilterOptions {
  doctorId: Types.ObjectId | string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PatientListResult {
  patients: IPatient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
