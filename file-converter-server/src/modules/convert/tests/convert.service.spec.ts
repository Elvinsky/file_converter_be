import { ConfigService } from '@/core/config/config.service';
import { FASTIFY_FILE_TOO_LARGE_CODE } from '@/core/http/http.constants';

import { CONVERT_ERROR_CODES } from '../errors/convert.errors';
import { ConvertService } from '../services/convert.service';
import { FormatDetectorService } from '../services/format-detector.service';

const DEFAULT_UPLOAD_LIMIT = 10485760;

function configWithLimits(
  limits: Partial<Record<string, number>> = {},
): ConfigService {
  return {
    get: (key: string) => limits[key] ?? DEFAULT_UPLOAD_LIMIT,
  } as ConfigService;
}

describe('ConvertService', () => {
  const service = new ConvertService(
    new FormatDetectorService(),
    configWithLimits(),
  );

  it('lists all twelve allowed conversion pairs grouped by source', () => {
    const catalog = service.listFormats();
    const pairCount = catalog.reduce(
      (count, item) => count + item.target.length,
      0,
    );

    expect(catalog).toEqual([
      { source: 'csv', target: ['json', 'xml', 'yaml'] },
      { source: 'json', target: ['csv', 'xml', 'yaml'] },
      { source: 'xml', target: ['csv', 'json', 'yaml'] },
      { source: 'yaml', target: ['csv', 'json', 'xml'] },
    ]);
    expect(pairCount).toBe(12);
  });

  it('reads targetFormat before buffering and returns an acceptance stub', async () => {
    const toBuffer = jest.fn().mockResolvedValue(Buffer.from('{}'));
    const part = {
      filename: 'sample.json',
      mimetype: 'application/json',
      toBuffer,
      fields: { targetFormat: { value: 'csv' } },
    };

    await expect(service.convert(part)).resolves.toEqual({
      accepted: true,
      sourceFormat: 'json',
      targetFormat: 'csv',
      bytes: 2,
      originalName: 'sample.json',
    });
    expect(toBuffer).toHaveBeenCalled();
  });

  it('rejects a missing or unknown targetFormat without consuming the stream', async () => {
    const toBuffer = jest.fn();
    const part = {
      filename: 'sample.json',
      mimetype: 'application/json',
      toBuffer,
      fields: { targetFormat: { value: 'pdf' } },
    };

    await expect(service.convert(part)).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.INVALID_TARGET_FORMAT },
    });
    expect(toBuffer).not.toHaveBeenCalled();
  });

  it('rejects an empty file after targetFormat is valid', async () => {
    const part = {
      filename: 'empty.json',
      mimetype: 'application/json',
      toBuffer: () => Promise.resolve(Buffer.alloc(0)),
      fields: { targetFormat: { value: 'csv' } },
    };

    await expect(service.convert(part)).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.FILE_EMPTY },
    });
  });

  it('rejects converting a format to itself', async () => {
    const part = {
      filename: 'sample.json',
      mimetype: 'application/json',
      toBuffer: () => Promise.resolve(Buffer.from('{}')),
      fields: { targetFormat: { value: 'json' } },
    };

    await expect(service.convert(part)).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.PAIR_NOT_ALLOWED },
    });
  });

  it('rejects a file larger than CONVERT_MAX_UPLOAD_<source>_BYTES after detect', async () => {
    const limited = new ConvertService(
      new FormatDetectorService(),
      configWithLimits({ CONVERT_MAX_UPLOAD_JSON_BYTES: 1 }),
    );
    const part = {
      filename: 'sample.json',
      mimetype: 'application/json',
      toBuffer: () => Promise.resolve(Buffer.from('{}')),
      fields: { targetFormat: { value: 'csv' } },
    };

    await expect(limited.convert(part)).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.FILE_TOO_LARGE },
      status: 413,
    });
  });

  it('maps Fastify request-file-too-large from toBuffer to 413', async () => {
    const error = Object.assign(new Error('request file too large'), {
      code: FASTIFY_FILE_TOO_LARGE_CODE,
      statusCode: 413,
    });
    const part = {
      filename: 'sample.json',
      mimetype: 'application/json',
      toBuffer: () => Promise.reject(error),
      fields: { targetFormat: { value: 'csv' } },
    };

    await expect(service.convert(part)).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.FILE_TOO_LARGE },
      status: 413,
    });
  });

  it('accepts a UTF-8 BOM and strips it before detect', async () => {
    const json = Buffer.from('{}');
    const part = {
      filename: 'sample.json',
      mimetype: 'application/json',
      toBuffer: () =>
        Promise.resolve(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), json])),
      fields: { targetFormat: { value: 'csv' } },
    };

    await expect(service.convert(part)).resolves.toEqual({
      accepted: true,
      sourceFormat: 'json',
      targetFormat: 'csv',
      bytes: 5,
      originalName: 'sample.json',
    });
  });

  it('rejects a BOM-only file as empty', async () => {
    const part = {
      filename: 'empty.json',
      mimetype: 'application/json',
      toBuffer: () => Promise.resolve(Buffer.from([0xef, 0xbb, 0xbf])),
      fields: { targetFormat: { value: 'csv' } },
    };

    await expect(service.convert(part)).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.FILE_EMPTY },
    });
  });

  it('rejects invalid UTF-8 before detect', async () => {
    const part = {
      filename: 'sample.json',
      mimetype: 'application/json',
      toBuffer: () => Promise.resolve(Buffer.from([0xff, 0xfe, 0x00])),
      fields: { targetFormat: { value: 'csv' } },
    };

    await expect(service.convert(part)).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.INVALID_ENCODING },
    });
  });
});
