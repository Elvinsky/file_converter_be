import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ConfigService } from '@/core/config/config.service';

import { OBJECT_STORAGE_CLIENT } from '../storage.constants';
import type {
  ObjectStorageClient,
  StoreObjectParams,
  StoreObjectResult,
} from '../storage.types';

export function isMissingObject(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const name = 'name' in error ? String(error.name) : '';
  const code = 'Code' in error ? String(error.Code) : '';
  const metadata =
    '$metadata' in error &&
    typeof error.$metadata === 'object' &&
    error.$metadata !== null &&
    'httpStatusCode' in error.$metadata
      ? Number(error.$metadata.httpStatusCode)
      : undefined;

  return (
    name === 'NoSuchKey' ||
    name === 'NotFound' ||
    code === 'NoSuchKey' ||
    metadata === 404
  );
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @Inject(OBJECT_STORAGE_CLIENT)
    private readonly client: ObjectStorageClient,
    private readonly config: ConfigService,
  ) {}

  async putObject(params: StoreObjectParams): Promise<StoreObjectResult> {
    const bucket = this.config.get('S3_BUCKET');

    await this.client.putObject({
      bucket,
      key: params.key,
      body: params.body,
      contentType: params.contentType,
    });

    this.logger.log(`Stored object s3://${bucket}/${params.key}`);

    return {
      bucket,
      key: params.key,
    };
  }

  async getObject(key: string): Promise<Buffer> {
    const bucket = this.config.get('S3_BUCKET');

    try {
      return await this.client.getObject({ bucket, key });
    } catch (error) {
      if (isMissingObject(error)) {
        throw new NotFoundException('Stored file is not available');
      }

      this.logger.error(`Failed to read object s3://${bucket}/${key}`);
      throw new InternalServerErrorException('Storage is unavailable');
    }
  }

  async deleteObject(key: string): Promise<void> {
    const bucket = this.config.get('S3_BUCKET');

    try {
      await this.client.deleteObject({ bucket, key });
      this.logger.log(`Deleted object s3://${bucket}/${key}`);
    } catch (error) {
      if (isMissingObject(error)) {
        return;
      }

      this.logger.error(`Failed to delete object s3://${bucket}/${key}`);
      throw error;
    }
  }
}
