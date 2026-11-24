import { Counter } from '../../models/Counter';
import { Patient } from '../../models/Patient';
import { Prescription } from '../../models/Prescription';

/**
 * Concurrency-safe atomic ID generator using MongoDB findOneAndUpdate with $inc.
 * Eliminates race conditions under simultaneous doctor submissions.
 */
export const generateNextPatientId = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const counterId = `patient_${currentYear}`;

  // Atomic loop: increment until an available sequence number is claimed
  while (true) {
    const counter = await Counter.findByIdAndUpdate(
      counterId,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const patientId = `PAT-${currentYear}-${counter.seq.toString().padStart(4, '0')}`;
    const exists = await Patient.exists({ patientId });
    if (!exists) {
      return patientId;
    }
  }
};

export const generateNextPrescriptionId = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const counterId = `prescription_${currentYear}`;

  // Atomic loop: increment until an available sequence number is claimed
  while (true) {
    const counter = await Counter.findByIdAndUpdate(
      counterId,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const prescriptionId = `RX-${currentYear}-${counter.seq.toString().padStart(6, '0')}`;
    const exists = await Prescription.exists({ prescriptionId });
    if (!exists) {
      return prescriptionId;
    }
  }
};
