import mongoose, { Document, Schema } from 'mongoose';

export interface ITherapyCategory extends Document {
  key: string;
  name: string;
  nameBn?: string;
  description?: string;
  isProtected: boolean;
  isSensitiveClinicalGroup: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const TherapyCategorySchema = new Schema<ITherapyCategory>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, unique: true, trim: true },
    nameBn: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    isProtected: { type: Boolean, default: false },
    isSensitiveClinicalGroup: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

TherapyCategorySchema.index({ isActive: 1, sortOrder: 1 });

export const TherapyCategory = mongoose.model<ITherapyCategory>(
  'TherapyCategory',
  TherapyCategorySchema
);
