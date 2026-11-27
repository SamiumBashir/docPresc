import mongoose, { Document, Schema, Types } from 'mongoose';

export type FoodChartStatus = 'DRAFT' | 'FINALIZED';

export interface IFoodChartEntry {
  catalogItemId?: Types.ObjectId | string | null;
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

export interface IFoodChart extends Document {
  chartNumber: string;
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  chamberId?: Types.ObjectId | null;
  patientSnapshot: IFoodChartPatientSnapshot;
  doctorSnapshot: IFoodChartDoctorSnapshot;
  status: FoodChartStatus;
  allowedFoods: IFoodChartEntry[];
  avoidedFoods: IFoodChartEntry[];
  supplements: IFoodChartSupplement[];
  dietaryInstructions?: string;
  additionalNotes?: string;
  version: number;
  parentChartId?: Types.ObjectId | null;
  rootChartId: Types.ObjectId;
  finalizedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const FoodChartEntrySchema = new Schema<IFoodChartEntry>(
  {
    catalogItemId: { type: Schema.Types.ObjectId, ref: 'FoodCatalogItem', default: null },
    labelBn: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    isCustom: { type: Boolean, default: false },
    portion: { type: String, trim: true },
    timing: { type: String, trim: true },
    prepNote: { type: String, trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const FoodChartSupplementSchema = new Schema<IFoodChartSupplement>(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true },
    duration: { type: String, trim: true },
    instructions: { type: String, trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const FoodChartSchema = new Schema<IFoodChart>(
  {
    chartNumber: { type: String, required: true, unique: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    chamberId: { type: Schema.Types.ObjectId, ref: 'Chamber', default: null },
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
      institutionRegNumbers: { type: Schema.Types.Mixed, default: {} },
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
    status: {
      type: String,
      enum: ['DRAFT', 'FINALIZED'],
      default: 'DRAFT',
      index: true,
    },
    allowedFoods: { type: [FoodChartEntrySchema], default: [] },
    avoidedFoods: { type: [FoodChartEntrySchema], default: [] },
    supplements: { type: [FoodChartSupplementSchema], default: [] },
    dietaryInstructions: { type: String, default: '' },
    additionalNotes: { type: String, default: '' },
    version: { type: Number, default: 1, min: 1 },
    parentChartId: { type: Schema.Types.ObjectId, ref: 'FoodChart', default: null },
    rootChartId: { type: Schema.Types.ObjectId, ref: 'FoodChart', required: true, index: true },
    finalizedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

FoodChartSchema.index({ doctorId: 1, status: 1, updatedAt: -1 });
FoodChartSchema.index({ doctorId: 1, patientId: 1, version: -1, createdAt: -1 });
FoodChartSchema.index({ rootChartId: 1, version: -1 });
FoodChartSchema.index({
  doctorId: 1,
  'patientSnapshot.name': 'text',
  'patientSnapshot.patientId': 'text',
  chartNumber: 'text',
});

export const FoodChart = mongoose.model<IFoodChart>('FoodChart', FoodChartSchema);
