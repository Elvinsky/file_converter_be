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
  CreateRoleDto,
  DeleteRoleResponseDto,
  RoleResponseDto,
  UpdateRoleDto,
} from '../dto/role.dto';
import { RoleService } from '../services/role.service';

@ApiTags('RBAC')
@Controller('admin/rbac/roles')
export class RolesController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @RequirePermission('rbac', 'read')
  @ApiOperation({ summary: 'List roles' })
  @ApiOkResponse({ type: [RoleResponseDto] })
  getRoles() {
    return this.roleService.getRoles();
  }

  @Post()
  @RequirePermission('rbac', 'create')
  @ApiOperation({ summary: 'Create a role' })
  @ApiCreatedResponse({ type: RoleResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Role name already exists' })
  createRole(@Body() dto: CreateRoleDto) {
    return this.roleService.createRole(dto);
  }

  @Put(':roleId')
  @RequirePermission('rbac', 'update')
  @ApiOperation({ summary: 'Update a role' })
  @ApiOkResponse({ type: RoleResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Role not found' })
  @ApiConflictResponse({ description: 'Role name already exists' })
  updateRole(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.roleService.updateRole(roleId, dto);
  }

  @Delete(':roleId')
  @RequirePermission('rbac', 'delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a role' })
  @ApiOkResponse({ type: DeleteRoleResponseDto })
  @ApiNotFoundResponse({ description: 'Role not found' })
  @ApiConflictResponse({
    description: 'Cannot delete a role that is assigned to users',
  })
  async deleteRole(@Param('roleId', ParseUUIDPipe) roleId: string) {
    await this.roleService.deleteRole(roleId);

    return {
      message: 'Role deleted successfully',
      id: roleId,
    };
  }
}
