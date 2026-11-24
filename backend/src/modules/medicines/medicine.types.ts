import { IMedicine } from '../../models/Medicine';

export interface CreateMedicineDTO {
  brandName: string;
  genericName: string;
  strength: string;
  dosageForm?: string;
  manufacturer?: string;
  category?: string;
  medicineType?: 'Allopathic' | 'Unani' | 'Ayurvedic' | 'Herbal';
  unit?: string;
  price?: number;
  status?: 'active' | 'inactive';
}

export interface UpdateMedicineDTO extends Partial<CreateMedicineDTO> {}

export interface MedicineSearchOptions {
  q?: string;
  limit?: number;
  medicineType?: string;
}

export interface MedicineFilterOptions {
  search?: string;
  category?: string;
  dosageForm?: string;
  manufacturer?: string;
  medicineType?: string;
  page?: number;
  limit?: number;
}
