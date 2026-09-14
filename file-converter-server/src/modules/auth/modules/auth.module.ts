import { Module } from '@nestjs/common';

import { MailModule } from '@/core/mail/mail.module';
import { UsersModule } from '@/modules/users/modules/users.module';

import { JwtModule } from '@/modules/jwt/modules/jwt.module';
import { OtpModule } from '@/modules/otp/modules/otp.module';

import { AuthController } from '../controllers/auth.controller';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthService } from '../services/auth.service';

@Module({
  imports: [UsersModule, MailModule, OtpModule, JwtModule],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
