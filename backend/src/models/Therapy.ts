import mongoose, { Document, Schema, Types } from 'mongoose';

export type TherapyVerificationStatus =
  | 'PENDING_CLINICAL_REVIEW'
  | 'NEEDS_TERMINOLOGY_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export interface ITherapy extends Document {
  key: string;
  name: string;
  englishName: string;
  bengaliName?: string;
  categoryId: Types.ObjectId;
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
  verifiedByUserId?: Types.ObjectId | null;
  verifiedByName?: string;
  verifiedAt?: Date | null;
  verificationNotes?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const TherapySchema = new Schema<ITherapy>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true, index: true },
    englishName: { type: String, required: true, trim: true },
    bengaliName: { type: String, trim: true, default: '' },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'TherapyCategory',
      required: true,
      index: true,
    },
    categoryName: { type: String, required: true, trim: true, index: true },
    isEdTreatment: { type: Boolean, default: false, index: true },
    description: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    isAvailable: { type: Boolean, default: true },
    verificationStatus: {
      type: String,
      enum: ['PENDING_CLINICAL_REVIEW', 'NEEDS_TERMINOLOGY_REVIEW', 'APPROVED', 'REJECTED'],
      default: 'PENDING_CLINICAL_REVIEW',
      index: true,
    },
    terminologyReviewRequired: { type: Boolean, default: false },
    specialReviewFlags: [{ type: String, trim: true }],
    governanceNotice: { type: String, trim: true, default: '' },
    requiredProviderQualifications: { type: String, trim: true, default: '' },
    requiredEquipment: { type: String, trim: true, default: '' },
    defaultSessionDurationMinutes: { type: Number, min: 1, max: 600, default: null },
    price: { type: Number, min: 0, default: null },
    administrativeNotes: { type: String, trim: true, default: '' },
    consentRequired: { type: Boolean, default: false },
    verifiedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedByName: { type: String, trim: true, default: '' },
    verifiedAt: { type: Date, default: null },
    verificationNotes: { type: String, trim: true, default: '' },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

TherapySchema.index({ isActive: 1, verificationStatus: 1, categoryName: 1, sortOrder: 1 });
TherapySchema.index({ isEdTreatment: 1, isActive: 1, verificationStatus: 1, sortOrder: 1 });
TherapySchema.index({
  name: 'text',
  englishName: 'text',
  bengaliName: 'text',
  categoryName: 'text',
});

export const Therapy = mongoose.model<ITherapy>('Therapy', TherapySchema);
