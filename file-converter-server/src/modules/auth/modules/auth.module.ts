import { Module } from '@nestjs/common';

import { MailModule } from '@/core/mail/mail.module';
import { UsersModule } from '@/modules/users/modules/users.module';

import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';

@Module({
  imports: [UsersModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
