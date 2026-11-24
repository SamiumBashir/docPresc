import { z } from 'zod';

export const MedicineSchema = z.object({
  brandName: z.string().min(1, 'Brand name is required'),
  genericName: z.string().min(1, 'Generic name is required'),
  strength: z.string().optional().default('Standard'),
  dosageForm: z.string().optional().default('Tablet'),
  form: z.string().optional(),
  manufacturer: z.string().optional().default('General'),
  manufacture: z.string().optional(),
  category: z.string().optional().default('General'),
  medicineType: z.enum(['Allopathic', 'Unani', 'Ayurvedic', 'Herbal']).optional().default('Allopathic'),
  type: z.enum(['Allopathic', 'Unani', 'Ayurvedic', 'Herbal']).optional(),
  unit: z.string().optional(),
  price: z.coerce.number().optional(),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});
