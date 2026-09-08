import { ApiProperty } from '@nestjs/swagger';

export class TestEmailResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'user@example.com' })
  to: string;
}
