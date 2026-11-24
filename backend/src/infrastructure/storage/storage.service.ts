import cloudinary from '../../config/cloudinary';
import { ENV } from '../../config/env';

export interface UploadResult {
  url: string;
  publicId: string;
  provider: 'cloudinary' | 'local_base64';
}

export interface IStorageService {
  uploadImage(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    folder?: string
  ): Promise<UploadResult>;
  deleteFile(publicId: string): Promise<boolean>;
}

export class CloudinaryStorageService implements IStorageService {
  async uploadImage(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    folder = 'docpresc/signatures'
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          format: 'png',
          transformation: [{ width: 600, crop: 'limit' }],
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Cloudinary upload stream failed.'));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              provider: 'cloudinary',
            });
          }
        }
      );
      stream.end(buffer);
    });
  }

  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch {
      return false;
    }
  }
}

export class LocalBase64StorageService implements IStorageService {
  async uploadImage(
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<UploadResult> {
    const base64 = `data:${mimeType};base64,${buffer.toString('base64')}`;
    const publicId = `local_${Date.now()}_${filename.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    return {
      url: base64,
      publicId,
      provider: 'local_base64',
    };
  }

  async deleteFile(_publicId: string): Promise<boolean> {
    return true;
  }
}

export const getStorageService = (): IStorageService => {
  const hasCloudinary = Boolean(
    ENV.CLOUDINARY_CLOUD_NAME &&
    ENV.CLOUDINARY_API_KEY &&
    ENV.CLOUDINARY_API_SECRET
  );

  if (hasCloudinary) {
    return new CloudinaryStorageService();
  }
  return new LocalBase64StorageService();
};
