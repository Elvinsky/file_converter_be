import { Module } from '@nestjs/common';

import { MailModule } from '@/core/mail/mail.module';
import { UsersModule } from '@/modules/users/modules/users.module';

import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { OtpModule } from '@/modules/otp/modules/otp.module';

@Module({
  imports: [UsersModule, MailModule, OtpModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
