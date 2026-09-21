import { CONVERT_ERROR_CODES } from '../errors/convert.errors';
import { FormatDetectorService } from '../services/format-detector.service';

function expectConvertCode(run: () => unknown, code: string) {
  try {
    run();
    throw new Error(`expected ${code}`);
  } catch (error) {
    expect(error).toMatchObject({ response: { code } });
  }
}

describe('FormatDetectorService', () => {
  const detector = new FormatDetectorService();

  it('detects json from extension, MIME, and object prefix', () => {
    expect(
      detector.detect({
        filename: 'data.json',
        mimeType: 'application/json',
        body: Buffer.from('{ "a": 1 }'),
      }),
    ).toBe('json');
  });

  it('conflicts when extension and MIME disagree', () => {
    expectConvertCode(
      () =>
        detector.detect({
          filename: 'data.csv',
          mimeType: 'application/json',
          body: Buffer.from('a,b\n1,2\n'),
        }),
      CONVERT_ERROR_CODES.FORMAT_CONFLICT,
    );
  });

  it('sniffs xml when there is no name and MIME is octet-stream', () => {
    expect(
      detector.detect({
        filename: '',
        mimeType: 'application/octet-stream',
        body: Buffer.from('<root/>'),
      }),
    ).toBe('xml');
  });

  it('maps .yml plus a yaml MIME to yaml', () => {
    expect(
      detector.detect({
        filename: 'config.yml',
        mimeType: 'application/x-yaml',
        body: Buffer.from('foo: bar\n'),
      }),
    ).toBe('yaml');
  });

  it('rejects random bytes with no hints as unsupported', () => {
    expectConvertCode(
      () =>
        detector.detect({
          filename: 'blob',
          mimeType: 'application/octet-stream',
          body: Buffer.from([0x00, 0x01, 0x02, 0xff, 0x80]),
        }),
      CONVERT_ERROR_CODES.UNSUPPORTED_SOURCE_FORMAT,
    );
  });

  it('conflicts when extension and MIME agree but sniff clearly disagrees', () => {
    expectConvertCode(
      () =>
        detector.detect({
          filename: 'data.json',
          mimeType: 'application/json',
          body: Buffer.from('<root/>'),
        }),
      CONVERT_ERROR_CODES.FORMAT_CONFLICT,
    );
  });

  it('does not invent yaml from a weak key-line sniff alone', () => {
    expectConvertCode(
      () =>
        detector.detect({
          filename: 'notes',
          mimeType: 'application/octet-stream',
          body: Buffer.from('foo: bar\n'),
        }),
      CONVERT_ERROR_CODES.UNSUPPORTED_SOURCE_FORMAT,
    );
  });
});
