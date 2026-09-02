import { MailService } from '@/core/mail/mail.service';

import { NotificationsController } from '../controllers/notifications.controller';

describe('NotificationsController', () => {
  it('sends a test email via Gmail SMTP', async () => {
    const mailService = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    } as unknown as MailService;

    const controller = new NotificationsController(mailService);

    await expect(controller.sendTestEmail()).resolves.toEqual({
      success: true,
      to: 'mikhnevichnik@gmail.com',
    });

    expect(mailService.sendMail).toHaveBeenCalledWith({
      to: 'mikhnevichnik@gmail.com',
      subject: 'File Converter — test email',
      text: 'This is a test email sent via Gmail SMTP.',
      html: '<p>This is a test email sent via Gmail SMTP.</p>',
    });
  });
});
