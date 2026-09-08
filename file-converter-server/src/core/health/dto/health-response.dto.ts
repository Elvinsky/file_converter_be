import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ enum: ['ok', 'error', 'shutting_down'], example: 'ok' })
  status: 'ok' | 'error' | 'shutting_down';

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  info?: Record<string, unknown>;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  error?: Record<string, unknown>;

  @ApiProperty({ type: 'object', additionalProperties: true, example: {} })
  details: Record<string, unknown>;
}
