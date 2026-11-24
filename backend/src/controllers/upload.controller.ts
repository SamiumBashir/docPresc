import { uploadController } from '../modules/uploads/upload.controller';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';

export const uploadSignature = (req: AuthRequest, res: Response) => uploadController.uploadSignature(req, res);
