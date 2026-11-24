import { getStorageService, IStorageService, UploadResult } from '../../infrastructure/storage/storage.service';

export class UploadService {
  constructor(private storage: IStorageService = getStorageService()) {}

  async uploadSignature(buffer: Buffer, originalname: string, mimetype: string): Promise<UploadResult> {
    return this.storage.uploadImage(buffer, originalname, mimetype, 'docpresc/signatures');
  }
}

export const uploadService = new UploadService();
