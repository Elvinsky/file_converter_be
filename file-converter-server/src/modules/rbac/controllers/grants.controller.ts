import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { RequirePermission } from '../decorators/require-permission.decorator';
import {
  CreateGrantDto,
  DeleteGrantResponseDto,
  GrantResponseDto,
  UpdateGrantDto,
} from '../dto/grant.dto';
import { GrantService } from '../services/grant.service';

@ApiTags('RBAC / Grants')
@Controller('admin/rbac/grants')
export class GrantsController {
  constructor(private readonly grantService: GrantService) {}

  @Get()
  @RequirePermission('rbac', 'read')
  @ApiOperation({
    summary: 'List grants',
    description:
      'Returns role-to-permission rules. Null `actions` means every action on that permission. Requires permission `rbac` + `read`.',
  })
  @ApiOkResponse({ type: [GrantResponseDto] })
  getGrants() {
    return this.grantService.getGrants();
  }

  @Post()
  @RequirePermission('rbac', 'create')
  @ApiOperation({
    summary: 'Create a grant',
    description:
      'Allows a role to perform actions on a permission. Role and permission must already exist. One grant per (role, permission). Omit `actions` or send [] for all verbs on that permission. Requires permission `rbac` + `create`.',
  })
  @ApiCreatedResponse({ type: GrantResponseDto })
  @ApiBadRequestResponse({
    description:
      'Validation failed or actions are not allowed on the permission',
  })
  @ApiNotFoundResponse({ description: 'Role or permission not found' })
  @ApiConflictResponse({
    description: 'Grant for this role and permission already exists',
  })
  createGrant(@Body() dto: CreateGrantDto) {
    return this.grantService.createGrant(dto);
  }

  @Put(':grantId')
  @RequirePermission('rbac', 'update')
  @ApiOperation({
    summary: 'Update a grant',
    description:
      'Changes the role, permission, and/or action subset. Requires permission `rbac` + `update`.',
  })
  @ApiParam({ name: 'grantId', format: 'uuid' })
  @ApiOkResponse({ type: GrantResponseDto })
  @ApiBadRequestResponse({
    description:
      'Validation failed, grantId is not a UUID, or actions are not allowed on the permission',
  })
  @ApiNotFoundResponse({ description: 'Grant, role, or permission not found' })
  @ApiConflictResponse({
    description: 'Grant for this role and permission already exists',
  })
  updateGrant(
    @Param('grantId', ParseUUIDPipe) grantId: string,
    @Body() dto: UpdateGrantDto,
  ) {
    return this.grantService.updateGrant(grantId, dto);
  }

  @Delete(':grantId')
  @RequirePermission('rbac', 'delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a grant',
    description:
      'Removes one role-to-permission rule. Does not delete the role or permission. Requires permission `rbac` + `delete`.',
  })
  @ApiParam({ name: 'grantId', format: 'uuid' })
  @ApiOkResponse({ type: DeleteGrantResponseDto })
  @ApiBadRequestResponse({ description: 'grantId is not a UUID' })
  @ApiNotFoundResponse({ description: 'Grant not found' })
  async deleteGrant(@Param('grantId', ParseUUIDPipe) grantId: string) {
    await this.grantService.deleteGrant(grantId);

    return {
      message: 'Grant deleted successfully',
      id: grantId,
    };
  }
}
