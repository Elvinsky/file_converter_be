import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AccessService } from '@/modules/rbac/services/access.service';

import { FileEntity } from '../entities/files.entity';
import { FilesService } from '../services/files.service';
import { StorageService } from '../services/storage.service';

describe('FilesService', () => {
  const actorId = '11111111-1111-1111-1111-111111111111';
  const otherUserId = '22222222-2222-2222-2222-222222222222';

  let service: FilesService;
  let storage: { putObject: jest.Mock };
  let accessService: { canAccess: jest.Mock };
  let filesRepository: {
    save: jest.Mock;
    create: jest.Mock;
    findOneOrFail: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let queryBuilder: {
    leftJoinAndSelect: jest.Mock;
    orderBy: jest.Mock;
    andWhere: jest.Mock;
    getMany: jest.Mock;
  };

  beforeEach(async () => {
    storage = {
      putObject: jest.fn().mockResolvedValue({
        bucket: 'file-converter-dev',
        key: 'uploads/key',
      }),
    };
    accessService = {
      canAccess: jest.fn(),
    };
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    filesRepository = {
      save: jest.fn(),
      create: jest.fn((value: unknown) => value),
      findOneOrFail: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: StorageService, useValue: storage },
        { provide: AccessService, useValue: accessService },
        { provide: getRepositoryToken(FileEntity), useValue: filesRepository },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('uploads a file to storage and persists metadata', async () => {
    const body = Buffer.from('hello');
    const createdAt = new Date('2026-01-01T00:00:00.000Z');

    filesRepository.save.mockImplementation((entity: { id: string }) =>
      Promise.resolve(entity),
    );
    filesRepository.findOneOrFail.mockImplementation(
      ({ where: { id } }: { where: { id: string } }) =>
        Promise.resolve({
          id,
          userId: actorId,
          originalName: 'weird_name.txt',
          storageKey: `uploads/${actorId}/${id}/weird_name.txt`,
          contentType: 'text/plain',
          sizeBytes: 5,
          createdAt,
          user: { email: 'user@example.com' },
        }),
    );

    const result = await service.upload(actorId, {
      filename: '../../weird name.txt',
      mimetype: 'text/plain',
      toBuffer: () => Promise.resolve(body),
    });

    expect(result.originalName).toBe('weird_name.txt');
    expect(result.contentType).toBe('text/plain');
    expect(result.sizeBytes).toBe(5);
    expect(result.createdAt).toEqual(createdAt);
    expect(result.userId).toBe(actorId);
    expect(result.publisherEmail).toBe('user@example.com');
    expect(result.id).toHaveLength(36);

    expect(storage.putObject).toHaveBeenCalledWith({
      key: `uploads/${actorId}/${result.id}/weird_name.txt`,
      body,
      contentType: 'text/plain',
    });
  });

  it('lists every file for an admin when no user filter is set', async () => {
    accessService.canAccess.mockResolvedValue(true);
    queryBuilder.getMany.mockResolvedValue([
      {
        id: 'file-1',
        originalName: 'a.txt',
        contentType: 'text/plain',
        sizeBytes: 1,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        userId: otherUserId,
        user: { email: 'other@example.com' },
      },
    ]);

    await expect(service.listFiles(actorId)).resolves.toEqual([
      {
        id: 'file-1',
        originalName: 'a.txt',
        contentType: 'text/plain',
        sizeBytes: 1,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        userId: otherUserId,
        publisherEmail: 'other@example.com',
      },
    ]);

    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
  });

  it('lists only the current user files when the actor is not an admin', async () => {
    accessService.canAccess.mockResolvedValue(false);
    queryBuilder.getMany.mockResolvedValue([]);

    await service.listFiles(actorId);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'file.userId = :ownerId',
      { ownerId: actorId },
    );
  });

  it('forbids a non-admin from listing another user files', async () => {
    accessService.canAccess.mockResolvedValue(false);

    await expect(
      service.listFiles(actorId, otherUserId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
