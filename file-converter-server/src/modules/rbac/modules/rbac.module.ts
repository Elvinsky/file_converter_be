import { Module } from '@nestjs/common';
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
import { GrantService } from '../services/grant.service';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';
import { UserRoleService } from '../services/user-role.service';

const rbacServices = [
  RoleService,
  PermissionService,
  GrantService,
  UserRoleService,
];

@Module({
  imports: [
    AuthModule,
    UsersModule,
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
  providers: rbacServices,
  exports: [TypeOrmModule, ...rbacServices],
})
export class RbacModule {}
