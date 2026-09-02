import { Controller, Post } from '@nestjs/common';

import { MailService } from '@/core/mail/mail.service';

const TEST_EMAIL_RECIPIENT = 'mikhnevichnik@gmail.com';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly mailService: MailService) {}

  @Post('test-email')
  async sendTestEmail() {
    await this.mailService.sendMail({
      to: TEST_EMAIL_RECIPIENT,
      subject: 'File Converter — test email',
      text: 'This is a test email sent via Gmail SMTP.',
      html: '<p>This is a test email sent via Gmail SMTP.</p>',
    });

    return {
      success: true,
      to: TEST_EMAIL_RECIPIENT,
    };
  }
}
