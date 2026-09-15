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
  ApiTags,
} from '@nestjs/swagger';

import { RequirePermission } from '../decorators/require-permission.decorator';
import {
  CreateGrantDto,
  DeleteGrantResponseDto,
  GrantResponseDto,
  UpdateGrantDto,
} from '../dto/grant.dto';
import { GrantService } from '../services/grant.service';

@ApiTags('RBAC')
@Controller('admin/rbac/grants')
export class GrantsController {
  constructor(private readonly grantService: GrantService) {}

  @Get()
  @RequirePermission('rbac', 'read')
  @ApiOperation({ summary: 'List grants' })
  @ApiOkResponse({ type: [GrantResponseDto] })
  getGrants() {
    return this.grantService.getGrants();
  }

  @Post()
  @RequirePermission('rbac', 'create')
  @ApiOperation({ summary: 'Create a grant' })
  @ApiCreatedResponse({ type: GrantResponseDto })
  @ApiBadRequestResponse({
    description:
      'Validation failed or actions are not allowed on the permission',
  })
  @ApiNotFoundResponse({ description: 'Role or permission not found' })
  @ApiConflictResponse({
    description: 'Grant for this role and permission already exists',
  })
  createGrant(@Body() dto: CreateGrantDto) {
    return this.grantService.createGrant(dto);
  }

  @Put(':grantId')
  @RequirePermission('rbac', 'update')
  @ApiOperation({ summary: 'Update a grant' })
  @ApiOkResponse({ type: GrantResponseDto })
  @ApiBadRequestResponse({
    description:
      'Validation failed or actions are not allowed on the permission',
  })
  @ApiNotFoundResponse({ description: 'Grant, role, or permission not found' })
  @ApiConflictResponse({
    description: 'Grant for this role and permission already exists',
  })
  updateGrant(
    @Param('grantId', ParseUUIDPipe) grantId: string,
    @Body() dto: UpdateGrantDto,
  ) {
    return this.grantService.updateGrant(grantId, dto);
  }

  @Delete(':grantId')
  @RequirePermission('rbac', 'delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a grant' })
  @ApiOkResponse({ type: DeleteGrantResponseDto })
  @ApiNotFoundResponse({ description: 'Grant not found' })
  async deleteGrant(@Param('grantId', ParseUUIDPipe) grantId: string) {
    await this.grantService.deleteGrant(grantId);

    return {
      message: 'Grant deleted successfully',
      id: grantId,
    };
  }
}
