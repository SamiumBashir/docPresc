import { Template, ITemplate } from '../../models/Template';
import { Types } from 'mongoose';

export class TemplateRepository {
  async findByDoctor(doctorId: Types.ObjectId | string): Promise<ITemplate[]> {
    return Template.find({ doctorId }).sort({ createdAt: -1 });
  }

  async findByIdAndDoctor(id: string, doctorId: Types.ObjectId | string): Promise<ITemplate | null> {
    return Template.findOne({ _id: id, doctorId });
  }

  async create(data: any): Promise<ITemplate> {
    return Template.create(data);
  }

  async update(id: string, doctorId: Types.ObjectId | string, updateData: any): Promise<ITemplate | null> {
    return Template.findOneAndUpdate(
      { _id: id, doctorId },
      { $set: updateData },
      { new: true }
    );
  }

  async delete(id: string, doctorId: Types.ObjectId | string): Promise<ITemplate | null> {
    return Template.findOneAndDelete({ _id: id, doctorId });
  }
}

export const templateRepository = new TemplateRepository();
