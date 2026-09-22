import { FASTIFY_FILE_TOO_LARGE_CODE } from '@/core/http/http.constants';
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

  it('returns the formats catalog from the service', () => {
    const catalog = [
      { source: 'csv' as const, target: ['json', 'xml', 'yaml'] as const },
    ];
    const listFormats = jest.fn().mockReturnValue(catalog);
    const convertService = { listFormats } as unknown as ConvertService;
    const controller = new ConvertController(convertService);

    expect(controller.getFormats()).toEqual(catalog);
    expect(listFormats).toHaveBeenCalled();
  });

  it('maps Fastify request-file-too-large from request.file to 413', async () => {
    const convert = jest.fn();
    const convertService = { convert } as unknown as ConvertService;
    const error = Object.assign(new Error('request file too large'), {
      code: FASTIFY_FILE_TOO_LARGE_CODE,
      statusCode: 413,
    });
    const request = {
      user: { id: userId, email: 'user@example.com' },
      file: jest.fn().mockRejectedValue(error),
    } as unknown as Request & AuthenticatedRequest;

    const controller = new ConvertController(convertService);

    await expect(controller.convert(request)).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.FILE_TOO_LARGE },
      status: 413,
    });
    expect(convert).not.toHaveBeenCalled();
  });
});
