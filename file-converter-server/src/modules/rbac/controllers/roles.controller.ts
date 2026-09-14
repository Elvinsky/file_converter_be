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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

import {
  CreateRoleDto,
  DeleteRoleResponseDto,
  RoleResponseDto,
  UpdateRoleDto,
} from '../dto/role.dto';
import { RoleService } from '../services/role.service';

@ApiTags('RBAC')
@Controller('admin/rbac/roles')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('access_token')
@ApiUnauthorizedResponse({
  description: 'Access token is missing or invalid',
})
export class RolesController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @ApiOperation({ summary: 'List roles' })
  @ApiOkResponse({ type: [RoleResponseDto] })
  getRoles() {
    return this.roleService.getRoles();
  }

  @Post()
  @ApiOperation({ summary: 'Create a role' })
  @ApiCreatedResponse({ type: RoleResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Role name already exists' })
  createRole(@Body() dto: CreateRoleDto) {
    return this.roleService.createRole(dto);
  }

  @Put(':roleId')
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
