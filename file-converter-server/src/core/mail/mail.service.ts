import { Inject, Injectable, Logger } from '@nestjs/common';

import { ConfigService } from '@/core/config/config.service';

import { MAIL_TRANSPORTER } from './mail.constants';
import type {
  MailTransporter,
  SendMailOptions,
  SendMailResult,
} from './mail.types';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @Inject(MAIL_TRANSPORTER)
    private readonly transporter: MailTransporter,
    private readonly config: ConfigService,
  ) {}

  async sendMail(options: SendMailOptions): Promise<SendMailResult> {
    const user = this.config.get('SMTP_USER');
    const password = this.config.get('SMTP_PASSWORD');

    if (!user || !password) {
      throw new Error(
        'SMTP_USER and SMTP_PASSWORD must be set in your .env file. For Gmail, use your email and a Google App Password (https://myaccount.google.com/apppasswords).',
      );
    }

    const result = await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    this.logger.log(`Email sent to ${this.formatRecipients(options.to)}`);

    return result;
  }

  private formatRecipients(to: string | string[]): string {
    return Array.isArray(to) ? to.join(', ') : to;
  }
}
