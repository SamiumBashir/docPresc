import { z } from 'zod';

export const RegisterDoctorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone must be at least 5 digits').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  qualification: z.string().min(2, 'Qualification is required (e.g. MBBS)'),
  specialization: z.string().optional().default('General Physician'),
  bmdcNumber: z.string().min(3, 'BMDC Registration Number is required'),
  workplace: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const PatientSchema = z.object({
  name: z.string().min(2, 'Patient name is required'),
  phone: z.string().optional().default(''),
  email: z.string().email().optional().or(z.literal('')),
  age: z.coerce.number().min(0).max(130, 'Age must be between 0 and 130'),
  gender: z.enum(['Male', 'Female', 'Other']),
  bloodGroup: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'])
    .optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  allergies: z.array(z.string()).optional().default([]),
  medicalHistory: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
});

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
  status: z.enum(['DRAFT', 'FINALIZED']).default('DRAFT'),
});

export const MedicineSchema = z.object({
  brandName: z.string().min(1, 'Brand name is required'),
  genericName: z.string().min(1, 'Generic name is required'),
  strength: z.string().min(1, 'Strength is required'),
  dosageForm: z.string().min(1, 'Dosage form is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  category: z.string().min(1, 'Category is required'),
  medicineType: z.enum(['Allopathic', 'Unani', 'Ayurvedic', 'Herbal']).optional().default('Allopathic'),
  unit: z.string().optional(),
  price: z.number().optional(),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

export const ChamberSchema = z.object({
  name: z.string().min(2, 'Chamber name is required'),
  address: z.string().min(3, 'Chamber address is required'),
  phone: z.string().optional(),
  appointmentPhone: z.string().optional(),
  visitingDays: z.array(z.string()).default(['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu']),
  visitingHours: z.string().default('5:00 PM - 9:00 PM'),
  roomNo: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export const TemplateSchema = z.object({
  name: z.string().min(2, 'Template name is required'),
  category: z.string().default('General'),
  description: z.string().optional(),
  chiefComplaints: z
    .array(
      z.object({
        complaint: z.string(),
        duration: z.string().optional(),
      })
    )
    .optional(),
  diagnosis: z
    .array(
      z.object({
        name: z.string(),
        icdCode: z.string().optional(),
      })
    )
    .optional(),
  medicines: z.array(PrescriptionMedicineSchema).default([]),
  investigations: z.array(z.string()).default([]),
  advice: z.array(z.string()).default([]),
  followUpDuration: z.string().default('7 days'),
});
