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
  @ApiProperty({ example: 'users' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @ApiProperty({ example: ['read', 'update', 'delete'] })
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

  @ApiPropertyOptional({ example: ['create', 'read', 'delete'] })
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
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'users' })
  name: string;

  @ApiProperty({ example: ['read', 'update', 'delete'] })
  actions: string[];
}

export class DeletePermissionResponseDto {
  @ApiProperty({ example: 'Permission deleted successfully' })
  message: string;

  @ApiProperty({ format: 'uuid' })
  id: string;
}
