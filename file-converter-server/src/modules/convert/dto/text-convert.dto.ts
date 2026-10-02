import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import { CONVERT_ERROR_CODES } from '../errors/convert.errors';

export enum TargetFormat {
  CSV = 'csv',
  JSON = 'json',
  XML = 'xml',
  YAML = 'yaml',
}

export const TEXT_FORMAT_OUTPUT: Record<
  TargetFormat,
  { contentType: string; fileName: string }
> = {
  [TargetFormat.CSV]: {
    contentType: 'text/csv; charset=utf-8',
    fileName: 'converted.csv',
  },
  [TargetFormat.JSON]: {
    contentType: 'application/json; charset=utf-8',
    fileName: 'converted.json',
  },
  [TargetFormat.XML]: {
    contentType: 'application/xml; charset=utf-8',
    fileName: 'converted.xml',
  },
  [TargetFormat.YAML]: {
    contentType: 'application/yaml; charset=utf-8',
    fileName: 'converted.yaml',
  },
};

export class TextConvertUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description:
      'Source text file. Multipart field name must be `file`. UTF-8 required; a leading BOM is stripped. Size must not exceed the cap for the detected source format.',
  })
  file: unknown;

  @ApiProperty({
    enum: TargetFormat,
    example: TargetFormat.JSON,
    description:
      'Output format. Same-format conversion is not supported (csv, json, xml, yaml).',
  })
  @IsEnum(TargetFormat)
  @IsNotEmpty()
  targetFormat: TargetFormat;
}

export class TextConvertFormatPairDto {
  @ApiProperty({
    enum: TargetFormat,
    example: TargetFormat.CSV,
    description: 'Source format.',
  })
  source: TargetFormat;

  @ApiProperty({
    enum: TargetFormat,
    isArray: true,
    example: [TargetFormat.JSON, TargetFormat.XML, TargetFormat.YAML],
    description: 'Allowed conversion targets for this source.',
  })
  target: TargetFormat[];
}

export type TextConvertJobDto = {
  userId: string;
  originalName: string;
  mimeType: string;
  targetFormat: TargetFormat;
  body: Buffer;
};

export type TextConvertResultDto = {
  body: Buffer;
  contentType: string;
  fileName: string;
};

/** Codes this text endpoint can return. Image codes stay off the contract. */
export const TEXT_CONVERT_ERROR_CODES = [
  CONVERT_ERROR_CODES.FILE_REQUIRED,
  CONVERT_ERROR_CODES.FILE_EMPTY,
  CONVERT_ERROR_CODES.INVALID_TARGET_FORMAT,
  CONVERT_ERROR_CODES.PAIR_NOT_ALLOWED,
  CONVERT_ERROR_CODES.INVALID_SYNTAX,
  CONVERT_ERROR_CODES.INVALID_ENCODING,
  CONVERT_ERROR_CODES.CONVERSION_AMBIGUOUS,
  CONVERT_ERROR_CODES.LIMIT_DEPTH,
  CONVERT_ERROR_CODES.LIMIT_KEYS,
  CONVERT_ERROR_CODES.LIMIT_ROWS,
  CONVERT_ERROR_CODES.FILE_TOO_LARGE,
  CONVERT_ERROR_CODES.UNSUPPORTED_SOURCE_FORMAT,
  CONVERT_ERROR_CODES.FORMAT_CONFLICT,
  CONVERT_ERROR_CODES.CONVERT_INTERNAL,
] as const;

export class TextConvertErrorDto {
  @ApiProperty({
    enum: TEXT_CONVERT_ERROR_CODES,
    example: CONVERT_ERROR_CODES.INVALID_SYNTAX,
    description: 'Stable machine-readable error code.',
  })
  code: (typeof TEXT_CONVERT_ERROR_CODES)[number];

  @ApiProperty({
    example: 'File could not be parsed',
    description: 'Human-readable explanation of `code`.',
  })
  message: string;
}

export const TEXT_CONVERT_RESPONSE_CONTENT = Object.fromEntries(
  Object.values(TEXT_FORMAT_OUTPUT).map((output) => [
    output.contentType,
    {
      schema: {
        type: 'string',
        format: 'binary',
      },
    },
  ]),
);
