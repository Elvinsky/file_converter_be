import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { trimStringArray } from '../utilities/transform';

export class CreateGrantDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Existing role id to grant access to.',
  })
  @IsUUID()
  roleId: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Existing permission id (resource catalog row).',
  })
  @IsUUID()
  permissionId: string;

  @ApiPropertyOptional({
    example: ['read'],
    description:
      'Subset of the permission actions. Omit or send an empty array for all actions.',
    nullable: true,
  })
  @Transform(trimStringArray)
  @IsArray()
  @IsOptional()
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(64, { each: true })
  actions?: string[] | null;
}

export class UpdateGrantDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  roleId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  permissionId?: string;

  @ApiPropertyOptional({
    example: ['read'],
    description:
      'Subset of the permission actions. Omit to leave unchanged. Empty array or null means all actions.',
    nullable: true,
  })
  @Transform(trimStringArray)
  @IsArray()
  @IsOptional()
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(64, { each: true })
  actions?: string[] | null;
}

export class GrantResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Grant surrogate key.' })
  id: string;

  @ApiProperty({ format: 'uuid', description: 'Role this grant belongs to.' })
  roleId: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Permission this grant allows.',
  })
  permissionId: string;

  @ApiPropertyOptional({
    example: ['read'],
    nullable: true,
    description: 'Null means all actions on the permission.',
  })
  actions: string[] | null;
}

export class DeleteGrantResponseDto {
  @ApiProperty({ example: 'Grant deleted successfully' })
  message: string;

  @ApiProperty({ format: 'uuid' })
  id: string;
}
