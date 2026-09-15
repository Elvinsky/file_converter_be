import { Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MailService } from '@/core/mail/mail.service';
import {
  RBAC_ACTIONS,
  RBAC_RESOURCES,
} from '@/modules/rbac/decorators/require-permission.constants';
import { RequirePermission } from '@/modules/rbac/decorators/require-permission.decorator';

import { TestEmailResponseDto } from '../dto/test-email-response.dto';

const TEST_EMAIL_RECIPIENT = 'mikhnevichnik@gmail.com';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly mailService: MailService) {}

  @RequirePermission(RBAC_RESOURCES.EMAIL, RBAC_ACTIONS.CREATE)
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
