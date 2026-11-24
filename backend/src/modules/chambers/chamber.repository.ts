import { Chamber, IChamber } from '../../models/Chamber';
import { Types } from 'mongoose';

export class ChamberRepository {
  async findByDoctor(doctorId: Types.ObjectId | string): Promise<IChamber[]> {
    return Chamber.find({ doctorId, status: 'active' })
      .sort({ isDefault: -1, createdAt: 1 })
      .lean() as unknown as IChamber[];
  }

  async findByIdAndDoctor(id: string, doctorId: Types.ObjectId | string): Promise<IChamber | null> {
    return Chamber.findOne({ _id: id, doctorId, status: 'active' });
  }

  async countActiveByDoctor(doctorId: Types.ObjectId | string): Promise<number> {
    return Chamber.countDocuments({ doctorId, status: 'active' });
  }

  async clearDefault(doctorId: Types.ObjectId | string): Promise<void> {
    await Chamber.updateMany({ doctorId }, { $set: { isDefault: false } });
  }

  async create(data: any): Promise<IChamber> {
    return Chamber.create(data);
  }

  async update(id: string, doctorId: Types.ObjectId | string, updateData: any): Promise<IChamber | null> {
    return Chamber.findOneAndUpdate(
      { _id: id, doctorId },
      { $set: updateData },
      { new: true }
    );
  }

  async softDelete(id: string, doctorId: Types.ObjectId | string): Promise<IChamber | null> {
    return Chamber.findOneAndUpdate(
      { _id: id, doctorId },
      { $set: { status: 'inactive', isDefault: false } },
      { new: true }
    );
  }

  async findAlternativeDefault(doctorId: Types.ObjectId | string, excludeId?: string): Promise<IChamber | null> {
    const query: any = { doctorId, status: 'active' };
    if (excludeId) query._id = { $ne: excludeId };
    return Chamber.findOne(query).sort({ createdAt: 1 });
  }
}

export const chamberRepository = new ChamberRepository();
