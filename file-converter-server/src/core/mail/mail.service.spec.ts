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
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    };
    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          SMTP_USER: 'sender@gmail.com',
          SMTP_PASSWORD: 'app-password',
          SMTP_FROM: 'File Converter <sender@gmail.com>',
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

  it('sends mail through SMTP transport', async () => {
    await service.sendMail({
      to: 'user@example.com',
      subject: 'Test',
      text: 'Hello',
    });

    expect(transporter.sendMail).toHaveBeenCalledWith({
      from: 'File Converter <sender@gmail.com>',
      to: 'user@example.com',
      subject: 'Test',
      text: 'Hello',
      html: undefined,
    });
  });

  it('throws when SMTP credentials are missing', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'SMTP_USER') {
        return '';
      }

      if (key === 'SMTP_PASSWORD') {
        return '';
      }

      return 'File Converter <sender@gmail.com>';
    });

    await expect(
      service.sendMail({
        to: 'user@example.com',
        subject: 'Test',
        text: 'Hello',
      }),
    ).rejects.toThrow('SMTP_USER and SMTP_PASSWORD must be set');
  });
});
