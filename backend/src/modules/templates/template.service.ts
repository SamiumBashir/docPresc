import { templateRepository, TemplateRepository } from './template.repository';
import { NotFoundError } from '../../shared/errors';
import mongoose, { Types } from 'mongoose';

export class TemplateService {
  constructor(private repo: TemplateRepository = templateRepository) {}

  async getTemplates(doctorId: Types.ObjectId | string) {
    return this.repo.findByDoctor(doctorId);
  }

  async createTemplate(doctorId: Types.ObjectId | string, data: any) {
    return this.repo.create({
      ...data,
      doctorId,
    });
  }

  async updateTemplate(id: string, doctorId: Types.ObjectId | string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Template not found');
    }

    const template = await this.repo.update(id, doctorId, data);
    if (!template) {
      throw new NotFoundError('Template not found');
    }

    return template;
  }

  async deleteTemplate(id: string, doctorId: Types.ObjectId | string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Template not found');
    }

    const template = await this.repo.delete(id, doctorId);
    if (!template) {
      throw new NotFoundError('Template not found');
    }

    return template;
  }
}

export const templateService = new TemplateService();
