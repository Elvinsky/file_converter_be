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
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import {
  RBAC_ACTIONS,
  RBAC_RESOURCES,
} from '../decorators/require-permission.constants';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { RoleResponseDto } from '../dto/role.dto';
import { UpdateUserRolesDto } from '../dto/user-role.dto';
import { UserRoleService } from '../services/user-role.service';

@ApiTags('RBAC / User roles')
@Controller('admin/rbac/users/:userId/roles')
export class UserRolesController {
  constructor(private readonly userRoleService: UserRoleService) {}

  @Get()
  @RequirePermission(RBAC_RESOURCES.PERMISSIONS, RBAC_ACTIONS.READ)
  @ApiOperation({
    summary: 'List roles assigned to a user',
    description:
      'Returns the role catalog entries this user currently holds. Requires permission `permissions` + `read`.',
  })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiOkResponse({ type: [RoleResponseDto] })
  @ApiBadRequestResponse({ description: 'userId is not a UUID' })
  @ApiNotFoundResponse({ description: 'User not found' })
  getUserRoles(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.userRoleService.getUserRoles(userId);
  }

  @Put()
  @RequirePermission(RBAC_RESOURCES.PERMISSIONS, RBAC_ACTIONS.UPDATE)
  @ApiOperation({
    summary: 'Replace roles assigned to a user',
    description:
      "Sets the user's roles to exactly `roleIds`. This is a full replace, not a patch: include existing ids when adding a role. An empty array removes all roles. Requires permission `permissions` + `update`.",
  })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiOkResponse({ type: [RoleResponseDto] })
  @ApiBadRequestResponse({
    description: 'Validation failed or userId is not a UUID',
  })
  @ApiNotFoundResponse({ description: 'User or role not found' })
  replaceUserRoles(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserRolesDto,
  ) {
    return this.userRoleService.replaceUserRoles(userId, dto);
  }
}
