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
  ApiTags,
} from '@nestjs/swagger';

import { RequirePermission } from '../decorators/require-permission.decorator';
import {
  CreatePermissionDto,
  DeletePermissionResponseDto,
  PermissionResponseDto,
  UpdatePermissionDto,
} from '../dto/permission.dto';
import { PermissionService } from '../services/permission.service';

@ApiTags('RBAC')
@Controller('admin/rbac/permissions')
export class PermissionsController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @RequirePermission('rbac', 'read')
  @ApiOperation({ summary: 'List permissions' })
  @ApiOkResponse({ type: [PermissionResponseDto] })
  getPermissions() {
    return this.permissionService.getPermissions();
  }

  @Post()
  @RequirePermission('rbac', 'create')
  @ApiOperation({ summary: 'Create a permission' })
  @ApiCreatedResponse({ type: PermissionResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Permission name already exists' })
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.permissionService.createPermission(dto);
  }

  @Put(':permissionId')
  @RequirePermission('rbac', 'update')
  @ApiOperation({ summary: 'Update a permission' })
  @ApiOkResponse({ type: PermissionResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  @ApiConflictResponse({ description: 'Permission name already exists' })
  updatePermission(
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.permissionService.updatePermission(permissionId, dto);
  }

  @Delete(':permissionId')
  @RequirePermission('rbac', 'delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiOkResponse({ type: DeletePermissionResponseDto })
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
