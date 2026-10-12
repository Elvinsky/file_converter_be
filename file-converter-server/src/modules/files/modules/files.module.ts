import { Module } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule } from '@/core/config/config.module';
import { ConfigService } from '@/core/config/config.service';
import { AuthModule } from '@/modules/auth/modules/auth.module';
import { RbacModule } from '@/modules/rbac/modules/rbac.module';

import { FilesController } from '../controllers/files.controller';
import { FileEntity } from '../entities/files.entity';
import { FilesService } from '../services/files.service';
import { StorageService } from '../services/storage.service';
import { OBJECT_STORAGE_CLIENT } from '../storage.constants';
import type { ObjectStorageClient } from '../storage.types';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    RbacModule,
    TypeOrmModule.forFeature([FileEntity]),
  ],
  controllers: [FilesController],
  providers: [
    {
      provide: OBJECT_STORAGE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): ObjectStorageClient => {
        const client = new S3Client({
          region: config.get('S3_REGION'),
          endpoint: config.get('S3_ENDPOINT'),
          forcePathStyle: config.get('S3_FORCE_PATH_STYLE'),
          credentials: {
            accessKeyId: config.get('S3_ACCESS_KEY'),
            secretAccessKey: config.get('S3_SECRET_KEY'),
          },
        });

        return {
          async putObject({ bucket, key, body, contentType }) {
            await client.send(
              new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: body,
                ContentType: contentType,
              }),
            );
          },
          async getObject({ bucket, key }) {
            const output = await client.send(
              new GetObjectCommand({
                Bucket: bucket,
                Key: key,
              }),
            );

            if (!output.Body) {
              throw Object.assign(new Error('Stored object is empty'), {
                name: 'NoSuchKey',
              });
            }

            const bytes = await output.Body.transformToByteArray();

            return Buffer.from(bytes);
          },
          async deleteObject({ bucket, key }) {
            await client.send(
              new DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
              }),
            );
          },
        };
      },
    },
    StorageService,
    FilesService,
  ],
  exports: [StorageService],
})
export class FilesModule {}
