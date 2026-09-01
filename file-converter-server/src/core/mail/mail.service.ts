import { Inject, Injectable, Logger } from '@nestjs/common';

import { ConfigService } from '@/core/config/config.service';

import { MAIL_TRANSPORTER } from './mail.constants';
import type {
  MailtrapMailTransporter,
  SendMailOptions,
  SendMailResult,
} from './mail.types';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @Inject(MAIL_TRANSPORTER)
    private readonly transporter: MailtrapMailTransporter,
    private readonly config: ConfigService,
  ) {}

  async sendMail(options: SendMailOptions): Promise<SendMailResult> {
    const token = this.config.get('MAILTRAP_TOKEN');

    if (!token) {
      throw new Error(
        'MAILTRAP_TOKEN is not set. Create an API token at https://mailtrap.io/api-tokens and add it to your .env file.',
      );
    }

    const result = await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      category: options.category,
    });

    this.logger.log(`Email sent to ${this.formatRecipients(options.to)}`);

    return result;
  }

  private formatRecipients(to: string | string[]): string {
    return Array.isArray(to) ? to.join(', ') : to;
  }
}
