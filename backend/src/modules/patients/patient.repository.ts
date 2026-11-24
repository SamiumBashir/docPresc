import { FilterQuery, Types } from 'mongoose';
import { Patient, IPatient } from '../../models/Patient';

export class PatientRepository {
  async findById(id: string | Types.ObjectId): Promise<IPatient | null> {
    return Patient.findById(id);
  }

  async findScopedById(id: string | Types.ObjectId, doctorId: string | Types.ObjectId): Promise<IPatient | null> {
    return Patient.findOne({ _id: id, doctorId });
  }

  async findScopedByPatientId(patientId: string, doctorId: string | Types.ObjectId): Promise<IPatient | null> {
    return Patient.findOne({ patientId, doctorId });
  }

  async find(filter: FilterQuery<IPatient>, options?: { skip?: number; limit?: number; sort?: any }) {
    let query = Patient.find(filter);
    if (options?.sort) query = query.sort(options.sort);
    if (options?.skip !== undefined) query = query.skip(options.skip);
    if (options?.limit !== undefined) query = query.limit(options.limit);
    return query.lean().exec() as unknown as Promise<IPatient[]>;
  }

  async count(filter: FilterQuery<IPatient>): Promise<number> {
    return Patient.countDocuments(filter);
  }

  async create(data: Partial<IPatient>): Promise<IPatient> {
    return Patient.create(data);
  }

  async updateScoped(
    id: string | Types.ObjectId,
    doctorId: string | Types.ObjectId,
    data: Partial<IPatient>
  ): Promise<IPatient | null> {
    return Patient.findOneAndUpdate(
      { _id: id, doctorId },
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async deleteScoped(
    id: string | Types.ObjectId,
    doctorId: string | Types.ObjectId
  ): Promise<IPatient | null> {
    return Patient.findOneAndDelete({ _id: id, doctorId });
  }
}

export const patientRepository = new PatientRepository();
