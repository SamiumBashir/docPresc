import { FilterQuery, Types } from 'mongoose';
import { Medicine, IMedicine } from '../../models/Medicine';

export class MedicineRepository {
  async findById(id: string | Types.ObjectId): Promise<IMedicine | null> {
    return Medicine.findById(id);
  }

  async find(filter: FilterQuery<IMedicine>, options?: { skip?: number; limit?: number; sort?: any; select?: string }) {
    let query = Medicine.find(filter);
    if (options?.select) query = query.select(options.select) as any;
    if (options?.sort) query = query.sort(options.sort);
    if (options?.skip !== undefined) query = query.skip(options.skip);
    if (options?.limit !== undefined) query = query.limit(options.limit);
    return query.lean().exec() as unknown as Promise<IMedicine[]>;
  }

  async count(filter: FilterQuery<IMedicine>): Promise<number> {
    return Medicine.countDocuments(filter);
  }

  async create(data: Partial<IMedicine>): Promise<IMedicine> {
    return Medicine.create(data);
  }

  async update(id: string | Types.ObjectId, data: Partial<IMedicine>): Promise<IMedicine | null> {
    return Medicine.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async delete(id: string | Types.ObjectId): Promise<IMedicine | null> {
    return Medicine.findByIdAndDelete(id);
  }

  async bulkWrite(operations: any[]) {
    return Medicine.bulkWrite(operations, { ordered: false });
  }

  async distinct(field: string, filter?: FilterQuery<IMedicine>): Promise<string[]> {
    return Medicine.distinct(field, filter || {}) as Promise<string[]>;
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    return Medicine.aggregate(pipeline);
  }
}

export const medicineRepository = new MedicineRepository();
