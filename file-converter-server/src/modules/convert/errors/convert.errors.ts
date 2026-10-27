import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  PayloadTooLargeException,
  RequestTimeoutException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';

import { isFastifyFileTooLarge } from '@/core/http/http.utils';

export const CONVERT_ERROR_CODES = {
  FILE_REQUIRED: 'FILE_REQUIRED',
  FILE_EMPTY: 'FILE_EMPTY',
  INVALID_TARGET_FORMAT: 'INVALID_TARGET_FORMAT',
  UNSUPPORTED_SOURCE_FORMAT: 'UNSUPPORTED_SOURCE_FORMAT',
  FORMAT_CONFLICT: 'FORMAT_CONFLICT',
  PAIR_NOT_ALLOWED: 'PAIR_NOT_ALLOWED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_SYNTAX: 'INVALID_SYNTAX',
  INVALID_ENCODING: 'INVALID_ENCODING',
  CONVERSION_AMBIGUOUS: 'CONVERSION_AMBIGUOUS',
  LIMIT_DEPTH: 'LIMIT_DEPTH',
  LIMIT_KEYS: 'LIMIT_KEYS',
  LIMIT_NODES: 'LIMIT_NODES',
  LIMIT_ROWS: 'LIMIT_ROWS',
  CONVERSION_TIMEOUT: 'CONVERSION_TIMEOUT',
  IMAGE_NOT_IMPLEMENTED: 'IMAGE_NOT_IMPLEMENTED',
  LIMIT_IMAGE_DIMENSION: 'LIMIT_IMAGE_DIMENSION',
  LIMIT_IMAGE_PIXELS: 'LIMIT_IMAGE_PIXELS',
  INVALID_SAVE: 'INVALID_SAVE',
  INVALID_OPTIONS: 'INVALID_OPTIONS',
  INVALID_IMAGE: 'INVALID_IMAGE',
  UNSAFE_SVG: 'UNSAFE_SVG',
  CONVERT_INTERNAL: 'CONVERT_INTERNAL',
} as const;

export type ConvertErrorCode =
  (typeof CONVERT_ERROR_CODES)[keyof typeof CONVERT_ERROR_CODES];

const DEFAULT_MESSAGES: Record<ConvertErrorCode, string> = {
  FILE_REQUIRED: 'File is required',
  FILE_EMPTY: 'File must not be empty',
  INVALID_TARGET_FORMAT: 'targetFormat is invalid',
  UNSUPPORTED_SOURCE_FORMAT: 'Source format is not supported',
  FORMAT_CONFLICT: 'Filename, Content-Type, and file content do not agree',
  PAIR_NOT_ALLOWED: 'Conversion pair is not supported',
  FILE_TOO_LARGE: 'File exceeds the size limit for its format',
  INVALID_SYNTAX: 'File could not be parsed',
  INVALID_ENCODING: 'File must be UTF-8',
  CONVERSION_AMBIGUOUS:
    'Document cannot be converted to the target format unambiguously',
  LIMIT_DEPTH: 'Document exceeds maximum nesting depth',
  LIMIT_KEYS: 'Document exceeds maximum key count',
  LIMIT_NODES: 'Document exceeds maximum node count',
  LIMIT_ROWS: 'CSV exceeds maximum row count',
  CONVERSION_TIMEOUT: 'Conversion timed out',
  IMAGE_NOT_IMPLEMENTED: 'Image conversion is not implemented',
  LIMIT_IMAGE_DIMENSION: 'Image exceeds maximum width or height',
  LIMIT_IMAGE_PIXELS: 'Image exceeds maximum pixel count',
  INVALID_SAVE: 'save must be true or false',
  INVALID_OPTIONS: 'Image options are invalid',
  INVALID_IMAGE: 'Image could not be read',
  UNSAFE_SVG: 'SVG contains unsafe content',
  CONVERT_INTERNAL: 'Conversion failed',
};

export type ConvertErrorBody = {
  code: ConvertErrorCode;
  message: string;
};

function toBody(code: ConvertErrorCode, message?: string): ConvertErrorBody {
  return {
    code,
    message: message ?? DEFAULT_MESSAGES[code],
  };
}

export function convertException(
  code: ConvertErrorCode,
  message?: string,
): HttpException {
  const body = toBody(code, message);

  switch (code) {
    case CONVERT_ERROR_CODES.FILE_TOO_LARGE:
      return new PayloadTooLargeException(body);
    case CONVERT_ERROR_CODES.UNSUPPORTED_SOURCE_FORMAT:
    case CONVERT_ERROR_CODES.FORMAT_CONFLICT:
      return new UnsupportedMediaTypeException(body);
    case CONVERT_ERROR_CODES.CONVERT_INTERNAL:
      return new InternalServerErrorException(body);
    case CONVERT_ERROR_CODES.CONVERSION_TIMEOUT:
      return new RequestTimeoutException(body);
    default:
      return new BadRequestException(body);
  }
}

export function readConvertErrorCode(error: unknown): string {
  if (error instanceof HttpException) {
    const response = error.getResponse();

    if (
      typeof response === 'object' &&
      response !== null &&
      'code' in response &&
      typeof response.code === 'string'
    ) {
      return response.code;
    }
  }

  return CONVERT_ERROR_CODES.CONVERT_INTERNAL;
}

export function isConvertErrorCode(code: string): code is ConvertErrorCode {
  return Object.values(CONVERT_ERROR_CODES).includes(code as ConvertErrorCode);
}

export function throwConvertError(
  code: ConvertErrorCode,
  message?: string,
): never {
  throw convertException(code, message);
}

export async function mapFastifyFileTooLarge<T>(
  run: () => Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (isFastifyFileTooLarge(error)) {
      throwConvertError(CONVERT_ERROR_CODES.FILE_TOO_LARGE);
    }

    throw error;
  }
}
