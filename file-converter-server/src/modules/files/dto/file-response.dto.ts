import { ApiProperty } from '@nestjs/swagger';

export class FileResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    description: 'File surrogate key.',
  })
  id: string;

  @ApiProperty({
    example: 'report.pdf',
    description: 'Original file name after sanitization.',
  })
  originalName: string;

  @ApiProperty({
    example: 'application/pdf',
    description: 'MIME type reported at upload.',
  })
  contentType: string;

  @ApiProperty({
    example: 1024,
    description: 'Stored object size in bytes.',
  })
  sizeBytes: number;

  @ApiProperty({
    example: '2026-01-01T00:00:00.000Z',
    description: 'When the file was uploaded.',
  })
  createdAt: Date;

  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-1111-1111-111111111111',
    description: 'User who uploaded the file.',
  })
  userId: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email of the user who uploaded the file.',
  })
  publisherEmail: string;
}
