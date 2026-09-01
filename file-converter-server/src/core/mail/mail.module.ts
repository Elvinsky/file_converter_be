import { Module } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { MailtrapTransport } from 'mailtrap';

import { ConfigModule } from '@/core/config/config.module';
import { ConfigService } from '@/core/config/config.service';

import { MAIL_TRANSPORTER } from './mail.constants';
import { MailService } from './mail.service';
import type { MailtrapMailTransporter } from './mail.types';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MAIL_TRANSPORTER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): MailtrapMailTransporter =>
        nodemailer.createTransport(
          MailtrapTransport({
            token: config.get('MAILTRAP_TOKEN'),
          }),
        ) as MailtrapMailTransporter,
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
