import type { Options } from 'nodemailer/lib/mailer';
import type { SentMessageInfo } from 'nodemailer';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export type SendMailResult = SentMessageInfo;

export interface MailTransporter {
  sendMail(mailOptions: Options): Promise<SendMailResult>;
}
