import mongoose, { Document, Schema, Types } from 'mongoose';

export type TreatmentPlanStatus =
  | 'DRAFT'
  | 'FINALIZED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export type ConsentStatus = 'NOT_REQUIRED' | 'PENDING' | 'OBTAINED' | 'DECLINED';

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

export interface ITreatmentPlan extends Document {
  chartNumber: string;
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  chamberId?: Types.ObjectId | null;
  therapyId: Types.ObjectId;
  therapySnapshot: ITherapySnapshotItem;
  therapyIds: Types.ObjectId[];
  therapySnapshots: ITherapySnapshotItem[];
  assignedPractitionerId: Types.ObjectId;
  practitionerSnapshot: {
    userId: Types.ObjectId;
    name: string;
    role: string;
    email?: string;
    phone?: string;
    qualification?: string;
    registrationNumber?: string;
    designation?: string;
  };
  patientSnapshot: {
    patientId: string;
    name: string;
    age: number;
    gender: string;
    phone?: string;
    bloodGroup?: string;
  };
  doctorSnapshot: {
    name: string;
    qualification: string;
    specialization: string;
    designation?: string;
    workplace?: string;
    bmdcNumber?: string;
    healthcareAuthority?: string;
    registrationNumber?: string;
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
  };
  treatmentObjective?: string;
  clinicalIndication?: string;
  clinicianApprovalConfirmed: boolean;
  status: TreatmentPlanStatus;
  plannedSessions?: number | null;
  sessionDuration?: string;
  frequency?: string;
  scheduleSummary?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  precautions?: string;
  patientInstructions?: string;
  consentStatus: ConsentStatus;
  consentNotes?: string;
  consentRecordedAt?: Date | null;
  isEdPlan: boolean;
  version: number;
  finalizedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TherapySnapshotSchema = new Schema<ITherapySnapshotItem>(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    englishName: { type: String, required: true },
    bengaliName: { type: String },
    categoryName: { type: String, required: true },
    isEdTreatment: { type: Boolean, default: false },
    verificationStatus: { type: String, required: true },
    verificationNotes: { type: String },
    requiredProviderQualifications: { type: String },
    requiredEquipment: { type: String },
  },
  { _id: false }
);

const TreatmentPlanSchema = new Schema<ITreatmentPlan>(
  {
    chartNumber: { type: String, required: true, unique: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    chamberId: { type: Schema.Types.ObjectId, ref: 'Chamber', default: null },
    therapyId: { type: Schema.Types.ObjectId, ref: 'Therapy', required: true, index: true },
    therapySnapshot: { type: TherapySnapshotSchema, required: true },
    therapyIds: [{ type: Schema.Types.ObjectId, ref: 'Therapy', index: true }],
    therapySnapshots: { type: [TherapySnapshotSchema], default: [] },
    assignedPractitionerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    practitionerSnapshot: {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
      email: { type: String },
      phone: { type: String },
      qualification: { type: String },
      registrationNumber: { type: String },
      designation: { type: String },
    },
    patientSnapshot: {
      patientId: { type: String, required: true },
      name: { type: String, required: true, trim: true },
      age: { type: Number, required: true },
      gender: { type: String, required: true },
      phone: { type: String },
      bloodGroup: { type: String },
    },
    doctorSnapshot: {
      name: { type: String, required: true },
      qualification: { type: String, default: '' },
      specialization: { type: String, default: '' },
      designation: { type: String },
      workplace: { type: String },
      bmdcNumber: { type: String },
      healthcareAuthority: { type: String },
      registrationNumber: { type: String },
      chamberName: { type: String },
      chamberAddress: { type: String },
      phone: { type: String },
      appointmentPhone: { type: String },
      visitingDays: [{ type: String }],
      visitingHours: { type: String },
      roomNo: { type: String },
      website: { type: String },
      logo: { type: String },
      signature: { type: String },
    },
    treatmentObjective: { type: String, trim: true, default: '' },
    clinicalIndication: { type: String, trim: true, default: '' },
    clinicianApprovalConfirmed: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['DRAFT', 'FINALIZED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'DRAFT',
      index: true,
    },
    plannedSessions: { type: Number, min: 1, max: 200, default: null },
    sessionDuration: { type: String, trim: true, default: '' },
    frequency: { type: String, trim: true, default: '' },
    scheduleSummary: { type: String, trim: true, default: '' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    precautions: { type: String, trim: true, default: '' },
    patientInstructions: { type: String, trim: true, default: '' },
    consentStatus: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING', 'OBTAINED', 'DECLINED'],
      default: 'PENDING',
    },
    consentNotes: { type: String, trim: true, default: '' },
    consentRecordedAt: { type: Date, default: null },
    isEdPlan: { type: Boolean, default: false, index: true },
    version: { type: Number, default: 1, min: 1 },
    finalizedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

TreatmentPlanSchema.index({ doctorId: 1, patientId: 1, createdAt: -1 });
TreatmentPlanSchema.index({ doctorId: 1, status: 1, updatedAt: -1 });
TreatmentPlanSchema.index({ assignedPractitionerId: 1, status: 1, updatedAt: -1 });
TreatmentPlanSchema.index({ therapyId: 1, status: 1 });
TreatmentPlanSchema.index({
  chartNumber: 'text',
  'patientSnapshot.name': 'text',
  'patientSnapshot.patientId': 'text',
  'therapySnapshot.name': 'text',
  'therapySnapshots.name': 'text',
});

export const TreatmentPlan = mongoose.model<ITreatmentPlan>(
  'TreatmentPlan',
  TreatmentPlanSchema
);
