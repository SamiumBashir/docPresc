import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { uploadService } from './upload.service';

export class UploadController {
  async uploadSignature(req: AuthRequest, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No signature image file provided.' });
      return;
    }

    try {
      const result = await uploadService.uploadSignature(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      res.json({
        success: true,
        message:
          result.provider === 'cloudinary'
            ? 'Signature uploaded to Cloudinary successfully.'
            : 'Signature processed successfully (Base64 fallback). Configure Cloudinary credentials in .env for cloud hosting.',
        data: {
          url: result.url,
          publicId: result.publicId,
          provider: result.provider,
        },
      });
    } catch (error: any) {
      console.error('Signature upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload signature.',
      });
    }
  }
}

export const uploadController = new UploadController();
