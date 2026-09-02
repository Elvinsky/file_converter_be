import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '../entities/users.entity';
import { UsersService } from '../services/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UsersService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
