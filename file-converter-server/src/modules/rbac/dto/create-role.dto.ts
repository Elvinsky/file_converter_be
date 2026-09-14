import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'admin' })
  @Transform(({ value }: { value?: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @ApiPropertyOptional({ example: 'Full access to administration' })
  @Transform(({ value }: { value?: string | null }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string | null;
}
