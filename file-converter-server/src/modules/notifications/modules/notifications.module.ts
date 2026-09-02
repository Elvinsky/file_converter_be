import { Module } from '@nestjs/common';

import { MailModule } from '@/core/mail/mail.module';

import { NotificationsController } from '../controllers/notifications.controller';

@Module({
  imports: [MailModule],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
