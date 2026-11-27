import mongoose, { Document, Schema } from 'mongoose';

export type FoodSectionType = 'allowed' | 'avoided';

export interface IFoodCatalogItem extends Document {
  key: string;
  section: FoodSectionType;
  category: string;
  labelBn: string;
  isCustomAllowed: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FoodCatalogItemSchema = new Schema<IFoodCatalogItem>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    section: { type: String, enum: ['allowed', 'avoided'], required: true, index: true },
    category: { type: String, required: true, trim: true },
    labelBn: { type: String, required: true, trim: true },
    isCustomAllowed: { type: Boolean, default: false },
    sortOrder: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

FoodCatalogItemSchema.index({ section: 1, isActive: 1, sortOrder: 1 });

export const FoodCatalogItem = mongoose.model<IFoodCatalogItem>(
  'FoodCatalogItem',
  FoodCatalogItemSchema
);
