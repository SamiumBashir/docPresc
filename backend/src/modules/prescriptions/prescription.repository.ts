import { FilterQuery, Types } from 'mongoose';
import { Prescription, IPrescription } from '../../models/Prescription';

const ATTACHED_FOOD_CHART_FIELDS =
  'chartNumber status version finalizedAt createdAt allowedFoods avoidedFoods supplements';

export class PrescriptionRepository {
  async findById(id: string | Types.ObjectId): Promise<IPrescription | null> {
    return Prescription.findById(id)
      .populate('chamberId')
      .populate('attachedFoodChartId', ATTACHED_FOOD_CHART_FIELDS);
  }

  async findScopedById(id: string | Types.ObjectId, doctorId: string | Types.ObjectId): Promise<IPrescription | null> {
    return Prescription.findOne({ _id: id, doctorId })
      .populate('chamberId')
      .populate('attachedFoodChartId', ATTACHED_FOOD_CHART_FIELDS);
  }

  async findByShareToken(token: string): Promise<IPrescription | null> {
    return Prescription.findOne({ shareToken: token }).populate('chamberId');
  }

  async find(filter: FilterQuery<IPrescription>, options?: { skip?: number; limit?: number; sort?: any; select?: string }) {
    let query = Prescription.find(filter);
    if (options?.select) query = query.select(options.select) as any;
    if (options?.sort) query = query.sort(options.sort);
    if (options?.skip !== undefined) query = query.skip(options.skip);
    if (options?.limit !== undefined) query = query.limit(options.limit);
    return query.populate('chamberId', 'name address phone').lean().exec() as unknown as Promise<any[]>;
  }

  async count(filter: FilterQuery<IPrescription>): Promise<number> {
    return Prescription.countDocuments(filter);
  }

  async create(data: Partial<IPrescription>): Promise<IPrescription> {
    return Prescription.create(data);
  }

  async updateScoped(
    id: string | Types.ObjectId,
    doctorId: string | Types.ObjectId,
    data: any
  ): Promise<IPrescription | null> {
    return Prescription.findOneAndUpdate(
      { _id: id, doctorId },
      { $set: data },
      { new: true, runValidators: true }
    );
  }
}

export const prescriptionRepository = new PrescriptionRepository();
