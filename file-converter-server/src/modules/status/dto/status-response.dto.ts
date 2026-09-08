import { ApiProperty } from '@nestjs/swagger';

export class StatusResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;
}
