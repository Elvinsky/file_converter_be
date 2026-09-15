import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { RequirePermission } from '../decorators/require-permission.decorator';
import { RoleResponseDto } from '../dto/role.dto';
import { UpdateUserRolesDto } from '../dto/user-role.dto';
import { UserRoleService } from '../services/user-role.service';

@ApiTags('RBAC')
@Controller('admin/rbac/users/:userId/roles')
export class UserRolesController {
  constructor(private readonly userRoleService: UserRoleService) {}

  @Get()
  @RequirePermission('rbac', 'read')
  @ApiOperation({ summary: 'List roles assigned to a user' })
  @ApiOkResponse({ type: [RoleResponseDto] })
  @ApiNotFoundResponse({ description: 'User not found' })
  getUserRoles(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.userRoleService.getUserRoles(userId);
  }

  @Put()
  @RequirePermission('rbac', 'update')
  @ApiOperation({
    summary: 'Replace roles assigned to a user',
    description:
      "Sets the user's roles to exactly roleIds. An empty array removes all roles.",
  })
  @ApiOkResponse({ type: [RoleResponseDto] })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'User or role not found' })
  replaceUserRoles(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserRolesDto,
  ) {
    return this.userRoleService.replaceUserRoles(userId, dto);
  }
}
