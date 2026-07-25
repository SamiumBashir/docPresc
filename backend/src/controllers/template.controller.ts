import { Response } from 'express';
import { Template } from '../models/Template';
import { AuthRequest } from '../middleware/auth';
import { TemplateSchema } from '../validators/schemas';

export const getTemplates = async (req: AuthRequest, res: Response): Promise<void> => {
  const doctorId = req.doctor?._id;
  if (!doctorId) {
    res.status(403).json({ success: false, message: 'Doctor scope required.' });
    return;
  }

  const templates = await Template.find({ doctorId }).sort({ createdAt: -1 });
  res.json({ success: true, data: templates });
};

export const createTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  const doctorId = req.doctor?._id;
  if (!doctorId) {
    res.status(403).json({ success: false, message: 'Doctor scope required.' });
    return;
  }

  const validated = TemplateSchema.parse(req.body);

  const template = await Template.create({
    ...validated,
    doctorId,
  });

  res.status(201).json({
    success: true,
    message: 'Prescription template saved successfully.',
    data: template,
  });
};

export const updateTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  const doctorId = req.doctor?._id;
  const { id } = req.params;

  const validated = TemplateSchema.parse(req.body);

  const template = await Template.findOneAndUpdate(
    { _id: id, doctorId },
    { $set: validated },
    { new: true }
  );

  if (!template) {
    res.status(404).json({ success: false, message: 'Template not found.' });
    return;
  }

  res.json({
    success: true,
    message: 'Template updated successfully.',
    data: template,
  });
};

export const deleteTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  const doctorId = req.doctor?._id;
  const { id } = req.params;

  const template = await Template.findOneAndDelete({ _id: id, doctorId });
  if (!template) {
    res.status(404).json({ success: false, message: 'Template not found.' });
    return;
  }

  res.json({
    success: true,
    message: 'Template deleted successfully.',
  });
};
