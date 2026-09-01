import { Test, TestingModule } from '@nestjs/testing';

import { ConfigService } from '@/core/config/config.service';

import { MAIL_TRANSPORTER } from './mail.constants';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let transporter: { sendMail: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    transporter = {
      sendMail: jest
        .fn()
        .mockResolvedValue({ success: true, message_ids: ['test-id'] }),
    };
    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          MAILTRAP_TOKEN: 'test-token',
          SMTP_FROM: 'File Converter <noreply@example.com>',
        };

        return values[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MAIL_TRANSPORTER, useValue: transporter },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sends mail through Mailtrap transport', async () => {
    await service.sendMail({
      to: 'user@example.com',
      subject: 'Test',
      text: 'Hello',
      category: 'Integration Test',
    });

    expect(transporter.sendMail).toHaveBeenCalledWith({
      from: 'File Converter <noreply@example.com>',
      to: 'user@example.com',
      subject: 'Test',
      text: 'Hello',
      html: undefined,
      category: 'Integration Test',
    });
  });

  it('throws when MAILTRAP_TOKEN is missing', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'MAILTRAP_TOKEN') {
        return '';
      }

      return 'File Converter <noreply@example.com>';
    });

    await expect(
      service.sendMail({
        to: 'user@example.com',
        subject: 'Test',
        text: 'Hello',
      }),
    ).rejects.toThrow('MAILTRAP_TOKEN is not set');
  });
});
