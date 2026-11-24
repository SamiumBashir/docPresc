import { templateController } from '../modules/templates/template.controller';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';

export const getTemplates = (req: AuthRequest, res: Response) => templateController.getTemplates(req, res);
export const createTemplate = (req: AuthRequest, res: Response) => templateController.createTemplate(req, res);
export const updateTemplate = (req: AuthRequest, res: Response) => templateController.updateTemplate(req, res);
export const deleteTemplate = (req: AuthRequest, res: Response) => templateController.deleteTemplate(req, res);
