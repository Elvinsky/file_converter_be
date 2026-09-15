import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/modules/auth.module';
import { UsersModule } from '@/modules/users/modules/users.module';

import { GrantsController } from '../controllers/grants.controller';
import { PermissionsController } from '../controllers/permissions.controller';
import { RolesController } from '../controllers/roles.controller';
import { UserRolesController } from '../controllers/user-roles.controller';
import { GrantEntity } from '../entities/grant.entity';
import { PermissionEntity } from '../entities/permission.entity';
import { RoleEntity } from '../entities/role.entity';
import { UserRoleEntity } from '../entities/user-role.entity';
import { AccessService } from '../services/access.service';
import { GrantService } from '../services/grant.service';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';
import { UserRoleService } from '../services/user-role.service';
import { PermissionsGuard } from '../guards/permissions.guard';

const rbacServices = [
  RoleService,
  PermissionService,
  GrantService,
  UserRoleService,
  AccessService,
];

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    TypeOrmModule.forFeature([
      RoleEntity,
      PermissionEntity,
      GrantEntity,
      UserRoleEntity,
    ]),
  ],
  controllers: [
    RolesController,
    PermissionsController,
    GrantsController,
    UserRolesController,
  ],
  providers: [...rbacServices, PermissionsGuard],
  exports: [TypeOrmModule, PermissionsGuard, ...rbacServices],
})
export class RbacModule {}
