import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { StatusResponseDto } from '../dto/status-response.dto';

@ApiTags('Status')
@Controller('status')
export class StatusController {
  @Get()
  @ApiOperation({ summary: 'Service status' })
  @ApiOkResponse({ type: StatusResponseDto })
  getStatus() {
    return { status: 'ok' };
  }
}
