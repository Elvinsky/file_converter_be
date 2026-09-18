import { BadRequestException } from '@nestjs/common';

import { AuthenticatedRequest } from '@/modules/auth/types/authenticated-request';

import { FilesController } from '../controllers/files.controller';
import { FilesService } from '../services/files.service';

describe('FilesController', () => {
  const userId = '11111111-1111-1111-1111-111111111111';

  it('uploads a file for the authenticated user', async () => {
    const stored = {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      originalName: 'sample.txt',
      contentType: 'text/plain',
      sizeBytes: 5,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      userId,
      publisherEmail: 'user@example.com',
    };
    const upload = jest.fn().mockResolvedValue(stored);
    const filesService = { upload } as unknown as FilesService;

    const file = {
      filename: 'sample.txt',
      mimetype: 'text/plain',
      toBuffer: () => Promise.resolve(Buffer.from('hello')),
    };
    const request = {
      user: { id: userId, email: 'user@example.com' },
      file: jest.fn().mockResolvedValue(file),
    } as unknown as AuthenticatedRequest;

    const controller = new FilesController(filesService);

    await expect(controller.upload(request)).resolves.toEqual(stored);
    expect(upload).toHaveBeenCalledWith(userId, file);
  });

  it('rejects upload requests without a file', async () => {
    const upload = jest.fn();
    const filesService = { upload } as unknown as FilesService;
    const request = {
      user: { id: userId, email: 'user@example.com' },
      file: jest.fn().mockResolvedValue(undefined),
    } as unknown as AuthenticatedRequest;

    const controller = new FilesController(filesService);

    await expect(controller.upload(request)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(upload).not.toHaveBeenCalled();
  });

  it('lists files for the current user or a requested publisher', async () => {
    const listFiles = jest.fn().mockResolvedValue([]);
    const filesService = { listFiles } as unknown as FilesService;
    const request = {
      user: { id: userId, email: 'user@example.com' },
    } as unknown as AuthenticatedRequest;

    const controller = new FilesController(filesService);

    await controller.getFiles(request, { userId });
    expect(listFiles).toHaveBeenCalledWith(userId, userId);
  });

  it('lists files for a specific user', async () => {
    const listFiles = jest.fn().mockResolvedValue([]);
    const filesService = { listFiles } as unknown as FilesService;
    const request = {
      user: { id: userId, email: 'user@example.com' },
    } as unknown as AuthenticatedRequest;

    const controller = new FilesController(filesService);
    const targetUserId = '22222222-2222-2222-2222-222222222222';

    await controller.getFilesForUser(request, targetUserId);
    expect(listFiles).toHaveBeenCalledWith(userId, targetUserId);
  });
});
