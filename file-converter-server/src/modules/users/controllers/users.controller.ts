import { RolesGuard } from '@/modules/auth/guards/roles.guard';
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
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { UserRole } from '../entities/users.entity';
import { AuthenticatedRequest } from '@/modules/auth/types/authenticated-request';
import { UpdateUserDto } from '../dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiCookieAuth('access_token')
  @Get()
  async getUsers() {
    return this.usersService.getUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiCookieAuth('access_token')
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiCookieAuth('access_token')
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
    return {
      message: 'User deleted successfully',
      id,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiCookieAuth('access_token')
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() user: UpdateUserDto) {
    await this.usersService.updateUser(id, user);
    return {
      message: 'User updated successfully',
      id,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @Get('me')
  async getMyUser(@Req() request: Request & AuthenticatedRequest) {
    return this.usersService.getUserById(request.user.id);
  }
}
