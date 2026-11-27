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
  defaultDose?: string;
  defaultDuration?: string;
  defaultInstruction?: string;
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
  attachedFoodChartId?: IFoodChart | string | null;
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

export type FoodSectionType = 'allowed' | 'avoided';

export interface IFoodCatalogItem {
  _id: string;
  key: string;
  section: FoodSectionType;
  category: string;
  labelBn: string;
  isCustomAllowed: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface IFoodChartEntry {
  catalogItemId?: string | null;
  labelBn: string;
  category?: string;
  isCustom: boolean;
  portion?: string;
  timing?: string;
  prepNote?: string;
  order: number;
}

export interface IFoodChartSupplement {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  order: number;
}

export interface IFoodChartPatientSnapshot {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  phone?: string;
  bloodGroup?: string;
}

export interface IFoodChartDoctorSnapshot {
  name: string;
  qualification: string;
  specialization: string;
  designation?: string;
  workplace?: string;
  bmdcNumber?: string;
  healthcareAuthority?: string;
  registrationNumber?: string;
  institutionRegNumbers?: Record<string, string>;
  chamberName?: string;
  chamberAddress?: string;
  phone?: string;
  appointmentPhone?: string;
  visitingDays?: string[];
  visitingHours?: string;
  roomNo?: string;
  website?: string;
  logo?: string;
  signature?: string;
}

export interface IFoodChart {
  _id: string;
  chartNumber: string;
  doctorId: string;
  patientId: string;
  chamberId?: IChamber | string | null;
  patientSnapshot: IFoodChartPatientSnapshot;
  doctorSnapshot: IFoodChartDoctorSnapshot;
  status: 'DRAFT' | 'FINALIZED';
  allowedFoods: IFoodChartEntry[];
  avoidedFoods: IFoodChartEntry[];
  supplements: IFoodChartSupplement[];
  dietaryInstructions?: string;
  additionalNotes?: string;
  version: number;
  parentChartId?: string | null;
  rootChartId: string;
  finalizedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IFoodChartVersionSummary {
  _id: string;
  chartNumber: string;
  status: 'DRAFT' | 'FINALIZED';
  version: number;
  parentChartId?: string | null;
  rootChartId: string;
  finalizedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  allowedFoods?: IFoodChartEntry[];
  avoidedFoods?: IFoodChartEntry[];
  supplements?: IFoodChartSupplement[];
}

// ============================================================================
// Therapy & Treatment Management Types
// ============================================================================

export type TherapyVerificationStatus =
  | 'PENDING_CLINICAL_REVIEW'
  | 'NEEDS_TERMINOLOGY_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export type TreatmentPlanStatus =
  | 'DRAFT'
  | 'FINALIZED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export type ConsentStatus = 'NOT_REQUIRED' | 'PENDING' | 'OBTAINED' | 'DECLINED';

export type TherapySessionStatus =
  | 'Scheduled'
  | 'Completed'
  | 'Cancelled'
  | 'Missed'
  | 'Rescheduled';

export interface ITherapyCategory {
  _id: string;
  key: string;
  name: string;
  nameBn?: string;
  description?: string;
  isProtected: boolean;
  isSensitiveClinicalGroup: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ITherapy {
  _id: string;
  key: string;
  name: string;
  englishName: string;
  bengaliName?: string;
  categoryId: string;
  categoryName: string;
  isEdTreatment: boolean;
  description?: string;
  isActive: boolean;
  isAvailable: boolean;
  verificationStatus: TherapyVerificationStatus;
  terminologyReviewRequired: boolean;
  specialReviewFlags: string[];
  governanceNotice?: string;
  requiredProviderQualifications?: string;
  requiredEquipment?: string;
  defaultSessionDurationMinutes?: number | null;
  price?: number | null;
  administrativeNotes?: string;
  consentRequired: boolean;
  verifiedByUserId?: string | null;
  verifiedByName?: string;
  verifiedAt?: string | null;
  verificationNotes?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface IPractitioner {
  _id: string;
  name: string;
  email: string;
  role: 'doctor' | 'staff';
  status: 'active' | 'pending' | 'suspended';
  phone?: string;
  qualification?: string;
  specialization?: string;
  designation?: string;
  registrationNumber?: string;
  isAuthorizedPractitioner: boolean;
}

export interface ITherapySnapshotItem {
  key: string;
  name: string;
  englishName: string;
  bengaliName?: string;
  categoryName: string;
  isEdTreatment: boolean;
  verificationStatus: string;
  verificationNotes?: string;
  requiredProviderQualifications?: string;
  requiredEquipment?: string;
}

export interface ITreatmentPlan {
  _id: string;
  chartNumber: string;
  doctorId: string;
  patientId: string;
  chamberId?: IChamber | string | null;
  therapyId: string;
  therapySnapshot: ITherapySnapshotItem;
  therapyIds?: string[];
  therapySnapshots?: ITherapySnapshotItem[];
  assignedPractitionerId: string;
  practitionerSnapshot: {
    userId: string;
    name: string;
    role: string;
    email?: string;
    phone?: string;
    qualification?: string;
    registrationNumber?: string;
    designation?: string;
  };
  patientSnapshot: IFoodChartPatientSnapshot;
  doctorSnapshot: IFoodChartDoctorSnapshot;
  treatmentObjective?: string;
  clinicalIndication?: string;
  clinicianApprovalConfirmed: boolean;
  status: TreatmentPlanStatus;
  plannedSessions?: number | null;
  sessionDuration?: string;
  frequency?: string;
  scheduleSummary?: string;
  startDate?: string | null;
  endDate?: string | null;
  precautions?: string;
  patientInstructions?: string;
  consentStatus: ConsentStatus;
  consentNotes?: string;
  consentRecordedAt?: string | null;
  isEdPlan: boolean;
  version: number;
  finalizedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ITherapySession {
  _id: string;
  treatmentPlanId:
    | string
    | {
        _id: string;
        chartNumber: string;
        status: TreatmentPlanStatus;
        isEdPlan: boolean;
        consentStatus: ConsentStatus;
        therapySnapshot: ITreatmentPlan['therapySnapshot'];
        therapySnapshots?: ITreatmentPlan['therapySnapshots'];
        therapyIds?: string[];
        patientSnapshot: IFoodChartPatientSnapshot;
        practitionerSnapshot: ITreatmentPlan['practitionerSnapshot'];
      };
  doctorId: string;
  patientId: string;
  therapyId: string;
  assignedPractitionerId: string;
  assignedPractitionerName: string;
  sessionNumber: number;
  scheduledAt: string;
  status: TherapySessionStatus;
  completedAt?: string | null;
  practitionerNotes?: string;
  patientFeedback?: string;
  nextSessionDate?: string | null;
  updatedByUserId?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ITherapyOverview {
  metrics: {
    totalTherapies: number;
    activeTherapies: number;
    approvedTherapies: number;
    pendingClinicalReview: number;
    needsTerminologyReview: number;
    edTherapiesCount: number;
    scheduledPlans: number;
    completedSessions: number;
    upcomingSessionsCount: number;
  };
  recentPendingReviews: ITherapy[];
  upcomingSessions: ITherapySession[];
}

export interface IPatientTreatmentHistory {
  patient: IFoodChartPatientSnapshot;
  summary: {
    totalPlans: number;
    activePlansCount: number;
    completedSessionsCount: number;
    upcomingSessionsCount: number;
  };
  activePlans: ITreatmentPlan[];
  previousPlans: ITreatmentPlan[];
  sessions: ITherapySession[];
}

