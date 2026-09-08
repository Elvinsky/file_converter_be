import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck } from '@nestjs/terminus';

import { HealthResponseDto } from './dto/health-response.dto';
import { HealthService } from './health.service';
import { ConfigService } from '@/core/config/config.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Returns Terminus health details when HEALTH_CHECK_ENABLED is true; otherwise an empty ok payload.',
  })
  @ApiOkResponse({ type: HealthResponseDto })
  async check() {
    const healthCheckEnabled = this.configService.get('HEALTH_CHECK_ENABLED');

    if (!healthCheckEnabled) {
      return this.healthService.getEmptyResponse();
    }

    return this.healthService.checkHealth();
  }
}
