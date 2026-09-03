import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';

import { MailService } from '@/core/mail/mail.service';
import { UsersService } from '@/modules/users/services/users.service';

import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { OtpService } from '@/modules/otp/services/otp.service';
import { VerifyOtpDto } from '@/modules/otp/dto/verify-otp.dto';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly otpService: OtpService,
  ) {}

  async register(registerDto: RegisterDto) {
    const passwordHash = await hash(registerDto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.usersService.createUser({
      email: registerDto.email,
      passwordHash,
    });

    const otpCode = await this.otpService.createOtp({
      email: user.email,
      userId: user.id,
    });

    await this.mailService.sendMail({
      to: user.email,
      subject: 'File Converter — Registration Successful & Your OTP Code',
      text: `Your account for ${user.email} was created successfully.\n\nPlease use the following One-Time Passcode (OTP) to verify your account:\n\n${otpCode.code}\n\nIf you did not request this, please ignore this email.\n\nThank you,\nFile Converter Team`,
      html: `
        <p>Your account for <strong>${user.email}</strong> was created successfully.</p>
        <p><strong>Your One-Time Passcode (OTP):</strong></p>
        <p style="font-size: 1.5em; font-weight: bold; letter-spacing: 0.15em;">${otpCode.code}</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr>
        <p style="color: #888; font-size: 0.9em;">Thank you,<br>File Converter Team</p>
      `,
    });

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findUserByEmail(loginDto.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async verifyOTP(verifyOtpDto: VerifyOtpDto) {
    const otpEntity = await this.otpService.verifyOtp(verifyOtpDto);

    if (!otpEntity || otpEntity.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const user = await this.usersService.findUserByEmail(verifyOtpDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.usersService.updateUser(user.id, { isActive: true });

    return { message: 'Email verified' };
  }
}
