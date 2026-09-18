import { Test, TestingModule } from '@nestjs/testing';

import { ConfigService } from '@/core/config/config.service';

import { StorageService } from '../services/storage.service';
import { OBJECT_STORAGE_CLIENT } from '../storage.constants';

describe('StorageService', () => {
  let service: StorageService;
  let client: { putObject: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    client = {
      putObject: jest.fn().mockResolvedValue(undefined),
    };
    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          S3_BUCKET: 'file-converter-dev',
        };

        return values[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: OBJECT_STORAGE_CLIENT, useValue: client },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('stores an object in the configured bucket', async () => {
    const body = Buffer.from('hello');

    await expect(
      service.putObject({
        key: 'test-uploads/user-1/file.txt',
        body,
        contentType: 'text/plain',
      }),
    ).resolves.toEqual({
      bucket: 'file-converter-dev',
      key: 'test-uploads/user-1/file.txt',
    });

    expect(client.putObject).toHaveBeenCalledWith({
      bucket: 'file-converter-dev',
      key: 'test-uploads/user-1/file.txt',
      body,
      contentType: 'text/plain',
    });
  });
});
