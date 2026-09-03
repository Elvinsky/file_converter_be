import { Module } from '@nestjs/common';

import { ConfigModule } from '@/core/config/config.module';
import { DatabaseModule } from '@/core/database/database.module';
import { HealthModule } from '@/core/health/health.module';
import { MailModule } from '@/core/mail/mail.module';
import { ThrottlerModule } from '@/core/throttler/throttler.module';

/**
 *
 * Application modules
 *
 */
import { NotificationsModule } from '@/modules/notifications/modules/notifications.module';
import { StatusModule } from '@/modules/status/modules/status.module';
import { UsersModule } from '@/modules/users/modules/users.module';
import { AuthModule } from '@/modules/auth/modules/auth.module';
import { OtpModule } from '@/modules/otp/modules/otp.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),

    ConfigModule,
    DatabaseModule,
    HealthModule,
    MailModule,
    ThrottlerModule,
    /**
     *
     * Application modules
     *
     */
    NotificationsModule,
    StatusModule,
    UsersModule,
    AuthModule,
    OtpModule,
  ],
})
export class AppModule {}
