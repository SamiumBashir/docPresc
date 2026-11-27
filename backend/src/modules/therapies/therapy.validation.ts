import { z } from 'zod';

const objectIdRegex = /^[a-f0-9]{24}$/i;

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalEmptyString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => v ?? '');

const optionalNullableDateString = z
  .union([z.string().trim(), z.null()])
  .optional()
  .transform((v) => {
    if (v === null) return null;
    return v && v.length > 0 ? v : undefined;
  })
  .refine((v) => v === undefined || v === null || !Number.isNaN(new Date(v).getTime()), {
    message: 'Invalid date format',
  });

const requiredDateString = z
  .string()
  .trim()
  .min(1, 'Session date/time is required')
  .refine((v) => !Number.isNaN(new Date(v).getTime()), {
    message: 'Invalid session date/time format',
  });

export const CreateTherapyCategorySchema = z.object({
  name: z.string().trim().min(2, 'Category name is required').max(120),
  nameBn: optionalTrimmed(120),
  description: optionalTrimmed(500),
  isSensitiveClinicalGroup: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).max(1000).optional(),
});

export const CreateTherapySchema = z.object({
  name: z.string().trim().min(2, 'Therapy name is required').max(160),
  englishName: optionalTrimmed(160),
  bengaliName: optionalTrimmed(160),
  categoryId: z.string().trim().regex(objectIdRegex, 'Valid category ID is required'),
  description: optionalEmptyString(1500),
  isActive: z.boolean().optional().default(true),
  isAvailable: z.boolean().optional().default(true),
  requiredProviderQualifications: optionalEmptyString(500),
  requiredEquipment: optionalEmptyString(500),
  defaultSessionDurationMinutes: z
    .union([z.coerce.number().int().min(1).max(600), z.null()])
    .optional(),
  price: z.union([z.coerce.number().min(0).max(1000000), z.null()]).optional(),
  administrativeNotes: optionalEmptyString(2000),
  consentRequired: z.boolean().optional().default(false),
  terminologyReviewRequired: z.boolean().optional().default(false),
  specialReviewFlags: z.array(z.string().trim().min(1).max(80)).max(20).optional().default([]),
  governanceNotice: optionalEmptyString(1000),
});

export const UpdateTherapySchema = CreateTherapySchema.partial();

export const ToggleTherapyStatusSchema = z.object({
  isActive: z.boolean(),
  isAvailable: z.boolean().optional(),
});

export const VerifyTherapySchema = z.object({
  verificationStatus: z.enum([
    'PENDING_CLINICAL_REVIEW',
    'NEEDS_TERMINOLOGY_REVIEW',
    'APPROVED',
    'REJECTED',
  ]),
  verificationNotes: optionalEmptyString(2000),
  terminologyConfirmed: z.boolean().optional(),
  governanceReviewed: z.boolean().optional(),
  requiredProviderQualifications: optionalTrimmed(500),
  consentRequired: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
});

export const CreatePractitionerSchema = z.object({
  name: z.string().trim().min(2, 'Practitioner name is required').max(120),
  email: z.string().trim().email('Valid email is required').max(160),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  phone: optionalTrimmed(40),
  qualification: optionalTrimmed(200),
  specialization: optionalTrimmed(200),
  designation: optionalTrimmed(200),
  registrationNumber: optionalTrimmed(100),
});

export const UpdatePractitionerSchema = z.object({
  status: z.enum(['active', 'pending', 'suspended']).optional(),
  isAuthorizedPractitioner: z.boolean().optional(),
  phone: optionalTrimmed(40),
  qualification: optionalTrimmed(200),
  specialization: optionalTrimmed(200),
  designation: optionalTrimmed(200),
  registrationNumber: optionalTrimmed(100),
});

const InitialSessionInputSchema = z.object({
  scheduledAt: requiredDateString,
  assignedPractitionerId: z.string().trim().regex(objectIdRegex, 'Invalid practitioner ID').optional(),
  practitionerNotes: optionalEmptyString(2000),
});

