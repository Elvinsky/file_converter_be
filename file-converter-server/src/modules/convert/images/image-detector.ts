import {
  CONVERT_ERROR_CODES,
  throwConvertError,
} from '../errors/convert.errors';
import { decodeUtf8, stripUtf8Bom } from '../utils/utf8.util';

import { ImageSourceFormat, isImageSourceFormat } from './image-graph';

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const EXTENSIONS: Record<string, ImageSourceFormat> = {
  png: 'png',
  jpg: 'jpeg',
  jpeg: 'jpeg',
  svg: 'svg',
};

const MIME_TYPES: Record<string, ImageSourceFormat> = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/svg+xml': 'svg',
  'text/xml': 'svg',
  'application/xml': 'svg',
};

export function detectImageFormat(input: {
  filename: string;
  mimeType: string;
  body: Buffer;
}): ImageSourceFormat {
  const fromName = formatFromName(input.filename);
  const fromMime = formatFromMime(input.mimeType);
  const fromBody = formatFromBody(input.body);
  const detected = [fromName, fromMime, fromBody].filter(
    (value): value is ImageSourceFormat => value !== undefined,
  );

  if (detected.length === 0 || !fromBody) {
    throwConvertError(CONVERT_ERROR_CODES.UNSUPPORTED_SOURCE_FORMAT);
  }

  const unique = new Set(detected);

  if (unique.size > 1) {
    throwConvertError(CONVERT_ERROR_CODES.FORMAT_CONFLICT);
  }

  return fromBody;
}

function formatFromName(filename: string): ImageSourceFormat | undefined {
  const extension = filename.split('.').pop()?.toLowerCase() ?? '';
  const format = EXTENSIONS[extension];

  return format && isImageSourceFormat(format) ? format : undefined;
}

function formatFromMime(mimeType: string): ImageSourceFormat | undefined {
  const normalized = mimeType.split(';')[0]?.trim().toLowerCase() ?? '';

  if (!normalized || normalized === 'application/octet-stream') {
    return undefined;
  }

  return MIME_TYPES[normalized];
}

function formatFromBody(body: Buffer): ImageSourceFormat | undefined {
  if (
    body.length >= PNG_SIGNATURE.length &&
    body.subarray(0, 8).equals(PNG_SIGNATURE)
  ) {
    return 'png';
  }

  if (
    body.length >= 3 &&
    body[0] === 0xff &&
    body[1] === 0xd8 &&
    body[2] === 0xff
  ) {
    return 'jpeg';
  }

  return sniffSvg(body);
}

function sniffSvg(body: Buffer): ImageSourceFormat | undefined {
  let text: string;

  try {
    text = decodeUtf8(stripUtf8Bom(body)).trimStart();
  } catch {
    return undefined;
  }

  const withoutDeclaration = text
    .replace(/^<\?xml[\s\S]*?\?>/i, '')
    .replace(/^<!DOCTYPE[\s\S]*?>/i, '')
    .trimStart();

  if (/^<svg[\s>]/i.test(withoutDeclaration)) {
    return 'svg';
  }

  return undefined;
}
