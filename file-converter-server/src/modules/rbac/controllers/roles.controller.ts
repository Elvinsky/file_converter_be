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
  CreateRoleDto,
  DeleteRoleResponseDto,
  RoleResponseDto,
  UpdateRoleDto,
} from '../dto/role.dto';
import { RoleService } from '../services/role.service';

@ApiTags('RBAC / Roles')
@Controller('admin/rbac/roles')
export class RolesController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @RequirePermission('rbac', 'read')
  @ApiOperation({
    summary: 'List roles',
    description:
      'Returns all roles ordered by name. Requires permission `rbac` + `read`.',
  })
  @ApiOkResponse({ type: [RoleResponseDto] })
  getRoles() {
    return this.roleService.getRoles();
  }

  @Post()
  @RequirePermission('rbac', 'create')
  @ApiOperation({
    summary: 'Create a role',
    description:
      'Creates a named role. Name must be unique. Requires permission `rbac` + `create`.',
  })
  @ApiCreatedResponse({ type: RoleResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Role name already exists' })
  createRole(@Body() dto: CreateRoleDto) {
    return this.roleService.createRole(dto);
  }

  @Put(':roleId')
  @RequirePermission('rbac', 'update')
  @ApiOperation({
    summary: 'Update a role',
    description:
      'Updates name and/or description. Name must stay unique. Requires permission `rbac` + `update`.',
  })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiOkResponse({ type: RoleResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed or roleId is not a UUID',
  })
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
  @ApiOperation({
    summary: 'Delete a role',
    description:
      'Deletes a role and cascades its grants. Fails with 409 if any user still has this role. Requires permission `rbac` + `delete`.',
  })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiOkResponse({ type: DeleteRoleResponseDto })
  @ApiBadRequestResponse({ description: 'roleId is not a UUID' })
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
