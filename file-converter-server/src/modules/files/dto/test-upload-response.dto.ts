import { ApiProperty } from '@nestjs/swagger';

export class TestUploadResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'file-converter-dev' })
  bucket: string;

  @ApiProperty({
    example:
      'test-uploads/11111111-1111-1111-1111-111111111111/1700000000000-sample.txt',
  })
  key: string;

  @ApiProperty({ example: 'sample.txt' })
  originalName: string;
}
