import { chamberRepository, ChamberRepository } from './chamber.repository';
import { Doctor } from '../../models/Doctor';
import { NotFoundError, AppError } from '../../shared/errors';
import mongoose, { Types } from 'mongoose';

export class ChamberService {
  constructor(private repo: ChamberRepository = chamberRepository) {}

  async getChambers(doctorId: Types.ObjectId | string) {
    return this.repo.findByDoctor(doctorId);
  }

  async createChamber(doctorId: Types.ObjectId | string, data: any) {
    const activeCount = await this.repo.countActiveByDoctor(doctorId);
    const isFirstChamber = activeCount === 0;
    const shouldBeDefault = data.isDefault || isFirstChamber;

    if (shouldBeDefault) {
      await this.repo.clearDefault(doctorId);
    }

    const chamber = await this.repo.create({
      ...data,
      isDefault: shouldBeDefault,
      doctorId,
    });

    if (shouldBeDefault) {
      await Doctor.findByIdAndUpdate(doctorId, { defaultChamberId: chamber._id });
    }

    return chamber;
  }

  async updateChamber(id: string, doctorId: Types.ObjectId | string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Chamber not found');
    }

    if (data.isDefault) {
      await this.repo.clearDefault(doctorId);
      await Doctor.findByIdAndUpdate(doctorId, { defaultChamberId: id });
    } else {
      // If unsetting default, make sure there is another active default
      const alt = await this.repo.findAlternativeDefault(doctorId, id);
      if (!alt) {
        data.isDefault = true;
      }
    }

    const chamber = await this.repo.update(id, doctorId, data);
    if (!chamber) {
      throw new NotFoundError('Chamber not found');
    }

    return chamber;
  }

  async deleteChamber(id: string, doctorId: Types.ObjectId | string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Chamber not found');
    }

    const chamber = await this.repo.softDelete(id, doctorId);
    if (!chamber) {
      throw new NotFoundError('Chamber not found');
    }

    // If deleted chamber was default, promote another active chamber
    const doctor = await Doctor.findById(doctorId);
    const wasDefault = chamber.isDefault || (doctor?.defaultChamberId && doctor.defaultChamberId.toString() === id);

    if (wasDefault) {
      const nextDefault = await this.repo.findAlternativeDefault(doctorId);
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
        await Doctor.findByIdAndUpdate(doctorId, { defaultChamberId: nextDefault._id });
      } else {
        await Doctor.findByIdAndUpdate(doctorId, { $unset: { defaultChamberId: 1 } });
      }
    }

    return chamber;
  }
}

export const chamberService = new ChamberService();
