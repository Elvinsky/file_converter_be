import { Module } from '@nestjs/common';

import { MailModule } from '@/core/mail/mail.module';
import { AuthModule } from '@/modules/auth/modules/auth.module';
import { RbacModule } from '@/modules/rbac/modules/rbac.module';

import { NotificationsController } from '../controllers/notifications.controller';

@Module({
  imports: [MailModule, AuthModule, RbacModule],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
