import { Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { MailService } from '@/core/mail/mail.service';

import { TestEmailResponseDto } from '../dto/test-email-response.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

const TEST_EMAIL_RECIPIENT = 'mikhnevichnik@gmail.com';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly mailService: MailService) {}

  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid',
  })
  @Post('test-email')
  @ApiOperation({
    summary: 'Send a test email',
    description:
      'Sends a test message through the configured Gmail SMTP transport.',
  })
  @ApiCreatedResponse({ type: TestEmailResponseDto })
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
