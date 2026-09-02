import { Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';

import { MailService } from '@/core/mail/mail.service';
import { UsersService } from '@/modules/users/services/users.service';

import { RegisterDto } from '../dto/register.dto';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const passwordHash = await hash(registerDto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.usersService.createUser({
      email: registerDto.email,
      passwordHash,
    });

    await this.mailService.sendMail({
      to: user.email,
      subject: 'File Converter — registration successful',
      text: `Your account for ${user.email} was created successfully. (Test message — OTP will come later.)`,
      html: `<p>Your account for <strong>${user.email}</strong> was created successfully.</p><p><em>Test message — OTP will come later.</em></p>`,
    });

    return user;
  }
}
