import { ConfigService } from '@/core/config/config.service';
import { StorageService } from '@/modules/files/services/storage.service';
import { UsersService } from '@/modules/users/services/users.service';

import { TransformationHistoryEntity } from '../entities/transformation-history.entity';
import { TransformationAuditService } from '../services/transformation-audit.service';
import { TransformationCleanupService } from '../services/transformation-cleanup.service';
import { TransformationHistoryService } from '../services/transformation-history.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ID = '22222222-2222-4222-8222-222222222222';

function historyService(options?: {
  rows?: TransformationHistoryEntity[];
  putObject?: jest.Mock;
  getObject?: jest.Mock;
}) {
  const rows = options?.rows ?? [];
  const repository = {
    create: (value: Partial<TransformationHistoryEntity>) => value,
    save: jest.fn((value: Partial<TransformationHistoryEntity>) =>
      Promise.resolve({
        id: '33333333-3333-4333-8333-333333333333',
        ...value,
      }),
    ),
    update: jest.fn().mockResolvedValue(undefined),
    findOne: jest.fn(({ where }: { where: { id: string; userId?: string } }) =>
      Promise.resolve(
        rows.find(
          (row) =>
            row.id === where.id &&
            (where.userId === undefined || row.userId === where.userId),
        ) ?? null,
      ),
    ),
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };
  const putObject =
    options?.putObject ?? jest.fn().mockResolvedValue(undefined);
  const getObject =
    options?.getObject ?? jest.fn().mockResolvedValue(Buffer.from('saved'));
  const storage = { putObject, getObject, deleteObject: jest.fn() };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  const users = {
    findUserById: jest.fn().mockResolvedValue({ id: USER_ID, isActive: true }),
    getUserById: jest.fn().mockResolvedValue({ id: USER_ID, isActive: true }),
  };
  const config = {
    get: () => 90,
  };
  const service = new TransformationHistoryService(
    repository as never,
    users as unknown as UsersService,
    storage as unknown as StorageService,
    audit as unknown as TransformationAuditService,
    config as unknown as ConfigService,
  );

  return { service, repository, storage, audit, users };
}

describe('TransformationHistoryService', () => {
  it('keeps a successful conversion when storage save fails', async () => {
    const { service, repository, audit, storage } = historyService({
      putObject: jest.fn().mockRejectedValue(new Error('minio down')),
    });

    await service.record({
      userId: USER_ID,
      type: 'file',
      sourceFormat: 'json',
      targetFormat: 'csv',
      status: 'success',
      fileSize: 4,
      durationMs: 12,
      save: true,
      body: Buffer.from('a,b'),
      contentType: 'text/csv; charset=utf-8',
      fileName: 'converted.csv',
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ storageKey: null, status: 'success' }),
    );
    expect(storage.putObject).toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'save', result: 'error' }),
    );
  });

  it('forbids downloading another user’s file', async () => {
    const row = {
      id: '33333333-3333-4333-8333-333333333333',
      userId: OTHER_ID,
      storageKey: 'transformations/other/file',
      expiresAt: new Date(Date.now() + 60_000),
      contentType: 'text/plain',
      resultFileName: 'converted.txt',
    } as TransformationHistoryEntity;
    const { service } = historyService({ rows: [row] });

    await expect(service.downloadOwn(USER_ID, row.id)).rejects.toMatchObject({
      status: 403,
    });
  });

  it('returns 404 when the saved file has expired', async () => {
    const row = {
      id: '33333333-3333-4333-8333-333333333333',
      userId: USER_ID,
      storageKey: 'transformations/self/file',
      expiresAt: new Date(Date.now() - 60_000),
      contentType: 'text/plain',
      resultFileName: 'converted.txt',
    } as TransformationHistoryEntity;
    const { service } = historyService({ rows: [row] });

    await expect(service.downloadOwn(USER_ID, row.id)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('does not list history for an inactive user', async () => {
    const { service, users } = historyService();
    users.findUserById.mockResolvedValue({ id: USER_ID, isActive: false });

    await expect(service.listOwn(USER_ID, {})).rejects.toMatchObject({
      status: 401,
    });
  });
});

describe('TransformationCleanupService', () => {
  it('deletes an expired row and its stored file together', async () => {
    const row = {
      id: '33333333-3333-4333-8333-333333333333',
      storageKey: 'transformations/self/file',
    } as TransformationHistoryEntity;
    const repository = {
      find: jest.fn().mockResolvedValueOnce([row]).mockResolvedValueOnce([]),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const storage = {
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };
    const service = new TransformationCleanupService(
      repository as never,
      storage as unknown as StorageService,
    );

    await expect(service.removeExpired()).resolves.toBe(1);
    expect(storage.deleteObject).toHaveBeenCalledWith(row.storageKey);
    expect(repository.delete).toHaveBeenCalledWith(row.id);
  });
});
