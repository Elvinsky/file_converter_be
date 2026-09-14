import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

import { RoleResponseDto } from '../dto/role.dto';
import { UpdateUserRolesDto } from '../dto/user-role.dto';
import { UserRoleService } from '../services/user-role.service';

@ApiTags('RBAC')
@Controller('admin/rbac/users/:userId/roles')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('access_token')
@ApiUnauthorizedResponse({
  description: 'Access token is missing or invalid',
})
export class UserRolesController {
  constructor(private readonly userRoleService: UserRoleService) {}

  @Get()
  @ApiOperation({ summary: 'List roles assigned to a user' })
  @ApiOkResponse({ type: [RoleResponseDto] })
  @ApiNotFoundResponse({ description: 'User not found' })
  getUserRoles(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.userRoleService.getUserRoles(userId);
  }

  @Put()
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
