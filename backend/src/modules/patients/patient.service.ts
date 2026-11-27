import mongoose, { Types } from 'mongoose';
import { patientRepository, PatientRepository } from './patient.repository';
import { IPatient } from '../../models/Patient';
import { Prescription } from '../../models/Prescription';
import { TreatmentPlan } from '../../models/TreatmentPlan';
import { generateNextPatientId } from '../../shared/utils/idGenerator';
import { NotFoundError, ForbiddenError } from '../../shared/errors';
import { CreatePatientDTO, UpdatePatientDTO, PatientFilterOptions, PatientListResult } from './patient.types';

export class PatientService {
  constructor(private repo: PatientRepository = patientRepository) {}

  async listPatients(filters: PatientFilterOptions): Promise<PatientListResult> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const query: any = { doctorId: filters.doctorId };

    if (filters.search && typeof filters.search === 'string' && filters.search.trim()) {
      const searchRegex = new RegExp(filters.search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { patientId: searchRegex },
      ];
    }

    const [patients, total] = await Promise.all([
      this.repo.find(query, { skip, limit, sort: { updatedAt: -1 } }),
      this.repo.count(query),
    ]);

    return {
      patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getPatientById(id: string, doctorId: Types.ObjectId | string, isAdmin = false): Promise<IPatient> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Patient record not found.');
    }

    const patient = isAdmin
      ? await this.repo.findById(id)
      : await this.repo.findScopedById(id, doctorId);

    if (!patient) {
      throw new NotFoundError('Patient record not found or access unauthorized.');
    }

    return patient;
  }

  async createPatient(data: CreatePatientDTO, doctorId: Types.ObjectId | string): Promise<IPatient> {
    if (!doctorId) {
      throw new ForbiddenError('Doctor identity required to register patients.');
    }

    const patientId = await generateNextPatientId();

    const payload: any = {
      ...data,
      patientId,
      doctorId: new mongoose.Types.ObjectId(doctorId.toString()),
    };
    if (data.dob) {
      payload.dob = new Date(data.dob);
    }

    return this.repo.create(payload);
  }

  async updatePatient(
    id: string,
    doctorId: Types.ObjectId | string,
    data: UpdatePatientDTO
  ): Promise<IPatient> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Patient record not found.');
    }

    const payload: any = { ...data };
    if (data.dob) {
      payload.dob = new Date(data.dob);
    }

    const updated = await this.repo.updateScoped(id, doctorId, payload);
    if (!updated) {
      throw new NotFoundError('Patient record not found or access unauthorized.');
    }

    return updated;
  }

  async getPatientMedicalHistory(id: string, doctorId: Types.ObjectId | string, isAdmin = false) {
    const patient = await this.getPatientById(id, doctorId, isAdmin);

    const prescriptions = await Prescription.find({
      patientId: patient._id,
      ...(isAdmin ? {} : { doctorId }),
    })
      .sort({ createdAt: -1 })
      .populate('chamberId', 'name address');

    const allDiagnoses: string[] = [];
    const pastMedicinesMap = new Map<string, any>();

    prescriptions.forEach((rx) => {
      rx.diagnosis.forEach((d) => {
        if (d.name && !allDiagnoses.includes(d.name)) {
          allDiagnoses.push(d.name);
        }
      });

      rx.medicines.forEach((med) => {
        if (med.brandName && !pastMedicinesMap.has(med.brandName)) {
          pastMedicinesMap.set(med.brandName, {
            brandName: med.brandName,
            genericName: med.genericName,
            strength: med.strength,
            dosageForm: med.dosageForm,
            lastDose: med.dose,
            lastFrequency: med.frequency,
            lastPrescribedDate: rx.createdAt,
          });
        }
      });
    });

    const treatmentPlans = await TreatmentPlan.find({ patientId: id, doctorId })
      .sort({ createdAt: -1 })
      .select(
        'chartNumber status isEdPlan therapySnapshot practitionerSnapshot startDate plannedSessions finalizedAt createdAt'
      )
      .lean();

    return {
      patient,
      prescriptions,
      treatmentPlans,
      timeline: prescriptions.map((rx) => ({
        id: rx._id,
        prescriptionId: rx.prescriptionId,
        date: rx.createdAt,
        status: rx.status,
        chamber: (rx.chamberId as any)?.name || 'Main Chamber',
        chiefComplaints: rx.chiefComplaints,
        diagnoses: rx.diagnosis,
        vitals: rx.vitals,
        medicinesCount: rx.medicines.length,
        investigationsCount: rx.investigations.length,
      })),
      pastDiagnoses: allDiagnoses,
      pastMedicines: Array.from(pastMedicinesMap.values()),
    };
  }
}

export const patientService = new PatientService();