export const CreateTreatmentPlanSchema = z
  .object({
    patientId: z.string().trim().regex(objectIdRegex, 'Valid patient ID is required'),
    chamberId: z.string().trim().optional().nullable(),
    therapyId: z.string().trim().regex(objectIdRegex, 'Valid therapy ID is required'),
    assignedPractitionerId: z
      .string()
      .trim()
      .regex(objectIdRegex, 'Valid practitioner ID is required'),
    treatmentObjective: optionalEmptyString(1500),
    clinicalIndication: optionalEmptyString(1500),
    clinicianApprovalConfirmed: z.boolean().default(false),
    plannedSessions: z.union([z.coerce.number().int().min(1).max(200), z.null()]).optional(),
    sessionDuration: optionalEmptyString(120),
    frequency: optionalEmptyString(200),
    scheduleSummary: optionalEmptyString(500),
    startDate: optionalNullableDateString,
    endDate: optionalNullableDateString,
    precautions: optionalEmptyString(3000),
    patientInstructions: optionalEmptyString(3000),
    consentStatus: z.enum(['NOT_REQUIRED', 'PENDING', 'OBTAINED', 'DECLINED']).optional(),
    consentNotes: optionalEmptyString(1000),
    status: z.enum(['DRAFT', 'FINALIZED', 'ACTIVE']).default('DRAFT'),
    initialSessions: z.array(InitialSessionInputSchema).max(50).optional().default([]),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate).getTime() >= new Date(data.startDate).getTime();
      }
      return true;
    },
    { message: 'End date cannot be earlier than start date', path: ['endDate'] }
  );

export const UpdateTreatmentPlanSchema = z
  .object({
    chamberId: z.string().trim().optional().nullable(),
    assignedPractitionerId: z
      .string()
      .trim()
      .regex(objectIdRegex, 'Valid practitioner ID is required')
      .optional(),
    treatmentObjective: z.string().trim().max(1500).optional(),
    clinicalIndication: z.string().trim().max(1500).optional(),
    clinicianApprovalConfirmed: z.boolean().optional(),
    plannedSessions: z.union([z.coerce.number().int().min(1).max(200), z.null()]).optional(),
    sessionDuration: z.string().trim().max(120).optional(),
    frequency: z.string().trim().max(200).optional(),
    scheduleSummary: z.string().trim().max(500).optional(),
    startDate: optionalNullableDateString,
    endDate: optionalNullableDateString,
    precautions: z.string().trim().max(3000).optional(),
    patientInstructions: z.string().trim().max(3000).optional(),
    consentStatus: z.enum(['NOT_REQUIRED', 'PENDING', 'OBTAINED', 'DECLINED']).optional(),
    consentNotes: z.string().trim().max(1000).optional(),
    status: z.enum(['DRAFT', 'FINALIZED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate).getTime() >= new Date(data.startDate).getTime();
      }
      return true;
    },
    { message: 'End date cannot be earlier than start date', path: ['endDate'] }
  );

export const CreateSessionsSchema = z.object({
  sessions: z
    .array(
      z.object({
        scheduledAt: requiredDateString,
        sessionNumber: z.coerce.number().int().min(1).max(500).optional(),
        assignedPractitionerId: z
          .string()
          .trim()
          .regex(objectIdRegex, 'Invalid practitioner ID')
          .optional(),
        practitionerNotes: optionalEmptyString(2000),
      })
    )
    .min(1, 'At least one session is required')
    .max(50),
});

export const UpdateSessionSchema = z.object({
  version: z.coerce.number().int().min(1, 'Session version is required for concurrency lock'),
  status: z.enum(['Scheduled', 'Completed', 'Cancelled', 'Missed', 'Rescheduled']).optional(),
  scheduledAt: optionalNullableDateString,
  completedAt: optionalNullableDateString,
  practitionerNotes: z.string().trim().max(2000).optional(),
  patientFeedback: z.string().trim().max(2000).optional(),
  nextSessionDate: optionalNullableDateString,
  assignedPractitionerId: z.string().trim().regex(objectIdRegex, 'Invalid practitioner ID').optional(),
});
