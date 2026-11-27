import mongoose, { Document, Schema, Types } from 'mongoose';

export type TherapySessionStatus =
  | 'Scheduled'
  | 'Completed'
  | 'Cancelled'
  | 'Missed'
  | 'Rescheduled';

export interface ITherapySession extends Document {
  treatmentPlanId: Types.ObjectId;
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  therapyId: Types.ObjectId;
  assignedPractitionerId: Types.ObjectId;
  assignedPractitionerName: string;
  sessionNumber: number;
  scheduledAt: Date;
  status: TherapySessionStatus;
  completedAt?: Date | null;
  practitionerNotes?: string;
  patientFeedback?: string;
  nextSessionDate?: Date | null;
  updatedByUserId?: Types.ObjectId | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const TherapySessionSchema = new Schema<ITherapySession>(
  {
    treatmentPlanId: {
      type: Schema.Types.ObjectId,
      ref: 'TreatmentPlan',
      required: true,
      index: true,
    },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    therapyId: { type: Schema.Types.ObjectId, ref: 'Therapy', required: true },
    assignedPractitionerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedPractitionerName: { type: String, required: true, trim: true },
    sessionNumber: { type: Number, required: true, min: 1 },
    scheduledAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled', 'Missed', 'Rescheduled'],
      default: 'Scheduled',
      index: true,
    },
    completedAt: { type: Date, default: null },
    practitionerNotes: { type: String, trim: true, default: '' },
    patientFeedback: { type: String, trim: true, default: '' },
    nextSessionDate: { type: Date, default: null },
    updatedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    version: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true }
);

TherapySessionSchema.index({ treatmentPlanId: 1, sessionNumber: 1 }, { unique: true });
TherapySessionSchema.index({ assignedPractitionerId: 1, scheduledAt: 1, status: 1 });
TherapySessionSchema.index({ patientId: 1, scheduledAt: -1 });
TherapySessionSchema.index({ doctorId: 1, status: 1, scheduledAt: 1 });

export const TherapySession = mongoose.model<ITherapySession>(
  'TherapySession',
  TherapySessionSchema
);
