import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/modules/auth.module';

import { RolesController } from '../controllers/roles.controller';
import { GrantEntity } from '../entities/grant.entity';
import { PermissionEntity } from '../entities/permission.entity';
import { RoleEntity } from '../entities/role.entity';
import { UserRoleEntity } from '../entities/user-role.entity';
import { RbacService } from '../services/rbac.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      RoleEntity,
      PermissionEntity,
      GrantEntity,
      UserRoleEntity,
    ]),
  ],
  controllers: [RolesController],
  providers: [RbacService],
  exports: [TypeOrmModule, RbacService],
})
export class RbacModule {}
