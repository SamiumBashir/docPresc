import { Types } from 'mongoose';

export interface TemplateMedicineItem {
  medicineId?: Types.ObjectId;
  brandName: string;
  genericName?: string;
  dosageForm: string;
  strength?: string;
  dose: string;
  frequency: string;
  duration: string;
  instruction: string;
}

export interface TemplateDTO {
  name: string;
  category?: string;
  description?: string;
  chiefComplaints?: Array<{ complaint: string; duration?: string }>;
  diagnosis?: Array<{ name: string; icdCode?: string }>;
  medicines?: TemplateMedicineItem[];
  investigations?: string[];
  advice?: string[];
  followUpDuration?: string;
}
