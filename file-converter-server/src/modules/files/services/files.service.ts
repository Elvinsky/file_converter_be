import { Injectable } from '@nestjs/common';
import path from 'node:path';

import { StorageService } from './storage.service';

export type IncomingUpload = {
  filename: string;
  mimetype: string;
  toBuffer: () => Promise<Buffer>;
};

@Injectable()
export class FilesService {
  constructor(private readonly storage: StorageService) {}

  async storeTestUpload(userId: string, file: IncomingUpload) {
    const originalName = this.sanitizeFileName(file.filename);
    const key = `test-uploads/${userId}/${Date.now()}-${originalName}`;
    const body = await file.toBuffer();

    const stored = await this.storage.putObject({
      key,
      body,
      contentType: file.mimetype,
    });

    return {
      success: true as const,
      bucket: stored.bucket,
      key: stored.key,
      originalName,
    };
  }

  private sanitizeFileName(filename: string): string {
    const baseName = path.basename(filename || 'upload.bin');
    const sanitized = baseName.replace(/[^\w.-]+/g, '_').slice(0, 200);

    return sanitized || 'upload.bin';
  }
}
