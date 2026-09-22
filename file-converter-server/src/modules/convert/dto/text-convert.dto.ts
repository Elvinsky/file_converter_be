import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum TargetFormat {
  CSV = 'csv',
  JSON = 'json',
  XML = 'xml',
  YAML = 'yaml',
}

export class TextConvertUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description:
      'Source text file. Multipart field name must be `file`. Size must not exceed the cap for the detected source format.',
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
