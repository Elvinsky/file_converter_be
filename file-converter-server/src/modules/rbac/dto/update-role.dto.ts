import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'editor' })
  @Transform(({ value }: { value?: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(64)
  name?: string;

  @ApiPropertyOptional({ example: 'Can edit files', nullable: true })
  @Transform(({ value }: { value?: string | null }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string | null;
}
