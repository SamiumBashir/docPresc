import { z } from 'zod';

export const PatientSchema = z.object({
  name: z.string().min(2, 'Patient name must be at least 2 characters').max(100),
  phone: z.string().max(25).optional().default(''),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  dob: z.string().optional(),
  age: z.coerce.number().min(0, 'Age must be 0 or greater').max(130, 'Age must be realistic'),
  gender: z.enum(['Male', 'Female', 'Other']),
  bloodGroup: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'])
    .optional()
    .default('Unknown'),
  address: z.string().max(300).optional(),
  emergencyContact: z.string().max(100).optional(),
  allergies: z.array(z.string()).optional().default([]),
  medicalHistory: z.array(z.string()).optional().default([]),
  notes: z.string().max(1000).optional(),
});
