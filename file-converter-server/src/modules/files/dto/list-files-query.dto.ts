import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';

export class ListFilesQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    example: '11111111-1111-1111-1111-111111111111',
    description:
      'Limit the list to this publisher. Callers with `files-list` + `read` (admins) may pass any user; others may only request themselves. Omit to list every file (admin) or only your own files.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsOptional()
  @IsUUID()
  userId?: string;
}
