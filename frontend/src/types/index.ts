export interface IUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'doctor' | 'admin' | 'staff';
  status?: string;
}

export interface IDoctorSettings {
  paperSize: 'A4' | 'Letter' | 'A5';
  defaultLanguage: 'en' | 'bn';
  defaultFollowUp: string;
  headerVisibility: boolean;
  footerVisibility: boolean;
  themeColor: string;
  showWatermark: boolean;
  showQrCode: boolean;
}

export interface IDoctor {
  _id: string;
  userId: string;
  name: string;
  qualification: string;
  specialization: string;
  bmdcNumber: string;
  designation?: string;
  workplace?: string;
  healthcareInstitutions?: string[];
  healthcareAuthority?: string;
  registrationNumber?: string;
  institutionRegNumbers?: Record<string, string>;
  phone: string;
  email: string;
  profileImage?: string;
  signature?: string;
  logo?: string;
  favoriteMedicines?: string[];
  defaultChamberId?: string | IChamber;
  settings: IDoctorSettings;
}

export interface IChamber {
  _id: string;
  doctorId: string;
  name: string;
  address: string;
  phone?: string;
  appointmentPhone?: string;
  website?: string;
  signature?: string;
  visitingDays: string[];
  visitingHours: string;
  roomNo?: string;
  isDefault: boolean;
  status: 'active' | 'inactive';
}

export interface IPatient {
  _id: string;
  patientId: string;
  doctorId: string;
  name: string;
  phone: string;
  email?: string;
  dob?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  address?: string;
  emergencyContact?: string;
  allergies: string[];
  medicalHistory: string[];
  notes?: string;
  lastVisit?: string;
  lastDiagnosis?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMedicine {
  _id: string;
  brandName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  category: string;
  medicineType?: 'Allopathic' | 'Unani' | 'Ayurvedic' | 'Herbal';
  unit?: string;
  price?: number;
  status: 'active' | 'inactive';
  isFavorite?: boolean;
}

export interface IPrescriptionMedicine {
  medicineId?: string;
  brandName: string;
  genericName?: string;
  dosageForm: string;
  strength?: string;
  medicineType?: 'Allopathic' | 'Unani' | 'Ayurvedic' | 'Herbal';
  dose: string;
  frequency: string;
  duration: string;
  instruction: string;
  customNote?: string;
  order: number;
}

export interface IPrescriptionChiefComplaint {
  complaint: string;
  duration?: string;
  note?: string;
}

export interface IPrescriptionDiagnosis {
  name: string;
  icdCode?: string;
  type?: 'provisional' | 'differential' | 'confirmed';
}

export interface IPrescriptionVitals {
  bpSystolic?: number | null;
  bpDiastolic?: number | null;
  pulse?: number | null;
  temperature?: number | null;
  spo2?: number | null;
  weight?: number | null;
  height?: number | null;
  bmi?: number | null;
}

export interface IPrescription {
  _id: string;
  prescriptionId: string;
  doctorId: string;
  chamberId?: IChamber | string;
  patientId: string;
  patientSnapshot: {
    patientId: string;
    name: string;
    age: number;
    gender: string;
    phone: string;
    bloodGroup?: string;
    allergies?: string[];
  };
  doctorSnapshot?: {
    name: string;
    qualification: string;
    specialization: string;
    bmdcNumber: string;
    designation?: string;
    workplace?: string;
    phone?: string;
    email?: string;
    chamberName?: string;
    chamberAddress?: string;
    chamberWebsite?: string;
    signature?: string;
    logo?: string;
  };
  vitals?: IPrescriptionVitals;
  chiefComplaints: IPrescriptionChiefComplaint[];
  history?: string;
  examination?: string;
  diagnosis: IPrescriptionDiagnosis[];
  medicines: IPrescriptionMedicine[];
  investigations: string[];
  advice: string[];
  followUp?: {
    duration: string;
    date?: string;
    notes?: string;
  };
  notes?: string;
  status: 'DRAFT' | 'FINALIZED' | 'CANCELLED';
  finalizedAt?: string;
  shareToken: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ITemplate {
  _id: string;
  doctorId: string;
  name: string;
  category?: string;
  description?: string;
  chiefComplaints?: Array<{ complaint: string; duration?: string }>;
  diagnosis?: Array<{ name: string; icdCode?: string }>;
  medicines: IPrescriptionMedicine[];
  investigations: string[];
  advice: string[];
  followUpDuration?: string;
}

export interface IAuditLog {
  _id: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
