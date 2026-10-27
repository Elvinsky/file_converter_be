import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class ListUsersQueryDto {
  @ApiPropertyOptional({
    example: '1',
    description: 'Page number starting at 1. Defaults to 1.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[1-9][0-9]*$/)
  page?: string;

  @ApiPropertyOptional({
    example: '20',
    description: 'Page size from 1 to 100. Defaults to 20.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(?:[1-9]|[1-9][0-9]|100)$/)
  limit?: string;
}
