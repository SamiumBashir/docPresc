import { FilterQuery, Types } from 'mongoose';
import { TherapyCategory, ITherapyCategory } from '../../models/TherapyCategory';
import { Therapy, ITherapy } from '../../models/Therapy';
import { TreatmentPlan, ITreatmentPlan } from '../../models/TreatmentPlan';
import { TherapySession, ITherapySession } from '../../models/TherapySession';

export class TherapyRepository {
  // Categories
  async findCategories(onlyActive = false): Promise<ITherapyCategory[]> {
    const filter: FilterQuery<ITherapyCategory> = onlyActive ? { isActive: true } : {};
    return TherapyCategory.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .lean()
      .exec() as unknown as Promise<ITherapyCategory[]>;
  }

  async findCategoryById(id: string | Types.ObjectId): Promise<ITherapyCategory | null> {
    return TherapyCategory.findById(id).exec();
  }

  async findCategoryByKeyOrName(key: string, name: string): Promise<ITherapyCategory | null> {
    return TherapyCategory.findOne({
      $or: [{ key }, { name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }],
    }).exec();
  }

  async createCategory(data: Partial<ITherapyCategory>): Promise<ITherapyCategory> {
    return TherapyCategory.create(data);
  }

  // Therapies Catalog
  async findTherapies(
    filter: FilterQuery<ITherapy>,
    options?: { skip?: number; limit?: number; sort?: Record<string, 1 | -1> }
  ): Promise<ITherapy[]> {
    let query = Therapy.find(filter);
    query = query.sort(options?.sort || { isEdTreatment: 1, sortOrder: 1, name: 1 });
    if (options?.skip !== undefined) query = query.skip(options.skip);
    if (options?.limit !== undefined) query = query.limit(options.limit);
    return query.lean().exec() as unknown as Promise<ITherapy[]>;
  }

  async countTherapies(filter: FilterQuery<ITherapy>): Promise<number> {
    return Therapy.countDocuments(filter);
  }

  async findTherapyById(id: string | Types.ObjectId): Promise<ITherapy | null> {
    return Therapy.findById(id).exec();
  }

  async findTherapiesByIds(ids: Array<string | Types.ObjectId>): Promise<ITherapy[]> {
    return Therapy.find({ _id: { $in: ids } }).exec();
  }

  async createTherapy(data: Partial<ITherapy>): Promise<ITherapy> {
    return Therapy.create(data);
  }

  async updateTherapyById(
    id: string | Types.ObjectId,
    data: Record<string, any>
  ): Promise<ITherapy | null> {
    return Therapy.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  }

  // Treatment Plans
  async findPlans(
    filter: FilterQuery<ITreatmentPlan>,
    options?: { skip?: number; limit?: number; sort?: Record<string, 1 | -1> }
  ): Promise<ITreatmentPlan[]> {
    let query = TreatmentPlan.find(filter);
    query = query.sort(options?.sort || { updatedAt: -1, createdAt: -1 });
    if (options?.skip !== undefined) query = query.skip(options.skip);
    if (options?.limit !== undefined) query = query.limit(options.limit);
    return query
      .populate(
        'chamberId',
        'name address phone appointmentPhone visitingDays visitingHours roomNo website'
      )
      .lean()
      .exec() as unknown as Promise<ITreatmentPlan[]>;
  }

  async countPlans(filter: FilterQuery<ITreatmentPlan>): Promise<number> {
    return TreatmentPlan.countDocuments(filter);
  }

  async findPlanById(id: string | Types.ObjectId): Promise<ITreatmentPlan | null> {
    return TreatmentPlan.findById(id).populate('chamberId').exec();
  }

  async createPlan(data: Partial<ITreatmentPlan>): Promise<ITreatmentPlan> {
    return TreatmentPlan.create(data);
  }

  async updatePlanById(
    id: string | Types.ObjectId,
    data: Record<string, any>
  ): Promise<ITreatmentPlan | null> {
    return TreatmentPlan.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate('chamberId')
      .exec();
  }

  // Therapy Sessions
  async findSessions(
    filter: FilterQuery<ITherapySession>,
    options?: { skip?: number; limit?: number; sort?: Record<string, 1 | -1> }
  ): Promise<ITherapySession[]> {
    let query = TherapySession.find(filter);
    query = query.sort(options?.sort || { scheduledAt: 1, sessionNumber: 1 });
    if (options?.skip !== undefined) query = query.skip(options.skip);
    if (options?.limit !== undefined) query = query.limit(options.limit);
    return query.lean().exec() as unknown as Promise<ITherapySession[]>;
  }

  async findSessionsWithPlan(
    filter: FilterQuery<ITherapySession>,
    options?: { skip?: number; limit?: number; sort?: Record<string, 1 | -1> }
  ): Promise<any[]> {
    let query = TherapySession.find(filter);
    query = query.sort(options?.sort || { scheduledAt: 1, sessionNumber: 1 });
    if (options?.skip !== undefined) query = query.skip(options.skip);
    if (options?.limit !== undefined) query = query.limit(options.limit);
    return query
      .populate(
        'treatmentPlanId',
        'chartNumber status therapySnapshot therapySnapshots therapyIds patientSnapshot practitionerSnapshot isEdPlan consentStatus'
      )
      .lean()
      .exec() as unknown as Promise<any[]>;
  }

  async countSessions(filter: FilterQuery<ITherapySession>): Promise<number> {
    return TherapySession.countDocuments(filter);
  }

  async findSessionById(id: string | Types.ObjectId): Promise<ITherapySession | null> {
    return TherapySession.findById(id).exec();
  }

  async getMaxSessionNumber(treatmentPlanId: string | Types.ObjectId): Promise<number> {
    const latest = await TherapySession.findOne({ treatmentPlanId })
      .sort({ sessionNumber: -1 })
      .select('sessionNumber')
      .lean()
      .exec();
    return latest?.sessionNumber ?? 0;
  }

  async createSessions(items: Array<Partial<ITherapySession>>): Promise<ITherapySession[]> {
    return TherapySession.insertMany(items) as unknown as Promise<ITherapySession[]>;
  }

  /**
   * Optimistic concurrency update: matches both _id and expected version,
   * increments version atomically by 1. Returns null on stale version conflict.
   */
  async updateSessionWithLock(
    id: string | Types.ObjectId,
    expectedVersion: number,
    updateFields: Record<string, any>
  ): Promise<ITherapySession | null> {
    return TherapySession.findOneAndUpdate(
      { _id: id, version: expectedVersion },
      {
        $set: updateFields,
        $inc: { version: 1 },
      },
      { new: true, runValidators: true }
    ).exec();
  }

  async deleteNonCompletedSession(id: string | Types.ObjectId): Promise<ITherapySession | null> {
    return TherapySession.findOneAndDelete({
      _id: id,
      status: { $ne: 'Completed' },
    }).exec();
  }
}

export const therapyRepository = new TherapyRepository();
