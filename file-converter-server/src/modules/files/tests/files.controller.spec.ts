import { BadRequestException } from '@nestjs/common';

import { AuthenticatedRequest } from '@/modules/auth/types/authenticated-request';

import { FilesController } from '../controllers/files.controller';
import { FilesService } from '../services/files.service';

describe('FilesController', () => {
  const userId = '11111111-1111-1111-1111-111111111111';

  it('stores an uploaded file for the authenticated user', async () => {
    const stored = {
      success: true as const,
      bucket: 'file-converter-dev',
      key: `test-uploads/${userId}/1-sample.txt`,
      originalName: 'sample.txt',
    };
    const storeTestUpload = jest.fn().mockResolvedValue(stored);
    const filesService = { storeTestUpload } as unknown as FilesService;

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

    await expect(controller.testUpload(request)).resolves.toEqual(stored);
    expect(storeTestUpload).toHaveBeenCalledWith(userId, file);
  });

  it('rejects requests without a file', async () => {
    const storeTestUpload = jest.fn();
    const filesService = { storeTestUpload } as unknown as FilesService;
    const request = {
      user: { id: userId, email: 'user@example.com' },
      file: jest.fn().mockResolvedValue(undefined),
    } as unknown as AuthenticatedRequest;

    const controller = new FilesController(filesService);

    await expect(controller.testUpload(request)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(storeTestUpload).not.toHaveBeenCalled();
  });
});
