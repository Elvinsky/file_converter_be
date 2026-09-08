import { Module } from '@nestjs/common';

import { MailModule } from '@/core/mail/mail.module';
import { AuthModule } from '@/modules/auth/modules/auth.module';

import { NotificationsController } from '../controllers/notifications.controller';

@Module({
  imports: [MailModule, AuthModule],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
