import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { templateService } from './template.service';
import { TemplateSchema } from '../../validators/schemas';
import { logAuditEvent } from '../../middleware/audit';

export class TemplateController {
  async getTemplates(req: AuthRequest, res: Response): Promise<void> {
    const doctorId = req.doctor?._id;
    if (!doctorId) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const templates = await templateService.getTemplates(doctorId);
    res.json({ success: true, data: templates });
  }

  async createTemplate(req: AuthRequest, res: Response): Promise<void> {
    const doctorId = req.doctor?._id;
    if (!doctorId) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const validated = TemplateSchema.parse(req.body);
    const template = await templateService.createTemplate(doctorId, validated);

    await logAuditEvent(req, {
      action: 'TEMPLATE_CREATE',
      resource: 'Template',
      resourceId: template._id.toString(),
      details: { name: template.name },
    });

    res.status(201).json({
      success: true,
      message: 'Prescription template saved successfully.',
      data: template,
    });
  }

  async updateTemplate(req: AuthRequest, res: Response): Promise<void> {
    const doctorId = req.doctor?._id;
    const { id } = req.params;

    if (!doctorId) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const validated = TemplateSchema.parse(req.body);
    const template = await templateService.updateTemplate(id, doctorId, validated);

    await logAuditEvent(req, {
      action: 'TEMPLATE_UPDATE',
      resource: 'Template',
      resourceId: id,
      details: { name: template.name },
    });

    res.json({
      success: true,
      message: 'Template updated successfully.',
      data: template,
    });
  }

  async deleteTemplate(req: AuthRequest, res: Response): Promise<void> {
    const doctorId = req.doctor?._id;
    const { id } = req.params;

    if (!doctorId) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const template = await templateService.deleteTemplate(id, doctorId);

    await logAuditEvent(req, {
      action: 'TEMPLATE_DELETE',
      resource: 'Template',
      resourceId: id,
      details: { name: template.name },
    });

    res.json({
      success: true,
      message: 'Template deleted successfully.',
    });
  }
}

export const templateController = new TemplateController();
