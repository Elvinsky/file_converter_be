import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

import { AuthenticatedRequest } from '@/modules/auth/types/authenticated-request';
import {
  RBAC_ACTIONS,
  RBAC_RESOURCES,
} from '@/modules/rbac/decorators/require-permission.constants';
import { RequirePermission } from '@/modules/rbac/decorators/require-permission.decorator';

import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserListDto } from '../dto/user-list.dto';
import { UsersService } from '../services/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @RequirePermission(RBAC_RESOURCES.ME, RBAC_ACTIONS.READ)
  @Get('me')
  async getMyUser(@Req() request: Request & AuthenticatedRequest) {
    return this.usersService.getUserById(request.user.id);
  }

  @RequirePermission(RBAC_RESOURCES.ME, RBAC_ACTIONS.UPDATE)
  @Put('me')
  async updateMyUser(
    @Req() request: Request & AuthenticatedRequest,
    @Body() user: UpdateUserDto,
  ) {
    await this.usersService.updateUser(request.user.id, user);
    return {
      message: 'User updated successfully',
      id: request.user.id,
    };
  }

  @RequirePermission(RBAC_RESOURCES.USERS, RBAC_ACTIONS.READ)
  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiOkResponse({ type: UserListDto })
  async getUsers(@Query() query: ListUsersQueryDto) {
    return this.usersService.getUsers(
      query.page ? Number(query.page) : 1,
      query.limit ? Number(query.limit) : 20,
    );
  }

  @RequirePermission(RBAC_RESOURCES.USERS, RBAC_ACTIONS.READ)
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @RequirePermission(RBAC_RESOURCES.USERS, RBAC_ACTIONS.DELETE)
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
    return {
      message: 'User deleted successfully',
      id,
    };
  }

  @RequirePermission(RBAC_RESOURCES.USERS, RBAC_ACTIONS.UPDATE)
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() user: UpdateUserDto) {
    await this.usersService.updateUser(id, user);
    return {
      message: 'User updated successfully',
      id,
    };
  }
}
