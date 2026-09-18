import { Inject, Injectable, Logger } from '@nestjs/common';

import { ConfigService } from '@/core/config/config.service';

import { OBJECT_STORAGE_CLIENT } from '../storage.constants';
import type {
  ObjectStorageClient,
  StoreObjectParams,
  StoreObjectResult,
} from '../storage.types';

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
}
