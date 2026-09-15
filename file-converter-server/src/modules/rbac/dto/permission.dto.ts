import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { trimString, trimStringArray } from '../utilities/transform';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'users',
    description:
      'Unique resource name used in @RequirePermission (e.g. users, me, permissions).',
    maxLength: 64,
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @ApiProperty({
    example: ['read', 'update', 'delete'],
    description: 'Actions that may be granted on this resource.',
    type: [String],
  })
  @Transform(trimStringArray)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(64, { each: true })
  actions: string[];
}

export class UpdatePermissionDto {
  @ApiPropertyOptional({ example: 'files' })
  @Transform(trimString)
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(64)
  name?: string;

  @ApiPropertyOptional({
    example: ['read', 'create', 'delete'],
    description: 'Replacement list of actions for this resource.',
    type: [String],
  })
  @Transform(trimStringArray)
  @IsArray()
  @IsOptional()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(64, { each: true })
  actions?: string[];
}

export class PermissionResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Permission surrogate key.' })
  id: string;

  @ApiProperty({
    example: 'users',
    description: 'Unique resource name.',
  })
  name: string;

  @ApiProperty({
    example: ['read', 'update', 'delete'],
    description: 'Actions defined on this permission.',
    type: [String],
  })
  actions: string[];
}

export class DeletePermissionResponseDto {
  @ApiProperty({ example: 'Permission deleted successfully' })
  message: string;

  @ApiProperty({ format: 'uuid' })
  id: string;
}
