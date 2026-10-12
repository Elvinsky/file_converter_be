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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import type { FastifyReply } from 'fastify';

import { sendAttachment } from '@/core/http/http.utils';
import { AuthenticatedRequest } from '@/modules/auth/types/authenticated-request';
import {
  RBAC_ACTIONS,
  RBAC_RESOURCES,
} from '@/modules/rbac/decorators/require-permission.constants';
import { RequirePermission } from '@/modules/rbac/decorators/require-permission.decorator';

import {
  HistoryQueryDto,
  TransformationHistoryPageDto,
} from '../dto/history.dto';
import { HistoryAuditFilter } from '../filters/history-audit.filter';
import { TransformationHistoryService } from '../services/transformation-history.service';

@ApiTags('Transformations')
@UseGuards(ThrottlerGuard)
@SkipThrottle({ default: true, history: true })
@UseFilters(HistoryAuditFilter)
@Controller('admin/users/:userId/transformations/history')
export class AdminTransformationHistoryController {
  constructor(private readonly history: TransformationHistoryService) {}

  @Get()
  @RequirePermission(RBAC_RESOURCES.TRANSFORMATIONS_HISTORY, RBAC_ACTIONS.READ)
  @ApiOperation({
    summary: 'List one user’s transformation history',
    description:
      'Requires permission `transformations-history` + `read`. Filters and cursor pages match the self history list. A missing user is not found. History rows do not include email or file contents.',
  })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiOkResponse({ type: TransformationHistoryPageDto })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'User not found' })
  list(
    @Req() request: Request & AuthenticatedRequest,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: HistoryQueryDto,
  ) {
    return this.history.listForAdmin(request.user.id, userId, query);
  }

  @Get(':itemId/download')
  @RequirePermission(RBAC_RESOURCES.TRANSFORMATIONS_HISTORY, RBAC_ACTIONS.READ)
  @ApiOperation({
    summary: 'Download a user’s saved transformation result',
    description:
      'Requires permission `transformations-history` + `read`. The history row must belong to the named user and still have a stored file.',
  })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Saved file attachment',
    content: {
      'application/octet-stream': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({
    description: 'User, history row, or saved file is missing or expired',
  })
  async download(
    @Req() request: Request & AuthenticatedRequest,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const file = await this.history.downloadForAdmin(
      request.user.id,
      userId,
      itemId,
    );

    return sendAttachment(reply, file);
  }
}
