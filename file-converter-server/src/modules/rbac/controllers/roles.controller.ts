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

import { CreateRoleDto } from '../dto/create-role.dto';
import {
  DeleteRoleResponseDto,
  RoleResponseDto,
} from '../dto/role-response.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RbacService } from '../services/rbac.service';

@ApiTags('RBAC')
@Controller('admin/rbac/roles')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('access_token')
@ApiUnauthorizedResponse({
  description: 'Access token is missing or invalid',
})
export class RolesController {
  constructor(private readonly rbacService: RbacService) {}

  @Get()
  @ApiOperation({ summary: 'List roles' })
  @ApiOkResponse({ type: [RoleResponseDto] })
  getRoles() {
    return this.rbacService.getRoles();
  }

  @Post()
  @ApiOperation({ summary: 'Create a role' })
  @ApiCreatedResponse({ type: RoleResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Role name already exists' })
  createRole(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(dto);
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
    return this.rbacService.updateRole(roleId, dto);
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
    await this.rbacService.deleteRole(roleId);

    return {
      message: 'Role deleted successfully',
      id: roleId,
    };
  }
}
