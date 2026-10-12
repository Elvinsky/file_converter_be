import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { CONVERT_ERROR_CODES } from '../errors/convert.errors';

export enum ImageFormat {
  PNG = 'png',
  JPEG = 'jpeg',
  SVG = 'svg',
}

export class ImageConvertUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description:
      'Source image. Multipart field name must be `file`. PNG, JPEG, or SVG.',
  })
  file: unknown;

  @ApiProperty({
    enum: ImageFormat,
    example: ImageFormat.JPEG,
    description:
      'Output format. Allowed pairs: png→jpeg, jpeg→png, svg→png, svg→jpeg. png/jpeg→svg is never supported.',
  })
  @IsEnum(ImageFormat)
  @IsNotEmpty()
  targetFormat: ImageFormat;

  @ApiPropertyOptional({
    type: String,
    description:
      'Optional JSON object: `{ "quality"?: 1-100, "width"?: number, "height"?: number, "background"?: "#rrggbb" }`. Flat fields of the same names are also accepted. `quality` applies to JPEG output. `width`, `height`, and `background` apply when an SVG becomes a picture. Background defaults to `#ffffff`.',
  })
  @IsOptional()
  @IsString()
  options?: string;

  @ApiPropertyOptional({
    description:
      'Keep the converted file in storage. Defaults to false. Accepts true, false, "true", or "false".',
    example: 'false',
  })
  @IsOptional()
  @IsString()
  save?: string;
}

export class ImageConvertFormatPairDto {
  @ApiProperty({
    enum: ImageFormat,
    example: ImageFormat.PNG,
  })
  source: ImageFormat;

  @ApiProperty({
    enum: [ImageFormat.PNG, ImageFormat.JPEG],
    isArray: true,
    example: [ImageFormat.JPEG],
  })
  target: Array<'png' | 'jpeg'>;
}

export const IMAGE_CONVERT_ERROR_CODES = [
  CONVERT_ERROR_CODES.FILE_REQUIRED,
  CONVERT_ERROR_CODES.FILE_EMPTY,
  CONVERT_ERROR_CODES.INVALID_TARGET_FORMAT,
  CONVERT_ERROR_CODES.PAIR_NOT_ALLOWED,
  CONVERT_ERROR_CODES.INVALID_IMAGE,
  CONVERT_ERROR_CODES.UNSAFE_SVG,
  CONVERT_ERROR_CODES.INVALID_OPTIONS,
  CONVERT_ERROR_CODES.INVALID_SAVE,
  CONVERT_ERROR_CODES.LIMIT_IMAGE_DIMENSION,
  CONVERT_ERROR_CODES.LIMIT_IMAGE_PIXELS,
  CONVERT_ERROR_CODES.FILE_TOO_LARGE,
  CONVERT_ERROR_CODES.UNSUPPORTED_SOURCE_FORMAT,
  CONVERT_ERROR_CODES.FORMAT_CONFLICT,
  CONVERT_ERROR_CODES.CONVERSION_TIMEOUT,
  CONVERT_ERROR_CODES.CONVERT_INTERNAL,
] as const;

export class ImageConvertErrorDto {
  @ApiProperty({ enum: IMAGE_CONVERT_ERROR_CODES })
  code: (typeof IMAGE_CONVERT_ERROR_CODES)[number];

  @ApiProperty({ example: 'Image could not be read' })
  message: string;
}

export const IMAGE_CONVERT_RESPONSE_CONTENT = {
  'image/png': { schema: { type: 'string', format: 'binary' } },
  'image/jpeg': { schema: { type: 'string', format: 'binary' } },
};
