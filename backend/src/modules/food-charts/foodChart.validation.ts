import { z } from 'zod';

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : undefined));

export const FoodChartEntrySchema = z.object({
  catalogItemId: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v && /^[a-f0-9]{24}$/i.test(v) ? v : null)),
  labelBn: z.string().trim().min(1, 'Food item name is required').max(200),
  category: optionalTrimmed(100),
  isCustom: z.boolean().default(false),
  portion: optionalTrimmed(120),
  timing: optionalTrimmed(120),
  prepNote: optionalTrimmed(250),
  order: z.coerce.number().int().min(0).default(0),
});

export const FoodChartSupplementSchema = z.object({
  name: z.string().trim().min(1, 'Supplement name is required').max(150),
  dosage: optionalTrimmed(100),
  frequency: optionalTrimmed(100),
  duration: optionalTrimmed(100),
  instructions: optionalTrimmed(250),
  order: z.coerce.number().int().min(0).default(0),
});

export const CreateFoodChartSchema = z.object({
  patientId: z.string().trim().min(1, 'Patient ID is required'),
  chamberId: z.string().trim().optional().nullable(),
  allowedFoods: z.array(FoodChartEntrySchema).max(200).default([]),
  avoidedFoods: z.array(FoodChartEntrySchema).max(200).default([]),
  supplements: z.array(FoodChartSupplementSchema).max(50).default([]),
  dietaryInstructions: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .nullable()
    .transform((v) => v ?? ''),
  additionalNotes: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .nullable()
    .transform((v) => v ?? ''),
  status: z.enum(['DRAFT', 'FINALIZED']).default('DRAFT'),
});

export const UpdateFoodChartSchema = z.object({
  chamberId: z.string().trim().optional().nullable(),
  allowedFoods: z.array(FoodChartEntrySchema).max(200).default([]),
  avoidedFoods: z.array(FoodChartEntrySchema).max(200).default([]),
  supplements: z.array(FoodChartSupplementSchema).max(50).default([]),
  dietaryInstructions: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .nullable()
    .transform((v) => v ?? ''),
  additionalNotes: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .nullable()
    .transform((v) => v ?? ''),
  status: z.enum(['DRAFT', 'FINALIZED']).optional(),
});
