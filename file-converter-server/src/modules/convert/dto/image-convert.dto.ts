import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export enum ImageFormat {
  PNG = 'png',
  JPEG = 'jpeg',
  WEBP = 'webp',
  GIF = 'gif',
  SVG = 'svg',
}

export enum ImageFit {
  COVER = 'cover',
  CONTAIN = 'contain',
  FILL = 'fill',
  INSIDE = 'inside',
  OUTSIDE = 'outside',
}

export class ImageConvertUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description:
      'Source image. Multipart field name must be `file`. Image conversion is reserved.',
  })
  file: unknown;

  @ApiProperty({
    enum: ImageFormat,
    example: ImageFormat.PNG,
    description: 'Output image format (reserved).',
  })
  @IsEnum(ImageFormat)
  @IsNotEmpty()
  targetFormat: ImageFormat;

  @ApiProperty({
    required: false,
    minimum: 1,
    maximum: 16384,
    description: 'Target width in pixels.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(16384)
  width?: number;

  @ApiProperty({
    required: false,
    minimum: 1,
    maximum: 16384,
    description: 'Target height in pixels.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(16384)
  height?: number;

  @ApiProperty({
    required: false,
    minimum: 1,
    maximum: 100,
    description: 'Encoder quality (jpeg/webp).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  quality?: number;

  @ApiProperty({
    enum: ImageFit,
    required: false,
    description: 'Resize fit when width/height are set.',
  })
  @IsOptional()
  @IsEnum(ImageFit)
  fit?: ImageFit;

  @ApiProperty({
    required: false,
    description: 'Drop EXIF and similar metadata.',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  stripMetadata?: boolean;
}

export class ImageConvertFormatPairDto {
  @ApiProperty({
    example: 'image',
    description: 'Always `image` for this catalog.',
  })
  kind: 'image';

  @ApiProperty({
    enum: ImageFormat,
    example: ImageFormat.PNG,
    description: 'Source format.',
  })
  source: ImageFormat;

  @ApiProperty({
    enum: ImageFormat,
    isArray: true,
    example: [ImageFormat.JPEG, ImageFormat.WEBP],
    description: 'Allowed conversion targets for this source.',
  })
  target: ImageFormat[];
}

export type ImageConvertOptionsDto = {
  width?: number;
  height?: number;
  quality?: number;
  fit?: ImageFit;
  stripMetadata?: boolean;
};

export type ImageConvertJobDto = {
  userId: string;
  originalName: string;
  mimeType: string;
  targetFormat: ImageFormat;
  body: Buffer;
  image?: ImageConvertOptionsDto;
};

export type ImageConvertResultDto = {
  body: Buffer;
  contentType: string;
  fileName: string;
};
