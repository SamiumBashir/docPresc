import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISession extends Document {
  userId: Types.ObjectId;
  refreshTokenHash: string;
  familyId?: string; // Token family identifier for reuse detection
  ipAddress?: string;
  userAgent?: string;
  isValid: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenHash: { type: String, required: true, index: true },
    familyId: { type: String, index: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    isValid: { type: Boolean, default: true, index: true },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: automatically deletes expired sessions
    },
  },
  { timestamps: true }
);

SessionSchema.index({ userId: 1, isValid: 1 });
SessionSchema.index({ refreshTokenHash: 1, isValid: 1 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);
