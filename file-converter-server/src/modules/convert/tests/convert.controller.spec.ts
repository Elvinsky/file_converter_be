import { AuthenticatedRequest } from '@/modules/auth/types/authenticated-request';

import { ConvertController } from '../controllers/convert.controller';
import { CONVERT_ERROR_CODES } from '../errors/convert.errors';
import { ConvertService } from '../services/convert.service';

describe('ConvertController', () => {
  const userId = '11111111-1111-1111-1111-111111111111';

  it('passes the file part to the service', async () => {
    const stub = {
      accepted: true as const,
      sourceFormat: 'json' as const,
      targetFormat: 'csv' as const,
      bytes: 2,
      originalName: 'sample.json',
    };
    const convert = jest.fn().mockResolvedValue(stub);
    const convertService = { convert } as unknown as ConvertService;

    const part = {
      fieldname: 'file',
      filename: 'sample.json',
      mimetype: 'application/json',
      toBuffer: () => Promise.resolve(Buffer.from('{}')),
      fields: { targetFormat: { value: 'csv' } },
    };
    const request = {
      user: { id: userId, email: 'user@example.com' },
      file: jest.fn().mockResolvedValue(part),
    } as unknown as Request & AuthenticatedRequest;

    const controller = new ConvertController(convertService);

    await expect(controller.convert(request)).resolves.toEqual(stub);
    expect(convert).toHaveBeenCalledWith(part);
  });

  it('rejects convert requests without a file part named file', async () => {
    const convert = jest.fn();
    const convertService = { convert } as unknown as ConvertService;
    const request = {
      user: { id: userId, email: 'user@example.com' },
      file: jest.fn().mockResolvedValue(undefined),
    } as unknown as Request & AuthenticatedRequest;

    const controller = new ConvertController(convertService);

    await expect(controller.convert(request)).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.FILE_REQUIRED },
    });
    expect(convert).not.toHaveBeenCalled();
  });
});
