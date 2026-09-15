import { UsersService } from '../services/users.service';
import {
  Controller,
  Delete,
  Body,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ApiCookieAuth } from '@nestjs/swagger';
import { AuthenticatedRequest } from '@/modules/auth/types/authenticated-request';
import { RequirePermission } from '@/modules/rbac/decorators/require-permission.decorator';
import { UpdateUserDto } from '../dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @Get('me')
  async getMyUser(@Req() request: Request & AuthenticatedRequest) {
    return this.usersService.getUserById(request.user.id);
  }

  @RequirePermission('users', 'read')
  @Get()
  async getUsers() {
    return this.usersService.getUsers();
  }

  @RequirePermission('users', 'read')
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @RequirePermission('users', 'delete')
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
    return {
      message: 'User deleted successfully',
      id,
    };
  }

  @RequirePermission('users', 'update')
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() user: UpdateUserDto) {
    await this.usersService.updateUser(id, user);
    return {
      message: 'User updated successfully',
      id,
    };
  }
}
