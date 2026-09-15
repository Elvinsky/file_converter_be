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

import {
  RBAC_ACTIONS,
  RBAC_RESOURCES,
} from '../decorators/require-permission.constants';
import { RequirePermission } from '../decorators/require-permission.decorator';
import {
  CreatePermissionDto,
  DeletePermissionResponseDto,
  PermissionResponseDto,
  UpdatePermissionDto,
} from '../dto/permission.dto';
import { PermissionService } from '../services/permission.service';

@ApiTags('RBAC / Permissions')
@Controller('admin/rbac/permissions')
export class PermissionsController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @RequirePermission(RBAC_RESOURCES.PERMISSIONS, RBAC_ACTIONS.READ)
  @ApiOperation({
    summary: 'List permissions',
    description:
      'Returns the resource catalog (name + allowed actions). Requires permission `permissions` + `read`.',
  })
  @ApiOkResponse({ type: [PermissionResponseDto] })
  getPermissions() {
    return this.permissionService.getPermissions();
  }

  @Post()
  @RequirePermission(RBAC_RESOURCES.PERMISSIONS, RBAC_ACTIONS.CREATE)
  @ApiOperation({
    summary: 'Create a permission',
    description:
      'Defines a resource and the actions that may later be granted. Creating a permission does not give anyone access. Requires permission `permissions` + `create`.',
  })
  @ApiCreatedResponse({ type: PermissionResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Permission name already exists' })
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.permissionService.createPermission(dto);
  }

  @Put(':permissionId')
  @RequirePermission(RBAC_RESOURCES.PERMISSIONS, RBAC_ACTIONS.UPDATE)
  @ApiOperation({
    summary: 'Update a permission',
    description:
      'Updates name and/or the allowed action list. Name must stay unique. Requires permission `permissions` + `update`.',
  })
  @ApiParam({ name: 'permissionId', format: 'uuid' })
  @ApiOkResponse({ type: PermissionResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed or permissionId is not a UUID',
  })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  @ApiConflictResponse({ description: 'Permission name already exists' })
  updatePermission(
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.permissionService.updatePermission(permissionId, dto);
  }

  @Delete(':permissionId')
  @RequirePermission(RBAC_RESOURCES.PERMISSIONS, RBAC_ACTIONS.DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a permission',
    description:
      'Deletes a permission. Grants that pointed at it are removed (cascade). Requires permission `permissions` + `delete`.',
  })
  @ApiParam({ name: 'permissionId', format: 'uuid' })
  @ApiOkResponse({ type: DeletePermissionResponseDto })
  @ApiBadRequestResponse({ description: 'permissionId is not a UUID' })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  async deletePermission(
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ) {
    await this.permissionService.deletePermission(permissionId);

    return {
      message: 'Permission deleted successfully',
      id: permissionId,
    };
  }
}
