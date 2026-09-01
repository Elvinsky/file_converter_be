import type { Options } from 'nodemailer/lib/mailer';
import type { SendError, SendResponse } from 'mailtrap';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  category?: string;
}

export type SendMailResult = SendResponse | SendError;

export interface MailtrapSendMailOptions extends Options {
  category?: string;
}

export interface MailtrapMailTransporter {
  sendMail(mailOptions: MailtrapSendMailOptions): Promise<SendMailResult>;
}
