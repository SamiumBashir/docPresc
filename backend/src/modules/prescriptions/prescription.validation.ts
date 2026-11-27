import { z } from 'zod';

export const PrescriptionMedicineSchema = z.object({
  medicineId: z.string().optional().nullable(),
  brandName: z.string().min(1, 'Medicine brand name is required'),
  genericName: z.string().optional().nullable(),
  dosageForm: z.string().default('Tablet'),
  strength: z.string().optional().nullable(),
  dose: z.string().default('1 tablet'),
  frequency: z.string().default('1+0+1'),
  duration: z.string().default('5 days'),
  instruction: z.string().default('After meal'),
  customNote: z.string().optional().nullable(),
  order: z.number().default(0),
});

export const PrescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  chamberId: z.string().optional().nullable(),
  vitals: z
    .object({
      bpSystolic: z.coerce.number().optional().nullable(),
      bpDiastolic: z.coerce.number().optional().nullable(),
      pulse: z.coerce.number().optional().nullable(),
      temperature: z.coerce.number().optional().nullable(),
      spo2: z.coerce.number().optional().nullable(),
      weight: z.coerce.number().optional().nullable(),
      height: z.coerce.number().optional().nullable(),
      bmi: z.coerce.number().optional().nullable(),
    })
    .optional()
    .nullable(),
  chiefComplaints: z
    .array(
      z.object({
        complaint: z.string().min(1),
        duration: z.string().optional().nullable(),
        note: z.string().optional().nullable(),
      })
    )
    .default([]),
  history: z.string().optional().nullable(),
  examination: z.string().optional().nullable(),
  diagnosis: z
    .array(
      z.object({
        name: z.string().min(1),
        icdCode: z.string().optional().nullable(),
        type: z.enum(['provisional', 'differential', 'confirmed']).default('provisional'),
      })
    )
    .default([]),
  medicines: z.array(PrescriptionMedicineSchema).default([]),
  investigations: z.array(z.string()).default([]),
  advice: z.array(z.string()).default([]),
  followUp: z
    .object({
      duration: z.string().default('7 days'),
      date: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
  attachedFoodChartId: z.string().trim().optional().nullable(),
  status: z.enum(['DRAFT', 'FINALIZED']).default('DRAFT'),
});
