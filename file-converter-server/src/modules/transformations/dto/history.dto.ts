import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class HistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Cursor returned as nextCursor. Omit for the first page.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Page size. Default 20, maximum 100.',
    example: '20',
  })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({ enum: ['file', 'image'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'csv, json, xml, yaml, png, jpeg, or svg',
  })
  @IsOptional()
  @IsString()
  sourceFormat?: string;

  @ApiPropertyOptional({
    description: 'csv, json, xml, yaml, png, jpeg, or svg',
  })
  @IsOptional()
  @IsString()
  targetFormat?: string;

  @ApiPropertyOptional({ enum: ['success', 'error'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Inclusive range start, ISO datetime' })
  @IsOptional()
  @IsString()
  createdAtFrom?: string;

  @ApiPropertyOptional({ description: 'Inclusive range end, ISO datetime' })
  @IsOptional()
  @IsString()
  createdAtTo?: string;
}

export class TransformationHistoryItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: ['file', 'image'] })
  type: 'file' | 'image';

  @ApiProperty()
  sourceFormat: string;

  @ApiProperty()
  targetFormat: string;

  @ApiProperty({ enum: ['success', 'error'] })
  status: 'success' | 'error';

  @ApiProperty({ description: 'Source file size in bytes' })
  fileSize: number;

  @ApiProperty()
  durationMs: number;

  @ApiPropertyOptional()
  errorCode?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({
    description: 'True when a saved result can still be downloaded.',
  })
  hasFile: boolean;
}

export class TransformationHistoryPageDto {
  @ApiProperty({ type: [TransformationHistoryItemDto] })
  items: TransformationHistoryItemDto[];

  @ApiProperty({ type: String, nullable: true })
  nextCursor: string | null;
}
