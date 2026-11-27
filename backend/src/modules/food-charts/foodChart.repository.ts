import { FilterQuery, Types } from 'mongoose';
import { FoodCatalogItem, IFoodCatalogItem } from '../../models/FoodCatalogItem';
import { FoodChart, IFoodChart } from '../../models/FoodChart';

export class FoodChartRepository {
  async findCatalogItems(): Promise<IFoodCatalogItem[]> {
    return FoodCatalogItem.find({ isActive: true })
      .sort({ section: 1, sortOrder: 1 })
      .lean()
      .exec() as unknown as Promise<IFoodCatalogItem[]>;
  }

  async findById(id: string | Types.ObjectId): Promise<IFoodChart | null> {
    return FoodChart.findById(id).populate('chamberId').exec();
  }

  async findScopedById(
    id: string | Types.ObjectId,
    doctorId: string | Types.ObjectId
  ): Promise<IFoodChart | null> {
    return FoodChart.findOne({ _id: id, doctorId }).populate('chamberId').exec();
  }

  async find(
    filter: FilterQuery<IFoodChart>,
    options?: { skip?: number; limit?: number; sort?: any; select?: string }
  ): Promise<any[]> {
    let query = FoodChart.find(filter);
    if (options?.select) query = query.select(options.select) as any;
    if (options?.sort) query = query.sort(options.sort);
    if (options?.skip !== undefined) query = query.skip(options.skip);
    if (options?.limit !== undefined) query = query.limit(options.limit);
    return query
      .populate('chamberId', 'name address phone appointmentPhone visitingDays visitingHours roomNo website')
      .lean()
      .exec() as unknown as Promise<any[]>;
  }

  async count(filter: FilterQuery<IFoodChart>): Promise<number> {
    return FoodChart.countDocuments(filter);
  }

  async create(data: Partial<IFoodChart>): Promise<IFoodChart> {
    return FoodChart.create(data);
  }

  async updateScoped(
    id: string | Types.ObjectId,
    doctorId: string | Types.ObjectId,
    data: Record<string, any>
  ): Promise<IFoodChart | null> {
    return FoodChart.findOneAndUpdate(
      { _id: id, doctorId, status: 'DRAFT' },
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate('chamberId')
      .exec();
  }

  async deleteDraftScoped(
    id: string | Types.ObjectId,
    doctorId: string | Types.ObjectId
  ): Promise<IFoodChart | null> {
    return FoodChart.findOneAndDelete({
      _id: id,
      doctorId,
      status: 'DRAFT',
    }).exec();
  }

  async findVersionsByRoot(
    rootChartId: Types.ObjectId | string,
    doctorId: Types.ObjectId | string
  ): Promise<any[]> {
    return FoodChart.find({ rootChartId, doctorId })
      .sort({ version: -1, createdAt: -1 })
      .select(
        'chartNumber status version parentChartId rootChartId finalizedAt createdAt updatedAt allowedFoods avoidedFoods supplements'
      )
      .lean()
      .exec() as unknown as Promise<any[]>;
  }

  async getMaxVersionForRoot(
    rootChartId: Types.ObjectId | string,
    doctorId: Types.ObjectId | string
  ): Promise<number> {
    const latest = await FoodChart.findOne({ rootChartId, doctorId })
      .sort({ version: -1 })
      .select('version')
      .lean()
      .exec();
    return latest?.version ?? 1;
  }
}

export const foodChartRepository = new FoodChartRepository();
