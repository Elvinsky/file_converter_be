import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/modules/auth.module';
import { RbacModule } from '@/modules/rbac/modules/rbac.module';

import { UsersController } from '../controllers/users.controller';
import { UserEntity } from '../entities/users.entity';
import { UsersService } from '../services/users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => RbacModule),
  ],
  providers: [UsersService],
  exports: [TypeOrmModule, UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
