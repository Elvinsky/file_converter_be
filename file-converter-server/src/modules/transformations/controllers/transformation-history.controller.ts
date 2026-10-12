import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import type { FastifyReply } from 'fastify';

import { sendAttachment } from '@/core/http/http.utils';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '@/modules/auth/types/authenticated-request';

import {
  HistoryQueryDto,
  TransformationHistoryPageDto,
} from '../dto/history.dto';
import { HistoryAuditFilter } from '../filters/history-audit.filter';
import { TransformationHistoryService } from '../services/transformation-history.service';

@ApiTags('Transformations')
@ApiUnauthorizedResponse({
  description: 'Access token is missing or invalid, or the user is inactive',
})
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@SkipThrottle({ default: true, historyAdmin: true })
@UseFilters(HistoryAuditFilter)
@Controller('transformations/history')
export class TransformationHistoryController {
  constructor(private readonly history: TransformationHistoryService) {}

  @Get()
  @ApiOperation({
    summary: 'List your transformation history',
    description:
      'Returns one page of the signed-in user’s file and image conversions. Default page size is 20 and the maximum is 100. Pass nextCursor to read the following page. The same query returns the same page.',
  })
  @ApiOkResponse({ type: TransformationHistoryPageDto })
  list(
    @Req() request: Request & AuthenticatedRequest,
    @Query() query: HistoryQueryDto,
  ) {
    return this.history.listOwn(request.user.id, query);
  }

  @Get(':itemId/download')
  @ApiOperation({
    summary: 'Download your saved transformation result',
    description:
      'Streams the file saved for one of your history rows. Missing, unsaved, or expired files are not available.',
  })
  @ApiOkResponse({
    description: 'Saved file attachment',
    content: {
      'application/octet-stream': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'History row or saved file is missing or expired',
  })
  async download(
    @Req() request: Request & AuthenticatedRequest,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const file = await this.history.downloadOwn(request.user.id, itemId);

    return sendAttachment(reply, file);
  }
}
