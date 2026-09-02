import { Module } from '@nestjs/common';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

import { ConfigModule } from '@/core/config/config.module';
import { ConfigService } from '@/core/config/config.service';

import { MAIL_TRANSPORTER } from './mail.constants';
import { MailService } from './mail.service';
import type { MailTransporter } from './mail.types';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MAIL_TRANSPORTER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): MailTransporter => {
        const transportOptions: SMTPTransport.Options = {
          host: config.get('SMTP_HOST'),
          port: config.get('SMTP_PORT'),
          secure: config.get('SMTP_SECURE'),
          auth: {
            user: config.get('SMTP_USER'),
            pass: config.get('SMTP_PASSWORD'),
          },
        };

        return nodemailer.createTransport(transportOptions);
      },
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
