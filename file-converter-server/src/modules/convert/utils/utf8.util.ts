import {
  CONVERT_ERROR_CODES,
  throwConvertError,
} from '../errors/convert.errors';

export const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

export function stripUtf8Bom(body: Buffer): Buffer {
  if (
    body.length >= UTF8_BOM.length &&
    body.subarray(0, UTF8_BOM.length).equals(UTF8_BOM)
  ) {
    return body.subarray(UTF8_BOM.length);
  }

  return body;
}

export function decodeUtf8(body: Buffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(stripUtf8Bom(body));
  } catch {
    throwConvertError(CONVERT_ERROR_CODES.INVALID_ENCODING);
  }
}
