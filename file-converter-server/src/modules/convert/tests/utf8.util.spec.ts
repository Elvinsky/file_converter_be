import { CONVERT_ERROR_CODES } from '../errors/convert.errors';
import { UTF8_BOM, decodeUtf8, stripUtf8Bom } from '../utils/utf8.util';

describe('utf8.util', () => {
  it('strips a leading UTF-8 BOM and leaves other bytes unchanged', () => {
    const json = Buffer.from('{}');

    expect(stripUtf8Bom(Buffer.concat([UTF8_BOM, json]))).toEqual(json);
    expect(stripUtf8Bom(json)).toEqual(json);
  });

  it('decodes valid UTF-8 after BOM strip', () => {
    expect(decodeUtf8(Buffer.from('café'))).toBe('café');
    expect(decodeUtf8(Buffer.concat([UTF8_BOM, Buffer.from('{}')]))).toBe('{}');
  });

  it('rejects invalid UTF-8 with INVALID_ENCODING', () => {
    try {
      decodeUtf8(Buffer.from([0xff, 0xfe]));
      throw new Error('expected INVALID_ENCODING');
    } catch (error) {
      expect(error).toMatchObject({
        response: { code: CONVERT_ERROR_CODES.INVALID_ENCODING },
      });
    }
  });
});
