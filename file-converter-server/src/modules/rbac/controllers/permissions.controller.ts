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
  CreatePermissionDto,
  DeletePermissionResponseDto,
  PermissionResponseDto,
  UpdatePermissionDto,
} from '../dto/permission.dto';
import { PermissionService } from '../services/permission.service';

@ApiTags('RBAC')
@Controller('admin/rbac/permissions')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('access_token')
@ApiUnauthorizedResponse({
  description: 'Access token is missing or invalid',
})
export class PermissionsController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @ApiOperation({ summary: 'List permissions' })
  @ApiOkResponse({ type: [PermissionResponseDto] })
  getPermissions() {
    return this.permissionService.getPermissions();
  }

  @Post()
  @ApiOperation({ summary: 'Create a permission' })
  @ApiCreatedResponse({ type: PermissionResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiConflictResponse({ description: 'Permission name already exists' })
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.permissionService.createPermission(dto);
  }

  @Put(':permissionId')
  @ApiOperation({ summary: 'Update a permission' })
  @ApiOkResponse({ type: PermissionResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  @ApiConflictResponse({ description: 'Permission name already exists' })
  updatePermission(
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.permissionService.updatePermission(permissionId, dto);
  }

  @Delete(':permissionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiOkResponse({ type: DeletePermissionResponseDto })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  async deletePermission(
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ) {
    await this.permissionService.deletePermission(permissionId);

    return {
      message: 'Permission deleted successfully',
      id: permissionId,
    };
  }
}
