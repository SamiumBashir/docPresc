import { Counter } from '../../models/Counter';
import { Patient } from '../../models/Patient';
import { Prescription } from '../../models/Prescription';
import { FoodChart } from '../../models/FoodChart';
import { TreatmentPlan } from '../../models/TreatmentPlan';

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

export const generateNextFoodChartNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const counterId = `food_chart_${currentYear}`;

  while (true) {
    const counter = await Counter.findByIdAndUpdate(
      counterId,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const chartNumber = `FC-${currentYear}-${counter.seq.toString().padStart(6, '0')}`;
    const exists = await FoodChart.exists({ chartNumber });
    if (!exists) {
      return chartNumber;
    }
  }
};

export const generateNextTreatmentPlanNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const counterId = `treatment_plan_${currentYear}`;

  while (true) {
    const counter = await Counter.findByIdAndUpdate(
      counterId,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const chartNumber = `TP-${currentYear}-${counter.seq.toString().padStart(6, '0')}`;
    const exists = await TreatmentPlan.exists({ chartNumber });
    if (!exists) {
      return chartNumber;
    }
  }
};
