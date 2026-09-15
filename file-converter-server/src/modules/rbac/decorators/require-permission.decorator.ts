import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

import { PermissionsGuard } from '../guards/permissions.guard';
import {
  REQUIRE_PERMISSION_KEY,
  type RequiredPermission,
} from './require-permission.constants';

export const RequirePermission = (permission: string, action: string) =>
  applyDecorators(
    SetMetadata(REQUIRE_PERMISSION_KEY, {
      permission,
      action,
    } satisfies RequiredPermission),
    UseGuards(JwtAuthGuard, PermissionsGuard),
    ApiCookieAuth('access_token'),
    ApiUnauthorizedResponse({
      description: 'Access token is missing or invalid',
    }),
    ApiForbiddenResponse({ description: 'Insufficient permissions' }),
  );
