import { CONVERT_ERROR_CODES } from '../errors/convert.errors';
import { ConvertService } from '../services/convert.service';
import { FormatDetectorService } from '../services/format-detector.service';

describe('ConvertService', () => {
  const service = new ConvertService(new FormatDetectorService());

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
});
