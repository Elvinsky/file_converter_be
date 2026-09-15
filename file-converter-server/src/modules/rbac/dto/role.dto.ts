import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { trimNullableString, trimString } from '../utilities/transform';

export class CreateRoleDto {
  @ApiProperty({
    example: 'admin',
    description: 'Unique role name used as the human-readable identifier.',
    maxLength: 64,
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @ApiPropertyOptional({
    example: 'Full access to administration',
    description: 'Optional description of the role.',
  })
  @Transform(trimNullableString)
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string | null;
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'editor' })
  @Transform(trimString)
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(64)
  name?: string;

  @ApiPropertyOptional({ example: 'Can edit files', nullable: true })
  @Transform(trimNullableString)
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string | null;
}

export class RoleResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Role surrogate key.' })
  id: string;

  @ApiProperty({
    example: 'admin',
    description: 'Unique role name.',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'Full access to administration',
    nullable: true,
  })
  description: string | null;
}

export class DeleteRoleResponseDto {
  @ApiProperty({ example: 'Role deleted successfully' })
  message: string;

  @ApiProperty({ format: 'uuid' })
  id: string;
}
