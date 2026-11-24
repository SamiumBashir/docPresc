import mongoose, { Document, Schema } from 'mongoose';

export interface ICounter extends Document {
  seq: number;
}

const CounterSchema = new Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: false, versionKey: false }
);

export const Counter = mongoose.model<ICounter>('Counter', CounterSchema);
