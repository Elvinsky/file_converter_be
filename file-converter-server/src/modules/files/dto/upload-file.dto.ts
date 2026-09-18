import { ApiProperty } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description:
      'File to store. Multipart field name must be `file`. Maximum size is 10 MB.',
  })
  file: unknown;
}
