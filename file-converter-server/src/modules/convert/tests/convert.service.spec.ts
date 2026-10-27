import { readFile, rm } from 'node:fs/promises';
import { Readable } from 'node:stream';

import { ConfigService } from '@/core/config/config.service';
import { FASTIFY_FILE_TOO_LARGE_CODE } from '@/core/http/http.constants';
import { TransformationHistoryService } from '@/modules/transformations/services/transformation-history.service';

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

function upload(
  body: Buffer,
  filename: string,
  mimetype: string,
  fields: Record<string, { value: string }>,
  onRead?: () => void,
) {
  return {
    filename,
    mimetype,
    fields,
    file: new Readable({
      read() {
        onRead?.();
        this.push(body);
        this.push(null);
      },
    }),
  };
}

async function readOutput(result: { outputPath: string }): Promise<string> {
  try {
    return await readFile(result.outputPath, 'utf8');
  } finally {
    await rm(result.outputPath, { force: true });
  }
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

  it('spools the upload and passes a file path to the worker', async () => {
    const run = jest.fn(
      async (job: { sourcePath: string; kind: string; text?: string }) => {
        const text = await readFile(job.sourcePath, 'utf8');

        expect(text).toBe('{"name":"Ada"}');
        expect(job.kind).toBe('text');
        expect(job.text).toBeUndefined();

        return {
          outputPath: job.sourcePath,
          size: text.length,
          contentType: 'application/xml; charset=utf-8',
          fileName: 'converted.xml',
        };
      },
    );
    const pooled = new ConvertService(
      new FormatDetectorService(),
      configWithLimits(),
      { run },
    );
    const fields: Record<string, { value: string }> = {};
    const result = await pooled.convert(
      upload(
        Buffer.from('{"name":"Ada"}'),
        'sample.json',
        'application/json',
        fields,
        () => {
          fields.targetFormat = { value: 'xml' };
        },
      ),
    );

    expect(result).toMatchObject({
      contentType: 'application/xml; charset=utf-8',
      fileName: 'converted.xml',
    });
    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({ sourcePath: expect.any(String) as string }),
    );
  });

  it('converts JSON to XML from the spooled file', async () => {
    const result = await service.convert(
      upload(Buffer.from('{"name":"Ada"}'), 'sample.json', 'application/json', {
        targetFormat: { value: 'xml' },
      }),
    );

    expect(result).toMatchObject({
      contentType: 'application/xml; charset=utf-8',
      fileName: 'converted.xml',
    });
    await expect(readOutput(result as { outputPath: string })).resolves.toBe(
      '<root><name>Ada</name></root>',
    );
  });

  it('rejects a missing or unknown targetFormat', async () => {
    const part = upload(Buffer.from('{}'), 'sample.json', 'application/json', {
      targetFormat: { value: 'pdf' },
    });

    await expect(service.convert(part)).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.INVALID_TARGET_FORMAT },
    });
  });

  it('rejects an empty file after targetFormat is valid', async () => {
    const part = upload(Buffer.alloc(0), 'empty.json', 'application/json', {
      targetFormat: { value: 'csv' },
    });

    await expect(service.convert(part)).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.FILE_EMPTY },
    });
  });

  it('rejects converting a format to itself', async () => {
    const part = upload(Buffer.from('{}'), 'sample.json', 'application/json', {
      targetFormat: { value: 'json' },
    });

    await expect(service.convert(part)).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.PAIR_NOT_ALLOWED },
    });
  });

  it('rejects a file larger than CONVERT_MAX_UPLOAD_<source>_BYTES after detect', async () => {
    const limited = new ConvertService(
      new FormatDetectorService(),
      configWithLimits({ CONVERT_MAX_UPLOAD_JSON_BYTES: 1 }),
    );
    const part = upload(Buffer.from('{}'), 'sample.json', 'application/json', {
      targetFormat: { value: 'csv' },
    });

    await expect(limited.convert(part)).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.FILE_TOO_LARGE },
      status: 413,
    });
  });

  it('maps Fastify request-file-too-large from the upload stream to 413', async () => {
    const error = Object.assign(new Error('request file too large'), {
      code: FASTIFY_FILE_TOO_LARGE_CODE,
      statusCode: 413,
    });
    const part = {
      filename: 'sample.json',
      mimetype: 'application/json',
      fields: { targetFormat: { value: 'csv' } },
      file: new Readable({
        read() {
          this.destroy(error);
        },
      }),
    };

    await expect(service.convert(part)).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.FILE_TOO_LARGE },
      status: 413,
    });
  });

  it('accepts a UTF-8 BOM and strips it before detect', async () => {
    const json = Buffer.from('{"name":"Ada"}');
    const result = await service.convert(
      upload(
        Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), json]),
        'sample.json',
        'application/json',
        { targetFormat: { value: 'xml' } },
      ),
    );

    expect(result).toMatchObject({
      contentType: 'application/xml; charset=utf-8',
      fileName: 'converted.xml',
    });
    await expect(readOutput(result as { outputPath: string })).resolves.toBe(
      '<root><name>Ada</name></root>',
    );
  });

  it('rejects a BOM-only file as empty', async () => {
    const part = upload(
      Buffer.from([0xef, 0xbb, 0xbf]),
      'empty.json',
      'application/json',
      { targetFormat: { value: 'csv' } },
    );

    await expect(service.convert(part)).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.FILE_EMPTY },
    });
  });

  it('converts CSV to a JSON attachment', async () => {
    const result = await service.convert(
      upload(Buffer.from('name,age\nAda,36\n'), 'people.csv', 'text/csv', {
        targetFormat: { value: 'json' },
      }),
    );

    expect(result).toMatchObject({
      contentType: 'application/json; charset=utf-8',
      fileName: 'converted.json',
    });
    await expect(readOutput(result as { outputPath: string })).resolves.toBe(
      '[{"name":"Ada","age":"36"}]',
    );
  });

  it('converts JSON to a CSV attachment', async () => {
    const result = await service.convert(
      upload(
        Buffer.from('[{"name":"Ada","age":36}]'),
        'people.json',
        'application/json',
        { targetFormat: { value: 'csv' } },
      ),
    );

    expect(result).toMatchObject({
      contentType: 'text/csv; charset=utf-8',
      fileName: 'converted.csv',
    });
    await expect(readOutput(result as { outputPath: string })).resolves.toBe(
      '"name","age"\n"Ada","36"\n',
    );
  });

  it('rejects a missing file', async () => {
    await expect(service.convert(null)).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.FILE_REQUIRED },
    });
  });

  it('rejects an invalid save flag', async () => {
    const part = upload(Buffer.from('{}'), 'sample.json', 'application/json', {
      targetFormat: { value: 'csv' },
      save: { value: 'yes' },
    });

    await expect(service.convert(part)).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.INVALID_SAVE },
    });
  });

  it('fails with CONVERSION_TIMEOUT when conversion does not finish', async () => {
    const limited = new ConvertService(
      new FormatDetectorService(),
      configWithLimits({ CONVERT_TIMEOUT_MS: 20 }),
      { run: () => new Promise(() => undefined) },
    );
    const part = upload(
      Buffer.from('{"name":"Ada"}'),
      'sample.json',
      'application/json',
      { targetFormat: { value: 'xml' } },
    );

    await expect(limited.convert(part)).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.CONVERSION_TIMEOUT },
      status: 408,
    });
  });

  it('records a successful conversion and still returns the file when save is requested', async () => {
    const record = jest.fn(async (input: { bodyPath?: string }) => {
      if (input.bodyPath) {
        await rm(input.bodyPath, { force: true });
      }
    });
    const history = { record } as unknown as TransformationHistoryService;
    const recording = new ConvertService(
      new FormatDetectorService(),
      configWithLimits(),
      undefined,
      history,
    );

    const result = await recording.convert(
      upload(Buffer.from('{"name":"Ada"}'), 'sample.json', 'application/json', {
        targetFormat: { value: 'xml' },
        save: { value: 'true' },
      }),
      { userId: '11111111-1111-1111-1111-111111111111' },
    );

    expect(result).toMatchObject({ fileName: 'converted.xml' });
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '11111111-1111-1111-1111-111111111111',
        type: 'file',
        sourceFormat: 'json',
        targetFormat: 'xml',
        status: 'success',
        save: true,
        bodyPath: expect.any(String) as string,
      }),
    );
    await rm((result as { outputPath: string }).outputPath, { force: true });
  });

  it('rejects invalid UTF-8 before detect', async () => {
    const part = upload(
      Buffer.from([0xff, 0xfe, 0x00]),
      'sample.json',
      'application/json',
      { targetFormat: { value: 'csv' } },
    );

    await expect(service.convert(part)).rejects.toMatchObject({
      response: { code: CONVERT_ERROR_CODES.INVALID_ENCODING },
    });
  });
});
